/**
 * content-loader.js
 * Carga contenido + aplica personalización + carrusel coverflow configurable.
 */
(async function() {
    const OWNER = 'jesugallardo';
    const REPO = 'hcd-mendoza-web';
    const BRANCH = 'main';
    const BASE = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}`;

    async function loadJSON(path) {
        try {
            const r = await fetch(`${BASE}/${path}?t=${Date.now()}`);
            if (r.status === 404) return { ok:false, notFound:true, data:null };
            if (!r.ok) return { ok:false, notFound:false, data:null };
            return { ok:true, notFound:false, data:await r.json() };
        } catch(e) { return { ok:false, notFound:false, data:null }; }
    }
    function setStateLoading(el, msg){ if(el) el.innerHTML = `<div class="loading"><div class="spinner"></div>${msg}</div>`; }
    function setStateError(el, fn){ if(!el) return; el.innerHTML = `<div class="loading state-error">⚠️ No se pudo cargar.<br><button class="btn" type="button">↻ Reintentar</button></div>`; const b=el.querySelector('button'); if(b) b.addEventListener('click', fn); }
    function setStateEmpty(el, msg){ if(el) el.innerHTML = `<p class="empty-msg">${msg}</p>`; }
    function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
    function imgUrl(p){ if(!p) return ''; return /^https?:\/\//.test(p)?p:`${BASE}/${p}?t=${Date.now()}`; }
    function formatDate(iso){ if(!iso) return ''; const [y,m,d]=String(iso).split('-'); const meses=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']; const mi=parseInt(m,10)-1; if(isNaN(mi)||mi<0||mi>11) return iso; return `${parseInt(d,10)} de ${meses[mi]}, ${y}`; }
    window.hcdImgError = function(img){ img.onerror=null; img.src='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="100%" height="100%" fill="#e1e4e8"/><text x="50%" y="50%" font-size="60" text-anchor="middle" dominant-baseline="middle">🏛️</text></svg>'); };

    /* ===== Opciones por defecto del carrusel ===== */
    const CF_DEFAULT = { tamaño:'mediano', autoplay:4000, nombrePos:'abajo', efecto:'coverflow', mostrarCargo:true, mostrarFlechas:true, mostrarDots:true, mostrarEnlace:true, enlaceTexto:'Ver todos los concejales →', enlaceUrl:'#concejales' };
    let cfOpts = { ...CF_DEFAULT };

    /* ================= 1. CONFIG DE PERSONALIZACIÓN ================= */
    const cfgRes = await loadJSON('data/config.json');
    const cfg = (cfgRes.ok && cfgRes.data) ? cfgRes.data : null;
    if (cfg) {
        if (cfg.carrusel) cfOpts = { ...CF_DEFAULT, ...cfg.carrusel };

        if (cfg.theme) {
            if (cfg.theme.primary) document.documentElement.style.setProperty('--primary', cfg.theme.primary);
            if (cfg.theme.accent) document.documentElement.style.setProperty('--gold', cfg.theme.accent);
        }
        if (cfg.site) {
            if (cfg.site.seoTitulo) document.getElementById('seo-title').textContent = cfg.site.seoTitulo;
            if (cfg.site.seoDescripcion) document.getElementById('seo-desc').setAttribute('content', cfg.site.seoDescripcion);
            if (cfg.site.nombre) {
                document.getElementById('site-name').textContent = cfg.site.nombre;
                document.getElementById('footer-name').textContent = cfg.site.nombre;
            }
            if (cfg.site.subtitulo) document.getElementById('site-subtitle').textContent = cfg.site.subtitulo;
            if (cfg.site.copyright) document.getElementById('footer-copyright').textContent = cfg.site.copyright;
            const logoEl = document.getElementById('site-logo');
            if (logoEl) {
                if (cfg.site.logoTipo === 'imagen' && cfg.site.logoImagen) {
                    logoEl.innerHTML = `<img src="${imgUrl(cfg.site.logoImagen)}" alt="${esc(cfg.site.nombre)}">`;
                } else if (cfg.site.logoEmoji) {
                    logoEl.textContent = cfg.site.logoEmoji;
                }
            }
        }
        if (cfg.anuncio && cfg.anuncio.visible && cfg.anuncio.texto) {
            const bar = document.getElementById('anuncio-bar');
            bar.style.background = cfg.anuncio.color || '#c9a227';
            bar.style.color = cfg.anuncio.textoColor || '#122a44';
            bar.innerHTML = cfg.anuncio.link
                ? `<a href="${esc(cfg.anuncio.link)}" target="_blank" rel="noopener">${esc(cfg.anuncio.texto)}</a>`
                : esc(cfg.anuncio.texto);
            bar.classList.add('visible');
        }
        if (cfg.hero) {
            const hero = document.getElementById('hero');
            if (cfg.hero.altura) { hero.classList.remove('hero-sm','hero-md','hero-lg','hero-full'); hero.classList.add('hero-'+cfg.hero.altura); }
            if (cfg.hero.overlay) { hero.classList.remove('overlay-light','overlay-medio','overlay-dark'); if(cfg.hero.overlay!=='medio') hero.classList.add('overlay-'+cfg.hero.overlay); }
            hero.classList.toggle('no-flechas', cfg.hero.mostrarFlechas === false);
            hero.classList.toggle('no-dots', cfg.hero.mostrarDots === false);
            if (typeof cfg.hero.autoplay === 'number' && typeof window.setHeroDelay === 'function') window.setHeroDelay(cfg.hero.autoplay);
        }
        if (cfg.textos) {
            document.querySelectorAll('[data-text]').forEach(el => {
                const key = el.dataset.text;
                if (cfg.textos[key]) el.textContent = cfg.textos[key];
            });
        }
        if (cfg.contacto) {
            const c = cfg.contacto;
            document.querySelectorAll('[data-contact="tel"]').forEach(e => e.textContent = c.telefono || '');
            document.querySelectorAll('[data-contact="mail"]').forEach(e => e.textContent = c.email || '');
            document.querySelectorAll('[data-contact="dir"]').forEach(e => e.textContent = c.direccion || '');
            document.querySelectorAll('[data-contact="horario"]').forEach(e => e.textContent = c.horario || '');
            document.querySelectorAll('[data-contact="tel-link"]').forEach(e => e.href = 'tel:' + (c.telefono||'').replace(/[^+\d]/g,''));
            document.querySelectorAll('[data-contact="mail-link"]').forEach(e => e.href = 'mailto:' + (c.email||''));
        }
        if (cfg.redes) {
            const icons = { facebook:'📘', instagram:'📷', twitter:'🐦', youtube:'▶️', whatsapp:'💬' };
            const cont = document.getElementById('footer-redes');
            const activos = Object.entries(cfg.redes).filter(([k,v]) => v.visible && v.url);
            if (cont && activos.length) {
                cont.innerHTML = activos.map(([k,v]) =>
                    `<a href="${esc(v.url)}" target="_blank" rel="noopener" aria-label="${k}">${icons[k]||'🔗'}</a>`
                ).join('');
            }
        }
        if (cfg.enlaces && cfg.enlaces.length) {
            const visibles = cfg.enlaces.filter(e => e.visible && e.titulo);
            const grid = document.getElementById('accesos-grid');
            if (grid && visibles.length) {
                grid.innerHTML = visibles.map(e =>
                    `<a class="acceso-card" href="${esc(e.url||'#')}" ${e.url&&e.url.startsWith('http')?'target="_blank" rel="noopener"':''}>
                        <div class="acceso-ico">${esc(e.icono||'🔗')}</div>
                        <h4>${esc(e.titulo)}</h4>
                    </a>`
                ).join('');
            }
        }
        if (cfg.layout) {
            const L = cfg.layout;
            if (L.ancho === 'ancho') document.body.classList.add('layout-ancho');
            if (L.ancho === 'full') document.body.classList.add('layout-full');
            if (L.fondosAlternados === false) document.body.classList.add('no-alternado');
            const fonts = {
                'default':'"Segoe UI",system-ui,-apple-system,sans-serif',
                'serif':'Georgia,"Times New Roman",serif',
                'moderna':'"Roboto","Helvetica Neue",sans-serif',
                'institucional':'"Merriweather",Georgia,serif'
            };
            if (L.fuente && L.fuente !== 'default') {
                if (L.fuente === 'moderna' || L.fuente === 'institucional') {
                    const fam = L.fuente === 'moderna' ? 'Roboto:wght@400;600;700' : 'Merriweather:wght@400;700';
                    const link = document.createElement('link');
                    link.rel = 'stylesheet';
                    link.href = `https://fonts.googleapis.com/css2?family=${fam}&display=swap`;
                    document.head.appendChild(link);
                }
                document.body.style.fontFamily = fonts[L.fuente] || fonts.default;
            }
            if (L.mostrarBackTop === false) document.getElementById('backTop').style.display = 'none';
            if (L.modoOscuroPublico) {
                const btn = document.getElementById('publicDarkToggle');
                btn.classList.add('visible');
                if (localStorage.getItem('hcd_public_dark') === '1') {
                    document.body.classList.add('public-dark');
                    btn.textContent = '☀️';
                }
            }
        }
        if (cfg.sections && cfg.sections.length) {
            const main = document.getElementById('main-content');
            [...cfg.sections].sort((a,b)=>a.order-b.order).forEach(sec => {
                const el = document.getElementById(sec.id);
                if (!el) return;
                if (sec.id === 'accesos-rapidos') {
                    const hay = (cfg.enlaces||[]).some(e => e.visible && e.titulo);
                    el.classList.toggle('section-hidden', !sec.visible || !hay);
                } else {
                    el.classList.toggle('section-hidden', !sec.visible);
                }
                el.classList.remove('section-normal','section-large','section-featured');
                if (sec.size && sec.size !== 'normal') el.classList.add('section-'+sec.size);
                if (main && el.parentNode === main) main.appendChild(el);
            });
        }
    }

    /* ================= 2. BANNERS ================= */
    const bannersRes = await loadJSON('data/banners.json');
    if (bannersRes.ok && Array.isArray(bannersRes.data) && bannersRes.data.length) {
        const wrapper = document.getElementById('hero-slides');
        if (wrapper) {
            wrapper.innerHTML = bannersRes.data.map((b,i)=>`
                <div class="slide ${i===0?'is-active':''}" style="background-image:url('${imgUrl(b.imagen)}');">
                    <div class="hero-content">
                        <h2>${esc(b.titulo)}</h2>
                        <p>${esc(b.subtitulo||'')}</p>
                    </div>
                </div>`).join('');
            if (typeof window.refreshHero === 'function') window.refreshHero();
        }
    }

    /* ================= 3. CONCEJALES ================= */
    async function loadConcejales() {
        const bloquesList = document.getElementById('bloques-list');
        setStateLoading(bloquesList, 'Cargando bloques...');
        const res = await loadJSON('data/concejales.json');
        if (!res.ok) { if(res.notFound) setStateEmpty(bloquesList,'Aún no hay concejales cargados.'); else setStateError(bloquesList, loadConcejales); return; }
        const concejales = res.data || [];
        if (!concejales.length) { setStateEmpty(bloquesList,'Aún no hay concejales cargados.'); return; }

        // Organigrama
        const cargosOrganigrama = { 'Presidente del HCD':'org-presidente','Secretario Habilitado':'org-secretario-1','Secretario Legislativo':'org-secretario-2','Prosecretario':'org-secretario-3' };
        Object.entries(cargosOrganigrama).forEach(([cargo,id])=>{
            const concejal = concejales.find(c=>c.cargo && c.cargo.trim()===cargo);
            const el = document.getElementById(id);
            if(!el) return;
            const avatar=el.querySelector('.avatar'), nombre=el.querySelector('h3,h4'), meta=el.querySelector('.meta');
            if(concejal){
                if(avatar) avatar.innerHTML = concejal.foto?`<img src="${imgUrl(concejal.foto)}" alt="${esc(concejal.nombre)}" onerror="hcdImgError(this)">`:'👤';
                if(nombre) nombre.textContent = concejal.nombre;
                if(meta) meta.textContent = [concejal.bloque, concejal.mandato?`Mandato hasta ${concejal.mandato}`:''].filter(Boolean).join(' · ')||'—';
            }
        });

        // Bloques con carrusel coverflow
        const bloquesMap = {};
        concejales.forEach(c=>{ const b=c.bloque||'Sin bloque'; if(!bloquesMap[b]) bloquesMap[b]=[]; bloquesMap[b].push(c); });

        if(bloquesList){
            let html = Object.keys(bloquesMap).map(bn=>{
                const miembros = bloquesMap[bn];
                const pres = miembros.find(m=>m.cargo && m.cargo.toLowerCase().includes('presidente'));
                return `<div class="bloque-item">
                    <h3>Bloque ${esc(bn)}</h3>
                    ${pres?`<p class="bloque-pres"><strong>Presidente:</strong> ${esc(pres.nombre)} · Mandato hasta ${esc(pres.mandato||'—')}</p>`:''}
                    <div class="cf-carousel">
                        <button class="cf-arrow prev" type="button" aria-label="Anterior">❮</button>
                        <div class="cf-stage">
                            ${miembros.map(c=>`
                                <div class="cf-slide">
                                    ${c.foto
                                        ? `<img src="${imgUrl(c.foto)}" alt="${esc(c.nombre)}" onerror="hcdImgError(this)">`
                                        : `<div class="cf-noimg">👤</div>`}
                                    <div class="cf-name">
                                        <strong>${esc(c.nombre)}</strong>
                                        ${cfOpts.mostrarCargo && c.cargo?`<small>${esc(c.cargo)}</small>`:''}
                                    </div>
                                </div>`).join('')}
                        </div>
                        <button class="cf-arrow next" type="button" aria-label="Siguiente">❯</button>
                        <div class="cf-dots"></div>
                    </div>
                </div>`;
            }).join('');

            // Enlace "Ver todos los concejales"
            if (cfOpts.mostrarEnlace) {
                html += `<a class="cf-ver-todos" href="${esc(cfOpts.enlaceUrl||'#concejales')}">${esc(cfOpts.enlaceTexto||'Ver todos los concejales →')}</a>`;
            }
            bloquesList.innerHTML = html;

            // Aplica clases de configuración + inicializa cada carrusel
            const sizeClass = { 'pequeño':'cf-sm','pequeno':'cf-sm','mediano':'cf-md','grande':'cf-lg' }[cfOpts.tamaño] || 'cf-md';
            bloquesList.querySelectorAll('.cf-carousel').forEach(root => {
                root.classList.add(sizeClass);
                root.classList.add('name-' + (cfOpts.nombrePos || 'abajo'));
                if (cfOpts.mostrarFlechas === false) root.classList.add('no-flechas');
                if (cfOpts.mostrarDots === false) root.classList.add('no-dots');
                initCoverflow(root, cfOpts);
            });
        }
    }

    /* ===== Carrusel coverflow con autoplay ===== */
    function initCoverflow(root, opts) {
        const slides = Array.from(root.querySelectorAll('.cf-slide'));
        const dotsWrap = root.querySelector('.cf-dots');
        if (!slides.length) return;
        const flat = (opts.efecto === 'plano');
        let active = 0, timer = null;

        dotsWrap.innerHTML = '';
        slides.forEach((_, i) => {
            const d = document.createElement('button');
            d.className = 'cf-dot';
            d.type = 'button';
            d.setAttribute('aria-label', 'Ir al concejal ' + (i+1));
            d.addEventListener('click', () => { active = i; update(); restart(); });
            dotsWrap.appendChild(d);
        });
        const dots = Array.from(dotsWrap.children);

        function update() {
            slides.forEach((s, i) => {
                const off = i - active;
                const abs = Math.abs(off);
                s.style.zIndex = 100 - abs;
                s.style.pointerEvents = abs > 2 ? 'none' : 'auto';
                if (off === 0) {
                    s.style.transform = 'translateX(0) rotateY(0deg) scale(1)';
                    s.style.opacity = '1';
                } else if (flat) {
                    s.style.transform = `translateX(${off * 78}%) scale(${abs===1?'.85':'.72'})`;
                    s.style.opacity = abs===1 ? '.45' : (abs===2 ? '.2' : '0');
                } else if (abs === 1) {
                    s.style.transform = `translateX(${off * 75}%) rotateY(${off * -35}deg) scale(.84)`;
                    s.style.opacity = '.45';
                } else if (abs === 2) {
                    s.style.transform = `translateX(${off * 95}%) rotateY(${off * -45}deg) scale(.72)`;
                    s.style.opacity = '.2';
                } else {
                    s.style.transform = `translateX(${off * 110}%) rotateY(${off * -50}deg) scale(.6)`;
                    s.style.opacity = '0';
                }
            });
            dots.forEach((d, i) => d.classList.toggle('active', i === active));
        }
        function next(){ active = (active + 1) % slides.length; update(); }
        function prev(){ active = (active - 1 + slides.length) % slides.length; update(); }
        function start(){ stop(); if (opts.autoplay > 0 && slides.length > 1) timer = setInterval(next, opts.autoplay); }
        function stop(){ if (timer) { clearInterval(timer); timer = null; } }
        function restart(){ start(); }

        root.querySelector('.cf-arrow.prev').addEventListener('click', () => { prev(); restart(); });
        root.querySelector('.cf-arrow.next').addEventListener('click', () => { next(); restart(); });
        slides.forEach((s, i) => s.addEventListener('click', () => { if (i !== active) { active = i; update(); restart(); } }));

        // Pausa al pasar el mouse (mejor UX con autoplay)
        root.addEventListener('mouseenter', stop);
        root.addEventListener('mouseleave', start);

        update();
        start();
    }

    await loadConcejales();

    /* ================= 4. NOTICIAS ================= */
    async function loadNoticias() {
        const cont = document.getElementById('noticias-container');
        setStateLoading(cont,'Cargando noticias...');
        const res = await loadJSON('data/noticias.json');
        if(!res.ok){ if(res.notFound) setStateEmpty(cont,'Aún no hay noticias publicadas.'); else setStateError(cont, loadNoticias); return; }
        const noticias = res.data||[];
        if(!noticias.length){ setStateEmpty(cont,'Aún no hay noticias publicadas.'); return; }
        cont.innerHTML = noticias.slice(0,6).map(n=>`
            <article class="noticia-card">
                ${n.imagen?`<img src="${imgUrl(n.imagen)}" alt="${esc(n.titulo)}" onerror="hcdImgError(this)">`:''}
                <div class="noticia-content">
                    <span class="fecha">${formatDate(n.fecha)}</span>
                    <h3>${esc(n.titulo)}</h3>
                    <p>${esc(n.resumen||'')}</p>
                    <a class="leer-mas" href="${n.link?esc(n.link):'#'}" ${n.link?'target="_blank" rel="noopener"':''}>Leer más →</a>
                </div>
            </article>`).join('');
    }
    await loadNoticias();

    /* ================= 5. TEMAS ================= */
    async function loadTemas() {
        const ct = document.getElementById('temas-sesion-lista');
        const ca = document.getElementById('temas-aprobados-lista');
        setStateLoading(ct,'Cargando temas...'); setStateLoading(ca,'Cargando temas aprobados...');
        const res = await loadJSON('data/temas_sesion.json');
        if(!res.ok){
            if(res.notFound){ setStateEmpty(ct,'No hay temas programados.'); setStateEmpty(ca,'Aún no hay temas aprobados.'); }
            else { setStateError(ct,loadTemas); setStateError(ca,loadTemas); }
            return;
        }
        const temas = res.data||[];
        const aTratar = temas.filter(t=>t.estado==='A tratar'||t.estado==='En comisión');
        const aprobados = temas.filter(t=>t.estado==='Aprobado');
        if(ct) ct.innerHTML = aTratar.length ? '<ul>'+aTratar.map(t=>`<li><span class="tipo-badge">${esc(t.tipo||'Tema')}</span><strong>${esc(t.titulo)}</strong>${t.descripcion?`<small>${esc(t.descripcion)}</small>`:''}</li>`).join('')+'</ul>' : '<p class="empty-msg">No hay temas programados para la próxima sesión.</p>';
        if(ca) ca.innerHTML = aprobados.length ? '<ul>'+aprobados.map(t=>`<li><span class="tipo-badge aprobado">✅ ${esc(t.tipo||'Tema')}</span><strong>${esc(t.titulo)}</strong>${t.descripcion?`<small>${esc(t.descripcion)}</small>`:''}</li>`).join('')+'</ul>' : '<p class="empty-msg">Aún no hay temas aprobados.</p>';
    }
    await loadTemas();
})();