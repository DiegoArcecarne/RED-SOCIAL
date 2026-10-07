#!/usr/bin/env node
/*
 * Prueba de humo del prototipo. Ejecuta prototipo/standalone.html en un DOM mínimo
 * (sin navegador ni dependencias) y comprueba que todas las vistas renderizan y que
 * los flujos principales funcionan: creación, solicitudes, privacidad y persistencia.
 *
 * Uso: node scripts/smoke-test.js   (sale con código 1 si algo falla)
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'prototipo', 'standalone.html'), 'utf8');
const code = (html.match(/<script>([\s\S]*?)<\/script>/) || [])[1];
if (!code) { console.error('No se encuentra el <script> en standalone.html'); process.exit(1); }

function makeEl() {
  return {
    _html: '', dataset: {}, style: {}, value: '', textContent: '', className: '', scrollTop: 0,
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    set innerHTML(v) { this._html = v; }, get innerHTML() { return this._html; },
    set onclick(f) {}, querySelector() { return makeEl(); }, querySelectorAll() { return []; },
  };
}

// AudioContext falso: registra cuántas notas se programan, sin sonar.
function makeAudio(counter) {
  const param = () => ({ value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {}, setTargetAtTime() {} });
  const node = (extra) => Object.assign({ connect() {}, disconnect() {} }, extra);
  return class FakeAudioContext {
    constructor() { this.currentTime = 0; this.sampleRate = 8000; this.destination = node(); }
    resume() {}
    createGain() { return node({ gain: param() }); }
    createBiquadFilter() { return node({ type: '', frequency: param() }); }
    createDynamicsCompressor() { return node(); }
    createOscillator() { return node({ type: '', frequency: param(), start() { counter.notes++; }, stop() {} }); }
    createBuffer(ch, len) { const d = new Float32Array(len); return { getChannelData: () => d }; }
    createBufferSource() { return node({ buffer: null, start() { counter.notes++; }, stop() {} }); }
  };
}

// Crea un entorno aislado; `store` hace de localStorage y se comparte entre entornos
// para simular una recarga de la página.
function createEnv(store, opts = {}) {
  // Por defecto se entra con la cuenta de demostración; { sinSesion: true } arranca en la bienvenida.
  if (!opts.sinSesion && !('planes-sesion' in store)) store['planes-sesion'] = 'demo';
  const reg = {};
  const audio = { notes: 0 };
  const ctx = {
    AudioContext: makeAudio(audio),
    console, setTimeout, clearTimeout, setInterval, clearInterval,
    document: { getElementById: (id) => reg[id] || (reg[id] = makeEl()), querySelectorAll: () => [], addEventListener() {}, readyState: 'complete' },
    location: { hash: '', reload() {} },
    history: { back() {} },
    localStorage: {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
    },
    addEventListener() {},
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(code, ctx, { filename: 'standalone.html' });
  return {
    run: (expr) => vm.runInContext(expr, ctx),
    nav: (hash) => { ctx.location.hash = '#/' + hash; ctx.router(); },
    html: (id) => (reg[id] ? reg[id]._html : ''),
    audio,
  };
}

let failures = 0;
let rendered = '';
function check(label, ok, detail = '') {
  console.log(`${ok ? 'OK  ' : 'FAIL'}  ${label}${!ok && detail ? '  -> ' + detail : ''}`);
  if (!ok) failures++;
}
const count = (s, re) => (s.match(re) || []).length;

const store = {};
const a = createEnv(store);

// --- Vistas ---
a.nav('feed'); let h = a.html('feed-list'); rendered += h;
check('feed: cuadrícula con 12 planes', count(h, /class="cell /g) === 12, count(h, /class="cell /g) + ' celdas');
check('feed: toda imagen tiene fallback onerror', count(h, /class="cover-img"/g) === count(h, /onerror="this\.remove\(\)"/g));
a.nav('mapa'); h = a.html('map'); rendered += h;
check('mapa: 8 lugares', count(h, /class="pin /g) === 8);
a.nav('grupos'); h = a.html('view-grupos'); rendered += h;
check('grupos: lista', h.includes('group-card'));
a.nav('perfil'); h = a.html('view-perfil'); rendered += h;
check('perfil: pestañas y publicaciones', h.includes('prof-tabs') && count(h, /class="cell /g) > 0);
a.nav('u/azotea'); h = a.html('view-page'); rendered += h;
check('perfil profesional: icono, categoría, dirección y web sin etiquetas', h.includes('class="pro-ic"') && h.includes('Ocio nocturno') && h.includes('ph-biz') && h.includes('azoteacirculo.es')
  && !h.includes('Información de negocio') && !h.includes('>Categoría<'));
a.nav('grupo/g1'); h = a.html('view-page'); rendered += h;
check('grupo: miembros con roles', h.includes('Admin') && h.includes('Miembro'));
a.nav('plan/p6'); h = a.html('view-detail'); rendered += h;
check('ficha con aprobación (admin): gestionar solicitudes', h.includes('Gestionar solicitudes'));
a.nav('plan/p4'); h = a.html('view-detail'); rendered += h;
check('ficha con aprobación (no admin): solicitar asistencia', h.includes('Solicitar asistencia'));
a.nav('solicitudes/p6'); h = a.html('view-page'); rendered += h;
check('solicitudes: aceptar / rechazar', h.includes('ico-btn ok') && h.includes('ico-btn no'));
a.nav('ajustes'); h = a.html('view-page'); rendered += h;
check('ajustes: toggles y restablecer demo', h.includes('class="switch') && h.includes('Restablecer demo'));
a.nav('crear'); h = a.html('view-page'); rendered += h;
check('crear: selector plan / publicación / grupo', ['crear-plan', 'crear-post', 'crear-grupo'].every((r) => h.includes(r)));
a.nav('crear-plan'); h = a.html('view-page'); rendered += h;
check('crear plan: tipo de asistencia', h.includes('Tipo de asistencia'));
a.nav('crear-post'); h = a.html('view-page'); rendered += h;
check('crear publicación: opciones', ['Qué compartes', 'Un plan', 'Tu vida', 'f-postplan', 'Música', 'Ubicación', 'Etiquetar personas', 'Texto alternativo', 'Audiencia',
  'Comentarios activos', 'Ocultar el número de Me gusta', 'Compartir también en Stories', 'cap-preview'].every((t) => h.includes(t)));
a.nav('crear-grupo'); h = a.html('view-page'); rendered += h;
check('crear grupo: miembros y roles', h.includes('Miembros y roles'));

// --- Privacidad: umbral de anonimato ---
a.nav('plan/p4'); h = a.html('view-detail');   // 6 asistentes (< umbral)
check('privacidad: plan pequeño no muestra total ni privados', h.includes('asistentes visibles') && !/\d+ en privado/.test(h));
a.nav('plan/p1'); h = a.html('view-detail');   // 41 asistentes (>= umbral)
check('privacidad: plan grande muestra total y privados', h.includes('asistentes reales') && /\d+ en privado/.test(h));

// --- Solicitudes: aceptar inscribe, no suma asistencia real ---
const before = a.run('({ att: getPlan("p6").attended, joined: getPlan("p6").joined })');
a.run('resolveRequest("r1","aceptada","p6")');
const after = a.run('({ att: getPlan("p6").attended, joined: getPlan("p6").joined })');
check('aceptar solicitud inscribe sin sumar asistencia real', after.att === before.att && after.joined === before.joined + 1);

// --- Muro (Vividas) ---
a.run('setContentTab("vividas")'); h = a.html('feed-list'); rendered += h;
const nPosts = a.run('POSTS.length');
check('muro: todas las publicaciones', count(h, /class="post"/g) === nPosts, count(h, /class="post"/g) + ' de ' + nPosts);
check('muro: fotos, carruseles y vídeos', /class="pm g-[a-z]+"/.test(h) && h.includes('car-track') && h.includes('pm-video'));
check('muro: un plan inyectado cada 5 publicaciones', count(h, /class="inject /g) === Math.floor(nPosts / 5));
check('muro: tira "Ahora mismo" con directos y stories', h.includes('class="strip"') && h.includes('ss live'));
check('muro: publicaciones vinculadas a su plan', h.includes('post-plan'));
check('muro: toda imagen tiene fallback onerror', count(h, /class="cover-img"/g) === count(h, /onerror="this\.remove\(\)"/g));

// --- Stories y directos ---
a.run('setContentTab("stories")'); h = a.html('feed-list'); rendered += h;
check('stories: directos y una tarjeta por persona', count(h, /class="live-card"/g) === a.run('LIVES.length') && count(h, /class="st-tile" /g) === a.run('storyGroups().length'));
a.run('openStory(0)'); h = a.html('overlay'); rendered += h;
check('visor de stories: barras de progreso y texto', h.includes('sv-bars') && h.includes('sv-text') && a.run('document.getElementById("overlay").hidden') === false);
a.run('storyNext(); storyNext(); storyPrev()');
check('visor de stories: avanza y retrocede', a.run('storyState.g + storyState.i') > 0);
a.run('closeOverlay()');
check('visor de stories: se cierra', a.run('document.getElementById("overlay").hidden') === true);
a.run('openLive("l1")'); h = a.html('overlay'); rendered += h;
a.run('tickLive(); tickLive()');
check('directo: insignia, espectadores y chat que avanza', h.includes('En directo') && a.html('lv-chat').includes('<b>'));
a.run('closeOverlay()');
a.nav('crear-directo'); h = a.html('view-page'); rendered += h;
check('emitir en directo: formulario', h.includes('Empezar directo'));
const nLives = a.run('LIVES.length');
a.run('startLive()');
check('emitir en directo: empieza y aparece entre los directos', a.run('LIVES.length') === nLives + 1 && a.html('overlay').includes('Finalizar'));
a.run('endLive()');
check('emitir en directo: finalizar lo retira', a.run('LIVES.length') === nLives);

// --- Interacciones con publicaciones ---
const likes0 = a.run('POSTS.find(p => p.id === "po8").likes');
a.run('likePost("po8")');
check('me gusta suma uno', a.run('POSTS.find(p => p.id === "po8").likes') === likes0 + 1);
a.run('openComments("po8"); document.getElementById("cm-input").value = "Me apunto a la próxima"; addComment("po8")');
check('comentar añade el comentario', a.run('POSTS.find(p => p.id === "po8").comments.some(c => c.userId === "me")'));
a.run('closeOverlay(); openPost("po1")');
check('abrir una publicación desde el perfil', a.html('overlay').includes('data-post="po1"'));
a.run('closeOverlay()');
const nStories = a.run('STORIES.length');
a.run('state.draftPost.alsoStory = true; publishPost()');
check('publicar con "compartir en stories" crea una story', a.run('STORIES.length') === nStories + 1);

// --- Publicaciones de planes y de la vida de cada uno ---
const nVida = a.run('POSTS.filter(p => !p.planId).length'), nPlan = a.run('POSTS.filter(p => p.planId).length');
check('vida: hay publicaciones de planes y de la vida', nVida > 0 && nPlan > 0);
a.run('setContentTab("vividas"); setWallFilter("vida")'); h = a.html('feed-list'); rendered += h;
check('muro: filtro "Vida" muestra solo publicaciones sin plan', count(h, /class="post"/g) === nVida && !h.includes('post-plan'));
a.run('setWallFilter("plan")'); h = a.html('feed-list');
check('muro: filtro "Planes" muestra solo experiencias de planes', count(h, /class="post"/g) === nPlan);
a.run('setWallFilter("todo")');
a.nav('u/marco'); h = a.html('view-page'); rendered += h;
check('perfil ajeno: filtro Todo / Planes / Su vida', h.includes('origin-seg') && h.includes('Su vida'));
a.run('setProfileFilter("vida","marco")'); h = a.html('profile-grid');
check('perfil ajeno: "Su vida" muestra solo sus publicaciones sin plan', count(h, /class="cell /g) === a.run('POSTS.filter(p => p.authorId === "marco" && !p.planId).length'));
a.run('setProfileFilter("plan","marco")'); h = a.html('profile-grid');
check('perfil ajeno: "Planes" muestra solo sus experiencias de planes', count(h, /class="cell /g) === a.run('POSTS.filter(p => p.authorId === "marco" && p.planId).length'));
a.nav('u/lucia');
check('cada perfil empieza en "Todo"', a.run('state.profileFilter') === 'todo');
a.nav('crear-post'); a.run('setPostField("origin","vida")'); h = a.html('view-page');
check('crear: "Tu vida" oculta el selector de plan', !h.includes('id="f-postplan"'));
a.run('publishPost()');
check('crear: publicar un momento de tu vida (sin plan)', a.run('POSTS[0].planId') === null && a.run('state.profileFilter') === 'vida');
a.nav('crear-post'); a.run('state.draftPost = freshPostDraft(); publishPost()');
check('crear: publicar la experiencia de un plan la vincula', a.run('linkablePlans().some(p => p.id === POSTS[0].planId)') && a.run('state.profileFilter') === 'plan');

// --- Música ---
a.nav('crear-post'); a.run('state.draftPost = freshPostDraft()');
a.run('openMusicPicker()'); h = a.html('mp-list'); rendered += a.html('overlay') + h;
check('música: el selector lista toda la biblioteca', count(h, /class="mp-row"/g) === a.run('TRACKS.length'));
a.run('setMusicMood("Fiesta")');
check('música: filtro por ambiente', count(a.html('mp-list'), /class="mp-row"/g) === a.run('TRACKS.filter(t => t.mood === "Fiesta").length'));
a.run('state.musicMood = "todas"; state.musicQuery = "lavapiés"; renderMusicList()');
check('música: búsqueda por artista', count(a.html('mp-list'), /class="mp-row"/g) === 1 && a.html('mp-list').includes('Clamores'));
const notes0 = a.audio.notes;
a.run('previewTrack("t2")');
check('música: la escucha previa suena (programa notas)', a.run('musicNow.src') === 'pv:t2' && a.audio.notes > notes0);
a.run('chooseTrack("t2")'); h = a.html('view-page'); rendered += h;
check('música: elegir pista la añade al borrador y para la escucha', a.run('state.draftPost.trackId') === 't2' && a.run('musicNow.src') === null && h.includes('pp-music') && h.includes('Neón Cálido · Azotea'));
a.run('ME.type = "profesional"');
check('música: cuentas profesionales solo ven música libre', a.run('availableTracks().every(t => t.free) && availableTracks().length < TRACKS.length'));
a.run('ME.type = "particular"');
const nStories2 = a.run('STORIES.length');
a.run('state.draftPost.alsoStory = true; publishPost()');
check('música: la publicación y su story guardan la pista', a.run('POSTS[0].trackId') === 't2' && a.run('STORIES.length') === nStories2 + 1 && a.run('STORIES[0].trackId') === 't2');
a.run('setContentTab("vividas")'); h = a.html('feed-list');
check('música: el muro muestra la canción de cada publicación', count(h, /class="post-music /g) === a.run('POSTS.filter(p => p.trackId).length'));
const soundOn = (id) => { const card = h.split('data-post="' + id + '"')[1].split('</article>')[0]; return card.includes('class="pm-mute ') && card.includes('data-music="' + id + '"'); };
check('música: fotos, carruseles y vídeos con botón de sonido sobre la imagen', soundOn('po10') && soundOn('po8') && soundOn('po7'));
for (const kind of ['foto', 'carrusel']) {
  a.run(`state.draftPost = freshPostDraft(); state.draftPost.kind = "${kind}"; state.draftPost.trackId = "t5"; publishPost()`);
  check(`música: publicar un ${kind} con canción`, a.run('POSTS[0].kind') === kind && a.run('POSTS[0].trackId') === 't5');
}
a.run('setContentTab("vividas")'); h = a.html('feed-list');
check('música: el nuevo carrusel con música tiene botón de sonido', soundOn(a.run('POSTS[0].id')));
a.run('togglePostMusic("po8")');
check('música: tocar la canción de una publicación la reproduce', a.run('musicNow.src') === 'po8' && a.run('musicNow.trackId') === 't1');
a.run('togglePostMusic("po8")');
check('música: tocar otra vez la para', a.run('musicNow.src') === null);
a.run('openStory(storyGroups().findIndex(g => g.userId === "azotea"))'); h = a.html('overlay'); rendered += h;
check('música: las stories suenan con su pista', a.run('musicNow.src') === 'story' && a.run('musicNow.trackId') === 't2' && h.includes('sv-music') && h.includes('sv-sound'));
a.run('toggleStorySound()');
check('música: silenciar la story', a.run('musicNow.src') === null);
a.run('toggleStorySound(); closeOverlay()');
check('música: cerrar la story para la música', a.run('musicNow.src') === null && a.run('state.storySound') === true);

// --- Compartir: dentro de la app y fuera (WhatsApp, etc.) con imagen de vista previa ---
a.run('setContentTab("vividas")'); h = a.html('feed-list');
check('muro: el botón de compartir abre la hoja', h.includes("openShare('po8')"));
a.run('openShare("po8")'); h = a.html('overlay'); rendered += h;
check('compartir: personas que sigues, story y apps externas', count(h, /class="sh-person /g) === a.run('shareTargets().length') && h.includes('Añadir a tu story') && h.includes('wa.me') && h.includes('t.me/share') && h.includes('Copiar enlace'));
check('compartir fuera: vista previa con la imagen de la publicación (og:image)', h.includes('og-card') && h.includes('og-img') && h.includes('1495567720989-cebdbdd97913') && h.includes('planes.app'));
const meta = a.run('shareMeta(POSTS.find(p => p.id === "po8"))');
check('Open Graph: título, descripción ≤ 120, imagen y URL pública', meta.title.startsWith('Lucía R. en planes') && meta.description.length <= 120 && meta.image === '1495567720989-cebdbdd97913' && meta.url === 'https://planes.app/p/po8');
check('WhatsApp: texto con el enlace', decodeURIComponent(a.run('externalShareUrl(POSTS.find(p => p.id === "po8"), "whatsapp")')).includes('https://planes.app/p/po8'));
a.run('toggleShareTo("lucia"); toggleShareTo("marco")'); h = a.html('overlay');
check('enviar dentro: seleccionar personas muestra el mensaje y "Enviar"', count(h, /sh-person on/g) === 2 && h.includes('id="sh-msg"'));
const sh0 = a.run('POSTS.find(p => p.id === "po8").shares || 0');
a.run('sendShareInApp()');
check('enviar dentro: cuenta el envío y cierra', a.run('POSTS.find(p => p.id === "po8").shares') === sh0 + 1 && a.run('document.getElementById("overlay").hidden') === true);
const ns = a.run('STORIES.length');
a.run('openShare("po8"); shareToStory("po8")');
check('añadir a tu story una publicación ajena', a.run('STORIES.length') === ns + 1 && a.run('STORIES[0].sharedPostId') === 'po8' && a.run('STORIES[0].text') === 'Publicación de @lucia');
a.run('openShare("po8"); copyShareLink("po8")');
check('copiar enlace sin portapapeles no rompe', a.run('POSTS.find(p => p.id === "po8").shareLog.length') >= 2);
a.run('POSTS.find(p => p.id === "po2").audience = "amigos"; openShare("po2")'); h = a.html('overlay');
check('publicación no pública: no se comparte fuera', h.includes('sh-lock') && !h.includes('wa.me') && !h.includes('og-card'));
a.run('POSTS.find(p => p.id === "po2").audience = "publico"; closeOverlay()');

// --- Compartir planes (mismo mecanismo) ---
a.nav('plan/p2'); h = a.html('view-detail');
check('ficha de plan: botón de compartir', h.includes("openShare('plan:p2')"));
a.run('openShare("plan:p2")'); h = a.html('overlay'); rendered += h;
check('compartir plan: misma hoja (personas, story, apps) con la portada del plan', h.includes('Compartir plan') && h.includes('sh-person') && h.includes('Añadir a tu story')
  && h.includes('wa.me') && h.includes('og-card') && h.includes(a.run('getPlan("p2").photo')) && h.includes('og-sum'));
const pm = a.run('shareMeta(getPlan("p2"))');
check('Open Graph del plan: título, fecha · lugar · precio y URL /plan/', pm.title === a.run('getPlan("p2").title') && pm.description.includes('Gratis') && pm.url === 'https://planes.app/plan/p2');
check('WhatsApp del plan: enlace al plan', decodeURIComponent(a.run('externalShareUrl(getPlan("p2"), "whatsapp")')).includes('https://planes.app/plan/p2'));
const secretDesc = a.run('shareMeta(getPlan("p4")).description');
check('plan con ubicación secreta: el enlace no la desvela', secretDesc.includes('Zona aproximada') && !secretDesc.includes(a.run('(getPlace(getPlan("p4").placeId)||{name:"__"}).name')));
a.run('toggleShareTo("lucia"); sendShareInApp()');
check('enviar un plan dentro cuenta en el plan', a.run('getPlan("p2").shares') === 1);
const ns2 = a.run('STORIES.length');
a.run('openShare("plan:p2"); shareToStory("plan:p2")');
check('añadir un plan a tu story (con "Ver el plan")', a.run('STORIES.length') === ns2 + 1 && a.run('STORIES[0].sharedPlanId') === 'p2' && a.run('STORIES[0].planId') === 'p2');

// --- Valoraciones: públicas / privadas y quién las ve; seguidores frente a amigos ---
check('amigos = seguimiento mutuo', a.run('areFriends("me","lucia")') === true && a.run('areFriends("me","ana")') === false && a.run('areFriends("me","sara")') === false);
a.run('state.profileTab = "valoraciones"'); a.nav('perfil'); h = a.html('view-perfil'); rendered += h;
const myRatings = a.run('RATINGS.filter(r => r.userId === "me").length');
check('perfil propio: todas sus valoraciones con su visibilidad', count(h, /class="rating"/g) === myRatings && count(h, /class="vis-chip"/g) === myRatings);
check('perfil propio: planes asistidos sin valorar con "Valorar"', h.includes('rating pending') && h.includes("openRatingSheet('p6')"));
check('perfil propio: pública por defecto (general) y privada en un plan', h.includes('Pública · Todos <span class="vc-gen">(general)') && h.includes('Privada · Amigos'));
const seen = (uid) => a.run(`RATINGS.filter(r => r.userId === "${uid}" && canSeeRating(r, "me")).map(r => r.planId).join(",")`);
check('lucía (amiga): ve su pública y su privada (privadas: amigos)', seen('lucia') === 'p2,p1');
check('david: privada por defecto y "solo yo" → solo su pública', seen('david') === 'p7');
check('ana: públicas solo para seguidores → la veo porque la sigo', seen('ana') === 'p8');
check('sara: públicas solo para amigos y no lo somos → no veo nada', seen('sara') === '');
a.nav('u/sara'); h = a.html('view-page'); rendered += h;
check('perfil ajeno sin valoraciones visibles: aviso sin recuento', h.includes('No hay valoraciones que puedas ver') && h.includes('Seguir también') && h.includes('Te sigue'));
a.run('toggleFollow("sara")'); h = a.html('view-page');
check('seguir a quien te sigue os hace amigos y desbloquea sus valoraciones', a.run('areFriends("me","sara")') && seen('sara') === 'p1' && h.includes('Amigos'));
a.run('toggleFollow("ana")');
check('dejar de seguir oculta las valoraciones solo para seguidores', seen('ana') === '');
a.run('toggleFollow("ana")');
a.nav('u/lucia'); h = a.html('view-page');
check('perfil ajeno: valoraciones visibles sin controles de visibilidad', count(h, /class="rating"/g) === 2 && !h.includes('vis-chip'));
a.run('openRatingSheet("p1")'); h = a.html('overlay'); rendered += h;
check('hoja de valoración: estrellas, opinión con límite y visibilidad', h.includes('rate-pick') && h.includes('id="f-rtext" maxlength="500"') && h.includes('General (pública)'));
a.run('setRateField("visibility","privada"); saveRating()');
check('cambiar una valoración a privada solo para ese plan', a.run('RATINGS.find(r => r.userId === "me" && r.planId === "p1").visibility') === 'privada');
a.run('openRatingSheet("p6"); setRateField("stars",4); document.getElementById("f-rtext").value = "Muy buena ruta"; saveRating()');
check('valorar un plan asistido', a.run('RATINGS.some(r => r.userId === "me" && r.planId === "p6" && r.stars === 4 && r.text === "Muy buena ruta")'));
a.nav('ajustes'); h = a.html('view-page'); rendered += h;
check('ajustes: por defecto y quién ve públicas y privadas', h.includes('Valoraciones de planes') && h.includes("setRatingPref('publica','amigos')") && h.includes("setRatingPref('privada','solo_yo')"));
a.run('setRatingPref("default","privada"); setRatingPref("privada","solo_yo")');
check('ajustes: cambiar la configuración general afecta a las que no tienen ajuste propio', a.run('ratingVis(RATINGS.find(r => r.id === "ra3"))') === 'privada' && a.run('canSeeRating(RATINGS.find(r => r.id === "ra3"), "lucia")') === false
  && a.run('canSeeRating(RATINGS.find(r => r.id === "ra4"), "nora")') === true);
a.run('state.profileTab = "posts"');

// --- Mensajes: chats, chats de plan, solicitudes y capas anti-acoso ---
a.nav('mensajes/chats'); h = a.html('view-page'); rendered += h;
const nChats = a.run('CONVERSATIONS.filter(c => c.type === "dm" && ["aceptada","enviada"].includes(convStatus(c))).length');
check('bandeja: pestañas Chats / Planes / Solicitudes y conversaciones', h.includes('Solicitudes') && count(a.html('conv-list'), /class="conv /g) === nChats);
check('bandeja: insignia de no leídos', a.run('document.getElementById("dm-badge").hidden') === false && Number(a.run('document.getElementById("dm-badge").textContent')) > 0);
a.nav('mensajes/planes');
check('bandeja: chats de plan', count(a.html('conv-list'), /class="conv /g) === a.run('CONVERSATIONS.filter(c => c.type === "plan").length'));
a.nav('mensajes/solicitudes'); h = a.html('view-page');
check('bandeja: solicitudes de desconocidos', count(a.html('conv-list'), /class="conv /g) === 1 && a.html('conv-list').includes('Nora') && h.includes('No sabrán que los has leído'));
a.nav('chat/c1'); h = a.html('view-page'); rendered += h;
check('chat: burbujas, plan compartido y campo de mensaje', count(h, /class="msg /g) + count(h, /class="msg"/g) === a.run('getConversation("c1").messages.length') && h.includes('msg-card') && h.includes('id="msg-input" maxlength="1000"'));
check('chat: abrirlo marca como leído', a.run('getConversation("c1").unread') === 0);
a.run('document.getElementById("msg-input").value = "¡Me apunto!"; sendMsg("c1")');
check('chat: enviar un mensaje', a.run('lastOf(getConversation("c1")).text') === '¡Me apunto!' && a.run('lastOf(getConversation("c1")).from') === 'me');
a.nav('chat/c2'); h = a.html('view-page');
check('chat de plan: nombres, punto de encuentro y confirmación del día', h.includes('msg-who') && h.includes('Punto de encuentro') && h.includes('Confirmo que voy'));
a.nav('chat/c6'); h = a.html('view-page'); rendered += h;
check('solicitud: aceptar / eliminar / bloquear, sin marcar como leída', h.includes('quiere enviarte un mensaje') && h.includes('acceptRequest') && h.includes('blockUser') && a.run('getConversation("c6").unread') === 1);
check('solicitud: la foto de una desconocida llega difuminada', h.includes('msg-img blur') && h.includes('revealImg'));
a.run('revealImg("c6", 1)');
check('ver la foto difuminada si quieres', !a.html('view-page').includes('msg-img blur'));
a.run('acceptRequest("c6")');
check('aceptar la solicitud la pasa a Chats', a.run('convStatus(getConversation("c6"))') === 'aceptada' && a.html('view-page').includes('id="msg-input"'));
a.run('openDm("ana")'); const anaC = a.run('dmWith("ana").id'); a.nav('chat/' + anaC); h = a.html('view-page');
check('escribir a quien no te sigue: aviso de solicitud', a.run('dmWith("ana").status') === 'enviada' && h.includes('solo puedes enviar uno'));
a.run(`document.getElementById("msg-input").value = "Hola Ana"; sendMsg("${anaC}")`); h = a.html('view-page');
check('un solo mensaje de presentación', !h.includes('id="msg-input"') && h.includes('Solicitud enviada') && a.run(`canWrite(getConversation("${anaC}"))`) === false);
a.run('setDmMode("abierto")');
check('modo abierto: no hay solicitudes', a.run('CONVERSATIONS.filter(c => convStatus(c) === "solicitud").length') === 0);
a.run('CONVERSATIONS.push({ id:"cx", type:"dm", with:"azotea", status:"solicitud", unread:1, messages:[{ from:"sara", text:"Hola", min:3 }] }); setDmMode("cerrado")');
check('modo cerrado: los mensajes de desconocidos no llegan', a.run('convStatus(getConversation("cx"))') === 'oculta');
a.run('setDmMode("solicitud")'); a.nav('ajustes'); h = a.html('view-page');
check('ajustes: mensajes de quien no conoces (no recibir / como solicitud / directamente)', h.includes('Mensajes de quien no conoces') && h.includes('No recibir') && h.includes('Como solicitud') && h.includes("setDmMode('cerrado')") && h.includes('Recomendado'));
a.run('blockUser("azotea")');
check('bloquear: borra el chat, deja de seguir y no deja escribir', !a.run('CONVERSATIONS.some(c => c.with === "azotea")') && !a.run('follows("me","azotea")') && a.run('ME.blocked.includes("azotea")'));
a.nav('u/azotea'); h = a.html('view-page');
check('perfil bloqueado: aviso y desbloquear', h.includes('Has bloqueado a') && h.includes('unblockUser'));
a.run('unblockUser("azotea")');
a.nav('u/lucia'); h = a.html('view-page');
check('perfil ajeno: botón "Mensaje"', h.includes("openDm('lucia')"));
const c1len = a.run('getConversation("c1").messages.length');
a.run('openShare("po8"); toggleShareTo("lucia"); toggleShareTo("ana"); sendShareInApp()');
check('compartir dentro llega como mensaje (y no salta una solicitud pendiente)', a.run('getConversation("c1").messages.length') === c1len + 1 && a.run('lastOf(getConversation("c1")).share') === 'po8'
  && a.run('dmWith("ana").messages.filter(m => m.from === "me").length') === 1);

// --- Solicitudes: aceptar, rechazar, bloquear y reportar ---
a.run(`CONVERSATIONS.push(
  { id:"rq1", type:"dm", with:"azotea", status:"solicitud", unread:1, messages:[{ from:"azotea", text:"Hola, ¿te interesa?", min:5 }] },
  { id:"rq2", type:"dm", with:"nora", status:"solicitud", unread:1, messages:[{ from:"nora", text:"Hey", min:8 }] },
  { id:"rq3", type:"dm", with:"sara", status:"solicitud", unread:1, messages:[{ from:"sara", text:"Hola", min:9 }] })`);
a.nav('mensajes/solicitudes'); h = a.html('view-page') + a.html('conv-list'); rendered += h;
check('solicitudes: aceptar o rechazar desde la lista y "Rechazar todas"', h.includes("rejectRequest('rq1')") && h.includes("acceptRequest('rq1', true)") && h.includes('Rechazar todas'));
a.nav('chat/rq1'); h = a.html('view-page');
check('solicitud abierta: Rechazar, Aceptar, Bloquear y Reportar', h.includes('>Rechazar<') && h.includes('>Aceptar<') && h.includes('Bloquear') && h.includes("openReport('azotea','rq1')"));
a.run('rejectRequest("rq1")');
check('rechazar: desaparece sin avisar y no puede volver a escribir', !a.run('getConversation("rq1")') && a.run('ME.rejectedFrom.includes("azotea")'));
a.run('acceptRequest("rq2", true)');
check('aceptar desde la lista: pasa a Chats', a.run('convStatus(getConversation("rq2"))') === 'aceptada');
a.run('openReport("sara","rq3")'); h = a.html('overlay'); rendered += h;
check('reportar: motivos, bloquear también y enviar desactivado hasta elegir', count(h, /class="rep-opt/g) === 8 && h.includes('Bloquear también') && /<button class="btn-primary" disabled/.test(h));
a.run('setReportField("reason","peligro")'); h = a.html('overlay');
check('reportar "me siento en peligro": 112 y cómo denunciar', h.includes('llama al 112') && h.includes('href="tel:112"') && h.includes('denunciarlo ante la Policía'));
const nRep = a.run('REPORTS.length');
a.run('submitReport()');
check('enviar reporte: llega a moderación con los mensajes, bloquea y quita la solicitud', a.run('REPORTS.length') === nRep + 1 && a.run('REPORTS[REPORTS.length-1].withMessages') === true
  && a.run('ME.blocked.includes("sara")') && !a.run('getConversation("rq3")'));
a.run('unblockUser("sara"); FOLLOWS.push(["me","sara"], ["sara","me"])');
a.run('CONVERSATIONS.push({ id:"rq4", type:"dm", with:"azotea", status:"solicitud", unread:1, messages:[{ from:"azotea", text:"a", min:1 }] }, { id:"rq5", type:"dm", with:"ana", status:"solicitud", unread:1, messages:[{ from:"ana", text:"b", min:2 }] })');
a.run('rejectAllRequests()');
check('rechazar todas', a.run('CONVERSATIONS.filter(c => convStatus(c) === "solicitud").length') === 0);
a.run('openChatMenu("c1")');
check('menú de un chat: reportar con motivos', a.html('overlay').includes("openReport('lucia','c1')"));
a.run('closeOverlay()');

// --- Verificación de identidad: red social sin fricción, planes solo verificados ---
a.run('setVerifiedSim(false)');
const intimo = a.run('PLANS.find(p => !p.secret && p.placeId && getPlace(p.placeId) && getPlace(p.placeId).kind !== "negocio" && !state.joined.has(p.id) && !state.attended.has(p.id)).id');
const gmax = a.run(`getPlan("${intimo}").groupMax`); a.run(`getPlan("${intimo}").groupMax = 8`);   // plan íntimo para la prueba
const intimoPlace = a.run(`getPlace(getPlan("${intimo}").placeId).name`);
a.nav('plan/' + intimo); h = a.html('view-detail'); rendered += h;
check('sin verificar: la ficha se ve, con "Verifícate para ir"', h.includes(a.run(`getPlan("${intimo}").title`)) && h.includes('Verifícate para ir'));
check('sin verificar: no se ve quién va (solo el número)', h.includes('Verifícate para ver quién va') && !h.includes('class="avatar sm"'));
const noTitle = h.split(a.run(`getPlan("${intimo}").title`)).join('');   // el título lo escribe el organizador
check('sin verificar: plan íntimo sin ubicación exacta', !noTitle.includes(intimoPlace) && h.includes('Zona aproximada'));
a.run(`toggleJoin("${intimo}")`); h = a.html('overlay'); rendered += h;
check('apuntarse sin verificar abre la explicación (y no apunta)', !a.run(`state.joined.has("${intimo}")`) && h.includes('Verificar ahora') && h.includes('todas las personas que asisten a un plan o lo organizan'));
a.run('doVerify()');
check('verificarse completa la acción pendiente', a.run('ME.verified') === true && a.run(`state.joined.has("${intimo}")`));
a.run(`getPlan("${intimo}").groupMax = ${gmax}`);
a.run('setVerifiedSim(false)');
const likes1 = a.run('POSTS.find(p => p.id === "po10").likes'); a.run('likePost("po10")');
const nP = a.run('POSTS.length'); a.run('state.draftPost = freshPostDraft(); state.draftPost.origin = "vida"; publishPost()');
check('sin verificar: dar me gusta y publicar funcionan (red social sin fricción)', a.run('POSTS.find(p => p.id === "po10").likes') === likes1 + 1 && a.run('POSTS.length') === nP + 1);
a.nav('chat/c2'); h = a.html('view-page');
check('sin verificar: el chat del plan pide verificarse', h.includes('Chat solo para personas verificadas') && !h.includes('msg-input'));
a.nav('chat/c1');
check('sin verificar: hablar con quien ya te conoce funciona', a.html('view-page').includes('id="msg-input"'));
a.run('closeOverlay(); openDm("ana")');
check('sin verificar: escribir a un desconocido pide verificarse', a.html('overlay').includes('escribir a quien no te conoce'));
a.run('closeOverlay()');
a.nav('crear-plan'); a.run('document.getElementById("f-title").value = "Plan sin verificar"; publishPlan()');
check('sin verificar: organizar un plan pide verificarse', a.run('PLANS[0].title') !== 'Plan sin verificar' && a.html('overlay').includes('organizar un plan'));
a.run('closeOverlay()');
a.nav('perfil'); h = a.html('view-perfil');
check('perfil propio sin verificar: aviso y selector de perfiles', h.includes('Sin verificar') && h.includes('openProfileSwitcher'));
a.nav('ajustes'); h = a.html('view-page');
check('ajustes: identidad, tus perfiles y simulación', h.includes('Identidad') && h.includes('Tus perfiles') && h.includes('Simular cuenta sin verificar'));
// --- Varios perfiles: uno personal verificado y profesionales vinculados ---
a.nav('nuevo-perfil'); h = a.html('view-page'); rendered += h;
check('nuevo perfil: solo profesional y explica por qué se verifica', h.includes('Solo hay uno por persona') && h.includes('Por qué se verifica') && h.includes('persona real responsable'));
a.run('document.getElementById("f-npname").value = "Café La Esquina"; document.getElementById("f-npuser").value = "cafelaesquina"; createProfile()');
check('crear perfil sin verificar pide verificarse primero', !a.run('USERS.some(u => u.handle === "@cafelaesquina")') && a.html('overlay').includes('crear otro perfil'));
a.run('doVerify()');
check('al verificarse se crea el perfil profesional vinculado', a.run('USERS.some(u => u.handle === "@cafelaesquina" && u.managedBy === "me" && u.type === "profesional")'));
const proId = a.run('USERS.find(u => u.handle === "@cafelaesquina").id');
a.nav('u/' + proId); h = a.html('view-page');
check('perfil profesional gestionado: aviso y "persona verificada detrás"', h.includes('Gestionas este perfil') && h.includes('persona con identidad verificada'));
a.run('openProfileSwitcher()'); h = a.html('overlay'); rendered += h;
check('selector: perfil personal y profesionales', h.includes('Personal, verificado') && h.includes('Café La Esquina') && h.includes('Añadir un perfil profesional'));
a.run('closeOverlay()');
a.run('document.getElementById("f-npuser").value = "cafelaesquina"; document.getElementById("f-npname").value = "Otro"; createProfile()');
check('el usuario del nuevo perfil también ha de ser único', a.run('USERS.filter(u => u.handle === "@cafelaesquina").length') === 1);

// --- Editar perfil y longitud de los textos ---
a.nav('perfil'); h = a.html('view-perfil');
check('perfil propio: botón "Editar perfil"', h.includes("go('editar-perfil')"));
a.nav('editar-perfil'); h = a.html('view-page'); rendered += h;
check('editar perfil: nombre, usuario y descripción con su límite y contador', h.includes('id="f-pname" maxlength="30"') && h.includes('id="f-puser" maxlength="30"')
  && h.includes('id="f-pbio" maxlength="150"') && h.includes('id="cnt-f-pbio"') && !h.includes('f-pweb'));
const uerr = (u) => a.run(`usernameError(${JSON.stringify(u)}, "me")`);
check('usuario: válidos', uerr('marina') === '' && uerr('marina_r.92') === '');
check('usuario: inválidos (corto, largo, mayúsculas, espacios, puntos, cogido)', ['ab', 'a'.repeat(31), 'Marina', 'mari na', '.marina', 'marina.', 'mari..na', 'lucia'].every((u) => uerr(u) !== ''));
a.run('document.getElementById("f-pname").value = "Marina García"; document.getElementById("f-puser").value = "lucia"; saveProfile()');
check('guardar: no deja coger un usuario ocupado', a.run('ME.handle') === '@marina');
a.run('document.getElementById("f-puser").value = "marina.garcia"; document.getElementById("f-pbio").value = "x".repeat(400); saveProfile()');
check('guardar: actualiza nombre, usuario e iniciales', a.run('ME.name') === 'Marina García' && a.run('ME.handle') === '@marina.garcia' && a.run('ME.initials') === 'MG');
check('guardar: la descripción se recorta a 150', a.run('ME.bio.length') === 150);
a.run('ME.type = "profesional"; ME.business = { category:"Bar", web:"", address:"" }'); a.nav('editar-perfil'); h = a.html('view-page');
check('editar perfil profesional: categoría, web y dirección', h.includes('id="f-pcat"') && h.includes('id="f-pweb" maxlength="100"') && h.includes('id="f-paddr" maxlength="120"'));
a.run('ME.type = "usuario"; delete ME.business');
a.nav('crear-plan'); h = a.html('view-page');
check('crear plan: título y descripción con límite', h.includes('id="f-title" maxlength="60"') && h.includes('id="f-desc" maxlength="1000"'));
a.nav('crear-post'); h = a.html('view-page');
check('crear publicación: pie y texto alternativo con límite', h.includes('maxlength="2200"') && h.includes('id="f-alt" maxlength="250"'));
a.nav('crear-grupo'); h = a.html('view-page');
check('crear grupo: nombre y descripción con límite', h.includes('id="f-gname" maxlength="50"') && h.includes('id="f-gabout" maxlength="300"'));
a.nav('crear-plan'); a.run('document.getElementById("f-title").value = "t".repeat(100); publishPlan()');
check('publicar plan: el título se recorta a 60', a.run('PLANS[0].title.length') === 60);

// --- Creación + persistencia tras "recargar" ---
const nPlans = a.run('PLANS.length');
a.run('publishPlan()');
const newId = a.run('PLANS[0].id');
check('publicar plan añade un plan', a.run('PLANS.length') === nPlans + 1);
a.run('publishPost(); publishGroup(); registerArrival("p2")');
const b = createEnv(store);   // misma "memoria" del navegador, entorno nuevo
check('persistencia: el plan creado sobrevive a recargar', b.run(`PLANS.some(p => p.id === "${newId}")`));
check('persistencia: la asistencia registrada sobrevive', b.run('state.attended.has("p2")'));
check('persistencia: el me gusta y el comentario sobreviven', b.run('POSTS.find(p => p.id === "po8").likedByMe === true && POSTS.find(p => p.id === "po8").comments.some(c => c.userId === "me")'));
check('persistencia: la música de las publicaciones sobrevive', b.run('POSTS.some(p => p.authorId === "me" && p.trackId === "t2" && p.id.startsWith("npo"))'));
check('persistencia: el perfil editado sobrevive', b.run('ME.name') === 'Marina García' && b.run('ME.handle') === '@marina.garcia' && b.run('ME.bio.length') === 150);
check('persistencia: valoraciones, seguimientos y preferencias sobreviven', b.run('RATINGS.some(r => r.userId === "me" && r.planId === "p6")') && b.run('areFriends("me","sara")') && b.run('ratingPrefs(ME).default') === 'privada');
check('persistencia: conversaciones, modo de mensajes y bloqueos sobreviven', b.run('getConversation("c6").status') === 'aceptada' && b.run('dmWith("ana").status') === 'enviada' && b.run('ME.dmMode') === 'solicitud');
check('persistencia: perfiles gestionados e identidad verificada sobreviven', b.run('USERS.some(u => u.handle === "@cafelaesquina" && u.managedBy === "me")') && b.run('ME.verified') === true);
check('persistencia: los planes base conservan fecha futura', b.run('getPlan("p1").when > new Date()'));
const c = createEnv({ [a.run('storeKey()')]: '{corrupto' });
check('persistencia: datos corruptos no rompen la demo', c.run('PLANS.length') === 12);

// --- Bucle de planes: fecha, reconfirmar, lista de espera, cancelar, QR de llegada, anfitrión, notificaciones ---
const pst = {};
const pl = createEnv(pst);
pl.nav('feed');
check('descubrir: filtro por fecha', pl.html('feed-filters').includes('seg-when') && pl.html('feed-filters').includes('Mañana'));
pl.run('state.when = "manana"; renderFeed()');
check('filtro "mañana": solo planes de mañana', count(pl.html('feed-list'), /class="cell /g) === pl.run('PLANS.filter(p => matchesWhen(p, "manana") && !isCancelled(p)).length'));
pl.run('state.when = "todo"; renderFeed()');
check('notificaciones: insignia con las no leídas', pl.run('NOTIFICATIONS.filter(n => !n.read).length') === 2 && pl.run('document.getElementById("notif-badge").textContent') === '2');
pl.nav('notificaciones'); h = pl.html('view-page'); rendered += h;
check('notificaciones: nuevas y anteriores', h.includes('Nuevas') && h.includes('Anteriores') && count(h, /class="notif /g) === 4);
pl.run('openNotif("n2")');
check('abrir una notificación la marca y lleva al plan', pl.run('NOTIFICATIONS.find(n => n.id === "n2").read') === true && pl.run('location.hash') === '#/plan/p3');
pl.run('markAllNotifs()');
check('marcar todo como leído', pl.run('document.getElementById("notif-badge").hidden') === true);
pl.run('openNotifPrefs()');
check('preferencias: un interruptor por tipo', count(pl.html('overlay'), /class="opt-row"/g) === 6);
pl.run('toggleNotifPref("mensaje"); closeOverlay()');
check('sin avisos de mensajes no se crea la notificación', pl.run('notify("mensaje", "x")') === null);
pl.nav('plan/p9'); h = pl.html('view-detail'); rendered += h;
check('reconfirmación del día: aviso con "Sí, voy" / "Ya no puedo"', h.includes('¿Sigues yendo?') && h.includes("reconfirm('p9')"));
pl.run('reconfirm("p9")'); h = pl.html('view-detail');
check('reconfirmar', pl.run('state.reconfirmed.has("p9")') && !h.includes('¿Sigues yendo?') && h.includes('reconfirmado'));
pl.nav('plan/p7'); h = pl.html('view-detail');
check('plan completo: lista de espera', h.includes('Completo') && h.includes('Apuntarme a la lista de espera'));
pl.run('joinWaitlist("p7")');
check('lista de espera: puesto 4', pl.run('waitPos(getPlan("p7"))') === 4 && pl.html('view-detail').includes('puesto 4'));
pl.run('demoSomeoneCancels("p7"); demoSomeoneCancels("p7"); demoSomeoneCancels("p7")');
check('lista de espera: avanza', pl.run('waitPos(getPlan("p7"))') === 1 && !pl.run('state.joined.has("p7")'));
pl.run('demoSomeoneCancels("p7")');
check('lista de espera: plaza para ti y aviso', pl.run('state.joined.has("p7")') && pl.run('NOTIFICATIONS[0].type') === 'plaza' && !!pl.run('planChat("p7")'));
check('política de cancelación: moderada a 52 h = 50 %', pl.run('refundFor(getPlan("p3")).pct') === 50);
pl.run('openCancel("p9")'); h = pl.html('overlay'); rendered += h;
check('cancelar con menos de 24 h: avisa de cancelación tardía', h.includes('cancelación tardía') && h.includes('Cancelar mi asistencia'));
const j9 = pl.run('getPlan("p9").joined');
pl.run('confirmCancel("p9")');
check('cancelar: libera la plaza, cuenta como tardía y sale del chat', !pl.run('state.joined.has("p9")') && pl.run('getPlan("p9").joined') === j9 - 1
  && pl.run('reliability().late') === 1 && !(pl.run('planChat("p9") && planChat("p9").members.includes("me")')));
pl.run('joinPlan("p12")');
check('apuntarse: entra en el chat del plan', pl.run('state.joined.has("p12")') && pl.run('planChat("p12").members.includes("me")'));
pl.run('openCheckin("p12")'); h = pl.html('overlay'); rendered += h;
check('llegada: escanear QR o escribir el código', h.includes('Código del anfitrión') && h.includes('QR de llegada'));
const att12 = pl.run('getPlan("p12").attended');
pl.run('document.getElementById("ck-code").value = "0000" === checkinCode("p12") ? "1111" : "0000"; submitCheckin("p12")');
check('llegada: un código incorrecto no vale', !pl.run('state.attended.has("p12")'));
pl.run('document.getElementById("ck-code").value = checkinCode("p12"); submitCheckin("p12")');
check('llegada con el código del anfitrión', pl.run('state.attended.has("p12")') && pl.run('getPlan("p12").attended') === att12 + 1);
check('el código cambia cada 10 min y vale el anterior', pl.run('validCheckinCode("p12", checkinCode("p12", Date.now() - 10*60*1000))') && !pl.run('validCheckinCode("p12", checkinCode("p12", Date.now() - 30*60*1000)) && checkinCode("p12", Date.now() - 30*60*1000) !== checkinCode("p12")'));
pl.nav('crear-plan'); h = pl.html('view-page');
check('crear plan: subir foto', h.includes('type="file"') && h.includes('accept="image/*"'));
pl.run('state.draft.photo = "data:image/jpeg;base64,QUJD"; state.draft.access = "aprobacion"; document.getElementById("f-title").value = "Picnic en Madrid Río"; publishPlan()');
const npId = pl.run('PLANS[0].id');
check('plan publicado con su foto, como anfitrión y con chat', pl.run('PLANS[0].photo').startsWith('data:image') && pl.run('PLANS[0].hostId') === 'me' && !!pl.run(`planChat("${npId}")`));
pl.nav('plan/' + npId); h = pl.html('view-detail'); rendered += h;
check('ficha del anfitrión: QR, llegadas, editar, cancelar y solicitudes', h.includes('Mostrar QR de llegada') && h.includes('Marcar llegadas a mano') && h.includes('Editar fecha') && h.includes('Cancelar el plan') && h.includes('Gestionar solicitudes') && h.includes('data:image/jpeg'));
pl.run(`simulateIncomingRequest("${npId}")`);
check('llega una solicitud a tu plan: notificación', pl.run(`REQUESTS.some(r => r.planId === "${npId}" && r.userId === "nora")`) && pl.run('NOTIFICATIONS[0].route') === 'solicitudes/' + npId);
pl.run(`openHostQr("${npId}")`); h = pl.html('overlay'); rendered += h;
check('QR del anfitrión: código que coincide', h.includes(pl.run(`checkinCode("${npId}")`)) && h.includes('Se renueva cada 10 minutos'));
pl.run(`openManualArrivals("${npId}")`);
const an = pl.run(`getPlan("${npId}").attended`);
pl.run(`toggleManualArrival("${npId}", "lucia")`);
check('marcar una llegada a mano', pl.run(`getPlan("${npId}").attended`) === an + 1);
pl.run('closeOverlay()');
pl.nav('editar-plan/' + npId); rendered += pl.html('view-page');
pl.run(`document.getElementById("f-edate").value = "2030-06-20T21:30"; document.getElementById("f-eplace").value = PLACES[1].id; saveEditPlan("${npId}")`);
check('editar fecha y lugar: avisa por el chat del plan', pl.run(`getPlan("${npId}").placeId`) === pl.run('PLACES[1].id') && pl.run(`planChat("${npId}").messages.some(m => m.from === "system" && m.text.startsWith("Cambio en el plan"))`));
pl.nav('chat/' + pl.run(`planChat("${npId}").id`));
check('chat del plan: mensajes del sistema', pl.html('view-page').includes('msg-sys'));
pl.run(`confirmCancelPlan("${npId}")`); h = pl.html('view-detail');
check('cancelar el plan: aviso y fuera de Descubrir', h.includes('ha cancelado este plan') && h.includes('Plan cancelado') && !pl.run(`filteredPlans().some(p => p.id === "${npId}")`));
pl.run('requestAttendance("p4")');
check('solicitar ir a un plan con aprobación', pl.run('state.requested.has("p4")'));
pl.run('simulateHostDecision("p4", "aceptada")');
check('te aceptan: apuntado, chat y notificación', pl.run('state.joined.has("p4")') && !!pl.run('planChat("p4")') && pl.run('NOTIFICATIONS[0].text').includes('Te han aceptado'));
pl.run('demoPlanEnded("p4")');
check('no presentarse cuenta en la fiabilidad', pl.run('reliability().noShows') === 1 && pl.run('reliability().pct') < 100 && pl.run('NOTIFICATIONS[0].type') === 'fiabilidad');
pl.nav('perfil');
check('perfil: fiabilidad agregada (sin decir a qué planes)', pl.html('view-perfil').includes('Fiabilidad') && pl.html('view-perfil').includes('1 no presentado'));
const pl2 = createEnv(pst);
check('persistencia: reconfirmaciones, notificaciones y fiabilidad', pl2.run('NOTIFICATIONS.length') > 4 && pl2.run('reliability().noShows') === 1 && pl2.run('state.joined.has("p7")'));

// --- Cuentas: bienvenida, registro con código, 2FA, 18+, onboarding, entrar, recuperar, seguridad ---
const ast = {};
let e = createEnv(ast, { sinSesion: true });
const set = (env, id, v) => env.run(`document.getElementById(${JSON.stringify(id)}).value = ${JSON.stringify(v)}`);
const step = (env) => env.run('state.auth && state.auth.step');
const authErrTxt = (env) => env.run('state.auth.err');
h = e.html('auth'); rendered += h;
check('sin sesión: bienvenida con crear cuenta, entrar y demo', e.run('document.getElementById("auth").hidden') === false && h.includes('Crear cuenta') && h.includes('Ya tengo cuenta') && h.includes('cuenta de demostración'));
const regToAge = (env, email) => {
  env.run("showAuth('registro', {})"); set(env, 'f-id', email); set(env, 'f-pass', 'planes2026'); env.run('submitRegister()');
  set(env, 'f-otp', env.run('state.otp.code')); env.run('submitCode()'); env.run("showAuth('edad')");
};
e.run("showAuth('registro', {})"); rendered += e.html('auth');
set(e, 'f-id', 'lucas@'); set(e, 'f-pass', 'planes2026'); e.run('submitRegister()');
check('registro: email no válido', authErrTxt(e).includes('email válido'));
set(e, 'f-id', 'marina@planes.app'); e.run('submitRegister()');
check('registro: email ya registrado', authErrTxt(e).includes('Ya hay una cuenta'));
set(e, 'f-id', 'lucas@correo.es'); set(e, 'f-pass', 'corta1'); e.run('submitRegister()');
check('registro: contraseña débil', authErrTxt(e).includes('Mínimo 8'));
e.run("state.auth.data.method = 'telefono'"); set(e, 'f-id', '12345'); set(e, 'f-pass', 'planes2026'); e.run('submitRegister()');
check('registro: teléfono no válido', authErrTxt(e).includes('teléfono válido'));
check('teléfono español: se completa con +34', e.run('normPhone("612 345 678")') === '+34612345678' && e.run('normPhone("0033612345678")') === '+33612345678');
e.run("state.auth.data.method = 'email'"); set(e, 'f-id', 'lucas@correo.es'); set(e, 'f-pass', 'planes2026'); e.run('submitRegister()');
h = e.html('auth'); rendered += h;
check('registro: envía un código (notificación simulada)', step(e) === 'codigo' && e.run('state.otp.purpose') === 'registro' && /^\d{6}$/.test(e.run('state.otp.code')) && e.html('sim-note').includes(e.run('state.otp.code')));
set(e, 'f-otp', '000000'); e.run('submitCode()');
check('código incorrecto: cuenta los intentos', authErrTxt(e).includes('Te quedan 4'));
set(e, 'f-otp', e.run('state.otp.code')); e.run('submitCode()'); rendered += e.html('auth');
check('código correcto: ofrece la verificación en dos pasos (opcional)', step(e) === '2fa' && e.html('auth').includes('Ahora no'));
e.run("state.auth.data.twoMethod = 'sms'; startTwoFA()");
check('2FA por SMS sin teléfono: lo explica', authErrTxt(e).includes('añade un teléfono'));
e.run("state.auth.data.twoMethod = 'app'; startTwoFA()"); set(e, 'f-otp', e.run('state.otp.code')); e.run('submitCode()');
check('2FA con app autenticadora activada en el alta', step(e) === 'edad' && e.run('state.auth.data.pending.twoFA') === 'app');
rendered += e.html('auth');
set(e, 'f-birth', '1999-05-20'); e.run('submitAge()');
check('18+: sin aceptar los términos no se crea la cuenta', authErrTxt(e).includes('aceptar los Términos') && e.run('accounts().length') === 1);
e.run('document.getElementById("f-legal").checked = true; submitAge()');
const lucasId = e.run('sessionId()');
check('cuenta creada: sesión iniciada y empieza vacía (sin el contenido de Marina)', lucasId && lucasId !== 'demo' && e.run('accounts().length') === 2
  && e.run('POSTS.filter(p => p.authorId === "me").length') === 0 && e.run('CONVERSATIONS.length') === 0 && e.run('ME.verified') === false && step(e) === 'perfil');
check('consentimientos guardados con su versión', e.run('getAccount(sessionId()).consents.legal') === true && e.run('getAccount(sessionId()).consents.version') === e.run('LEGAL_VERSION'));
rendered += e.html('auth');
e.run('submitProfile()');
check('perfil: el nombre es obligatorio', authErrTxt(e).includes('nombre'));
set(e, 'f-pname', 'Lucas Gil'); set(e, 'f-puser', 'lucia'); e.run('submitProfile()');
check('perfil: usuario cogido', authErrTxt(e).includes('cogido'));
set(e, 'f-puser', 'lucas.gil'); set(e, 'f-pcity', 'Madrid'); e.run('submitProfile()');
check('perfil guardado y paso a intereses', step(e) === 'intereses' && e.run('ME.handle') === '@lucas.gil' && e.run('ME.initials') === 'LG');
check('intereses: hacen falta 3', e.html('auth').includes('disabled') && e.html('auth').includes('(0/3)'));
e.run('toggleInterest("outdoor"); toggleInterest("gastro"); toggleInterest("fiesta")');
check('intereses: con 3 se puede seguir', !e.html('auth').includes('(0/3)') && e.run('ME.interests.length') === 3);
e.run("stepDone('ubicacion')"); rendered += e.html('auth');
e.run("ME.locationAllowed = false; stepDone('seguir')"); h = e.html('auth'); rendered += h;
const sug = e.run('followSuggestions().map(x => x.u.id)');
check('a quién seguir: locales verificados primero', sug[0] === 'azotea' && h.includes('Seguir a todos'));
e.run('followAllSuggested()');
check('seguir a todos', e.run('FOLLOWS.filter(f => f[0] === "me").length') === sug.length);
e.run('finishOnboarding()');
check('fin del onboarding: entra al muro', e.run('document.getElementById("auth").hidden') === true && e.run('getAccount(sessionId()).onboarded') === true && e.run('state.contentTab') === 'vividas');
let e2 = createEnv(ast);
check('al recargar sigue la sesión de la cuenta nueva con su perfil', e2.run('ME.name') === 'Lucas Gil' && e2.run('POSTS.filter(p => p.authorId === "me").length') === 0 && e2.run('follows("me","azotea")') && e2.run('document.getElementById("auth").hidden') !== false);
e2.run('logout()');
check('cerrar sesión', !('planes-sesion' in ast));
let e3 = createEnv(ast, { sinSesion: true });
e3.run("showAuth('entrar', {})"); rendered += e3.html('auth');
for (let i = 0; i < 4; i++){ set(e3, 'f-id', 'marina@planes.app'); set(e3, 'f-pass', 'mal' + i); e3.run('submitLogin()'); }
check('entrar: error genérico (no desvela si la cuenta existe)', authErrTxt(e3) === 'Email, teléfono o contraseña incorrectos.');
set(e3, 'f-pass', 'otra'); e3.run('submitLogin()');
check('entrar: 5 fallos bloquean 15 minutos', authErrTxt(e3).includes('bloqueado') && e3.run('getAccount("demo").lockedUntil') > 0);
set(e3, 'f-pass', 'planes123'); e3.run('submitLogin()');
check('bloqueada: ni con la contraseña correcta', authErrTxt(e3).includes('Demasiados intentos') && !('planes-sesion' in ast));
e3.run('updateAccount("demo", { lockedUntil: null })');
set(e3, 'f-id', 'lucas@correo.es'); set(e3, 'f-pass', 'planes2026'); e3.run('submitLogin()');
check('entrar con 2FA: pide el código', step(e3) === 'codigo' && e3.run('state.otp.purpose') === 'login2fa' && !('planes-sesion' in ast));
set(e3, 'f-otp', e3.run('state.otp.code')); e3.run('submitCode()');
check('entrar con 2FA: con el código se inicia sesión', ast['planes-sesion'] === lucasId);
delete ast['planes-sesion'];
let e4 = createEnv(ast, { sinSesion: true });
e4.run("showAuth('recuperar', {})"); set(e4, 'f-id', 'nadie@correo.es'); e4.run('submitRecover()');
check('recuperar: no desvela si el email existe', step(e4) === 'recuperar' && !e4.run('state.otp'));
set(e4, 'f-id', 'lucas@correo.es'); e4.run('submitRecover()'); set(e4, 'f-otp', e4.run('state.otp.code')); e4.run('submitCode()');
set(e4, 'f-pass', 'nueva2027'); set(e4, 'f-pass2', 'distinta2027'); e4.run('submitNewPass()');
check('recuperar: las contraseñas han de coincidir', step(e4) === 'nueva-clave' && authErrTxt(e4).includes('no coinciden'));
set(e4, 'f-pass2', 'nueva2027'); e4.run('submitNewPass()');
check('recuperar: nueva contraseña y sesión iniciada', ast['planes-sesion'] === lucasId && e4.run(`getAccount("${lucasId}").hash === demoHash("nueva2027", getAccount("${lucasId}").salt)`));
let e5 = createEnv(ast);
e5.nav('seguridad'); h = e5.html('view-page'); rendered += h;
check('seguridad: email, contraseña, 2FA activada, sesiones y eliminar cuenta', h.includes('lucas@correo.es') && h.includes('Activada · App autenticadora') && h.includes('Cerrar sesión') && h.includes('Eliminar cuenta'));
e5.run('disableTwoFA()');
check('desactivar 2FA', e5.run('currentAccount().twoFA') === null);
e5.run("enableTwoFA('email')"); set(e5, 'f-otp', e5.run('state.otp.code')); e5.run("confirmTwoFA('email')");
check('activar 2FA por email desde Ajustes', e5.run('currentAccount().twoFA.method') === 'email');
e5.run('openChangePass()'); set(e5, 'f-cur', 'mal'); set(e5, 'f-new', 'otra2028'); e5.run('changePass()');
check('cambiar contraseña: exige la actual', e5.run('currentAccount().hash === demoHash("nueva2027", currentAccount().salt)'));
e5.run('startVerifyFlow()'); h = e5.html('overlay'); rendered += h;
check('verificación paso a paso: documento, frente, dorso, selfie y comprobación', h.includes('1 de 5') && h.includes('Pasaporte'));
e5.run("state.vflow.doc = 'pasaporte'; renderVerifyFlow()");
check('con pasaporte no se pide el dorso', e5.html('overlay').includes('1 de 4'));
e5.run('verifyNext(); verifyNext(); verifyNext()');
check('verificación: llega a "Comprobando…"', e5.run('state.vflow.step') === 'check' && e5.html('overlay').includes('Comprobando'));
e5.run('state.vflow = null; doVerify()');
check('verificación: queda verificado', e5.run('ME.verified') === true);
e5.run('openDeleteAccount()'); set(e5, 'f-del', 'borrar'); e5.run('deleteAccount()');
check('eliminar cuenta: pide escribir ELIMINAR', e5.run('accounts().some(a => a.id === sessionId())'));
const lucasKey = e5.run('storeKey()');
set(e5, 'f-del', 'ELIMINAR'); e5.run('deleteAccount()');
check('eliminar cuenta: borra la cuenta, sus datos y la sesión', !e5.run(`accounts().some(a => a.id === "${lucasId}")`) && !(lucasKey in ast) && !('planes-sesion' in ast));
let e6 = createEnv({}, { sinSesion: true });
e6.run("showAuth('registro', {})"); set(e6, 'f-id', 'joven@correo.es'); set(e6, 'f-pass', 'planes2026'); e6.run('submitRegister()');
set(e6, 'f-otp', e6.run('state.otp.code')); e6.run('submitCode()'); e6.run("showAuth('edad')");
set(e6, 'f-birth', `${new Date().getFullYear() - 16}-01-01`); e6.run('document.getElementById("f-legal").checked = true; submitAge()');
check('menor de 18: no se crea la cuenta', step(e6) === 'menor' && e6.run('accounts().length') === 1 && !e6.run('sessionId()'));
// --- Web instalable (PWA) ---
const pdir = path.join(__dirname, '..', 'prototipo');
let man = null; try { man = JSON.parse(fs.readFileSync(path.join(pdir, 'manifest.webmanifest'), 'utf8')); } catch (err) {}
check('PWA: manifest válido, pantalla completa y con iconos que existen', !!man && man.display === 'standalone' && man.icons.length >= 3 && man.icons.every((i) => fs.existsSync(path.join(pdir, i.src))));
check('PWA: el HTML enlaza el manifest y el icono de iPhone', html.includes('rel="manifest"') && html.includes('apple-touch-icon') && fs.existsSync(path.join(pdir, 'sw.js')));

// --- Sin emojis en la interfaz ---
const emoji = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;
check('ninguna vista contiene emojis', !emoji.test(rendered));

console.log(failures ? `\n${failures} comprobación(es) fallida(s)` : '\nTodo OK');
process.exit(failures ? 1 : 0);
