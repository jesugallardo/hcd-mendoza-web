/**
 * admin-app.js — sin Noticias, con Fuentes Externas (gacetillas).
 */
const MAX_CONCEJALES = 12;
let DATA = { concejales: [], banners: [], bloques: [], temas: [] };
let GACETILLAS_DATA = [];

const DEFAULT_CONFIG = {
    site: { nombre:'Honorable Concejo Deliberante', subtitulo:'de la Ciudad de Mendoza', logoTipo:'emoji', logoEmoji:'🏛️', logoImagen:'', copyright:'© 2026 Informática — Concejo Municipal de la Ciudad de Mendoza', seoTitulo:'Honorable Concejo Deliberante — Ciudad de Mendoza', seoDescripcion:'Sitio oficial del Honorable Concejo Deliberante de la Ciudad de Mendoza.' },
    anuncio: { visible:false, texto:'', link:'', color:'#c9a227', textoColor:'#122a44' },
    hero: { altura:'md', titulo:'Gestión Legislativa Abierta', subtitulo:'Accedé a toda la información pública sobre proyectos, ordenanzas y actividades del Concejo.', autoplay:6000, overlay:'medio', mostrarFlechas:true, mostrarDots:true },
    carrusel: { tamaño:'mediano', autoplay:4000, nombrePos:'abajo', efecto:'coverflow', mostrarCargo:true, mostrarFlechas:true, mostrarDots:true, mostrarEnlace:true, enlaceTexto:'Ver todos los concejales →', enlaceUrl:'#concejales' },
    fuentes: { gacetillas: { enVivo:true, categorias:'' } },
    sections: [
        { id:'accesos-rapidos', name:'Accesos Rápidos', titleKey:'accesos_titulo', defaultTitle:'Accesos Rápidos', visible:false, order:1, size:'normal' },
        { id:'institucional', name:'Institucional', titleKey:'institucional_titulo', defaultTitle:'Institucional', visible:true, order:2, size:'normal' },
        { id:'gacetillas', name:'Gacetillas de la Muni', titleKey:'gacetillas_titulo', defaultTitle:'🗞️ Gacetillas de la Ciudad', visible:true, order:3, size:'normal' },
        { id:'actividad', name:'Actividad Legislativa', titleKey:'actividad_titulo', defaultTitle:'Actividad Legislativa', visible:true, order:4, size:'normal' },
        { id:'temas-sesion', name:'Temas de Sesión', titleKey:'temas_titulo', defaultTitle:'📋 Temas de la Próxima Sesión', visible:true, order:5, size:'normal' },
        { id:'contacto', name:'Contacto', titleKey:'contacto_titulo', defaultTitle:'Contacto', visible:true, order:6, size:'normal' }
    ],
    textos: {},
    contacto: { telefono:'(54) 261-449-5100', email:'contacto@concejomendoza.gob.ar', direccion:'9 de Julio 500 — Mendoza', horario:'Lunes a Viernes de 8:00 a 14:00 hs' },
    redes: { facebook:{url:'',visible:false}, instagram:{url:'',visible:false}, twitter:{url:'',visible:false}, youtube:{url:'',visible:false}, whatsapp:{url:'',visible:false} },
    enlaces: [],
    layout: { ancho:'normal', fuente:'default', mostrarBackTop:true, modoOscuroPublico:false, fondosAlternados:true },
    theme: { primary:'#1a3a5c', accent:'#c9a227' }
};
let SITE_CONFIG = JSON.parse(JSON.stringify(DEFAULT_CONFIG));

function $(id){ const el=document.getElementById(id); if(!el) console.warn(`[admin] No existe #${id}`); return el; }
function val(id){ const el=$(id); return el ? el.value : ''; }
function setVal(id,v){ const el=$(id); if(el) el.value = v ?? ''; }
function setChk(id,v){ const el=$(id); if(el) el.checked = !!v; }
function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

window.addEventListener('DOMContentLoaded', () => {
    try {
        if (typeof GitHubAPI === 'undefined') { alert('ERROR: no se cargó js/github-api.js'); return; }
        initTheme(); populateMandatoYears();
        const cfg = GitHubAPI.loadConfig();
        if (cfg.token && cfg.owner && cfg.repo) { setVal('ghOwner',cfg.owner); setVal('ghRepo',cfg.repo); setVal('ghBranch',cfg.branch); setVal('ghToken',cfg.token); showPanel(); }
        document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
            document.querySelectorAll('.panel-section').forEach(x=>x.classList.remove('active'));
            t.classList.add('active');
            const sec = $('sec-'+t.dataset.tab); if(sec) sec.classList.add('active');
        }));
        setupImagePreview('cc-foto','cc-foto-preview');
        setupImagePreview('bn-imagen','bn-imagen-preview');
        setupImagePreview('si-logoImagen','si-logo-preview');
        setupTokenEye();
    } catch(err){ console.error(err); alert('Error al iniciar: '+err.message); }
});

function initTheme(){ const btn=$('themeToggle'); if(!btn) return; if(localStorage.getItem('hcd_theme')==='dark') document.body.classList.add('dark'); updateThemeBtn(); btn.addEventListener('click',()=>{ document.body.classList.toggle('dark'); localStorage.setItem('hcd_theme',document.body.classList.contains('dark')?'dark':'light'); updateThemeBtn(); }); }
function updateThemeBtn(){ const btn=$('themeToggle'); if(!btn) return; btn.textContent = document.body.classList.contains('dark')?'☀️ Modo Claro':'🌙 Modo Oscuro'; }
function setupImagePreview(i,p){ const inp=$(i),prev=$(p); if(!inp||!prev) return; inp.addEventListener('change',e=>{ const f=e.target.files[0]; if(f){prev.src=URL.createObjectURL(f);prev.style.display='block';} else prev.style.display='none'; }); }
function setupTokenEye(){ const eye=$('tokenEye'),tok=$('ghToken'); if(!eye||!tok) return; eye.addEventListener('click',()=>{ const s=tok.type==='text'; tok.type=s?'password':'text'; eye.textContent=s?'👁️':''; }); }
function showStatus(msg,type='info'){ const bar=$('statusBar'); if(!bar) return; bar.textContent=msg; bar.className='status-bar show '+type; setTimeout(()=>bar.classList.remove('show'),3500); }
function rawBase(){ const c=GitHubAPI.getConfig(); return `https://raw.githubusercontent.com/${c.owner}/${c.repo}/${c.branch}`; }

async function doLogin(){ const owner=val('ghOwner').trim(),repo=val('ghRepo').trim(),branch=val('ghBranch').trim()||'main',token=val('ghToken').trim(); if(!owner||!repo||!token) return showStatus('Completá todos los campos','error'); GitHubAPI.setConfig({owner,repo,branch,token}); try{ showStatus('Verificando conexión...','info'); await GitHubAPI.testConnection(); showStatus('¡Conexión exitosa!','success'); await showPanel(); }catch(e){ showStatus('Error: '+e.message,'error'); GitHubAPI.clearConfig(); } }
async function testConnection(){ const owner=val('ghOwner').trim(),repo=val('ghRepo').trim(),branch=val('ghBranch').trim()||'main',token=val('ghToken').trim(); if(!owner||!repo||!token) return showStatus('Completá los campos primero','error'); GitHubAPI.setConfig({owner,repo,branch,token}); try{ await GitHubAPI.testConnection(); showStatus('✅ Conexión OK','success'); }catch(e){ showStatus('❌ '+e.message,'error'); } }
function logout(){ if(!confirm('¿Cerrar sesión? Se borrará el token.')) return; GitHubAPI.clearConfig(); location.reload(); }
function clearData(){ if(!confirm('¿Borrar todos los datos guardados en este navegador?')) return; GitHubAPI.clearConfig(); localStorage.removeItem('hcd_theme'); location.reload(); }
async function showPanel(){ const l=$('loginScreen'),p=$('adminPanel'); if(l) l.style.display='none'; if(p) p.style.display='block'; const c=GitHubAPI.getConfig(); const info=$('repoInfo'); if(info) info.textContent=`${c.owner}/${c.repo} (${c.branch})`; await loadAllData(); }

async function loadAllData() {
    try {
        const [c,b,bl,t,cfg,gac] = await Promise.all([
            GitHubAPI.getFile('data/concejales.json'), GitHubAPI.getFile('data/banners.json'),
            GitHubAPI.getFile('data/bloques.json'), GitHubAPI.getFile('data/temas_sesion.json'),
            GitHubAPI.getFile('data/config.json'),
            GitHubAPI.getFile('data/gacetillas.json')
        ]);
        DATA.concejales = c.content?JSON.parse(c.content):[];
        DATA.banners = b.content?JSON.parse(b.content):[];
        DATA.bloques = bl.content?JSON.parse(bl.content):[];
        DATA.temas = t.content?JSON.parse(t.content):[];
        if (gac.content) { try { GACETILLAS_DATA = JSON.parse(gac.content); } catch(e) {} }
        if (cfg.content) { try { SITE_CONFIG = mergeConfig(DEFAULT_CONFIG, JSON.parse(cfg.content)); } catch(e) { SITE_CONFIG = JSON.parse(JSON.stringify(DEFAULT_CONFIG)); } }
        else SITE_CONFIG = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
        renderAll(); renderPersonalizacion();
    } catch(e){ showStatus('Error cargando datos: '+e.message,'error'); }
}
function mergeConfig(def, saved){ const out=JSON.parse(JSON.stringify(def)); (function walk(d,s){ for(const k in s){ if(s[k] && typeof s[k]==='object' && !Array.isArray(s[k]) && d[k] && typeof d[k]==='object' && !Array.isArray(d[k])) walk(d[k],s[k]); else d[k]=s[k]; } })(out,saved); return out; }
function renderAll(){ populateBloqueSelect(); renderConcejales(); renderBanners(); renderBloques(); renderTemas(); }

/* ===== Bloques / mandato ===== */
const BLOQUES_SEMILLA=['La Libertad Avanza + Frente Cambia Mendoza','Frente Cambia Mendoza','Fuerza Justicialista Mendoza','Partido Verde','Coalición Cívica + ARI'];
function populateBloqueSelect(){ const sel=$('cc-bloque'); if(!sel) return; const act=sel.value; const nombres=[...new Set([...DATA.bloques.map(b=>b.nombre).filter(Boolean),...BLOQUES_SEMILLA])].sort(); sel.innerHTML='<option value="">Seleccioná un bloque...</option>'+nombres.map(n=>`<option value="${n}">${n}</option>`).join('')+'<option value="__nuevo__">➕ Otro (nuevo)...</option>'; if(act&&act!=='__nuevo__') sel.value=act; }
function onBloqueSelectChange(){ const sel=$('cc-bloque'),nv=$('cc-bloque-nuevo'); if(!sel||!nv) return; nv.style.display=sel.value==='__nuevo__'?'block':'none'; if(sel.value==='__nuevo__') nv.focus(); }
async function ensureBloque(nombre){ if(!nombre||DATA.bloques.some(b=>b.nombre===nombre)) return; DATA.bloques.push({nombre,presidente:'',integrantes:[]}); try{ await GitHubAPI.putFile('data/bloques.json',JSON.stringify(DATA.bloques,null,2),`Add bloque ${nombre}`);}catch(e){} }
function populateMandatoYears(){ const sel=$('cc-mandato'); if(!sel) return; const a=new Date().getFullYear(); let h='<option value="">—</option>'; for(let y=a;y<=a+12;y++) h+=`<option value="${y}">${y}</option>`; sel.innerHTML=h; }

/* ===== CONCEJALES ===== */
async function saveConcejal(){ const idx=parseInt(val('cc-edit-index')||'-1'); const nombre=val('cc-nombre').trim(); let bloque=val('cc-bloque'); const bNuevo=val('cc-bloque-nuevo').trim(); const mandato=val('cc-mandato'); const cargo=val('cc-cargo'); const fi=$('cc-foto'); const fotoFile=fi?fi.files[0]:null; if(bloque==='__nuevo__') bloque=bNuevo; if(!nombre||!bloque) return showStatus('Nombre y bloque son obligatorios','error'); if(idx===-1&&DATA.concejales.length>=MAX_CONCEJALES) return showStatus(`Máximo ${MAX_CONCEJALES} concejales.`,'error'); try{ showStatus('Guardando...','info'); await ensureBloque(bloque); let fotoPath=idx>=0?DATA.concejales[idx].foto:''; if(fotoFile){ const ext=fotoFile.name.split('.').pop(); fotoPath=`assets/img/concejales/${nombre.toLowerCase().replace(/[^a-z0-9]/g,'-')}.${ext}`; await GitHubAPI.uploadImage(fotoPath,fotoFile,`Upload foto ${nombre}`);} const item={nombre,bloque,mandato,cargo,foto:fotoPath}; if(idx>=0) DATA.concejales[idx]=item; else DATA.concejales.push(item); await GitHubAPI.putFile('data/concejales.json',JSON.stringify(DATA.concejales,null,2),idx>=0?`Update concejal ${nombre}`:`Add concejal ${nombre}`); showStatus('✅ Concejal guardado','success'); resetConcejalForm(); await loadAllData(); }catch(e){ showStatus('Error: '+e.message,'error'); } }
function editConcejal(i){ const c=DATA.concejales[i]; if(!c) return; populateBloqueSelect(); setVal('cc-nombre',c.nombre); const sel=$('cc-bloque'); if(sel){ if([...sel.options].some(o=>o.value===c.bloque)) sel.value=c.bloque; else { sel.value='__nuevo__'; const nv=$('cc-bloque-nuevo'); if(nv){nv.style.display='block'; nv.value=c.bloque;} } } setVal('cc-mandato',c.mandato||''); setVal('cc-cargo',c.cargo||''); setVal('cc-edit-index',i); if(c.foto){ const p=$('cc-foto-preview'); if(p){p.src=`${rawBase()}/${c.foto}`;p.style.display='block';} } window.scrollTo({top:0,behavior:'smooth'}); }
async function deleteConcejal(i){ if(!confirm('¿Eliminar este concejal?')) return; const n=DATA.concejales[i].nombre; DATA.concejales.splice(i,1); try{ await GitHubAPI.putFile('data/concejales.json',JSON.stringify(DATA.concejales,null,2),`Delete concejal ${n}`); showStatus('Eliminado','success'); await loadAllData(); }catch(e){ showStatus('Error: '+e.message,'error'); } }
function resetConcejalForm(){ ['cc-nombre','cc-bloque','cc-mandato','cc-cargo','cc-foto','cc-bloque-nuevo'].forEach(id=>setVal(id,'')); const nv=$('cc-bloque-nuevo'); if(nv) nv.style.display='none'; setVal('cc-edit-index','-1'); const p=$('cc-foto-preview'); if(p) p.style.display='none'; }
function renderConcejales(){ const cont=$('listaConcejales'); if(!cont) return; const counter=$('cc-counter'); if(counter){ counter.textContent=`(${DATA.concejales.length}/${MAX_CONCEJALES})`; counter.classList.toggle('warn',DATA.concejales.length>=MAX_CONCEJALES);} if(!DATA.concejales.length){ cont.innerHTML='<p style="color:var(--text-muted);">No hay concejales cargados.</p>'; return; } cont.innerHTML='<h3 style="margin:20px 0 10px;">Concejales cargados ('+DATA.concejales.length+')</h3>'+DATA.concejales.map((c,i)=>`<div class="item-card">${c.foto?`<img src="${rawBase()}/${c.foto}" alt="" onerror="this.style.display='none'">`:''}<div class="item-info"><h4>${esc(c.nombre)}</h4><small>${esc(c.bloque)} · Mandato ${esc(c.mandato||'?')}${c.cargo?' · '+esc(c.cargo):''}</small></div><div class="item-actions"><button class="btn" type="button" onclick="editConcejal(${i})">Editar</button><button class="btn btn-danger" type="button" onclick="deleteConcejal(${i})">Borrar</button></div></div>`).join(''); }

/* ===== BLOQUES ===== */
async function saveBloque(){ const idx=parseInt(val('bl-edit-index')||'-1'); const nombre=val('bl-nombre').trim(); const presidente=val('bl-presidente').trim(); const integrantes=val('bl-integrantes').split('\n').map(s=>s.trim()).filter(Boolean); if(!nombre) return showStatus('El nombre es obligatorio','error'); try{ showStatus('Guardando...','info'); const item={nombre,presidente,integrantes}; if(idx>=0) DATA.bloques[idx]=item; else DATA.bloques.push(item); await GitHubAPI.putFile('data/bloques.json',JSON.stringify(DATA.bloques,null,2),idx>=0?'Update bloque':'Add bloque'); showStatus('✅ Bloque guardado','success'); resetBloqueForm(); await loadAllData(); }catch(e){ showStatus('Error: '+e.message,'error'); } }
function editBloque(i){ const b=DATA.bloques[i]; if(!b) return; setVal('bl-nombre',b.nombre); setVal('bl-presidente',b.presidente||''); setVal('bl-integrantes',(b.integrantes||[]).join('\n')); setVal('bl-edit-index',i); }
async function deleteBloque(i){ if(!confirm('¿Eliminar este bloque?')) return; DATA.bloques.splice(i,1); try{ await GitHubAPI.putFile('data/bloques.json',JSON.stringify(DATA.bloques,null,2),'Delete bloque'); showStatus('Eliminado','success'); await loadAllData(); }catch(e){ showStatus('Error: '+e.message,'error'); } }
function resetBloqueForm(){ ['bl-nombre','bl-presidente','bl-integrantes'].forEach(id=>setVal(id,'')); setVal('bl-edit-index','-1'); }
function renderBloques(){ const cont=$('listaBloques'); if(!cont) return; if(!DATA.bloques.length){ cont.innerHTML='<p style="color:var(--text-muted);">No hay bloques cargados.</p>'; return; } cont.innerHTML='<h3 style="margin:20px 0 10px;">Bloques cargados ('+DATA.bloques.length+')</h3>'+DATA.bloques.map((b,i)=>`<div class="item-card"><div class="item-info"><h4>${esc(b.nombre)}</h4><small>Presidente: ${esc(b.presidente||'—')} · ${(b.integrantes||[]).length} integrantes</small></div><div class="item-actions"><button class="btn" type="button" onclick="editBloque(${i})">Editar</button><button class="btn btn-danger" type="button" onclick="deleteBloque(${i})">Borrar</button></div></div>`).join(''); }

/* ===== BANNERS ===== */
async function saveBanner(){ const idx=parseInt(val('bn-edit-index')||'-1'); const titulo=val('bn-titulo').trim(); const subtitulo=val('bn-subtitulo').trim(); const fi=$('bn-imagen'); const imgFile=fi?fi.files[0]:null; if(!titulo) return showStatus('El título es obligatorio','error'); try{ showStatus('Guardando...','info'); let imgPath=idx>=0?DATA.banners[idx].imagen:''; if(imgFile){ const ext=imgFile.name.split('.').pop(); imgPath=`assets/img/banners/banner-${Date.now()}.${ext}`; await GitHubAPI.uploadImage(imgPath,imgFile,`Upload banner ${titulo}`);} const item={titulo,subtitulo,imagen:imgPath}; if(idx>=0) DATA.banners[idx]=item; else DATA.banners.push(item); await GitHubAPI.putFile('data/banners.json',JSON.stringify(DATA.banners,null,2),idx>=0?'Update banner':'Add banner'); showStatus('✅ Banner guardado','success'); resetBannerForm(); await loadAllData(); }catch(e){ showStatus('Error: '+e.message,'error'); } }
function editBanner(i){ const b=DATA.banners[i]; if(!b) return; setVal('bn-titulo',b.titulo); setVal('bn-subtitulo',b.subtitulo||''); setVal('bn-edit-index',i); if(b.imagen){ const p=$('bn-imagen-preview'); if(p){p.src=`${rawBase()}/${b.imagen}`;p.style.display='block';} } }
async function deleteBanner(i){ if(!confirm('¿Eliminar este banner?')) return; DATA.banners.splice(i,1); try{ await GitHubAPI.putFile('data/banners.json',JSON.stringify(DATA.banners,null,2),'Delete banner'); showStatus('Eliminado','success'); await loadAllData(); }catch(e){ showStatus('Error: '+e.message,'error'); } }
function resetBannerForm(){ ['bn-titulo','bn-subtitulo','bn-imagen'].forEach(id=>setVal(id,'')); setVal('bn-edit-index','-1'); const p=$('bn-imagen-preview'); if(p) p.style.display='none'; }
function renderBanners(){ const cont=$('listaBanners'); if(!cont) return; if(!DATA.banners.length){ cont.innerHTML='<p style="color:var(--text-muted);">No hay banners.</p>'; return; } cont.innerHTML='<h3 style="margin:20px 0 10px;">Banners cargados ('+DATA.banners.length+')</h3>'+DATA.banners.map((b,i)=>`<div class="item-card">${b.imagen?`<img src="${rawBase()}/${b.imagen}" alt="" onerror="this.style.display='none'">`:''}<div class="item-info"><h4>${esc(b.titulo)}</h4><small>${esc((b.subtitulo||'').substring(0,80))}</small></div><div class="item-actions"><button class="btn" type="button" onclick="editBanner(${i})">Editar</button><button class="btn btn-danger" type="button" onclick="deleteBanner(${i})">Borrar</button></div></div>`).join(''); }

/* ===== TEMAS ===== */
async function saveTema(){ const idx=parseInt(val('tm-edit-index')||'-1'); const titulo=val('tm-titulo').trim(); const descripcion=val('tm-descripcion').trim(); const tipo=val('tm-tipo')||'Ordenanza'; const estado=val('tm-estado')||'A tratar'; if(!titulo) return showStatus('El título es obligatorio','error'); try{ showStatus('Guardando...','info'); const item={titulo,descripcion,tipo,estado}; if(idx>=0) DATA.temas[idx]=item; else DATA.temas.push(item); await GitHubAPI.putFile('data/temas_sesion.json',JSON.stringify(DATA.temas,null,2),idx>=0?'Update tema':'Add tema'); showStatus('✅ Tema guardado','success'); resetTemaForm(); await loadAllData(); }catch(e){ showStatus('Error: '+e.message,'error'); } }
function editTema(i){ const t=DATA.temas[i]; if(!t) return; setVal('tm-titulo',t.titulo); setVal('tm-descripcion',t.descripcion||''); setVal('tm-tipo',t.tipo||'Ordenanza'); setVal('tm-estado',t.estado||'A tratar'); setVal('tm-edit-index',i); }
async function deleteTema(i){ if(!confirm('¿Eliminar este tema?')) return; DATA.temas.splice(i,1); try{ await GitHubAPI.putFile('data/temas_sesion.json',JSON.stringify(DATA.temas,null,2),'Delete tema'); showStatus('Eliminado','success'); await loadAllData(); }catch(e){ showStatus('Error: '+e.message,'error'); } }
function resetTemaForm(){ ['tm-titulo','tm-descripcion','tm-tipo','tm-estado'].forEach(id=>setVal(id,'')); setVal('tm-edit-index','-1'); }
function renderTemas(){ const cont=$('listaTemas'); if(!cont) return; if(!DATA.temas.length){ cont.innerHTML='<p style="color:var(--text-muted);">No hay temas cargados.</p>'; return; } cont.innerHTML='<h3 style="margin:20px 0 10px;">Temas cargados ('+DATA.temas.length+')</h3>'+DATA.temas.map((t,i)=>`<div class="item-card"><div class="item-info"><h4>${esc(t.titulo)}</h4><small>${esc(t.tipo)} · ${esc(t.estado)}${t.descripcion?' · '+esc(t.descripcion.substring(0,60)):''}</small></div><div class="item-actions"><button class="btn" type="button" onclick="editTema(${i})">Editar</button><button class="btn btn-danger" type="button" onclick="deleteTema(${i})">Borrar</button></div></div>`).join(''); }

/* =====================================================
   PERSONALIZACIÓN
===================================================== */
function renderPersonalizacion(){
    const C = SITE_CONFIG;
    setChk('an-visible',C.anuncio.visible); setVal('an-texto',C.anuncio.texto); setVal('an-link',C.anuncio.link); setVal('an-color',C.anuncio.color);
    setVal('si-nombre',C.site.nombre); setVal('si-subtitulo',C.site.subtitulo); setVal('si-logoTipo',C.site.logoTipo); setVal('si-logoEmoji',C.site.logoEmoji); setVal('si-copyright',C.site.copyright); toggleLogoFields();
    if (C.site.logoImagen) { const p=$('si-logo-preview'); if(p){p.src=`${rawBase()}/${C.site.logoImagen}`;p.style.display='block';} }
    setVal('he-altura',C.hero.altura); setVal('he-autoplay',String(C.hero.autoplay)); setVal('he-overlay',C.hero.overlay); setChk('he-flechas',C.hero.mostrarFlechas); setChk('he-dots',C.hero.mostrarDots); setVal('he-titulo',C.hero.titulo); setVal('he-subtitulo',C.hero.subtitulo);
    setVal('ca-tamano',C.carrusel.tamaño); setVal('ca-autoplay',String(C.carrusel.autoplay)); setVal('ca-nombrepos',C.carrusel.nombrePos); setVal('ca-efecto',C.carrusel.efecto); setChk('ca-cargo',C.carrusel.mostrarCargo); setChk('ca-flechas',C.carrusel.mostrarFlechas); setChk('ca-dots',C.carrusel.mostrarDots); setChk('ca-enlace',C.carrusel.mostrarEnlace); setVal('ca-enlaceTexto',C.carrusel.enlaceTexto); setVal('ca-enlaceUrl',C.carrusel.enlaceUrl);
    // Fuentes externas
    const secGac = C.sections.find(s=>s.id==='gacetillas');
    setChk('fu-gac-visible', secGac ? secGac.visible : true);
    setChk('fu-gac-vivo', C.fuentes.gacetillas.enVivo);
    setVal('fu-gac-cats', C.fuentes.gacetillas.categorias || '');
    setVal('fu-gac-titulo', (C.textos && C.textos.gacetillas_titulo) || (secGac ? secGac.defaultTitle : ''));
    // Contacto / apariencia / SEO
    setVal('co-telefono',C.contacto.telefono); setVal('co-email',C.contacto.email); setVal('co-direccion',C.contacto.direccion); setVal('co-horario',C.contacto.horario);
    setVal('th-primary',C.theme.primary); setVal('th-accent',C.theme.accent); setVal('la-fuente',C.layout.fuente); setVal('la-ancho',C.layout.ancho); setChk('la-backtop',C.layout.mostrarBackTop); setChk('la-alternado',C.layout.fondosAlternados); setChk('la-darkpublic',C.layout.modoOscuroPublico);
    setVal('se-titulo',C.site.seoTitulo); setVal('se-desc',C.site.seoDescripcion);
    renderSectionsEditor(); renderEnlacesEditor(); renderRedesEditor();
    renderGacetillasEditor();
}
function toggleLogoFields(){ const tipo=val('si-logoTipo'); const ef=$('logoEmojiField'),imf=$('logoImgField'); if(ef) ef.style.display=tipo==='emoji'?'block':'none'; if(imf) imf.style.display=tipo==='imagen'?'block':'none'; }

/* ----- Secciones ----- */
function renderSectionsEditor(){ const cont=$('sections-editor'); if(!cont) return; const sorted=[...SITE_CONFIG.sections].sort((a,b)=>a.order-b.order); cont.innerHTML=sorted.map(sec=>{ const tituloActual=(SITE_CONFIG.textos&&SITE_CONFIG.textos[sec.titleKey])||sec.defaultTitle; return `<div class="section-item" draggable="true" data-id="${sec.id}"><div class="drag-handle">☰</div><div class="section-info"><h4>${esc(sec.name)}</h4><input type="text" value="${esc(tituloActual)}" data-titlekey="${sec.titleKey}" style="margin-top:.4rem;width:100%;padding:.4rem;border:1px solid var(--border);border-radius:6px;background:var(--surface);color:var(--text);" placeholder="Título de la sección"></div><div class="section-controls"><select onchange="updateSectionProp('${sec.id}','size',this.value)"><option value="normal" ${sec.size==='normal'?'selected':''}>Normal</option><option value="large" ${sec.size==='large'?'selected':''}>Grande</option><option value="featured" ${sec.size==='featured'?'selected':''}>Destacado</option></select><input type="checkbox" class="chk" ${sec.visible?'checked':''} onchange="updateSectionProp('${sec.id}','visible',this.checked)" title="Mostrar/Ocultar"></div></div>`; }).join(''); cont.querySelectorAll('input[data-titlekey]').forEach(inp=>{ inp.addEventListener('change',e=>{ const key=e.target.dataset.titlekey; if(!SITE_CONFIG.textos) SITE_CONFIG.textos={}; SITE_CONFIG.textos[key]=e.target.value.trim(); }); }); initSectionDrag(); }
function initSectionDrag(){ const items=document.querySelectorAll('#sections-editor .section-item'); let dragged=null; items.forEach(item=>{ item.addEventListener('dragstart',()=>{dragged=item;item.classList.add('dragging');}); item.addEventListener('dragend',()=>{item.classList.remove('dragging');updateSectionOrder();}); item.addEventListener('dragover',e=>{ e.preventDefault(); if(dragged===item) return; const r=item.getBoundingClientRect(); const mid=r.top+r.height/2; if(e.clientY<mid) item.parentNode.insertBefore(dragged,item); else item.parentNode.insertBefore(dragged,item.nextSibling); }); }); }
function updateSectionOrder(){ document.querySelectorAll('#sections-editor .section-item').forEach((item,idx)=>{ const s=SITE_CONFIG.sections.find(x=>x.id===item.dataset.id); if(s) s.order=idx+1; }); }
function updateSectionProp(id,prop,value){ const s=SITE_CONFIG.sections.find(x=>x.id===id); if(s) s[prop]=value; }

/* ----- Enlaces / redes ----- */
function renderEnlacesEditor(){ const cont=$('enlaces-editor'); if(!cont) return; if(!SITE_CONFIG.enlaces.length){ cont.innerHTML='<p style="color:var(--text-muted);">No hay accesos rápidos. Agregá el primero.</p>'; return; } cont.innerHTML=SITE_CONFIG.enlaces.map((e,i)=>`<div class="enlace-item" draggable="true" data-idx="${i}"><div class="drag-handle">☰</div><input type="text" value="${esc(e.icono||'')}" placeholder="🔗" style="width:60px;padding:.4rem;border:1px solid var(--border);border-radius:6px;background:var(--surface);color:var(--text);" onchange="SITE_CONFIG.enlaces[${i}].icono=this.value"><input type="text" value="${esc(e.titulo||'')}" placeholder="Título" style="flex:1;min-width:120px;padding:.4rem;border:1px solid var(--border);border-radius:6px;background:var(--surface);color:var(--text);" onchange="SITE_CONFIG.enlaces[${i}].titulo=this.value"><input type="url" value="${esc(e.url||'')}" placeholder="https://..." style="flex:1.5;min-width:150px;padding:.4rem;border:1px solid var(--border);border-radius:6px;background:var(--surface);color:var(--text);" onchange="SITE_CONFIG.enlaces[${i}].url=this.value"><input type="checkbox" class="chk" ${e.visible?'checked':''} onchange="SITE_CONFIG.enlaces[${i}].visible=this.checked"><button class="btn btn-danger sm" type="button" onclick="removeEnlace(${i})">✕</button></div>`).join(''); initEnlaceDrag(); }
function addEnlace(){ SITE_CONFIG.enlaces.push({titulo:'',icono:'🔗',url:'',visible:true}); renderEnlacesEditor(); }
function removeEnlace(i){ SITE_CONFIG.enlaces.splice(i,1); renderEnlacesEditor(); }
function initEnlaceDrag(){ const items=document.querySelectorAll('#enlaces-editor .enlace-item'); let dragged=null; items.forEach(item=>{ item.addEventListener('dragstart',()=>{dragged=item;item.classList.add('dragging');}); item.addEventListener('dragend',()=>{item.classList.remove('dragging');reorderEnlaces();}); item.addEventListener('dragover',e=>{ e.preventDefault(); if(dragged===item) return; const r=item.getBoundingClientRect(); const mid=r.top+r.height/2; if(e.clientY<mid) item.parentNode.insertBefore(dragged,item); else item.parentNode.insertBefore(dragged,item.nextSibling); }); }); }
function reorderEnlaces(){ const orden=[...document.querySelectorAll('#enlaces-editor .enlace-item')].map(el=>parseInt(el.dataset.idx)); SITE_CONFIG.enlaces=orden.map(i=>SITE_CONFIG.enlaces[i]); renderEnlacesEditor(); }
function renderRedesEditor(){ const cont=$('redes-editor'); if(!cont) return; const labels={facebook:'Facebook',instagram:'Instagram',twitter:'X / Twitter',youtube:'YouTube',whatsapp:'WhatsApp'}; cont.innerHTML=Object.entries(SITE_CONFIG.redes).map(([k,v])=>`<div style="display:flex;gap:.8rem;align-items:center;margin-bottom:.7rem;flex-wrap:wrap;"><input type="checkbox" class="chk" ${v.visible?'checked':''} onchange="SITE_CONFIG.redes['${k}'].visible=this.checked"><label style="width:110px;font-weight:600;">${labels[k]||k}</label><input type="url" value="${esc(v.url||'')}" placeholder="https://..." style="flex:1;min-width:200px;padding:.4rem;border:1px solid var(--border);border-radius:6px;background:var(--surface);color:var(--text);" onchange="SITE_CONFIG.redes['${k}'].url=this.value"></div>`).join(''); }

/* ----- GACETILLAS: editor + sync ----- */
function renderGacetillasEditor(){
    const cont=$('gac-editor'); if(!cont) return;
    if(!GACETILLAS_DATA.length){ cont.innerHTML='<p style="color:var(--text-muted);">No hay gacetillas. Usá "Sincronizar" o agregá una manual.</p>'; return; }
    cont.innerHTML = GACETILLAS_DATA.slice(0,30).map((g,i)=>`<div class="item-card"><div class="item-info"><input type="text" value="${esc(g.titulo)}" onchange="GACETILLAS_DATA[${i}].titulo=this.value" style="width:100%;margin-bottom:.3rem;padding:.35rem;border:1px solid var(--border);border-radius:6px;background:var(--surface);color:var(--text);"><small>${esc(g.fecha||'')} · <input type="text" value="${esc(g.categoria||'General')}" onchange="GACETILLAS_DATA[${i}].categoria=this.value" style="width:120px;padding:.2rem;border:1px solid var(--border);border-radius:4px;background:var(--surface);color:var(--text);"> · ${g.origen==='manual'?'✍️ manual':'🏛️ muni'}</small></div><div class="item-actions"><input type="checkbox" class="chk" ${g.visible!==false?'checked':''} onchange="GACETILLAS_DATA[${i}].visible=this.checked" title="Visible en el sitio"><button class="btn btn-danger sm" type="button" onclick="removeGacetilla(${i})">✕</button></div></div>`).join('');
}
function addGacetillaManual(){ GACETILLAS_DATA.unshift({ id:'manual-'+Date.now(), titulo:'Nueva gacetilla', fecha:new Date().toISOString().slice(0,10), categoria:'General', resumen:'', url:'', imagen:'', origen:'manual', visible:true }); renderGacetillasEditor(); }
function removeGacetilla(i){ GACETILLAS_DATA.splice(i,1); renderGacetillasEditor(); }
function saveGacetillas(){ GitHubAPI.putFile('data/gacetillas.json', JSON.stringify(GACETILLAS_DATA,null,2),'Update gacetillas').then(()=>showStatus('✅ Gacetillas guardadas','success')).catch(e=>showStatus('Error: '+e.message,'error')); }
async function syncGacetillas(){
    try {
        showStatus('Consultando Prensa de la Muni...','info');
        const vivo = await FuentesExternas.fetchGacetillasVivo();
        const hidden = new Set(GACETILLAS_DATA.filter(g=>g.visible===false).map(g=>g.id));
        const manuales = GACETILLAS_DATA.filter(g=>g.origen==='manual');
        GACETILLAS_DATA = [...vivo.map(g=>({ ...g, visible: !hidden.has(g.id) })), ...manuales];
        await GitHubAPI.putFile('data/gacetillas.json', JSON.stringify(GACETILLAS_DATA,null,2),'Sync gacetillas desde Prensa Muni');
        showStatus('✅ Gacetillas sincronizadas','success');
        renderGacetillasEditor();
    } catch(e){ showStatus('❌ '+e.message,'error'); }
}

/* ----- Collect + guardar config ----- */
function collectPersonalizacion(){
    const C = SITE_CONFIG;
    C.anuncio.visible=$('an-visible').checked; C.anuncio.texto=val('an-texto').trim(); C.anuncio.link=val('an-link').trim(); C.anuncio.color=val('an-color');
    C.site.nombre=val('si-nombre').trim(); C.site.subtitulo=val('si-subtitulo').trim(); C.site.logoTipo=val('si-logoTipo'); C.site.logoEmoji=val('si-logoEmoji').trim(); C.site.copyright=val('si-copyright').trim();
    C.hero.altura=val('he-altura'); C.hero.autoplay=parseInt(val('he-autoplay'),10); C.hero.overlay=val('he-overlay'); C.hero.mostrarFlechas=$('he-flechas').checked; C.hero.mostrarDots=$('he-dots').checked; C.hero.titulo=val('he-titulo').trim(); C.hero.subtitulo=val('he-subtitulo').trim();
    if(!C.textos) C.textos={};
    C.textos.hero_titulo=C.hero.titulo; C.textos.hero_subtitulo=C.hero.subtitulo;
    C.carrusel.tamaño=val('ca-tamano'); C.carrusel.autoplay=parseInt(val('ca-autoplay'),10); C.carrusel.nombrePos=val('ca-nombrepos'); C.carrusel.efecto=val('ca-efecto'); C.carrusel.mostrarCargo=$('ca-cargo').checked; C.carrusel.mostrarFlechas=$('ca-flechas').checked; C.carrusel.mostrarDots=$('ca-dots').checked; C.carrusel.mostrarEnlace=$('ca-enlace').checked; C.carrusel.enlaceTexto=val('ca-enlaceTexto').trim(); C.carrusel.enlaceUrl=val('ca-enlaceUrl').trim();
    // Fuentes externas
    C.fuentes.gacetillas.enVivo=$('fu-gac-vivo').checked;
    C.fuentes.gacetillas.categorias=val('fu-gac-cats').trim();
    const secGac=C.sections.find(s=>s.id==='gacetillas'); if(secGac) secGac.visible=$('fu-gac-visible').checked;
    C.textos.gacetillas_titulo=val('fu-gac-titulo').trim();
    // Resto
    C.contacto.telefono=val('co-telefono').trim(); C.contacto.email=val('co-email').trim(); C.contacto.direccion=val('co-direccion').trim(); C.contacto.horario=val('co-horario').trim();
    C.theme.primary=val('th-primary'); C.theme.accent=val('th-accent'); C.layout.fuente=val('la-fuente'); C.layout.ancho=val('la-ancho'); C.layout.mostrarBackTop=$('la-backtop').checked; C.layout.fondosAlternados=$('la-alternado').checked; C.layout.modoOscuroPublico=$('la-darkpublic').checked;
    C.site.seoTitulo=val('se-titulo').trim(); C.site.seoDescripcion=val('se-desc').trim();
    updateSectionOrder();
}
async function saveSiteConfig(){
    try {
        showStatus('Guardando configuración...','info');
        collectPersonalizacion();
        const logoInput=$('si-logoImagen');
        if (SITE_CONFIG.site.logoTipo==='imagen' && logoInput && logoInput.files[0]) {
            const ext=logoInput.files[0].name.split('.').pop();
            SITE_CONFIG.site.logoImagen=`assets/img/logo.${ext}`;
            await GitHubAPI.uploadImage(SITE_CONFIG.site.logoImagen, logoInput.files[0], 'Upload logo');
        }
        await GitHubAPI.putFile('data/config.json', JSON.stringify(SITE_CONFIG,null,2), 'Update site configuration');
        showStatus('✅ Configuración guardada','success');
    } catch(e){ showStatus('Error: '+e.message,'error'); }
}
function resetSiteConfig(){ if(!confirm('¿Restablecer TODA la configuración a los valores por defecto?')) return; SITE_CONFIG=JSON.parse(JSON.stringify(DEFAULT_CONFIG)); renderPersonalizacion(); showStatus('Configuración restablecida (recordá guardar)','success'); }