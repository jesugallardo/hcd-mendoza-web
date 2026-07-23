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
    const url = path.startsWith('http') ? path : `${base()}${path}`;
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
  
  async function testConnection() {
    await request('');
    return true;
  }
  
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
  
  async function putFile(path, content, message, sha = null) {
    let currentSha = sha;
    try {
      const existing = await request(`/contents/${path}?ref=${config.branch}&t=${Date.now()}`);
      currentSha = existing.sha;
    } catch (e) {
      if (!e.message.includes('404')) throw e;
    }

    const body = {
      message,
      content: encodeBase64(content),
      branch: config.branch
    };
    if (currentSha) body.sha = currentSha;
    
    return await request(`/contents/${path}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }
  
  async function deleteFile(path, sha, message) {
    return await request(`/contents/${path}`, {
      method: 'DELETE',
      body: JSON.stringify({ message, sha, branch: config.branch })
    });
  }
  
  async function uploadImage(path, blob, message) {
    const base64 = await blobToBase64(blob);
    let currentSha = null;
    try {
      const existing = await request(`/contents/${path}?ref=${config.branch}&t=${Date.now()}`);
      currentSha = existing.sha;
    } catch (e) { /* no existe, ok */ }
    
    const body = { 
      message, 
      content: base64.split(',')[1], 
      branch: config.branch 
    };
    if (currentSha) body.sha = currentSha;
    
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