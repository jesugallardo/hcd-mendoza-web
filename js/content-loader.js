/**
 * content-loader.js
 * Carga dinámica de contenido desde GitHub
 * Usuario: jesugallardo | Repo: hcd-mendoza-web | Rama: main
 */
(async function() {
  const OWNER = 'jesugallardo';
  const REPO = 'hcd-mendoza-web';
  const BRANCH = 'main';
  const BASE = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}`;

  async function loadJSON(path) {
    try {
      const r = await fetch(`${BASE}/${path}?t=${Date.now()}`);
      if (!r.ok) return null;
      return await r.json();
    } catch (e) { return null; }
  }

  // ====== BANNERS ======
  const banners = await loadJSON('data/banners.json');
  if (banners && banners.length) {
    const wrapper = document.querySelector('.slides-wrapper');
    if (wrapper) {
      wrapper.innerHTML = banners.map((b, i) => `
        <div class="slide ${i === 0 ? 'is-active' : ''}" style="background-image:url('${BASE}/${b.imagen}'); background-size:cover; background-position:center;">
          <div class="hero-content">
            <h2>${b.titulo}</h2>
            <p>${b.subtitulo || ''}</p>
          </div>
        </div>
      `).join('');
      if (window.initHeroSlider) window.initHeroSlider();
    }
  }

  // ====== CONCEJALES ======
  const concejales = await loadJSON('data/concejales.json');
  if (concejales && concejales.length) {
    const wrapper = document.querySelector('#concejales .cc-wrapper');
    if (wrapper) {
      wrapper.innerHTML = concejales.map(c => `
        <div class="cc-slide">
          <div class="concejal-card">
            ${c.foto ? `<img src="${BASE}/${c.foto}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;margin-bottom:10px;">` : '<div class="avatar">👤</div>'}
            <h3>${c.nombre}</h3>
            <div class="bloque">${c.bloque}</div>
            ${c.cargo ? `<div style="font-size:11px;color:var(--accent-color);margin-top:4px;">${c.cargo}</div>` : ''}
            <div style="font-size:11px;color:#999;margin-top:4px;">Mandato hasta ${c.mandato || '—'}</div>
          </div>
        </div>
      `).join('');
      if (window.initConcejalesCarousel) window.initConcejalesCarousel();
    }
  }

  // ====== NOTICIAS ======
  const noticias = await loadJSON('data/noticias.json');
  if (noticias && noticias.length) {
    const cont = document.querySelector('#noticias .grid-3');
    if (cont) {
      cont.innerHTML = noticias.slice(0, 6).map(n => `
        <article class="noticia-card">
          ${n.imagen ? `<img src="${BASE}/${n.imagen}" style="width:100%;height:160px;object-fit:cover;border-radius:4px;margin-bottom:12px;">` : ''}
          <span class="fecha">${formatDate(n.fecha)}</span>
          <h3>${n.titulo}</h3>
          <p>${n.resumen || ''}</p>
          <a class="leer-mas" href="${n.link || '#'}">Leer más →</a>
        </article>
      `).join('');
    }
  }

  // ====== BLOQUES ======
  const bloques = await loadJSON('data/bloques.json');
  if (bloques && bloques.length) {
    const cont = document.querySelector('#bloques-list');
    if (cont) {
      cont.innerHTML = bloques.map(b => `
        <div class="bloque-item" style="background:#fff; border:1px solid var(--border-color); border-radius:6px; margin-bottom:10px;">
          <button class="bloque-toggle-btn">
            <span>Bloque ${b.nombre}</span>
            <span>Ver Integrantes ▾</span>
          </button>
          <div class="bloque-content" style="display:none; padding:15px;">
            ${b.presidente ? `<p><strong>Presidente:</strong> ${b.presidente}</p>` : ''}
            <ul>${(b.integrantes || []).map(i => `<li>${i}</li>`).join('')}</ul>
          </div>
        </div>
      `).join('');
      // Re-asociar listeners a los nuevos botones
      cont.querySelectorAll('.bloque-toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const content = btn.nextElementSibling;
          content.style.display = content.style.display === 'none' ? 'block' : 'none';
        });
      });
    }
  }

  function formatDate(iso) {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    return `${parseInt(d)} de ${meses[parseInt(m)-1]}, ${y}`;
  }
})();