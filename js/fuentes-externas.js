/**
 * fuentes-externas.js
 * Conectores con la Municipalidad de Mendoza:
 *  - Portal de Datos Abiertos (CKAN) -> tablero
 *  - Prensa (WordPress / RSS)        -> gacetillas
 * Lo usan content-loader.js (lectura en vivo) y admin-app.js (sincronización).
 */
const FuentesExternas = (() => {
    const CKAN = 'https://datos.ciudaddemendoza.gov.ar/api/3/action';
    const PRENSA = 'https://prensa.ciudaddemendoza.gob.ar';

    const decodeHtml = s => { const d = document.createElement('div'); d.innerHTML = s || ''; return (d.textContent || '').trim(); };
    const strip = s => decodeHtml((s || '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

    /* ---------- CKAN ---------- */
    async function ckanDataset(query) {
        const r = await fetch(`${CKAN}/package_search?q=${encodeURIComponent(query)}&rows=1&sort=metadata_modified+desc`);
        if (!r.ok) throw new Error('CKAN search ' + r.status);
        const j = await r.json();
        return (j.result && j.result.results && j.result.results[0]) || null;
    }
    async function ckanRecords(pkg, limit = 2000) {
        const res = (pkg.resources || []).find(x => x.datastore_active);
        if (!res) throw new Error('Dataset sin datastore');
        const r = await fetch(`${CKAN}/datastore_search?resource_id=${res.id}&limit=${limit}`);
        if (!r.ok) throw new Error('datastore ' + r.status);
        const j = await r.json();
        return (j.result && j.result.records) || [];
    }
    function numCol(recs) {
        if (!recs.length) return null;
        const keys = Object.keys(recs[0]);
        return keys.find(k => /monto|total|importe|pesos|presupuesto|ejecutado/i.test(k) && typeof recs[0][k] === 'number')
            || keys.find(k => typeof recs[0][k] === 'number' && !/^_?id$/i.test(k)) || null;
    }
    function txtCol(recs) {
        if (!recs.length) return null;
        const keys = Object.keys(recs[0]);
        return keys.find(k => /area|secretar|tipo|categoria|estado|dependencia|barrio|obra/i.test(k) && typeof recs[0][k] === 'string')
            || keys.find(k => typeof recs[0][k] === 'string' && !/^_?id$/i.test(k)) || null;
    }
    function groupSum(recs, t, n, max = 8) {
        const m = {}; recs.forEach(r => { const k = String(r[t] ?? 'Otros').slice(0, 40); m[k] = (m[k] || 0) + (Number(r[n]) || 0); });
        const e = Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, max);
        return { labels: e.map(x => x[0]), data: e.map(x => Math.round(x[1])) };
    }
    function groupCount(recs, t, max = 8) {
        const m = {}; recs.forEach(r => { const k = String(r[t] ?? 'Otros').slice(0, 40); m[k] = (m[k] || 0) + 1; });
        const e = Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, max);
        return { labels: e.map(x => x[0]), data: e.map(x => x[1]) };
    }

    /* ---------- Tablero en vivo (best effort) ---------- */
    async function fetchTableroVivo() {
        const out = { actualizado: new Date().toISOString(), origen: 'vivo', kpis: [], graficos: [] };
        try { // Presupuesto
            const pkg = await ckanDataset('presupuesto');
            const recs = await ckanRecords(pkg);
            const n = numCol(recs), t = txtCol(recs);
            if (recs.length && n) {
                out.kpis.push({ id: 'presupuesto', titulo: 'Presupuesto municipal', valor: recs.reduce((a, r) => a + (Number(r[n]) || 0), 0), formato: 'moneda', detalle: pkg.title || 'Presupuesto' });
                if (t) out.graficos.push({ id: 'g-pres', titulo: 'Presupuesto por área', tipo: 'doughnut', ...groupSum(recs, t, n) });
            }
        } catch (e) { console.warn('[fuentes] presupuesto:', e.message); }
        try { // Obras
            const pkg = await ckanDataset('obras');
            const recs = await ckanRecords(pkg);
            if (recs.length) {
                out.kpis.push({ id: 'obras', titulo: 'Obras registradas', valor: recs.length, formato: 'numero', detalle: pkg.title || 'Obras' });
                const t = txtCol(recs);
                if (t) out.graficos.push({ id: 'g-obras', titulo: 'Obras por tipo', tipo: 'bar', ...groupCount(recs, t) });
            }
        } catch (e) { console.warn('[fuentes] obras:', e.message); }
        try { // Reclamos
            const pkg = await ckanDataset('reclamos');
            const recs = await ckanRecords(pkg);
            if (recs.length) {
                out.kpis.push({ id: 'reclamos', titulo: 'Reclamos registrados', valor: recs.length, formato: 'numero', detalle: pkg.title || 'Reclamos' });
                const t = txtCol(recs);
                if (t) out.graficos.push({ id: 'g-recl', titulo: 'Reclamos por categoría', tipo: 'bar', ...groupCount(recs, t) });
            }
        } catch (e) { console.warn('[fuentes] reclamos:', e.message); }
        if (!out.kpis.length) throw new Error('Sin datos en vivo');
        return out;
    }

    /* ---------- Gacetillas en vivo (WP JSON -> fallback RSS) ---------- */
    async function fetchGacetillasVivo() {
        try {
            const r = await fetch(`${PRENSA}/wp-json/wp/v2/posts?per_page=12&_embed=1`);
            if (!r.ok) throw new Error('WP ' + r.status);
            const posts = await r.json();
            if (!Array.isArray(posts) || !posts.length) throw new Error('WP vacío');
            return posts.map(p => ({
                id: 'muni-' + p.id,
                titulo: decodeHtml(p.title && p.title.rendered),
                fecha: (p.date || '').slice(0, 10),
                url: p.link || '',
                resumen: strip(p.excerpt && p.excerpt.rendered).slice(0, 220),
                imagen: (p._embedded && p._embedded['wp:featuredmedia'] && p._embedded['wp:featuredmedia'][0] && p._embedded['wp:featuredmedia'][0].source_url) || '',
                categoria: (p._embedded && p._embedded['wp:term'] && p._embedded['wp:term'][0] && p._embedded['wp:term'][0][0] && p._embedded['wp:term'][0][0].name) || 'General',
                origen: 'muni', visible: true
            }));
        } catch (e) {
            const r2 = await fetch('https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(PRENSA + '/feed'));
            if (!r2.ok) throw new Error('RSS falló');
            const j = await r2.json();
            if (j.status !== 'ok' || !j.items || !j.items.length) throw new Error('RSS vacío');
            return j.items.map((it, i) => ({
                id: 'muni-rss-' + i + '-' + (it.pubDate || '').slice(0, 10),
                titulo: decodeHtml(it.title),
                fecha: (it.pubDate || '').slice(0, 10),
                url: it.link || '',
                resumen: strip(it.description).slice(0, 220),
                imagen: it.thumbnail || (it.enclosure && it.enclosure.link) || '',
                categoria: (it.categories && it.categories[0]) || 'General',
                origen: 'muni', visible: true
            }));
        }
    }

    return { fetchTableroVivo, fetchGacetillasVivo, CKAN, PRENSA };
})();