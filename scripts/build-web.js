#!/usr/bin/env node
/*
 * Genera la web pública del prototipo (prototipo/web/): una página por plan, por
 * publicación pública y por perfil, con las etiquetas Open Graph y de Twitter que hacen
 * que WhatsApp, Telegram, iMessage, X o LinkedIn enseñen la vista previa con imagen.
 * Cada página tiene "Abrir en la app", que lleva a la misma pantalla de la app.
 *
 * Es la versión estática de lo que en la app real sirve el servidor (ver docs/compartir.md).
 * Solo cubre los datos de ejemplo (data.js): lo que se crea en la demo vive en el navegador
 * de cada uno y se comparte con la página genérica abrir.html.
 *
 * Uso:
 *   node scripts/build-web.js           # regenera prototipo/web/
 *   node scripts/build-web.js --check   # falla si prototipo/web/ está desactualizado
 *
 * Regla: no edites prototipo/web/ a mano.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const proto = path.join(__dirname, '..', 'prototipo');
const out = path.join(proto, 'web');

// Datos de ejemplo, igual que los ve la app.
const ctx = { console, Date, Math };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(proto, 'data.js'), 'utf8') + `
  ;Object.assign(globalThis, { PLANS, PLACES, CATEGORIES, USERS, POSTS, FOLLOWS, getPlace, getPlan, getCategory, getUser });`, ctx);
const { PLANS, CATEGORIES, USERS, POSTS, FOLLOWS, getPlace, getCategory, getUser } = ctx;

// Dominio de la app real. Las páginas del prototipo no llevan og:url ni canonical
// para que los lectores de enlaces usen la dirección real desde donde se sirven.
const DOMAIN = 'planes.app';
const IOS_APP_ID = 'ABCDE12345.app.planes';          // Team ID + bundle id (provisional)
const ANDROID_PACKAGE = 'app.planes';                // nombre del paquete (provisional)
const ANDROID_SHA256 = ['AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99'];

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const clip = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s; };
const photo = (slug, w, h) => slug ? `https://images.unsplash.com/photo-${slug}?w=${w}&h=${h || w}&fit=crop&q=70` : '';
const initials = (name) => name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
const handleOf = (u) => String(u.handle || '').replace(/^@/, '');
const FALLBACK_IMG = '1529156069898-49953e39b3ac';   // gente en un plan (Unsplash)

/* ---------- mismas reglas de privacidad que la app ---------- */
const sizeBucket = (p) => (p.groupMax <= 8 ? 'intimo' : p.groupMax <= 20 ? 'mediano' : 'grande');
const SIZE_LABEL = { intimo: 'Íntimo', mediano: 'Mediano', grande: 'Grande' };
const isCancelled = (p) => p.status === 'cancelado';
// Las videollamadas privadas no tienen página pública: su enlace abre la app.
const planIsPublic = (p) => !(p.online && p.online.visibility === 'privada');
// Planes secretos o íntimos fuera de un negocio: sin el sitio exacto.
function planWhere(p){
  if (p.online) return 'Videollamada';
  const place = getPlace(p.placeId);
  if (p.secret || !place) return 'Zona aproximada · Madrid';
  if (sizeBucket(p) === 'intimo' && place.kind !== 'negocio') return `Zona aproximada · ${place.city}`;
  return `${place.name} · ${place.city}`;
}
const isPrivate = (u) => !!u && u.profilePublic === false;
// Solo tienen página las publicaciones públicas de cuentas públicas (ni retiradas ni en revisión).
const postIsPublic = (po) => {
  const u = getUser(po.authorId);
  return !!u && !isPrivate(u) && (po.audience || 'publico') === 'publico' && !po.removed && !po.held;
};
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const followers = (u) => u.followers || FOLLOWS.filter((f) => f[1] === u.id).length;

/* ---------- plantilla ---------- */
function page({ depth, title, description, image, imageAlt, type, appRoute, body, indexable, label, redirect = true }){
  const up = '../'.repeat(depth);
  const app = `${up}../standalone.html#/${appRoute}`;
  const img = image || photo(FALLBACK_IMG, 1200, 630);
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)} · planes</title>
<meta name="description" content="${esc(description)}">
<!-- Prototipo con datos de ejemplo: no se indexa. En la app real: ${indexable ? 'index' : 'noindex'} (ver docs/compartir.md). -->
<meta name="robots" content="noindex">
<meta property="og:site_name" content="planes">
<meta property="og:locale" content="es_ES">
<meta property="og:type" content="${type}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${esc(img)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(imageAlt || title)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(img)}">
<meta name="theme-color" content="#000000">
<link rel="icon" href="${up}../icon-192.png">
<link rel="apple-touch-icon" href="${up}../apple-touch-icon.png">
<link rel="stylesheet" href="${up}web.css">
${redirect ? `<script>
  // Si la app está instalada y el móvil abre el enlace dentro de ella (PWA en Android),
  // se va directamente a la pantalla. En la app nativa lo hacen los universal links / App Links.
  try { if (matchMedia('(display-mode: standalone)').matches) location.replace(${JSON.stringify(app)}); } catch (e) {}
</script>
` : ''}</head>
<body>
<header class="w-bar"><a class="w-brand" href="${up}index.html">planes</a><a class="w-open" href="${esc(app)}">Abrir en la app</a></header>
<main class="w-main">
${body}
<a class="w-cta" href="${esc(app)}">${esc(label || 'Ver en la app')}</a>
<p class="w-fine">¿Aún no tienes planes? <a href="${up}../standalone.html">Ábrela e instálala</a> en tu móvil: es gratis. Para ir a un plan hay que verificar la identidad.</p>
</main>
<footer class="w-foot">planes · prototipo con datos de ejemplo</footer>
</body>
</html>
`;
}

/* ---------- páginas ---------- */
const files = {};
const planPages = new Set(), postPages = new Set();

PLANS.filter(planIsPublic).forEach((p) => {
  const cat = getCategory(p.category);
  const host = p.host || {};
  const where = planWhere(p);
  const facts = [p.paid ? `${p.price} €` : 'Gratis', SIZE_LABEL[sizeBucket(p)], cat ? cat.label : ''].filter(Boolean);
  const description = isCancelled(p) ? 'Este plan se ha cancelado.' : `${facts.join(' · ')} · ${where}`;
  planPages.add(p.id);
  files[`plan/${p.id}.html`] = page({
    depth: 1, type: 'website', appRoute: `plan/${p.id}`, indexable: !isCancelled(p), label: 'Ver el plan en la app',
    title: p.title, description, image: photo(p.photo, 1200, 630), imageAlt: `Foto del plan ${p.title}`,
    body: `<article class="w-card">
  ${p.photo ? `<div class="w-cover"><img onerror="this.remove()" src="${esc(photo(p.photo, 900, 600))}" alt="${esc('Foto del plan ' + p.title)}"></div>` : ''}
  <div class="w-body">
    <p class="w-tags">${esc(facts.join(' · '))}${p.secret ? ' · Secreto' : ''}</p>
    <h1>${esc(p.title)}</h1>
    <p class="w-where">${esc(where)}</p>
    ${isCancelled(p) ? '<p class="w-warn">Este plan se ha cancelado.</p>' : ''}
    <p>${esc(p.summary)}</p>
    <p class="w-host">Organiza ${esc(host.name)}${host.verified ? ' · identidad verificada' : ''}</p>
    <p class="w-dim">La fecha, la hora, quién va y el chat del plan, en la app.</p>
  </div>
</article>`,
  });
});

POSTS.filter(postIsPublic).forEach((po) => {
  const u = getUser(po.authorId);
  const plan = po.planId && PLANS.find((p) => p.id === po.planId);
  const imgs = po.imgs || [];
  const cap = po.caption || '';
  postPages.add(po.id);
  files[`p/${po.id}.html`] = page({
    depth: 1, type: 'article', appRoute: `p/${po.id}`, indexable: false, label: 'Ver la publicación en la app',
    title: `${u.name} en planes${plan ? ' · ' + plan.title : ''}`, description: clip(cap, 160),
    image: photo(imgs[0], 1200, 630), imageAlt: po.altText || `Publicación de ${u.name}`,
    body: `<article class="w-card">
  <div class="w-who"><span class="w-av">${esc(u.initials || initials(u.name))}</span><span><b>${esc(u.name)}</b><span>${esc(u.handle)}</span></span></div>
  ${imgs[0] ? `<div class="w-cover sq"><img onerror="this.remove()" src="${esc(photo(imgs[0], 900))}" alt="${esc(po.altText || '')}">${po.kind === 'video' ? '<span class="w-badge">Vídeo</span>' : (imgs.length > 1 ? `<span class="w-badge">1/${imgs.length}</span>` : '')}</div>` : ''}
  <div class="w-body">
    <p><b>${esc(u.handle)}</b> ${esc(cap)}</p>
    <p class="w-dim">${po.hideLikes ? 'Le gusta a varias personas' : `${po.likes || 0} Me gusta`} · ${plural((po.comments || []).filter((c) => !c.removed && !c.held).length, 'comentario', 'comentarios')}</p>
    ${plan ? `<p class="w-link">Del plan <a href="../plan/${esc(plan.id)}.html">${esc(plan.title)}</a></p>` : ''}
  </div>
</article>`,
  });
});

USERS.filter((u) => !u.managedBy).forEach((u) => {
  const priv = isPrivate(u);
  const posts = POSTS.filter((po) => po.authorId === u.id);
  const visible = priv ? [] : posts.filter((po) => postPages.has(po.id));
  const biz = u.type === 'profesional';
  const stats = `${plural(posts.length, 'publicación', 'publicaciones')} · ${plural((u.attendedPlanIds || []).length, 'asistido', 'asistidos')} · ${plural(followers(u), 'seguidor', 'seguidores')}`;
  files[`u/${handleOf(u)}.html`] = page({
    depth: 1, type: 'profile', appRoute: `u/${u.id}`, indexable: biz, label: priv ? 'Pedir seguir en la app' : 'Seguir en la app',
    title: `${u.name} (${u.handle})`, description: priv ? `Cuenta privada · ${stats}` : clip(u.bio || stats, 160),
    image: priv ? '' : photo((visible[0] || {}).imgs && visible[0].imgs[0], 1200, 630), imageAlt: `Perfil de ${u.name}`,
    body: `<article class="w-card">
  <div class="w-prof"><span class="w-av lg">${esc(u.initials || initials(u.name))}</span>
    <span><h1>${esc(u.name)}</h1><span class="w-dim">${esc(u.handle)}${biz ? ' · cuenta profesional' : ''}</span></span></div>
  <div class="w-body">
    ${u.bio ? `<p>${esc(u.bio)}</p>` : ''}
    <p class="w-dim">${esc(stats)}</p>
    ${priv ? '<p class="w-warn">Esta cuenta es privada. Síguela en la app para ver sus publicaciones.</p>' : ''}
  </div>
  ${visible.length ? `<div class="w-grid">${visible.slice(0, 9).map((po) => `<a href="../p/${esc(po.id)}.html"><img onerror="this.remove()" src="${esc(photo((po.imgs || [])[0], 300))}" alt="${esc(po.altText || 'Publicación')}" loading="lazy"></a>`).join('')}</div>` : ''}
</article>`,
  });
});

// Enlaces de lo que no tiene página propia (lo creado en la demo): la página lee el
// destino de la parte tras la # y ofrece abrirlo en la app.
files['abrir.html'] = page({
  depth: 0, type: 'website', appRoute: 'feed', indexable: false, label: 'Abrir en la app', redirect: false,
  title: 'Te han compartido algo en planes', description: 'Planes y gente con quien vivirlos. Ábrelo en la app.',
  body: `<article class="w-card"><div class="w-body">
  <h1>Te han compartido algo en planes</h1>
  <p>Ábrelo en la app para verlo.</p>
  <p class="w-dim">En la demo, lo que crea cada persona se guarda en su navegador: si lo abres en otro móvil puede que no aparezca.</p>
</div></article>
<script>
  document.addEventListener('DOMContentLoaded', function(){
    var r = (location.hash || '').replace(/^#\\/?/, '');
    if (!/^(plan|p|u|tema)\\/[\\w.%-]+$/.test(r)) return;
    var to = '../standalone.html#/' + r;
    try { if (matchMedia('(display-mode: standalone)').matches) return location.replace(to); } catch (e) {}
    Array.prototype.forEach.call(document.querySelectorAll('a[href$="#/feed"]'), function(a){ a.href = to; });
  });
</script>`,
});

const upcoming = PLANS.filter((p) => !isCancelled(p) && planIsPublic(p)).slice(0, 8);
files['index.html'] = page({
  depth: 0, type: 'website', appRoute: 'feed', indexable: true, label: 'Abrir la app',
  title: 'Planes y gente con quien vivirlos', description: 'Descubre qué hacer hoy cerca de ti y ve con gente nueva o con tu grupo. Quien va a un plan ha verificado su identidad.',
  image: photo(FALLBACK_IMG, 1200, 630),
  body: `<article class="w-card"><div class="w-body">
  <h1>Planes y gente con quien vivirlos</h1>
  <p>Atardeceres, cenas, rutas y conciertos cerca de ti. Ve con gente nueva o con tu grupo. No es una app de ligar.</p>
</div></article>
<h2 class="w-h2">Algunos planes</h2>
<ul class="w-list">${upcoming.map((p) => `<li><a href="plan/${esc(p.id)}.html"><img onerror="this.remove()" src="${esc(photo(p.photo, 160))}" alt="" loading="lazy"><span><b>${esc(p.title)}</b><span>${esc(planWhere(p))}</span></span></a></li>`).join('')}</ul>`,
});

// Asociación de dominio para que los enlaces abran la app nativa. En la app real se
// sirven en https://planes.app/.well-known/ (raíz del dominio, sin redirecciones).
files['.well-known/apple-app-site-association'] = JSON.stringify({
  applinks: { details: [{ appIDs: [IOS_APP_ID], components: [
    { '/': '/plan/*', comment: 'Planes' }, { '/': '/p/*', comment: 'Publicaciones' },
    { '/': '/u/*', comment: 'Perfiles' }, { '/': '/tema/*', comment: 'Temas' }, { '/': '/lugar/*', comment: 'Lugares' },
  ] }] },
  webcredentials: { apps: [IOS_APP_ID] },
}, null, 2) + '\n';
files['.well-known/assetlinks.json'] = JSON.stringify([{
  relation: ['delegate_permission/common.handle_all_urls'],
  target: { namespace: 'android_app', package_name: ANDROID_PACKAGE, sha256_cert_fingerprints: ANDROID_SHA256 },
}], null, 2) + '\n';

files['web.css'] = `/* Web pública del prototipo: oscura y sobria, como la app. Generada por scripts/build-web.js. */
:root{--bg:#000;--surface:#0e0e10;--surface-2:#161618;--line:#262628;--ink:#f2f2f4;--soft:#a6a6ad;--dim:#6c6c73;--accent:#3d6fb3}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--ink);font-family:"Inter",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;-webkit-font-smoothing:antialiased;line-height:1.5}
a{color:inherit}
.w-bar{position:sticky;top:0;z-index:2;display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:rgba(0,0,0,.85);backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}
.w-brand{font-weight:800;font-size:22px;text-decoration:none;letter-spacing:-.3px}
.w-open{font-size:13px;font-weight:700;text-decoration:none;border:1px solid var(--line);background:var(--surface-2);border-radius:999px;padding:7px 13px}
.w-main{max-width:560px;margin:0 auto;padding:16px 16px 40px}
.w-card{background:var(--surface);border:1px solid var(--line);border-radius:18px;overflow:hidden}
.w-cover{position:relative;aspect-ratio:3/2;background:var(--surface-2)}
.w-cover.sq{aspect-ratio:1/1}
.w-cover img{width:100%;height:100%;object-fit:cover;display:block}
.w-badge{position:absolute;right:10px;top:10px;background:rgba(0,0,0,.6);font-size:12px;font-weight:700;border-radius:999px;padding:3px 9px}
.w-body{padding:16px;display:flex;flex-direction:column;gap:8px;font-size:15px}
.w-body h1{font-size:23px;line-height:1.2}
.w-tags{font-size:12px;font-weight:700;color:var(--soft);text-transform:uppercase;letter-spacing:.4px}
.w-where{color:var(--soft);font-weight:600}
.w-host{font-size:14px;color:var(--soft)}
.w-dim{font-size:13px;color:var(--dim)}
.w-warn{font-size:14px;border:1px solid var(--line);background:var(--surface-2);border-radius:12px;padding:10px 12px}
.w-link{font-size:14px;color:var(--soft)}
.w-who{display:flex;gap:10px;align-items:center;padding:12px 14px}
.w-who > span:last-child{display:flex;flex-direction:column;font-size:14px;line-height:1.3}
.w-who > span:last-child span{color:var(--soft);font-size:13px}
.w-prof{display:flex;gap:14px;align-items:center;padding:18px 16px 0}
.w-prof h1{font-size:21px;line-height:1.2}
.w-av{width:38px;height:38px;border-radius:50%;background:var(--surface-2);border:1px solid var(--line);display:grid;place-items:center;font-weight:700;font-size:13px;flex:none}
.w-av.lg{width:72px;height:72px;font-size:22px}
.w-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:2px}
.w-grid img{width:100%;aspect-ratio:1/1;object-fit:cover;display:block;background:var(--surface-2)}
.w-cta{display:block;text-align:center;margin-top:16px;background:var(--accent);color:#fff;text-decoration:none;font-weight:700;border-radius:12px;padding:13px}
.w-fine{margin-top:12px;font-size:13px;color:var(--soft);text-align:center}
.w-h2{font-size:13px;color:var(--dim);text-transform:uppercase;letter-spacing:.5px;margin:22px 2px 10px}
.w-list{list-style:none;display:flex;flex-direction:column;gap:8px}
.w-list a{display:flex;gap:12px;align-items:center;text-decoration:none;background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:8px}
.w-list img{width:56px;height:56px;border-radius:10px;object-fit:cover;flex:none;background:var(--surface-2)}
.w-list span{display:flex;flex-direction:column;font-size:14px;line-height:1.35;min-width:0}
.w-list span span{color:var(--soft);font-size:13px}
.w-foot{text-align:center;font-size:12px;color:var(--dim);padding:0 16px 30px}
`;

/* ---------- escribir o comprobar ---------- */
function listFiles(dir, base = ''){
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => d.isDirectory()
    ? listFiles(path.join(dir, d.name), base + d.name + '/') : [base + d.name]);
}
const wanted = Object.keys(files).sort();
// Importado (por la prueba de humo): solo expone las reglas y las páginas, sin escribir nada.
if (require.main !== module) module.exports = { files, planWhere, postIsPublic };
else if (process.argv.includes('--check')){
  const have = listFiles(out).sort();
  const stale = wanted.filter((f) => !fs.existsSync(path.join(out, f)) || fs.readFileSync(path.join(out, f), 'utf8') !== files[f]);
  const extra = have.filter((f) => !(f in files));
  if (stale.length || extra.length){
    console.error(`prototipo/web/ está desactualizado (${stale.length + extra.length} archivos). Ejecuta: node scripts/build-web.js`);
    process.exit(1);
  }
  console.log(`prototipo/web/ al día (${wanted.length} archivos)`);
} else {
  fs.rmSync(out, { recursive: true, force: true });
  wanted.forEach((f) => { const p = path.join(out, f); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, files[f]); });
  console.log(`prototipo/web/ generado: ${planPages.size} planes, ${postPages.size} publicaciones, ${Object.keys(files).filter((f) => f.startsWith('u/')).length} perfiles (${wanted.length} archivos)`);
}
