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
      if (!r.ok) return null; // Devuelve null si es 404 (archivo no existe)
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
          <div class="bloque-item" style="margin-bottom: 40px;">
            <h3 style="font-size: 1.1rem; margin-bottom: 15px; color: var(--primary); border-left: 4px solid var(--accent); padding-left: 10px;">
              Bloque ${bloqueNombre}
            </h3>
            
            ${presidente ? `<p style="margin-bottom: 15px; font-size: 0.9rem; background: var(--bg); padding: 10px 15px; border-radius: 6px;"><strong>Presidente de Bloque:</strong> ${presidente.nombre} · Mandato hasta ${presidente.mandato}</p>` : ''}
            
            <div class="carousel-container" style="position: relative;">
              <button class="carousel-btn prev" onclick="moveCarousel(this.parentElement.querySelector('.cc-wrapper'), -1)" style="position: absolute; left: -15px; top: 50%; transform: translateY(-50%); z-index: 10; background: var(--primary); color: white; border: none; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">❮</button>
              
              <div class="cc-wrapper" style="display: flex; overflow-x: auto; scroll-snap-type: x mandatory; gap: 20px; padding: 10px 5px 20px 5px; scroll-behavior: smooth;">
                ${miembros.map(c => `
                  <div class="cc-slide" style="flex: 0 0 220px; scroll-snap-align: start;">
                    <div class="concejal-card" style="background: white; padding: 25px 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid var(--border); text-align: center; height: 100%; transition: transform 0.2s;">
                      ${c.foto ? `<img src="${BASE}/${c.foto}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;margin-bottom:10px;border: 3px solid var(--primary);">` : '<div class="avatar" style="width:80px;height:80px;border-radius:50%;background:var(--bg);margin:0 auto 10px;display:flex;align-items:center;justify-content:center;font-size:2rem;color:var(--text-light);border: 3px solid var(--border);">👤</div>'}
                      <h3 style="font-size: 1rem; margin-bottom: 6px;">${c.nombre}</h3>
                      ${c.cargo ? `<div style="font-size:11px;color:var(--accent);font-weight:600;margin-bottom:6px;">${c.cargo}</div>` : ''}
                      <div style="font-size:11px;color:#999;">Mandato hasta ${c.mandato || '—'}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
              
              <button class="carousel-btn next" onclick="moveCarousel(this.parentElement.querySelector('.cc-wrapper'), 1)" style="position: absolute; right: -15px; top: 50%; transform: translateY(-50%); z-index: 10; background: var(--primary); color: white; border: none; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">❯</button>
            </div>
          </div>
        `;
      }).join('');
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
  
  // ====== BLOQUES (Acordeón) ======
  let bloques = await loadJSON('data/bloques.json');
  
  // Datos de prueba por defecto si no hay archivo o está vacío
  if (!bloques || !bloques.length) {
    bloques = [
      { nombre: "La Libertad Avanza + Frente Cambia Mendoza", presidente: "Cecilia Rodríguez", integrantes: ["Maximiliano Garrido", "L. Villarreal Occhionero", "Carla Ernani", "Tomás Dris"] },
      { nombre: "Frente Cambia Mendoza", presidente: "Marcelo Rubio", integrantes: ["Cielo Daou", "Rafael Bazán", "Ernesto Giménez"] },
      { nombre: "Fuerza Justicialista Mendoza", presidente: "Gustavo Caleau", integrantes: [] },
      { nombre: "Partido Verde", presidente: "Ricardo García", integrantes: [] },
      { nombre: "Coalición Cívica + ARI", presidente: "Gustavo Gutiérrez", integrantes: [] }
    ];
  }

  if (bloques && bloques.length) {
    const cont = document.querySelector('#bloques-list-acordeon'); // Asegurate que tu HTML tenga este ID o cambiá el selector
    if (cont) {
      cont.innerHTML = bloques.map(b => `
        <div class="bloque-item" style="background:#fff; border:1px solid var(--border); border-radius:6px; margin-bottom:10px;">
          <button class="bloque-toggle-btn" style="width:100%; text-align:left; padding:15px; background:none; border:none; cursor:pointer; font-weight:600; display:flex; justify-content:space-between; align-items:center;">
            <span>Bloque ${b.nombre}</span>
            <span>Ver Integrantes ▾</span>
          </button>
          <div class="bloque-content" style="display:none; padding:15px; border-top:1px solid var(--border);">
            ${b.presidente ? `<p><strong>Presidente: </strong>${b.presidente}</p>` : ''}
            <ul style="list-style:none; padding:0;">${(b.integrantes || []).map(i => `<li style="padding:4px 0;">• ${i}</li>`).join('')}</ul>
          </div>
        </div>
      `).join('');
      
      // Activar el acordeón de bloques
      cont.querySelectorAll('.bloque-toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const content = btn.nextElementSibling;
          const arrow = btn.querySelector('span:last-child');
          if (content.style.display === 'none') {
            content.style.display = 'block';
            arrow.textContent = 'Ver Integrantes ▴';
          } else {
            content.style.display = 'none';
            arrow.textContent = 'Ver Integrantes ▾';
          }
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

  // Función global para mover los carruseles con las flechas
  window.moveCarousel = function(wrapper, direction) {
    const scrollAmount = 240;
    wrapper.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
  };
})();