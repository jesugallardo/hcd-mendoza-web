/**
 * content-loader.js
 * Carga dinámica de contenido desde GitHub
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
        <div class="slide" style="background-image: url('${BASE}/${b.imagen}');">
          <div class="hero-content">
            <h1>${b.titulo}</h1>
            <p>${b.subtitulo || ''}</p>
          </div>
        </div>
      `).join('');
    }
  }
  
  // ====== CONCEJALES (Agrupados por Bloque con carruseles) ======
  let concejales = await loadJSON('data/concejales.json');
  
  // Datos de prueba si no hay datos reales
  if (!concejales || !concejales.length) {
    concejales = [
      { nombre: "Cecilia Rodríguez", bloque: "La Libertad Avanza + Frente Cambia Mendoza", mandato: "2030", cargo: "Presidente de Bloque", foto: "" },
      { nombre: "Maximiliano Garrido", bloque: "La Libertad Avanza + Frente Cambia Mendoza", mandato: "2030", cargo: "Integrante", foto: "" },
      { nombre: "Carla Ernani", bloque: "La Libertad Avanza + Frente Cambia Mendoza", mandato: "2030", cargo: "Integrante", foto: "" },
      { nombre: "Tomás Dris", bloque: "La Libertad Avanza + Frente Cambia Mendoza", mandato: "2030", cargo: "Integrante", foto: "" },
      { nombre: "L. Villarreal Occhionero", bloque: "La Libertad Avanza + Frente Cambia Mendoza", mandato: "2030", cargo: "Integrante", foto: "" },
      { nombre: "Marcelo Rubio", bloque: "Frente Cambia Mendoza", mandato: "2027", cargo: "Presidente del Bloque", foto: "" },
      { nombre: "Cielo Daou", bloque: "Frente Cambia Mendoza", mandato: "2027", cargo: "Integrante", foto: "" },
      { nombre: "Rafael Bazán", bloque: "Frente Cambia Mendoza", mandato: "2027", cargo: "Integrante", foto: "" },
      { nombre: "Ernesto Giménez", bloque: "Frente Cambia Mendoza", mandato: "2027", cargo: "Integrante", foto: "" },
      { nombre: "Gustavo Caleau", bloque: "Fuerza Justicialista Mendoza", mandato: "2030", cargo: "Monobloque", foto: "" },
      { nombre: "Ricardo García", bloque: "Partido Verde", mandato: "2027", cargo: "Integrante", foto: "" },
      { nombre: "Gustavo Gutiérrez", bloque: "Coalición Cívica + ARI", mandato: "2027", cargo: "Monobloque", foto: "" }
    ];
  }

  const container = document.getElementById('bloques-container');
  if (container) {
    const bloquesMap = {};
    concejales.forEach(c => {
      if (!bloquesMap[c.bloque]) bloquesMap[c.bloque] = [];
      bloquesMap[c.bloque].push(c);
    });

    container.innerHTML = Object.keys(bloquesMap).map(bloqueNombre => {
      const miembros = bloquesMap[bloqueNombre];
      const presidente = miembros.find(m => m.cargo && m.cargo.toLowerCase().includes('presidente'));
      
      return `
        <div class="bloque-item">
          <div class="bloque-header" onclick="toggleBloque(this)">
            <h3>Bloque ${bloqueNombre}</h3>
            <span class="bloque-toggle">Ver Bloque e Integrantes ▾</span>
          </div>
          <div class="bloque-content">
            ${presidente ? `<div class="bloque-presidente"><strong>Presidente de Bloque:</strong> ${presidente.nombre} · Mandato hasta ${presidente.mandato}</div>` : ''}
            <div class="carousel-container">
              <button class="carousel-btn prev" onclick="moveCarousel(this.parentElement.querySelector('.carousel-wrapper'), -1)">❮</button>
              <div class="carousel-wrapper">
                ${miembros.map(c => `
                  <div class="carousel-slide">
                    <div class="concejal-card">
                      ${c.foto ? `<img src="${BASE}/${c.foto}" alt="${c.nombre}">` : '<div class="avatar">👤</div>'}
                      <h4>${c.nombre}</h4>
                      ${c.cargo ? `<div class="cargo">${c.cargo}</div>` : ''}
                      <div class="mandato">Mandato hasta ${c.mandato || '—'}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
              <button class="carousel-btn next" onclick="moveCarousel(this.parentElement.querySelector('.carousel-wrapper'), 1)">❯</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }
  
  // ====== NOTICIAS ======
  const noticias = await loadJSON('data/noticias.json');
  if (noticias && noticias.length) {
    const cont = document.getElementById('noticias-container');
    if (cont) {
      cont.innerHTML = noticias.slice(0, 6).map(n => `
        <article class="noticia-card">
          ${n.imagen ? `<img src="${BASE}/${n.imagen}" alt="${n.titulo}">` : ''}
          <div class="noticia-content">
            <span class="fecha">${formatDate(n.fecha)}</span>
            <h3>${n.titulo}</h3>
            <p>${n.resumen || ''}</p>
            <a href="${n.link || '#'}" class="leer-mas">Leer más →</a>
          </div>
        </article>
      `).join('');
    }
  }
  
  // ====== TEMAS DE SESIÓN ======
  const temas = await loadJSON('data/temas_sesion.json');
  if (temas && temas.length) {
    const cont = document.querySelector('#temas-sesion-lista');
    if (cont) {
      const temasATratar = temas.filter(t => t.estado === 'A tratar');
      if (temasATratar.length) {
        cont.innerHTML = '<ul>' + 
          temasATratar.map(t => `
            <li>
              <span class="tipo-badge">${t.tipo}</span>
              <strong>${t.titulo}</strong>
              <span class="estado-badge">${t.estado}</span>
              ${t.descripcion ? `<small>${t.descripcion}</small>` : ''}
            </li>
          `).join('') + 
          '</ul>';
      } else {
        cont.innerHTML = '<p style="color:var(--text-light); text-align:center; font-size:0.95rem;">No hay temas programados para la próxima sesión.</p>';
      }
    }
  }
  
  function formatDate(iso) {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    return `${parseInt(d)} de ${meses[parseInt(m)-1]}, ${y}`;
  }
})();