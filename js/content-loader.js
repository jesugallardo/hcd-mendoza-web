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
    const wrapper = document.getElementById('hero-slides');
    if (wrapper) {
      wrapper.innerHTML = banners.map((b, i) => `
        <div class="slide ${i === 0 ? 'is-active' : ''}" style="background-image:url('${BASE}/${b.imagen}');">
          <div class="hero-content">
            <h2>${b.titulo}</h2>
            <p>${b.subtitulo || ''}</p>
          </div>
        </div>
      `).join('');
    }
  }

  // ====== CONCEJALES ======
  const concejales = await loadJSON('data/concejales.json');
  if (!concejales || !concejales.length) {
    // Si no hay concejales cargados, ocultamos la sección de autoridades
    const sec = document.getElementById('concejales');
    if (sec) sec.style.display = 'none';
  } else {
    // 1. Organigrama: detectar por cargo exacto y actualizar fotos/nombres
    const cargosOrganigrama = {
      'Presidente del HCD': 'org-presidente',
      'Secretario Habilitado': 'org-secretario-1',
      'Secretario Legislativo': 'org-secretario-2',
      'Prosecretario': 'org-secretario-3'
    };

    Object.entries(cargosOrganigrama).forEach(([cargo, id]) => {
      const concejal = concejales.find(c => c.cargo && c.cargo.trim() === cargo);
      const el = document.getElementById(id);
      if (el && concejal) {
        const avatar = el.querySelector('.avatar');
        const nombre = el.querySelector('h3, h4');
        const meta = el.querySelector('.meta');
        if (avatar) {
          avatar.innerHTML = concejal.foto
            ? `<img src="${BASE}/${concejal.foto}?t=${Date.now()}" alt="${concejal.nombre}">`
            : '👤';
        }
        if (nombre) nombre.textContent = concejal.nombre;
        if (meta && concejal.bloque && concejal.mandato) {
          meta.textContent = `${concejal.bloque} · Mandato hasta ${concejal.mandato}`;
        }
      }
    });

    // 2. Bloques políticos: TODOS los concejales (incluidos los del organigrama)
    const bloquesMap = {};
    concejales.forEach(c => {
      const bloque = c.bloque || 'Sin bloque';
      if (!bloquesMap[bloque]) bloquesMap[bloque] = [];
      bloquesMap[bloque].push(c);
    });

    const container = document.getElementById('bloques-list');
    if (container && Object.keys(bloquesMap).length) {
      container.innerHTML = Object.keys(bloquesMap).map(bloqueNombre => {
        const miembros = bloquesMap[bloqueNombre];
        const presidente = miembros.find(m => m.cargo && m.cargo.toLowerCase().includes('presidente'));
        return `
          <div class="bloque-item">
            <h3>Bloque ${bloqueNombre}</h3>
            ${presidente ? `<p class="bloque-pres"><strong>Presidente:</strong> ${presidente.nombre} · Mandato hasta ${presidente.mandato}</p>` : ''}
            <div class="carousel-container">
              <button class="carousel-btn prev" onclick="moveCarousel(this.parentElement.querySelector('.cc-wrapper'), -1)">❮</button>
              <div class="cc-wrapper">
                ${miembros.map(c => `
                  <div class="cc-slide">
                    <div class="concejal-card">
                      <div class="avatar">${c.foto ? `<img src="${BASE}/${c.foto}?t=${Date.now()}">` : '👤'}</div>
                      <h4>${c.nombre}</h4>
                      ${c.cargo ? `<div class="cargo">${c.cargo}</div>` : ''}
                      <div class="meta">Mandato hasta ${c.mandato || '—'}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
              <button class="carousel-btn next" onclick="moveCarousel(this.parentElement.querySelector('.cc-wrapper'), 1)"></button>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // ====== NOTICIAS ======
  const noticias = await loadJSON('data/noticias.json');
  const contNoticias = document.getElementById('noticias-container');
  if (contNoticias) {
    if (noticias && noticias.length) {
      contNoticias.innerHTML = noticias.slice(0, 6).map(n => `
        <article class="noticia-card">
          ${n.imagen ? `<img src="${BASE}/${n.imagen}?t=${Date.now()}">` : ''}
          <div class="noticia-content">
            <span class="fecha">${formatDate(n.fecha)}</span>
            <h3>${n.titulo}</h3>
            <p>${n.resumen || ''}</p>
            <a class="leer-mas" href="${n.link || '#'}" target="_blank">Leer más →</a>
          </div>
        </article>
      `).join('');
    } else {
      contNoticias.innerHTML = '<p class="empty-msg">Aún no hay noticias publicadas.</p>';
    }
  }

  // ====== TEMAS DE SESIÓN ======
  const temas = await loadJSON('data/temas_sesion.json');

  const contTemas = document.getElementById('temas-sesion-lista');
  if (contTemas) {
    const temasATratar = (temas || []).filter(t => t.estado === 'A tratar');
    if (temasATratar.length) {
      contTemas.innerHTML = '<ul>' +
        temasATratar.map(t => `
          <li>
            <span class="tipo-badge">${t.tipo}</span>
            <strong>${t.titulo}</strong>
            ${t.descripcion ? `<small>${t.descripcion}</small>` : ''}
          </li>
        `).join('') + '</ul>';
    } else {
      contTemas.innerHTML = '<p class="empty-msg">No hay temas programados para la próxima sesión.</p>';
    }
  }

  const contAprobados = document.getElementById('temas-aprobados-lista');
  if (contAprobados) {
    const temasAprobados = (temas || []).filter(t => t.estado === 'Aprobado');
    if (temasAprobados.length) {
      contAprobados.innerHTML = '<ul>' +
        temasAprobados.map(t => `
          <li>
            <span class="tipo-badge aprobado">✅ ${t.tipo}</span>
            <strong>${t.titulo}</strong>
            ${t.descripcion ? `<small>${t.descripcion}</small>` : ''}
          </li>
        `).join('') + '</ul>';
    } else {
      contAprobados.innerHTML = '<p class="empty-msg">Aún no hay temas aprobados.</p>';
    }
  }

  function formatDate(iso) {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    return `${parseInt(d)} de ${meses[parseInt(m)-1]}, ${y}`;
  }
})();