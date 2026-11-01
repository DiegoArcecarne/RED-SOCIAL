/* Service worker del prototipo: permite instalarlo como app y abrirlo sin conexión.
   La página va "primero red" (siempre la última versión si hay conexión) y las fotos,
   "primero caché" (se ven aunque no haya red una vez cargadas). */
const VERSION = 'planes-v1';
const SHELL = ['./standalone.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== VERSION && k !== VERSION + '-img').map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  // Lo que llega desde el menú de compartir del móvil (share_target del manifest).
  if (req.method === 'POST' && url.pathname.endsWith('/recibir-compartido')) { e.respondWith(receiveShare(req)); return; }
  if (req.method !== 'GET') return;
  if (url.hostname === 'images.unsplash.com') {
    e.respondWith(caches.open(VERSION + '-img').then((c) => c.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok || res.type === 'opaque') c.put(req, res.clone());
      return res;
    }))));
    return;
  }
  if (url.origin !== self.location.origin) return;
  e.respondWith(fetch(req).then((res) => {
    if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req).then((hit) => hit || caches.match('./standalone.html'))));
});

/* Guarda lo recibido (fotos o vídeo, título, texto y enlace) en una caché y abre la app en
   #/recibido, que lo convierte en una publicación nueva o abre el enlace (ver social.js). */
async function receiveShare(req) {
  const at = (p) => new URL(p, self.registration.scope).href;
  try {
    const form = await req.formData();
    const box = await caches.open('planes-compartido');
    await Promise.all((await box.keys()).map((k) => box.delete(k)));
    const files = form.getAll('media').filter((f) => f && f.size).slice(0, 10);
    await Promise.all(files.map((f, i) => box.put(at('compartido/' + i), new Response(f, { headers: { 'content-type': f.type || 'application/octet-stream' } }))));
    const meta = { title: form.get('title') || '', text: form.get('text') || '', url: form.get('url') || '', n: files.length };
    await box.put(at('compartido/meta'), new Response(JSON.stringify(meta), { headers: { 'content-type': 'application/json' } }));
  } catch (err) { /* si falla, se abre la app sin más */ }
  return Response.redirect(at('standalone.html#/recibido'), 303);
}
