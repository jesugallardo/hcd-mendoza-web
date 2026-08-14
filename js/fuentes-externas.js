/**
 * fuentes-externas.js
 * Conector con la Prensa de la Municipalidad de Mendoza (WordPress / RSS) -> gacetillas.
 * Lo usan content-loader.js (lectura en vivo) y admin-app.js (sincronización).
 */
const FuentesExternas = (() => {
    const PRENSA = 'https://prensa.ciudaddemendoza.gob.ar';

    const decodeHtml = s => { const d = document.createElement('div'); d.innerHTML = s || ''; return (d.textContent || '').trim(); };
    const strip = s => decodeHtml((s || '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

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

    return { fetchGacetillasVivo, PRENSA };
})();
