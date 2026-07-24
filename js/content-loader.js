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
    } catch (e) {
      return null;
    }
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
    }
  }
  
  // ====== CONCEJALES (Agrupados por Bloque con Carrusel) ======
  let concejales = await loadJSON('data/concejales.json');
  
  // Datos de prueba por defecto si no hay archivo o está vacío
  if (!concejales || !concejales.length) {
    concejales = [
      { nombre: "Cecilia Rodríguez", bloque: "La Libertad Avanza + Frente Cambia Mendoza", mandato: "2030", cargo: "Presidente de Bloque", foto: "" },
      { nombre: "Maximiliano Garrido", bloque: "La Libertad Avanza + Frente Cambia Mendoza", mandato: "2030", cargo: "Integrante", foto: "" },
      { nombre: "L. Villarreal Occhionero", bloque: "La Libertad Avanza + Frente Cambia Mendoza", mandato: "2030", cargo: "Integrante", foto: "" },
      { nombre: "Carla Ernani", bloque: "La Libertad Avanza + Frente Cambia Mendoza", mandato: "2030", cargo: "Integrante", foto: "" },
      { nombre: "Tomás Dris", bloque: "La Libertad Avanza + Frente Cambia Mendoza", mandato: "2030", cargo: "Integrante", foto: "" },
      { nombre: "Marcelo Rubio", bloque: "Frente Cambia Mendoza", mandato: "2027", cargo: "Presidente del Bloque", foto: "" },
      { nombre: "Cielo Daou", bloque: "Frente Cambia Mendoza", mandato: "2027", cargo: "Integrante", foto: "" },
      { nombre: "Rafael Bazán", bloque: "Frente Cambia Mendoza", mandato: "2027", cargo: "Integrante", foto: "" },
      { nombre: "Ernesto Giménez", bloque: "Frente Cambia Mendoza", mandato: "2027", cargo: "Integrante", foto: "" },
      { nombre: "Gustavo Caleau", bloque: "Fuerza Justicialista Mendoza", mandato: "2030", cargo: "Monobloque", foto: "" },
      { nombre: "Ricardo García", bloque: "Partido Verde", mandato: "2027", cargo: "Integrante", foto: "" },
      { nombre: "Gustavo Gutiérrez", bloque: "Coalición Cívica + ARI", mandato: "2027", cargo: "Monobloque", foto: "" }
    ];
  }

  if (concejales && concejales.length) {
    // 1. Agrupar concejales por bloque
    const bloquesMap = {};
    concejales.forEach(c => {
      if (!bloquesMap[c.bloque]) bloquesMap[c.bloque] = [];
      bloquesMap[c.bloque].push(c);
    });

    // 2. Renderizar un carrusel por cada bloque
    const container = document.getElementById('bloques-list');
    if (container) {
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
                      ${c.foto ? `<img src="${BASE}/${c.foto}">` : '<div class="avatar"></div>'}
                      <h4>${c.nombre}</h4>
                      ${c.cargo ? `<div class="cargo">${c.cargo}</div>` : ''}
                      <div class="meta">Mandato hasta ${c.mandato || '—'}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
              <button class="carousel-btn next" onclick="moveCarousel(this.parentElement.querySelector('.cc-wrapper'), 1)">❯</button>
            </div>
          </div>
        `;
      }).join('');
    }
  }
  
  // ====== NOTICIAS ======
  const noticias = await loadJSON('data/noticias.json');
  if (noticias && noticias.length) {
    const cont = document.getElementById('noticias-container');
    if (cont) {
      cont.innerHTML = noticias.slice(0, 6).map(n => `
        <article class="noticia-card">
          ${n.imagen ? `<img src="${BASE}/${n.imagen}">` : ''}
          <div class="noticia-content">
            <span class="fecha">${formatDate(n.fecha)}</span>
            <h3>${n.titulo}</h3>
            <p>${n.resumen || ''}</p>
            <a class="leer-mas" href="${n.link || '#'}">Leer más →</a>
          </div>
        </article>
      `).join('');
    }
  }
  
  function formatDate(iso) {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    return `${parseInt(d)} de ${meses[parseInt(m)-1]}, ${y}`;
  }

  // Función global para mover los carruseles con las flechas
  window.moveCarousel = function(wrapper, direction) {
    const scrollAmount = 240;
    wrapper.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
  };
})();