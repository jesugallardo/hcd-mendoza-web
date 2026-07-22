/**
 * github-api.js
 * Wrapper sobre la REST API de GitHub para hacer commits desde el panel.
 */
const GitHubAPI = (() => {
  let config = { owner: '', repo: '', branch: 'main', token: '' };
  
  const headers = () => ({
    'Authorization': `Bearer ${config.token}`,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  });
  
  const base = () => `https://api.github.com/repos/${config.owner}/${config.repo}`;
  
  function setConfig(cfg) {
    config = { ...config, ...cfg };
    localStorage.setItem('gh_admin_config', JSON.stringify(config));
  }
  
  function loadConfig() {
    const saved = localStorage.getItem('gh_admin_config');
    if (saved) config = JSON.parse(saved);
    return config;
  }
  
  function clearConfig() {
    localStorage.removeItem('gh_admin_config');
    config = { owner: '', repo: '', branch: 'main', token: '' };
  }
  
  async function request(path, options = {}) {
    // Si path es '/' o vacío, usamos la base directamente.
    const cleanPath = (path === '/' || path === '') ? '' : path;
    const url = path.startsWith('http') ? path : `${base()}${cleanPath}`;
    
    const res = await fetch(url, { 
      ...options, 
      headers: { ...headers(), ...(options.headers || {}) } 
    });
    
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`GitHub API ${res.status}: ${errText}`);
    }
    
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }
  
  // Test de conexión: pide la info del repositorio (URL válida)
  async function testConnection() {
    await request(''); // Esto resuelve a https://api.github.com/repos/{owner}/{repo}
    return true;
  }
  
  // Obtener archivo (decodificado)
  async function getFile(path) {
    try {
      const data = await request(`/contents/${path}?ref=${config.branch}`);
      const content = decodeBase64(data.content);
      return { content, sha: data.sha };
    } catch (e) {
      if (e.message.includes('404')) return { content: null, sha: null };
      throw e;
    }
  }
  
  // Crear o actualizar archivo (commit)
  async function putFile(path, content, message, sha = null) {
    const body = {
      message,
      content: encodeBase64(content),
      branch: config.branch
    };
    if (sha) body.sha = sha;
    
    return await request(`/contents/${path}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }
  
  // Eliminar archivo
  async function deleteFile(path, sha, message) {
    return await request(`/contents/${path}`, {
      method: 'DELETE',
      body: JSON.stringify({ message, sha, branch: config.branch })
    });
  }
  
  // Subir imagen (binario)
  async function uploadImage(path, blob, message) {
    const base64 = await blobToBase64(blob);
    // obtener sha si ya existe
    let sha = null;
    try {
      const existing = await request(`/contents/${path}?ref=${config.branch}`);
      sha = existing.sha;
    } catch (e) { /* no existe, está bien */ }
    
    const body = { 
      message, 
      content: base64.split(',')[1], 
      branch: config.branch 
    };
    if (sha) body.sha = sha;
    
    return await request(`/contents/${path}`, { 
      method: 'PUT', 
      body: JSON.stringify(body) 
    });
  }
  
  function encodeBase64(str) {
    return btoa(unescape(encodeURIComponent(str)));
  }
  
  function decodeBase64(str) {
    return decodeURIComponent(escape(atob(str.replace(/\n/g, ''))));
  }
  
  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  
  return { 
    setConfig, 
    loadConfig, 
    clearConfig, 
    testConnection, 
    getFile, 
    putFile, 
    deleteFile, 
    uploadImage, 
    getConfig: () => config 
  };
})();