/**
 * admin-app.js
 * Controlador del panel: formularios, listados, guardado.
 */
let DATA = {
  concejales: [],
  banners: [],
  noticias: [],
  temas: []
};

window.addEventListener('DOMContentLoaded', () => {
  const cfg = GitHubAPI.loadConfig();
  if (cfg.token && cfg.owner && cfg.repo) {
    document.getElementById('ghOwner').value = cfg.owner;
    document.getElementById('ghRepo').value = cfg.repo;
    document.getElementById('ghBranch').value = cfg.branch;
    document.getElementById('ghToken').value = cfg.token;
    showPanel();
  }
  
  document.querySelectorAll('.tab').forEach(t => {
    t.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
      document.querySelectorAll('.panel-section').forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      document.getElementById('sec-' + t.dataset.tab).classList.add('active');
    });
  });
  
  setupImagePreview('cc-foto', 'cc-foto-preview');
  setupImagePreview('bn-imagen', 'bn-imagen-preview');
  setupImagePreview('nt-imagen', 'nt-imagen-preview');
});

function setupImagePreview(inputId, previewId) {
  document.getElementById(inputId).addEventListener('change', e => {
    const file = e.target.files[0];
    const preview = document.getElementById(previewId);
    if (file) { preview.src = URL.createObjectURL(file); preview.style.display = 'block'; } 
    else { preview.style.display = 'none'; }
  });
}

function showStatus(msg, type = 'info') {
  const bar = document.getElementById('statusBar');
  bar.textContent = msg;
  bar.className = 'status-bar show ' + type;
  setTimeout(() => bar.classList.remove('show'), 3500);
}

async function doLogin() {
  const owner = document.getElementById('ghOwner').value.trim();
  const repo = document.getElementById('ghRepo').value.trim();
  const branch = document.getElementById('ghBranch').value.trim() || 'main';
  const token = document.getElementById('ghToken').value.trim();
  if (!owner || !repo || !token) return showStatus('Completá todos los campos', 'error');
  GitHubAPI.setConfig({ owner, repo, branch, token });
  try {
    showStatus('Verificando conexión...', 'info');
    await GitHubAPI.testConnection();
    showStatus('¡Conexión exitosa!', 'success');
    await showPanel();
  } catch (e) {
    showStatus('Error: ' + e.message, 'error');
    GitHubAPI.clearConfig();
  }
}

async function testConnection() {
  const owner = document.getElementById('ghOwner').value.trim();
  const repo = document.getElementById('ghRepo').value.trim();
  const token = document.getElementById('ghToken').value.trim();
  if (!owner || !repo || !token) return showStatus('Completá los campos primero', 'error');
  GitHubAPI.setConfig({ owner, repo, branch: 'main', token });
  try {
    await GitHubAPI.testConnection();
    showStatus('✅ Conexión OK', 'success');
  } catch (e) { showStatus('❌ ' + e.message, 'error'); }
}

function logout() {
  if (!confirm('¿Cerrar sesión? Se borrará el token de este navegador.')) return;
  GitHubAPI.clearConfig();
  location.reload();
}

async function showPanel() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('adminPanel').style.display = 'block';
  const cfg = GitHubAPI.getConfig();
  document.getElementById('repoInfo').textContent = `${cfg.owner}/${cfg.repo} (${cfg.branch})`;
  await loadAllData();
}

async function loadAllData() {
  try {
    const [c, b, n, t] = await Promise.all([
      GitHubAPI.getFile('data/concejales.json'),
      GitHubAPI.getFile('data/banners.json'),
      GitHubAPI.getFile('data/noticias.json'),
      GitHubAPI.getFile('data/temas_sesion.json')
    ]);
    DATA.concejales = c.content ? JSON.parse(c.content) : [];
    DATA.banners = b.content ? JSON.parse(b.content) : [];
    DATA.noticias = n.content ? JSON.parse(n.content) : [];
    DATA.temas = t.content ? JSON.parse(t.content) : [];
    renderAll();
  } catch (e) { showStatus('Error cargando datos: ' + e.message, 'error'); }
}

function renderAll() {
  renderConcejales(); renderBanners(); renderNoticias(); renderTemas();
}

// ========= CONCEJALES =========
async function saveConcejal() {
  const idx = parseInt(document.getElementById('cc-edit-index').value);
  const nombre = document.getElementById('cc-nombre').value.trim();
  const bloque = document.getElementById('cc-bloque').value.trim();
  const mandato = document.getElementById('cc-mandato').value.trim();
  const cargo = document.getElementById('cc-cargo').value.trim();
  const fotoFile = document.getElementById('cc-foto').files[0];
  if (!nombre || !bloque) return showStatus('Nombre y bloque son obligatorios', 'error');
  try {
    showStatus('Guardando...', 'info');
    let fotoPath = idx >= 0 ? DATA.concejales[idx].foto : '';
    if (fotoFile) {
      const ext = fotoFile.name.split('.').pop();
      const slug = nombre.toLowerCase().replace(/[^a-z0-9]/g, '-');
      fotoPath = `assets/img/concejales/${slug}.${ext}`;
      await GitHubAPI.uploadImage(fotoPath, fotoFile, `Upload foto ${nombre}`);
    }
    const item = { nombre, bloque, mandato, cargo, foto: fotoPath };
    if (idx >= 0) DATA.concejales[idx] = item; else DATA.concejales.push(item);
    await GitHubAPI.putFile('data/concejales.json', JSON.stringify(DATA.concejales, null, 2), idx >= 0 ? `Update concejal ${nombre}` : `Add concejal ${nombre}`);
    showStatus('✅ Concejal guardado', 'success');
    resetConcejalForm(); await loadAllData();
  } catch (e) { showStatus('Error: ' + e.message, 'error'); }
}

function editConcejal(i) {
  const c = DATA.concejales[i];
  document.getElementById('cc-nombre').value = c.nombre;
  document.getElementById('cc-bloque').value = c.bloque;
  document.getElementById('cc-mandato').value = c.mandato || '';
  document.getElementById('cc-cargo').value = c.cargo || '';
  document.getElementById('cc-edit-index').value = i;
  if (c.foto) {
    const cfg = GitHubAPI.getConfig();
    const p = document.getElementById('cc-foto-preview');
    p.src = `https://raw.githubusercontent.com/${cfg.owner}/${cfg.repo}/${cfg.branch}/${c.foto}`; p.style.display = 'block';
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deleteConcejal(i) {
  if (!confirm('¿Eliminar este concejal?')) return;
  const nombre = DATA.concejales[i].nombre;
  DATA.concejales.splice(i, 1);
  try {
    await GitHubAPI.putFile('data/concejales.json', JSON.stringify(DATA.concejales, null, 2), `Delete concejal ${nombre}`);
    showStatus('Eliminado', 'success'); await loadAllData();
  } catch (e) { showStatus('Error: ' + e.message, 'error'); }
}

function resetConcejalForm() {
  ['cc-nombre','cc-bloque','cc-mandato','cc-cargo','cc-foto'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('cc-edit-index').value = -1;
  document.getElementById('cc-foto-preview').style.display = 'none';
}

function renderConcejales() {
  const cont = document.getElementById('listaConcejales');
  if (!DATA.concejales.length) { cont.innerHTML = '<p style="color:#888;">No hay concejales cargados.</p>'; return; }
  const cfg = GitHubAPI.getConfig();
  cont.innerHTML = '<h3 style="margin:20px 0 10px; color:var(--primary);">Concejales cargados (' + DATA.concejales.length + ')</h3>' +
    DATA.concejales.map((c, i) => `
      <div class="item-card">
        ${c.foto ? `<img src="https://raw.githubusercontent.com/${cfg.owner}/${cfg.repo}/${cfg.branch}/${c.foto}">` : '<div style="width:50px;height:50px;background:#ddd;border-radius:4px;"></div>'}
        <div class="item-info">
          <h4>${c.nombre}</h4>
          <small>${c.bloque} · Mandato ${c.mandato || '?'}${c.cargo ? ' · ' + c.cargo : ''}</small>
        </div>
        <div class="item-actions">
          <button class="btn" onclick="editConcejal(${i})">Editar</button>
          <button class="btn btn-danger" onclick="deleteConcejal(${i})">Borrar</button>
        </div>
      </div>
    `).join('');
}

// ========= BANNERS =========
async function saveBanner() {
  const idx = parseInt(document.getElementById('bn-edit-index').value);
  const titulo = document.getElementById('bn-titulo').value.trim();
  const subtitulo = document.getElementById('bn-subtitulo').value.trim();
  const imgFile = document.getElementById('bn-imagen').files[0];
  if (!titulo) return showStatus('El título es obligatorio', 'error');
  try {
    showStatus('Guardando...', 'info');
    let imgPath = idx >= 0 ? DATA.banners[idx].imagen : '';
    if (imgFile) {
      const ext = imgFile.name.split('.').pop();
      const slug = 'banner-' + Date.now();
      imgPath = `assets/img/banners/${slug}.${ext}`;
      await GitHubAPI.uploadImage(imgPath, imgFile, `Upload banner ${titulo}`);
    }
    const item = { titulo, subtitulo, imagen: imgPath };
    if (idx >= 0) DATA.banners[idx] = item; else DATA.banners.push(item);
    await GitHubAPI.putFile('data/banners.json', JSON.stringify(DATA.banners, null, 2), idx >= 0 ? `Update banner` : `Add banner`);
    showStatus('✅ Banner guardado', 'success'); resetBannerForm(); await loadAllData();
  } catch (e) { showStatus('Error: ' + e.message, 'error'); }
}

function editBanner(i) {
  const b = DATA.banners[i];
  document.getElementById('bn-titulo').value = b.titulo;
  document.getElementById('bn-subtitulo').value = b.subtitulo || '';
  document.getElementById('bn-edit-index').value = i;
  if (b.imagen) {
    const cfg = GitHubAPI.getConfig();
    const p = document.getElementById('bn-imagen-preview');
    p.src = `https://raw.githubusercontent.com/${cfg.owner}/${cfg.repo}/${cfg.branch}/${b.imagen}`; p.style.display = 'block';
  }
}

async function deleteBanner(i) {
  if (!confirm('¿Eliminar este banner?')) return;
  DATA.banners.splice(i, 1);
  try { await GitHubAPI.putFile('data/banners.json', JSON.stringify(DATA.banners, null, 2), 'Delete banner'); showStatus('Eliminado', 'success'); await loadAllData(); } 
  catch (e) { showStatus('Error: ' + e.message, 'error'); }
}

function resetBannerForm() {
  ['bn-titulo','bn-subtitulo','bn-imagen'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('bn-edit-index').value = -1;
  document.getElementById('bn-imagen-preview').style.display = 'none';
}

function renderBanners() {
  const cont = document.getElementById('listaBanners');
  if (!DATA.banners.length) { cont.innerHTML = '<p style="color:#888;">No hay banners.</p>'; return; }
  const cfg = GitHubAPI.getConfig();
  cont.innerHTML = '<h3 style="margin:20px 0 10px; color:var(--primary);">Banners cargados (' + DATA.banners.length + ')</h3>' +
    DATA.banners.map((b, i) => `
      <div class="item-card">
        ${b.imagen ? `<img src="https://raw.githubusercontent.com/${cfg.owner}/${cfg.repo}/${cfg.branch}/${b.imagen}">` : ''}
        <div class="item-info">
          <h4>${b.titulo}</h4>
          <small>${(b.subtitulo || '').substring(0, 80)}...</small>
        </div>
        <div class="item-actions">
          <button class="btn" onclick="editBanner(${i})">Editar</button>
          <button class="btn btn-danger" onclick="deleteBanner(${i})">Borrar</button>
        </div>
      </div>
    `).join('');
}

// ========= NOTICIAS =========
async function saveNoticia() {
  const idx = parseInt(document.getElementById('nt-edit-index').value);
  const titulo = document.getElementById('nt-titulo').value.trim();
  const resumen = document.getElementById('nt-resumen').value.trim();
  const contenido = document.getElementById('nt-contenido').value.trim();
  const fecha = document.getElementById('nt-fecha').value;
  const link = document.getElementById('nt-link').value.trim();
  const imgFile = document.getElementById('nt-imagen').files[0];
  if (!titulo || !fecha) return showStatus('Título y fecha son obligatorios', 'error');
  try {
    showStatus('Guardando...', 'info');
    let imgPath = idx >= 0 ? DATA.noticias[idx].imagen : '';
    if (imgFile) {
      const ext = imgFile.name.split('.').pop();
      const slug = 'noticia-' + Date.now();
      imgPath = `assets/img/noticias/${slug}.${ext}`;
      await GitHubAPI.uploadImage(imgPath, imgFile, `Upload imagen noticia`);
    }
    const item = { titulo, resumen, contenido, fecha, imagen: imgPath, link };
    if (idx >= 0) DATA.noticias[idx] = item; else DATA.noticias.unshift(item);
    await GitHubAPI.putFile('data/noticias.json', JSON.stringify(DATA.noticias, null, 2), idx >= 0 ? `Update noticia` : `Add noticia`);
    showStatus('✅ Noticia guardada', 'success'); resetNoticiaForm(); await loadAllData();
  } catch (e) { showStatus('Error: ' + e.message, 'error'); }
}

function editNoticia(i) {
  const n = DATA.noticias[i];
  document.getElementById('nt-titulo').value = n.titulo;
  document.getElementById('nt-resumen').value = n.resumen || '';
  document.getElementById('nt-contenido').value = n.contenido || '';
  document.getElementById('nt-fecha').value = n.fecha;
  document.getElementById('nt-link').value = n.link || '';
  document.getElementById('nt-edit-index').value = i;
  if (n.imagen) {
    const cfg = GitHubAPI.getConfig();
    const p = document.getElementById('nt-imagen-preview');
    p.src = `https://raw.githubusercontent.com/${cfg.owner}/${cfg.repo}/${cfg.branch}/${n.imagen}`; p.style.display = 'block';
  }
}

async function deleteNoticia(i) {
  if (!confirm('¿Eliminar esta noticia?')) return;
  DATA.noticias.splice(i, 1);
  try { await GitHubAPI.putFile('data/noticias.json', JSON.stringify(DATA.noticias, null, 2), 'Delete noticia'); showStatus('Eliminada', 'success'); await loadAllData(); } 
  catch (e) { showStatus('Error: ' + e.message, 'error'); }
}

function resetNoticiaForm() {
  ['nt-titulo','nt-resumen','nt-contenido','nt-fecha','nt-link','nt-imagen'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('nt-edit-index').value = -1;
  document.getElementById('nt-imagen-preview').style.display = 'none';
}

function renderNoticias() {
  const cont = document.getElementById('listaNoticias');
  if (!DATA.noticias.length) { cont.innerHTML = '<p style="color:#888;">No hay noticias.</p>'; return; }
  const cfg = GitHubAPI.getConfig();
  cont.innerHTML = '<h3 style="margin:20px 0 10px; color:var(--primary);">Noticias cargadas (' + DATA.noticias.length + ')</h3>' +
    DATA.noticias.map((n, i) => `
      <div class="item-card">
        ${n.imagen ? `<img src="https://raw.githubusercontent.com/${cfg.owner}/${cfg.repo}/${cfg.branch}/${n.imagen}">` : ''}
        <div class="item-info">
          <h4>${n.titulo}</h4>
          <small>${n.fecha} · ${(n.resumen || '').substring(0, 60)}...</small>
        </div>
        <div class="item-actions">
          <button class="btn" onclick="editNoticia(${i})">Editar</button>
          <button class="btn btn-danger" onclick="deleteNoticia(${i})">Borrar</button>
        </div>
      </div>
    `).join('');
}

// ========= TEMAS DE SESIÓN =========
async function saveTema() {
  const idx = parseInt(document.getElementById('tm-edit-index').value);
  const titulo = document.getElementById('tm-titulo').value.trim();
  const descripcion = document.getElementById('tm-descripcion').value.trim();
  const tipo = document.getElementById('tm-tipo').value;
  const estado = document.getElementById('tm-estado').value;
  if (!titulo) return showStatus('El título es obligatorio', 'error');
  try {
    showStatus('Guardando...', 'info');
    const item = { titulo, descripcion, tipo, estado };
    if (idx >= 0) DATA.temas[idx] = item; else DATA.temas.push(item);
    await GitHubAPI.putFile('data/temas_sesion.json', JSON.stringify(DATA.temas, null, 2), idx >= 0 ? `Update tema de sesión` : `Add tema de sesión`);
    showStatus('✅ Tema guardado', 'success'); resetTemaForm(); await loadAllData();
  } catch (e) { showStatus('Error: ' + e.message, 'error'); }
}

function editTema(i) {
  const t = DATA.temas[i];
  document.getElementById('tm-titulo').value = t.titulo;
  document.getElementById('tm-descripcion').value = t.descripcion || '';
  document.getElementById('tm-tipo').value = t.tipo || 'Ordenanza';
  document.getElementById('tm-estado').value = t.estado || 'A tratar';
  document.getElementById('tm-edit-index').value = i;
}

async function deleteTema(i) {
  if (!confirm('¿Eliminar este tema?')) return;
  DATA.temas.splice(i, 1);
  try { await GitHubAPI.putFile('data/temas_sesion.json', JSON.stringify(DATA.temas, null, 2), 'Delete tema de sesión'); showStatus('Eliminado', 'success'); await loadAllData(); } 
  catch (e) { showStatus('Error: ' + e.message, 'error'); }
}

function resetTemaForm() {
  ['tm-titulo','tm-descripcion','tm-tipo','tm-estado'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('tm-edit-index').value = -1;
}

function renderTemas() {
  const cont = document.getElementById('listaTemas');
  if (!DATA.temas.length) { cont.innerHTML = '<p style="color:#888;">No hay temas cargados.</p>'; return; }
  cont.innerHTML = '<h3 style="margin:20px 0 10px; color:var(--primary);">Temas cargados (' + DATA.temas.length + ')</h3>' +
    DATA.temas.map((t, i) => `
      <div class="item-card">
        <div class="item-info">
          <h4>${t.titulo}</h4>
          <small>${t.tipo} · ${t.estado}${t.descripcion ? ' · ' + t.descripcion.substring(0, 60) + '...' : ''}</small>
        </div>
        <div class="item-actions">
          <button class="btn" onclick="editTema(${i})">Editar</button>
          <button class="btn btn-danger" onclick="deleteTema(${i})">Borrar</button>
        </div>
      </div>
    `).join('');
}