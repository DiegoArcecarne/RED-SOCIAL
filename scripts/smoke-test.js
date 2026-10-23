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
    location: { hash: opts.hash || '', reload() {} },
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
check('feed: cuadrícula con 15 planes (12 en persona y 3 por videollamada)', count(h, /class="cell /g) === 15, count(h, /class="cell /g) + ' celdas');
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
const nPosts = a.run('wallPosts().length');   // las de cuentas privadas que no sigues no salen
check('muro: no muestra publicaciones de cuentas privadas que no sigues', nPosts === a.run('POSTS.length') - a.run('POSTS.filter(p => p.authorId === "irene").length'));
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
const nVida = a.run('wallPosts().filter(p => !p.planId).length'), nPlan = a.run('wallPosts().filter(p => p.planId).length');
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
check('enviar reporte: llega a moderación con los mensajes, bloquea y quita la solicitud', a.run('REPORTS.length') === nRep + 1 && a.run('REPORTS[REPORTS.length-1].objectType') === 'conversacion'
  && a.run('REPORTS[REPORTS.length-1].evidence').length > 0 && a.run('REPORTS[REPORTS.length-1].reporterId') === 'me' && a.run('severityOf(REPORTS[REPORTS.length-1])') === 'critica'
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
check('persistencia: datos corruptos no rompen la demo', c.run('PLANS.length') === 15);

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
check('preferencias: un interruptor por tipo', count(pl.html('overlay'), /class="opt-row"/g) === pl.run('Object.keys(NOTIF_TYPES).length'));
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
check('lista de espera (plan de pago): plaza guardada 24 h para pagar y aviso', pl.run('myPayment("p7").status') === 'pendiente' && pl.run('NOTIFICATIONS[0].type') === 'plaza' && !pl.run('state.joined.has("p7")')
  && (pl.nav('plan/p7'), pl.html('view-detail').includes('Pagar 14 € y confirmar')));
pl.run('openCheckout("p7"); payNow()');
check('lista de espera: al pagar, plaza y chat', pl.run('state.joined.has("p7")') && pl.run('myPayment("p7").status') === 'retenido' && !!pl.run('planChat("p7")'));
const pol = (k, h) => pl.run(`refundFor({ paid:true, price:20, cancelPolicy:"${k}", when: new Date(Date.now() + ${h} * 3600000) }).pct`);
check('políticas de cancelación (PRODUCTO.md): flexible, moderada y estricta', pol('flexible', 30) === 100 && pol('flexible', 10) === 0 && pol('moderada', 50) === 100 && pol('moderada', 30) === 50
  && pol('moderada', 10) === 0 && pol('estricta', 200) === 100 && pol('estricta', 100) === 0);
pl.run('openCancel("p9")'); h = pl.html('overlay'); rendered += h;
check('cancelar con menos de 24 h: avisa de cancelación tardía', h.includes('cancelación tardía') && h.includes('Cancelar mi asistencia'));
const j9 = pl.run('getPlan("p9").joined');
pl.run('confirmCancel("p9")');
check('cancelar: libera la plaza, cuenta como tardía y sale del chat', !pl.run('state.joined.has("p9")') && pl.run('getPlan("p9").joined') === j9 - 1
  && pl.run('reliability().late') === 1 && !(pl.run('planChat("p9") && planChat("p9").members.includes("me")')));
pl.run('joinPlan("p12")');
check('plan de pago: apuntarse abre el pago', pl.html('overlay').includes('Reservar plaza') && !pl.run('state.joined.has("p12")'));
pl.run('payNow()');
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
check('editar fecha y lugar: queda en novedades y avisa por el chat del plan', pl.run(`getPlan("${npId}").placeId`) === pl.run('PLACES[1].id') && pl.run(`planChat("${npId}").messages.some(m => m.from === "system" && m.text.startsWith("Cambio de fecha u hora: Nueva fecha:"))`)
  && pl.run(`planChat("${npId}").messages.some(m => m.from === "system" && m.text.startsWith("Cambio de lugar: Nuevo lugar:"))`) && pl.run(`planUpdates(getPlan("${npId}")).map(u => u.type).join()`) === 'lugar,fecha');
pl.nav('chat/' + pl.run(`planChat("${npId}").id`));
check('chat del plan: mensajes del sistema', pl.html('view-page').includes('msg-sys'));
pl.run(`confirmCancelPlan("${npId}")`); h = pl.html('view-detail');
check('cancelar el plan: aviso y fuera de Descubrir', h.includes('ha cancelado este plan') && h.includes('Plan cancelado') && !pl.run(`filteredPlans().some(p => p.id === "${npId}")`));
pl.run('requestAttendance("p4")');
check('solicitar ir a un plan con aprobación', pl.run('state.requested.has("p4")'));
pl.run('simulateHostDecision("p4", "aceptada")');
check('te aceptan en un plan de pago: 24 h para pagar', pl.run('myPayment("p4").status') === 'pendiente' && pl.run('NOTIFICATIONS[0].text').includes('Te han aceptado') && pl.run('NOTIFICATIONS[0].text').includes('Paga'));
pl.run('joinPlan("p4"); payNow()');
check('te aceptan: apuntado, chat y notificación', pl.run('state.joined.has("p4")') && !!pl.run('planChat("p4")') && pl.run('NOTIFICATIONS.some(n => n.text.includes("Te han aceptado"))'));
pl.run('demoPlanEnded("p4")');
check('no presentarse cuenta en la fiabilidad (y el pago va al anfitrión)', pl.run('reliability().noShows') === 1 && pl.run('reliability().pct') < 100 && pl.run('NOTIFICATIONS[0].type') === 'fiabilidad' && pl.run('myPayment("p4").status') === 'liberado');
pl.nav('perfil');
check('perfil: fiabilidad agregada (sin decir a qué planes)', pl.html('view-perfil').includes('Fiabilidad') && pl.html('view-perfil').includes('1 no presentado'));
const pl2 = createEnv(pst);
check('persistencia: reconfirmaciones, notificaciones y fiabilidad', pl2.run('NOTIFICATIONS.length') > 4 && pl2.run('reliability().noShows') === 1 && pl2.run('state.joined.has("p7")'));

// --- Social: subir fotos y vídeos, menú de publicación, privados, seguidores, búsqueda, temas y menciones ---
const sst = {};
const so = createEnv(sst);
so.nav('crear-post'); h = so.html('view-page'); rendered += h;
check('sin fotos: el carrusel de muestra también se desliza', (so.run("state.draftPost.kind = 'carrusel'; renderCreatePost()"), count(so.html('view-page'), /class="car-slide /g) === 3) && so.html('view-page').includes('Ver cómo quedará'));
so.run("state.draftPost.kind = 'foto'; renderCreatePost()");
check('crear publicación: subir fotos o vídeo de la cámara o la galería', h.includes('accept="image/*,video/*"') && h.includes('multiple'));
so.run('addDraftItem({ type:"image", url:"data:image/jpeg;base64,QQ==" }); addDraftItem({ type:"image", url:"data:image/jpeg;base64,Qg==" }); renderCreatePost()');
h = so.html('view-page');
check('dos fotos: carrusel con vista previa y quitar', so.run('state.draftPost.kind') === 'carrusel' && h.includes('Carrusel de 2 fotos') && count(h, /removeDraftItem/g) === 2);
so.run('addDraftItem({ type:"image", url:"data:image/jpeg;base64,Qw==" }); renderCreatePost()'); h = so.html('view-page'); rendered += h;
check('vista previa del carrusel: se desliza por todas las fotos, con contador y puntos', h.includes('id="draft-track"') && count(h, /class="car-slide /g) === 3 && h.includes('id="cc-draft">1/3') && count(h, /<i class="(on)?"><\/i>/g) >= 3);
check('miniaturas para saltar, ordenar y quitar', count(h, /class="dt ?(on)?"/g) === 3 && h.includes("draftGo(2)") && count(h, /"moveDraftItem\(/g) === 6 && h.includes('Ver cómo quedará'));
const firstUrl = so.run('draftItems()[0].url'); so.run('moveDraftItem(draftItems()[0].id, 1)');
check('cambiar el orden', so.run('draftItems()[1].url') === firstUrl);
so.run('document.getElementById("f-caption").value = "Domingo de #atardecer"; openPostPreview()'); h = so.html('overlay');
check('"Ver cómo quedará": la publicación como en el muro, con todas las fotos y el pie', h.includes('Así se verá') && count(h, /class="car-slide /g) === 3 && h.includes('1/3') && h.includes('#atardecer') && h.includes('Seguir editando') && h.includes('Publicar'));
so.run('closeOverlay(); removeDraftItem(draftItems()[2].id)');
so.run('state.draftPost.origin = "vida"; publishPost()');
check('publicar el carrusel subido', so.run('POSTS[0].kind') === 'carrusel' && so.run('POSTS[0].imgs.every(r => r.startsWith("m:"))') && so.run('POSTS[0].imgs.length') === 2);
so.run('state.draftPost = freshPostDraft(); addDraftItem({ type:"video", url:"blob:v", posterUrl:"data:image/jpeg;base64,QQ==", duration:12 }); state.draftPost.origin = "vida"; publishPost()');
check('publicar un vídeo subido: se reproduce de verdad', so.run('POSTS[0].kind') === 'video' && !!so.run('POSTS[0].video') && so.run('POSTS[0].duration') === 12);
so.run('setContentTab("vividas")'); h = so.html('feed-list');
check('muro: vídeo real con su control de sonido', h.includes('pm-video real') && h.includes('<video') && h.includes('toggleVideoSound'));
so.run('openPostMenu(POSTS[0].id)'); h = so.html('overlay'); rendered += h;
check('menú de una publicación propia: editar pie y eliminar', h.includes('Editar el pie') && h.includes('Eliminar publicación'));
so.run('openEditCaption(POSTS[0].id); document.getElementById("f-ecap").value = "Paseo con @lucia #domingo"; saveCaption(POSTS[0].id)');
check('editar el pie: menciones y temas', so.run('POSTS[0].caption') === 'Paseo con @lucia #domingo' && so.run('POSTS[0].edited') === true && so.run('POSTS[0].hashtags[0]') === '#domingo');
const nP0 = so.run('POSTS.length'); so.run('deletePost(POSTS[0].id)');
check('eliminar una publicación', so.run('POSTS.length') === nP0 - 1);
so.run('openPostMenu("po8")');
check('menú de una publicación ajena: seguir y reportar', so.html('overlay').includes('Reportar') && so.html('overlay').includes('Lucía R.'));
so.run('closeOverlay(); openComments("po8"); document.getElementById("cm-input").value = "¡Qué bonito!"; addComment("po8")');
check('borrar tu propio comentario', so.html('overlay').includes('deleteComment'));
const nc = so.run('POSTS.find(p => p.id === "po8").comments.length'); so.run(`deleteComment("po8", ${nc - 1})`);
check('comentario borrado', so.run('POSTS.find(p => p.id === "po8").comments.length') === nc - 1);
so.run('closeOverlay()');
check('pies con @menciones y #temas tocables', so.run('highlightCaption("Con @marcot en #retiro")').includes("openHandle('@marcot')") && so.run('highlightCaption("x #Retiro")').includes("tema/retiro"));
so.run('savePost("po10")'); so.run('state.profileTab = "guardados"'); so.nav('perfil'); h = so.html('view-perfil'); rendered += h;
check('perfil: guardados (solo tú los ves)', h.includes('Solo tú ves lo que guardas') && h.includes("openPost('po10')"));
so.run('state.profileTab = "posts"');
so.nav('u/irene'); h = so.html('view-page'); rendered += h;
check('perfil privado: se ve la cabecera, no el contenido', h.includes('Esta cuenta es privada') && !h.includes('profile-grid') && h.includes('Solicitar seguir'));
check('perfil privado: sus valoraciones tampoco', so.run('canSeeRating(RATINGS.find(r => r.id === "ra16"), "me")') === false);
so.run('toggleFollow("irene")');
check('solicitar seguir: queda pendiente', so.run('hasRequested("irene")') && so.html('view-page').includes('Solicitado') && !so.run('follows("me","irene")'));
so.run('simulateFollowAccepted("irene")');
check('aceptan tu solicitud: ves sus publicaciones y te avisan', so.run('follows("me","irene")') && so.run('wallPosts().some(p => p.authorId === "irene")') && so.run('NOTIFICATIONS[0].type') === 'seguidor');
so.nav('u/irene');
check('ya se ve su perfil', so.html('view-page').includes('profile-grid'));
so.run('toggleProfilePrivacy()');
check('tu perfil privado', so.run('ME.profilePublic') === false);
so.run('simulateIncomingFollow()');
const reqFrom = so.run('incomingRequests()[0]');
so.nav('notificaciones'); h = so.html('view-page'); rendered += h;
check('te piden seguirte: confirmar o eliminar en notificaciones', !!reqFrom && h.includes('Solicitudes para seguirte') && h.includes(`answerFollowRequest('${reqFrom}', true)`));
so.run(`answerFollowRequest("${reqFrom}", true)`);
check('confirmar: pasa a seguirte', so.run(`follows("${reqFrom}","me")`) && so.run('incomingRequests().length') === 0);
so.run('toggleProfilePrivacy()');
so.nav('perfil');
check('perfil: seguidores desde el grafo y tocables', so.html('view-perfil').includes("go('seguidores/me')") && so.html('view-perfil').includes(`<b>${so.run('followersOf("me").length')}</b> seguidores`));
so.nav('seguidores/me'); h = so.html('view-page'); rendered += h;
check('lista de seguidores con "Eliminar"', count(h, /class="au-person"/g) === so.run('followersOf("me").length') && h.includes('removeFollower'));
so.nav('seguidos/me'); h = so.html('view-page');
check('lista de seguidos', count(h, /class="au-person"/g) === so.run('followingOf("me").length'));
so.nav('feed');
check('Descubrir: entrada al buscador', so.html('feed-filters').includes("go('buscar')"));
so.nav('buscar'); h = so.html('view-page'); rendered += h + so.html('sr-res');
check('buscador vacío: temas populares', so.html('sr-res').includes('Temas populares'));
so.run('state.search.q = "lucia"; renderSearchResults()');
check('buscar personas sin tildes', so.html('sr-res').includes('Lucía R.'));
so.run('state.search.q = "vino"; renderSearchResults()');
check('buscar planes', so.html('sr-res').includes('Cata de vinos naturales'));
so.run('state.search.q = "#atardecer"; renderSearchResults()');
check('buscar temas', so.html('sr-res').includes('#atardecerdebod'));
so.run('setSearchTab("personas"); state.search.q = "irene"; renderSearchResults()');
check('búsqueda por pestañas', so.html('sr-res').includes('Irene C.') && !so.html('sr-res').includes('Cata de vinos'));
so.run('saveRecentSearch("vino")');
check('búsquedas recientes', so.run('ME.recentSearches[0]') === 'vino');
so.nav('tema/atardecerdebod'); h = so.html('view-page'); rendered += h;
check('página de un tema: publicaciones y planes', h.includes('#atardecerdebod') && h.includes("openPost('po8')") && h.includes('Planes aquí'));
so.run('setContentTab("menciones")'); h = so.html('feed-list'); rendered += h;
const mm = so.run('myMentions().map(m => m.key)');
check('menciones: etiqueta, mención en publicación y en comentario', mm.includes('tag:pv7') && mm.includes('post:po11') && mm.some(k => k.startsWith('com:po8')) && h.includes('Pendientes'));
so.run('answerMention("tag:pv7", true)');
check('aceptar una etiqueta: sale en tu perfil (Etiquetadas)', so.run('taggedPosts("me").some(p => p.id === "pv7")'));
so.run('answerMention("post:po11", false)');
check('quitar una mención: deja de aparecer', !so.run('myMentions().some(m => m.key === "post:po11")'));
so.run('setMentionPolicy("nadie")');
check('quién puede mencionarte: nadie', so.run('myMentions().length') === 0);
const so2 = createEnv(sst);
check('persistencia: seguir, privacidad, menciones y búsquedas', so2.run('follows("me","irene")') && so2.run('ME.mentionPolicy') === 'nadie' && so2.run('ME.recentSearches[0]') === 'vino');

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
// --- Confianza y seguridad: filtros, reportes, bloqueos, moderación, apelaciones, SOS y RGPD ---
const tst = {};
const t = createEnv(tst);
const lvl = (txt, ctx) => t.run(`moderateText(${JSON.stringify(txt)}, ${JSON.stringify(ctx || {})})`);
check('filtro: insulto disfrazado ("1d10t4", "i d i o t a") avisa antes de publicar', lvl('Eres un 1d10t4').cat === 'insulto' && lvl('eres un i d i o t a').level === 'aviso' && lvl('IMBÉCILLL').cat === 'insulto');
check('filtro: amenazas y odio se retienen', lvl('Te voy a matar').level === 'retener' && lvl('Sé dónde vives').cat === 'amenaza' && lvl('vaya sudacas').cat === 'odio');
check('filtro: spam con enlace y dinero se retiene', lvl('Gana 300 € a la semana en bit.ly/ya').cat === 'spam' && lvl('Mirad la web del bar: www.bar.com').level === 'ok');
check('filtro: teléfono a quien no conoces avisa; a quien conoces, no', lvl('llámame al 600 123 456', { kind:'mensaje' }).cat === 'contacto' && lvl('llámame al 600 123 456', { kind:'mensaje', known:true }).level === 'ok');
check('filtro: sin falsos positivos en frases normales', ['Qué buen plan, repetimos', 'Un montón todo el rato', 'La computadora', 'Llegamos a las 21:30'].every((x) => lvl(x).level === 'ok'));
t.run('openComments("po8")'); set(t, 'cm-input', 'Sois unos imbéciles'); const nC = t.run('getPost = (id) => POSTS.find(p => p.id === id); getPost("po8").comments.length');
t.run('addComment("po8")'); h = t.html('overlay'); rendered += h;
check('comentario con insulto: pregunta "¿Seguro?" y no publica aún', h.includes('¿Seguro que quieres publicarlo?') && h.includes('Publicar igualmente') && t.run('getPost("po8").comments.length') === nC);
t.run('nudgeEdit()');
check('comentario con insulto: "Editar" no publica y devuelve el texto', t.run('getPost("po8").comments.length') === nC && t.run('document.getElementById("cm-input").value') === 'Sois unos imbéciles');
t.run('addComment("po8"); nudgeGo()');
check('comentario con insulto: "Publicar igualmente" publica, marca y avisa a moderación (prioridad baja)', t.run('getPost("po8").comments.length') === nC + 1 && t.run('getPost("po8").comments.slice(-1)[0].flagged') === 'insulto'
  && t.run('REPORTS.slice(-1)[0].source') === 'automatico' && t.run('severityOf(REPORTS.slice(-1)[0])') === 'alta');
set(t, 'cm-input', 'Te voy a matar'); t.run('addComment("po8")'); h = t.html('overlay'); rendered += h;
check('comentario con amenaza: se retiene (solo lo ves tú) y queda en revisión', t.run('getPost("po8").comments.slice(-1)[0].held') === true && h.includes('En revisión')
  && t.run('MOD_ACTIONS[0].action') === 'retener' && t.run('MOD_ACTIONS[0].status') === 'en_revision' && t.run('MOD_ACTIONS[0].automated') === true);
check('comentario retenido: tú lo ves marcado; los demás no', t.run('commentVisible(getPost("po8").comments.slice(-1)[0])') === true && t.run('visibleComments(getPost("po8")).length') === nC + 2);
t.run('openComments("po8")'); check('comentarios: los tuyos retenidos llevan "En revisión" y los ajenos se pueden reportar', t.html('overlay').includes('cm-held') && t.html('overlay').includes('reportComment('));
t.run('state.draftPost = freshPostDraft(); state.draftPost.alsoStory = true'); t.nav('crear-post'); set(t, 'f-caption', 'Gana 500 € al mes con cripto en www.ganafacil.xyz');
const nStories5 = t.run('STORIES.length'); t.run('publishPost()');
check('publicación con spam: retenida, sin Stories, y en tu perfil con el aviso', t.run('POSTS[0].held') === true && t.run('STORIES.length') === nStories5 && t.run('postCard(POSTS[0])').includes('En revisión'));
const heldPost = t.run('POSTS[0].id');
check('publicación retenida: fuera del muro de los demás', t.run(`(() => { const p = POSTS.find(x => x.id === "${heldPost}"); p.authorId = "lucia"; const v = canSeePost(p); p.authorId = "me"; return v; })()`) === false);
t.run('openChat = (id) => { location.hash = "#/chat/" + id; renderChat(id); }; openChat("c1")'); set(t, 'msg-input', 'Mi número es 600 123 456');
const nMsg = t.run('getConversation("c1").messages.length'); t.run('sendMsg("c1")');
check('mensaje a alguien que conoces: sin aviso', t.run('getConversation("c1").messages.length') === nMsg + 1 && !t.html('overlay').includes('Cuidado con tus datos'));
t.run('const cx = dmWith("ana", true); openChat(cx.id)'); set(t, 'msg-input', 'Escríbeme a ana.fan@correo.es');
t.run('sendMsg(dmWith("ana").id)'); h = t.html('overlay'); rendered += h;
check('mensaje con tus datos a quien no conoces: avisa y deja enviarlo igualmente', h.includes('Cuidado con tus datos') && h.includes('Enviar igualmente') && t.run('dmWith("ana").messages.length') === 0);
t.run('nudgeGo()'); check('enviar igualmente: se entrega', t.run('dmWith("ana").messages.length') === 1);
set(t, 'msg-input', 'Sé dónde vives'); t.run('openChat("c1"); sendMsg("c1")');
check('mensaje con amenaza: no se entrega, queda retenido', t.run('getConversation("c1").messages.slice(-1)[0].held') === true && t.run('renderChat("c1"); document.getElementById("view-page").innerHTML').includes('No entregado'));

// Reportes de contenido, perfiles y planes; bloqueo y desbloqueo
t.run('openPostMenu("po9")'); check('menú de publicación ajena: reportar la publicación', t.html('overlay').includes("objectType:'publicacion'"));
t.run('openReport("marco", null, { objectType:"publicacion", postId:"po9" })'); h = t.html('overlay'); rendered += h;
check('reportar publicación: título, prueba adjunta y sin bloquear por defecto', h.includes('Reportar la publicación') && h.includes('Se adjunta la publicación') && t.run('state.report.block') === false);
t.run('setReportField("reason","spam"); submitReport()');
check('reporte de publicación: guarda tipo, prueba y quién reporta', t.run('REPORTS.slice(-1)[0].objectType') === 'publicacion' && t.run('REPORTS.slice(-1)[0].evidence').includes('5 km') && !t.run('(ME.blocked||[]).includes("marco")'));
const myRep = t.run('REPORTS.slice(-1)[0].id');
t.run('reportComment("po7","cm-a1")'); check('reportar un comentario', t.html('overlay').includes('Reportar el comentario'));
t.run('reportPlan("p3")'); check('reportar un plan (al anfitrión)', t.html('overlay').includes('Reportar el plan') && t.run('state.report.uid') === 'azotea');
t.run('closeOverlay()'); t.nav('u/alexv'); h = t.html('view-page'); rendered += h;
check('perfil ajeno: botón de más opciones', h.includes('openUserMenu(\'alexv\')'));
t.run('openUserMenu("alexv")'); h = t.html('overlay'); check('más opciones: reportar y bloquear', h.includes('Reportar') && h.includes('Bloquear'));
t.run('location.hash = "#/u/alexv"; blockUser("alexv")'); h = t.html('view-page');
check('bloquear desde el perfil: se queda en el perfil y lo muestra', h.includes('Has bloqueado a Álex V.') && t.run('ME.blocked.includes("alexv")'));
check('bloqueado: sus comentarios dejan de verse', !t.run('visibleComments(getPost("po7")).some(c => c.userId === "alexv")'));
t.nav('bloqueados'); h = t.html('view-page'); rendered += h;
check('cuentas bloqueadas: lista con desbloquear', h.includes('Álex V.') && h.includes('Desbloquear'));
t.run('unblockUser("alexv")'); check('desbloquear desde la lista', !t.run('ME.blocked.includes("alexv")') && !t.html('view-page').includes('Álex V.'));
t.nav('mis-reportes'); h = t.html('view-page'); rendered += h;
check('tus reportes: estado de cada uno', h.includes('Marco T.') && h.includes('En revisión'));

// Panel de moderación
t.nav('moderacion'); h = t.html('view-page'); rendered += h;
check('panel: cola ordenada por gravedad (crítica primero) con plazos', h.indexOf('Crítica') > -1 && h.indexOf('Crítica') < h.indexOf('Baja') && h.includes('responder en 1 h') && h.includes('Filtro automático'));
check('panel: prueba, historial de la cuenta y quién reporta', h.includes('Menudo DJ más malo') && h.includes('reportes') && h.includes('nunca se le dice'));
t.run('openModActions("rp2")'); h = t.html('overlay'); rendered += h;
check('panel: acciones disponibles', ['Desestimar', 'Reducir el alcance', 'organizar planes', 'Suspender la cuenta 7 días', 'Cerrar la cuenta para siempre', 'autoridades'].every((x) => h.includes(x)));
t.run('applyModAction("rp1","retirar")');
check('retirar: el comentario desaparece y queda la decisión con sus motivos', !t.run('visibleComments(getPost("po7")).some(c => c.id === "cm-a1")') && t.run('REPORTS.find(r => r.id === "rp1").status') === 'resuelto'
  && t.run('statementFor(MOD_ACTIONS[0])').includes('Norma:') && t.run('statementFor(MOD_ACTIONS[0])').includes('persona del equipo'));
t.run('applyModAction("rp2","suspender7")');
check('suspender: la cuenta queda suspendida, no se le puede escribir y su perfil lo indica', t.run('isSanctioned("alexv")') && t.run('userMod("alexv").strikes') === 2
  && (t.run('openDm("alexv")'), t.html('toast').includes('suspendida') || t.run('document.getElementById("toast").textContent').includes('suspendida')) && (t.nav('u/alexv'), t.html('view-page').includes('suspendida')));
t.run('applyModAction("rp4","desestimar")'); check('desestimar', t.run('REPORTS.find(r => r.id === "rp4").status') === 'desestimado');
t.run('ME.notifPrefs = Object.fromEntries(Object.keys(NOTIF_TYPES).map(k => [k, false]))');
t.run(`applyModAction("${myRep}","aviso")`);
check('quien reporta recibe el resultado (aviso de seguridad, no se puede desactivar)', t.run('NOTIFICATIONS[0].type') === 'seguridad' && t.run('NOTIFICATIONS[0].route') === 'mis-reportes' && t.run('NOTIFICATIONS[0].text').includes('Marco T.'));
t.run('ME.notifPrefs = undefined');
const heldRep = t.run('REPORTS.find(r => r.status === "en_cola" && r.objectType === "comentario" && r.targetUserId === "me" && r.modActionId).id');
t.nav('moderacion'); check('panel: lo retenido por el filtro se puede publicar', t.html('view-page').includes(`applyModAction('${heldRep}','publicar')`));
t.run(`applyModAction("${heldRep}","publicar")`);
check('publicar lo retenido: vuelve a verse y la decisión automática queda anulada', t.run('getPost("po8").comments.find(c => c.text === "Te voy a matar").held') === false
  && t.run(`MOD_ACTIONS.find(a => a.id === REPORTS.find(r => r.id === "${heldRep}").modActionId).status`) === 'revocada');
// Apelaciones
t.nav('estado-cuenta'); h = t.html('view-page'); rendered += h;
check('estado de tu cuenta: decisiones con motivos y botón de apelar', h.includes('Retirar el contenido') && h.includes('Vendo 2 entradas') && h.includes('sistema automático') && h.includes("openAppeal('action:ma1')"));
t.run('openAppeal("action:ma1")'); t.run('submitAppeal()'); check('apelar: pide el motivo', !t.run('MOD_ACTIONS.find(a => a.id === "ma1").appeal'));
set(t, 'f-appeal', 'Eran entradas mías y no sabía que no se podía'); t.run('submitAppeal()');
check('apelación enviada', t.run('MOD_ACTIONS.find(a => a.id === "ma1").appeal.status') === 'pendiente');
t.nav('moderacion'); t.run('renderModeration("apelaciones")'); h = t.html('view-page'); rendered += h;
check('panel: apelaciones pendientes con su motivo', h.includes('Marina apela') && h.includes('Eran entradas mías'));
t.run('resolveAppeal("action:ma1", true)');
check('apelación estimada: el comentario vuelve y se avisa', t.run('getPost("po9").comments.find(c => c.id === "cm-m1").removed') === false && t.run('MOD_ACTIONS.find(a => a.id === "ma1").status') === 'revocada'
  && t.run('NOTIFICATIONS[0].text').includes('Te damos la razón'));
t.run(`REPORTS.find(r => r.id === "${myRep}").status = "desestimado"`); t.run(`openAppeal("report:${myRep}")`); set(t, 'f-appeal', 'Es spam de verdad'); t.run('submitAppeal()');
t.run(`resolveAppeal("report:${myRep}", true)`);
check('quien reporta también puede pedir otra revisión: vuelve a la cola', t.run(`REPORTS.find(r => r.id === "${myRep}").status`) === 'en_cola');
t.run('renderModeration("historial")'); check('panel: historial de decisiones', t.html('view-page').includes('Anulada') && t.html('view-page').includes('Vigente'));
// Bio y planes
t.nav('editar-perfil'); set(t, 'f-pbio', 'Te voy a matar'); const bio0 = t.run('ME.bio'); t.run('saveProfile()');
check('descripción con amenaza: no se guarda', t.run('ME.bio') === bio0);
t.nav('crear-plan'); set(t, 'f-title', 'Quedada'); set(t, 'f-desc', 'Os mato a todos'); t.run('publishPlan()');
check('plan con amenaza: retenido, fuera del feed, con aviso en la ficha', t.run('PLANS[0].held') === true && !t.run('filteredPlans().some(p => p.id === PLANS[0].id)') && (t.run('renderDetail(PLANS[0].id)'), t.html('view-detail').includes('En revisión')));
t.run('setUserMod("me", { canHost:false })'); const nPl = t.run('PLANS.length'); t.nav('crear-plan'); set(t, 'f-title', 'Paseo'); t.run('publishPlan()');
check('sin permiso para organizar: no se publica', t.run('PLANS.length') === nPl);
t.run('setUserMod("me", { canHost:true })');
// Contactos de confianza y SOS
t.nav('plan/p9'); h = t.html('view-detail'); rendered += h;
check('ficha: botón SOS y propuesta de añadir contacto de confianza', h.includes('class="sos-btn"') && h.includes('Añade un contacto de confianza') && h.includes('Reportar este plan'));
t.nav('contactos-confianza'); h = t.html('view-page'); rendered += h;
check('contactos de confianza: explicación y formulario', h.includes('Hasta 3 personas') && h.includes('f-tphone'));
set(t, 'f-tname', 'Luis'); set(t, 'f-tphone', '12'); t.run('addTrusted()'); check('teléfono no válido: no se añade', t.run('trustedContacts().length') === 0);
set(t, 'f-tphone', '+34 611 222 333'); t.run('addTrusted()'); set(t, 'f-tname', 'Carmen'); set(t, 'f-tphone', '622 333 444'); t.run('addTrusted()');
check('añadir contactos (invitación por SMS)', t.run('trustedContacts().length') === 2 && t.run('trustedContacts()[0].status') === 'pendiente');
t.nav('plan/p9'); t.run('shareWithContacts("p9")'); h = t.html('view-detail');
check('compartir el plan con los contactos', t.run('SAFETY_EVENTS[0].type') === 'compartir' && h.includes('Compartido con Luis y Carmen') && h.includes('He llegado bien'));
t.run('arrivedSafe("p9")'); check('he llegado bien', t.run('SAFETY_EVENTS[0].type') === 'llegada');
t.run('openSos("p9")'); h = t.html('overlay'); rendered += h;
check('SOS: llamar al 112 y enviar alerta con ubicación', h.includes('href="tel:112"') && h.includes('Enviar alerta con mi ubicación') && h.includes('Luis y Carmen'));
t.run('sendSos("p9")'); h = t.html('view-detail');
check('SOS enviado: alerta activa, aviso y "Estoy bien"', t.run('activeSos("p9").status') === 'activa' && h.includes('Alerta SOS enviada') && h.includes('Estoy bien') && t.run('NOTIFICATIONS[0].type') === 'seguridad');
t.nav('moderacion'); t.run('renderModeration("sos")'); h = t.html('view-page'); rendered += h;
check('panel: la alerta SOS aparece con el plan, la ubicación y los contactos avisados', h.includes('SOS activo') && h.includes('Cata de vinos') && h.includes('Luis, Carmen'));
t.run('escalateSos(SAFETY_EVENTS[0].id); closeSos(SAFETY_EVENTS[0].id, "equipo")');
check('panel: avisar al 112 y cerrar la alerta', t.run('SAFETY_EVENTS[0].escalated') === true && t.run('SAFETY_EVENTS[0].status') === 'cerrada' && !t.run('activeSos("p9")'));
t.run('location.hash = "#/chat/c2"; renderChat("c2")'); check('chat del plan: botón SOS', t.html('view-page').includes('sos-chip'));
// Tus datos (RGPD)
t.nav('ajustes'); h = t.html('view-page'); rendered += h;
check('ajustes: tu seguridad, tus datos y panel de moderación', ['Contactos de confianza y SOS', 'Cuentas bloqueadas', 'Tus reportes', 'Estado de tu cuenta', 'Tus datos y privacidad', 'Panel de moderación'].every((x) => h.includes(x)));
t.nav('mis-datos'); h = t.html('view-page'); rendered += h;
check('tus datos: descargar, consentimientos, derechos y eliminar', ['Descargar mis datos', 'Consentimientos', 'Novedades y planes destacados', 'Interés legítimo', 'Términos y privacidad', 'Corregir tus datos', 'Eliminar cuenta'].every((x) => h.includes(x)));
const exp = t.run('JSON.parse(JSON.stringify(buildExport()))');
check('exportación: todo lo tuyo y sin la contraseña', ['cuenta', 'perfil', 'publicaciones', 'comentarios', 'valoraciones', 'sigues', 'teSiguen', 'planes', 'mensajes', 'notificaciones', 'bloqueados', 'reportesEnviados', 'decisionesSobreTi', 'seguridad', 'consentimientos'].every((k) => k in exp)
  && exp.cuenta.email === 'marina@planes.app' && !('hash' in exp.cuenta) && !('salt' in exp.cuenta) && exp.publicaciones.every((p) => p.authorId === 'me') && exp.seguridad.contactosDeConfianza.length === 2);
check('exportación: los reportes no incluyen datos de terceros que reportan', exp.reportesEnviados.every((r) => !('reporterId' in r)));
t.run('toggleConsent("analitica"); toggleConsent("marketing")');
check('consentimientos: se cambian y queda registro con fecha', t.run('consentValue("analitica")') === true && t.run('currentAccount().consents.marketing') === true && t.run('ME.consentLog.length') === 2 && !!t.run('ME.consentLog[0].at'));
t.run('openDeleteAccount()'); check('eliminar cuenta: ofrece descargar antes tus datos', t.html('overlay').includes('descarga una copia de tus datos'));
// Persistencia
const t2 = createEnv(tst);
check('persisten decisiones, apelaciones, sanciones, SOS, contactos y consentimientos', t2.run('MOD_ACTIONS.find(a => a.id === "ma1").status') === 'revocada' && t2.run('isSanctioned("alexv")')
  && t2.run('SAFETY_EVENTS.some(e => e.type === "sos")') && t2.run('trustedContacts().length') === 2 && t2.run('consentValue("analitica")') === true && t2.run('REPORTS.some(r => r.reporterId === "me")'));
check('persisten los comentarios retirados y retenidos', !t2.run('visibleComments(POSTS.find(p => p.id === "po7")).some(c => c.id === "cm-a1")'));

// --- Pagos: reservar con dinero retenido, 15 % de comisión, reembolsos, reclamaciones, cobros del anfitrión y facturas ---
const pyst = {};
const py = createEnv(pyst);
const sp22 = py.run('splitFor(22)');
check('reparto: 15 % de comisión con el IVA dentro; el resto, para el anfitrión', sp22.fee === 3.3 && sp22.net === 18.7 && sp22.feeBase === 2.73 && sp22.feeVat === 0.57);
check('validación: DNI, NIE e IBAN (dígitos de control)', py.run('validTaxId("12345678Z") && validTaxId("X1234567L") && !validTaxId("12345678A")') && py.run('validIban("ES91 2100 0418 4502 0005 1332") && !validIban("ES91 2100 0418 4502 0005 1333")'));
py.nav('plan/p12'); h = py.html('view-detail'); rendered += h;
check('ficha de un plan de pago: "Reservar · precio" y pago protegido', h.includes('Reservar · 12 €') && h.includes('pago protegido hasta el plan'));
py.run('joinPlan("p12")'); h = py.html('overlay'); rendered += h;
check('pagar: política, dinero retenido, móvil y tarjeta guardada', h.includes('Cancelación flexible') && h.includes('Lo retenemos hasta el plan') && h.includes('Apple Pay o Google Pay') && h.includes('Visa ···· 4242') && h.includes('Pagar 12,00 €'));
py.run('setCheckout("method", "nueva")'); set(py, 'f-card', '4242 4242 4242 4241'); set(py, 'f-exp', '12/30'); set(py, 'f-cvc', '123'); py.run('payNow()');
check('tarjeta con un número mal escrito: error y no se cobra', py.html('overlay').includes('no es válido') && !py.run('myPayment("p12")'));
set(py, 'f-card', '4242424242424242'); set(py, 'f-exp', '01/20'); set(py, 'f-cvc', '123'); py.run('payNow()');
check('tarjeta caducada: error', py.html('overlay').includes('caducada'));
set(py, 'f-card', '4000 0000 0000 0002'); set(py, 'f-exp', '12/30'); set(py, 'f-cvc', '123'); py.run('payNow()');
check('tarjeta rechazada por el banco: error y no se apunta', py.html('overlay').includes('rechazado el pago') && !py.run('state.joined.has("p12")'));
set(py, 'f-card', '4000 0027 6000 3184'); set(py, 'f-exp', '12/30'); set(py, 'f-cvc', '123'); py.run('payNow()');
check('3D Secure: el banco pide confirmar', py.html('overlay').includes('Confirma el pago en tu banco') && !py.run('myPayment("p12")'));
py.run('completePayment(state.checkout.pending)');
check('pago confirmado: retenido, apuntado, recibo y tarjeta guardada', py.run('myPayment("p12").status') === 'retenido' && py.run('state.joined.has("p12")') && /^PL-\d{4}-\d{6}$/.test(py.run('myPayment("p12").receiptNo'))
  && py.run('PAYMENT_METHODS.length') === 2 && py.run('NOTIFICATIONS[0].type') === 'pago');
check('ficha: pagado y recibo', py.html('view-detail').includes('Pagado 12,00 €') && py.html('view-detail').includes('openReceipt('));
py.run('openCancel("p12")'); check('cancelar con tiempo (flexible): te devolvemos todo', py.html('overlay').includes('te devolvemos 12 €'));
py.run('confirmCancel("p12")');
check('reembolso completo: estado, importe y aviso', py.run('PAYMENTS.find(x => x.planId === "p12" && x.userId === "me").status') === 'reembolsado' && py.run('PAYMENTS.find(x => x.planId === "p12" && x.userId === "me").refunded') === 12 && py.run('NOTIFICATIONS[0].text').includes('Te devolvemos 12,00 €'));
py.run('joinPlan("p3"); payWithWallet()');
check('pagar con el móvil (Apple Pay o Google Pay)', py.run('myPayment("p3").method') === 'Pago con el móvil' && py.run('state.joined.has("p3")'));
py.run('getPlan("p3").when = new Date(Date.now() + 30 * 3600000); confirmCancel("p3")');
check('cancelar en la franja del 50 % (moderada): reembolso parcial', py.run('myPayment("p3").status') === 'reembolso_parcial' && py.run('myPayment("p3").refunded') === 9);
py.run('joinPlan("p9")'); py.run('getPlan("p12").status = "activo"'); py.run('joinPlan("p12"); payNow()'); py.run('confirmCancelPlan("p12")');
check('cancela el anfitrión: reembolso del 100 % aunque la política no lo diera', py.run('myPayment("p12").status') === 'reembolsado' && py.run('myPayment("p12").refundReason').includes('canceló'));
py.nav('pagos'); h = py.html('view-page'); rendered += h;
check('pagos y reembolsos: tarjetas, pagos con su estado, recibos y reclamar', h.includes('Visa ···· 4242') && h.includes('Retenido hasta el plan') && h.includes('Reembolso parcial') && h.includes('Pagado al anfitrión')
  && h.includes('Recibo') && h.includes("openClaim('pay1')"));
py.run('openReceipt("pay1")'); h = py.html('overlay'); rendered += h;
check('recibo: número, plan, importe y quién cobra', h.includes('PL-2026-000118') && h.includes('Cata de vinos naturales') && h.includes('22,00 €') && h.includes('en nombre de Vinos Vivos'));
py.run('openClaim("pay1"); state.claim.reason = "no_celebrado"'); set(py, 'f-claim', 'No había nadie en el sitio'); py.run('submitClaim()');
const claimRep = py.run('REPORTS.slice(-1)[0]');
check('reclamar: pausa el pago al anfitrión y va a moderación', py.run('PAYMENTS.find(x => x.id === "pay1").status') === 'en_revision' && claimRep.paymentId === 'pay1' && claimRep.objectType === 'plan' && claimRep.evidence.includes('No había nadie'));
py.nav('moderacion'); h = py.html('view-page');
check('panel: la reclamación con su pago y "Reembolsar"', h.includes('Reclamación de un pago de 22,00 €') && h.includes(`applyModAction('${claimRep.id}','reembolsar')`));
py.run(`applyModAction("${claimRep.id}", "reembolsar")`);
check('reclamación aceptada: reembolso completo y aviso', py.run('PAYMENTS.find(x => x.id === "pay1").status') === 'reembolsado' && py.run('NOTIFICATIONS.some(n => n.text.startsWith("Reclamación aceptada"))'));
// Cobros del anfitrión
py.nav('crear-plan'); py.run('setDraft("price", "pago")'); set(py, 'f-price', '20'); set(py, 'f-title', 'Taller de cerámica'); py.run('publishPlan()');
check('plan de pago sin cobros configurados: no se publica y lleva a configurarlos', py.run('PLANS[0].title') !== 'Taller de cerámica' && py.run('location.hash') === '#/cobros');
py.nav('cobros'); h = py.html('view-page'); rendered += h;
check('alta de cobros: tipo, datos fiscales e IBAN', h.includes('Configura tus cobros') && h.includes('Particular') && h.includes('Autónomo o empresa') && h.includes('f-iban') && h.includes('85 %'));
set(py, 'f-legal', 'Marina López'); set(py, 'f-taxid', '12345678A'); set(py, 'f-addr', 'Calle Mayor 1, Madrid'); set(py, 'f-iban', 'ES9121000418450200051332'); py.run('submitPayoutSetup()');
check('alta de cobros: DNI no válido', py.html('view-page').includes('no es válido') && !py.run('ME.payouts'));
set(py, 'f-taxid', '12345678Z'); py.run('submitPayoutSetup()');
check('alta de cobros: en revisión (Stripe verifica)', py.run('ME.payouts.status') === 'en_revision' && py.html('view-page').includes('Estamos verificando'));
py.run('ME.payouts.status = "activa"');
py.nav('crear-plan'); h = py.html('view-page'); rendered += h;
check('crear plan de pago: lo que te llega y política de cancelación', h.includes('Política de cancelación') && h.includes('d-policy') && py.run('priceHint("20")').includes('te llegan 17,00 €'));
py.run('setDraft("price", "pago"); setDraft("policy", "estricta"); state.draft.access = "libre"'); set(py, 'f-price', '20'); set(py, 'f-title', 'Taller de cerámica'); py.run('publishPlan()');
const tp = py.run('PLANS[0]');
check('plan de pago publicado: precio, política elegida y con reserva', tp.title === 'Taller de cerámica' && tp.paid && tp.price === 20 && tp.cancelPolicy === 'estricta' && tp.joinType === 'apuntado');
py.run(`demoSales("${tp.id}", 3)`); py.nav('cobros'); h = py.html('view-page'); rendered += h;
check('cobros: reservas, ventas, comisión y lo que te llega', h.includes('3 reservas') && h.includes('ventas 60,00 €') && h.includes('comisión 9,00 €') && h.includes('para ti 51,00 €') && h.includes('Retenido hasta el plan'));
py.run(`demoHostPlanDone("${tp.id}")`); check('plan celebrado: los cobros van en camino (48 h)', py.run(`hostSales("${tp.id}").every(x => x.status === "liberado")`));
py.run(`demoPayout("${tp.id}")`);
check('pago al anfitrión: a su cuenta, con aviso', py.run(`hostSales("${tp.id}").every(x => x.status === "pagado")`) && py.run('NOTIFICATIONS[0].text').includes('Te hemos pagado 51,00 €') && py.run('NOTIFICATIONS[0].text').includes('ES91 ···· 1332'));
const inv = py.run(`commissionInvoice(new Date().toISOString().slice(0, 7))`);
check('factura mensual de la comisión: base, IVA y total', inv.fee === 9 && inv.feeBase === 7.44 && inv.feeVat === 1.56 && inv.net === 51 && /^PLC-\d{6}-0001$/.test(inv.no));
py.run(`openInvoice("${inv.month}")`); h = py.html('overlay'); rendered += h;
check('factura: emisor, cliente con su NIF e IVA', h.includes('Comisión por intermediación') && h.includes('12345678Z') && h.includes('IVA 21 %'));
py.nav('ajustes'); check('ajustes: pagos y cobros', py.html('view-page').includes("go('pagos')") && py.html('view-page').includes("go('cobros')") && py.html('view-page').includes('Activos'));
check('tus datos (RGPD): incluyen pagos, tarjetas (sin el número) y cobros (IBAN oculto)', py.run('buildExport().pagos.length') > 0 && !JSON.stringify(py.run('buildExport().formasDePago')).includes('4242424242') && py.run('buildExport().cobros.iban') === 'ES91 ···· 1332');
const py2 = createEnv(pyst);
check('persisten pagos, tarjetas y cobros', py2.run('PAYMENTS.length') === py.run('PAYMENTS.length') && py2.run('PAYMENT_METHODS.length') === 2 && py2.run('payoutsReady()'));

// --- Interfaz compacta: filtros plegados y barras que se esconden al bajar ---
const ui = createEnv({});
ui.nav('feed'); h = ui.html('feed-filters'); rendered += h;
check('filtros plegados: buscador y botón "Filtros"; el panel, cerrado', h.includes('filter-btn') && h.includes('Busca planes') && /id="filter-panel" hidden/.test(h) && h.includes('aria-expanded="false"'));
ui.run('toggleFilters()'); check('el botón abre el panel', ui.run('state.filtersOpen') === true && ui.run('document.getElementById("filter-panel").hidden') === false);
ui.run('state.category = "outdoor"; state.price = "gratis"; toggleFilters(false); renderFeed()');
check('con el panel cerrado: contador y chips de los filtros puestos', ui.run('document.getElementById("filter-count").textContent') === '2' && ui.html('filter-active').includes('Outdoor') && ui.html('filter-active').includes('Gratis'));
check('los planes se filtran igual', count(ui.html('feed-list'), /class="cell /g) === ui.run('filteredPlans().length') && ui.run('filteredPlans().every(p => p.category === "outdoor" && !p.paid)'));
ui.run('clearFilter("price", "todos")'); check('quitar un filtro con su chip', ui.run('state.price') === 'todos' && ui.run('document.getElementById("filter-count").textContent') === '1');
ui.run('clearFilters()'); check('quitar todos los filtros', ui.run('activeFilters().length') === 0 && ui.run('document.getElementById("filter-count").hidden') === true);
ui.run(`globalThis.__ph = { cls:{}, classList:{ toggle(c, v){ __ph.cls[c] = v; } }, style:{ setProperty(){} }, offsetHeight:120 }; document.querySelector = () => __ph;
  globalThis.__v = { scrollTop:0, _lastY:0, scrollHeight:3000, clientHeight:700, querySelector:() => null }`);
ui.run('__v.scrollTop = 200; onViewScroll({ target: __v }); __v.scrollTop = 300; chromeState.lock = 0; onViewScroll({ target: __v })');
check('al bajar se esconden la cabecera y la barra de abajo', ui.run('chromeState.hidden') === true && ui.run('__ph.cls["chrome-hidden"]') === true);
ui.run('chromeState.lock = 0; __v.scrollTop = 250; onViewScroll({ target: __v })');
check('al subir vuelven', ui.run('chromeState.hidden') === false);
ui.run('chromeState.lock = 0; __v.scrollTop = 400; onViewScroll({ target: __v }); chromeState.lock = 0; __v.scrollTop = 10; onViewScroll({ target: __v })');
check('arriba del todo siempre se ven', ui.run('chromeState.hidden') === false);
ui.run('chromeState.lock = 0; __v.scrollTop = 400; __v.querySelector = (s) => s === ".chat-foot" ? {} : null; onViewScroll({ target: __v })');
check('en un chat no se esconden', ui.run('chromeState.hidden') === false);
ui.run('__v.querySelector = () => null; chromeState.lock = 0; __v.scrollTop = 600; onViewScroll({ target: __v })'); ui.nav('mapa');
check('al cambiar de pantalla vuelven a verse', ui.run('chromeState.hidden') === false);

// --- Quién está en el plan: visibilidad, chinchetas en el plan y en el mapa, y saludos ---
const prs = {};
const pr = createEnv(prs);
pr.nav('plan/p2'); h = pr.html('view-detail'); rendered += h;
check('antes de llegar: no ves a nadie, solo el aviso', pr.run('peopleHere("p2").length') === 0 && h.includes('Cuando registres tu llegada verás quién más está'));
check('tu presencia: quién te ve (todos, amigos, nadie) y si vas solo o en grupo', ['Todos los del plan', 'Amigos', 'Nadie', 'Voy solo', 'Voy en grupo', 'No decirlo'].every((x) => h.includes(x)));
pr.run('setPlanPresence("p2", "mode", "solo")'); check('elegir "voy solo"', pr.run('myPresence("p2").mode') === 'solo');
pr.run('registerArrival("p2")');
const here = pr.run('peopleHere("p2").map(e => e.u.id)');
check('al llegar: ves a los visibles; nunca a quien eligió "nadie"', here.includes('lucia') && here.includes('marco') && here.includes('nora') && !here.includes('david'));
check('"solo amigos": solo si sois amigos', here.includes('ana') === pr.run('areFriends("me", "ana")'));
pr.run('blockUser("nora", true)'); check('bloqueados: no salen', !pr.run('peopleHere("p2").some(e => e.u.id === "nora")')); pr.run('unblockUser("nora")');
pr.nav('plan/p2'); h = pr.html('view-detail'); rendered += h;
check('aquí ahora: chinchetas en el punto del plan con enlace al perfil, y la tuya', h.includes('Aquí ahora') && h.includes('here-pin') && h.includes("go('u/lucia')") && h.includes('here-me') && h.includes('nunca en vuestra ubicación exacta'));
check('aquí ahora: quién ha venido solo', h.includes('Va solo') && /han venido solos|ha venido solo/.test(h));
check('al llegar visible para todos: sale en la lista pública', pr.run('getPlan("p2").publicAttendees.includes(ME.initials)'));
pr.run('setPlanPresence("p2", "vis", "nadie")'); h = pr.html('view-detail');
check('visibilidad "nadie": sin tu chincheta y fuera de la lista pública', !h.includes('here-me') && h.includes('Ahora no te ven') && !pr.run('getPlan("p2").publicAttendees.includes(ME.initials)'));
pr.run('setPlanPresence("p2", "vis", "todos")');
pr.run('sendPing("marco", "p2")');
const pc = pr.run('dmWith("marco").messages.slice(-1)[0]');
check('saludo "yo también estoy aquí": llega como mensaje con la chincheta animada', pc.ping === 'p2' && pc.from === 'me' && pr.run('dmWith("marco").status') === 'aceptada' && pr.run('pinged("p2", "marco")'));
const nMsgs = pr.run('dmWith("marco").messages.length'); pr.run('sendPing("marco", "p2")');
check('un saludo por persona y plan', pr.run('dmWith("marco").messages.length') === nMsgs && pr.html('view-detail').includes('Saludado'));
check('en la bandeja: "Yo también estoy en el plan"', pr.run('msgPreview(dmWith("marco").messages.slice(-1)[0], dmWith("marco"))') === 'Tú: Yo también estoy en el plan');
pr.run('location.hash = "#/chat/" + dmWith("marco").id; renderChat(dmWith("marco").id)'); h = pr.html('view-page'); rendered += h;
check('en el chat: el saludo con la chincheta', h.includes('ping-msg') && h.includes('ping-ring') && h.includes('Yo también estoy en'));
pr.run('location.hash = "#/feed"; pingBack("marco", "p2")');
check('te devuelven el saludo: aviso "En el plan"', pr.run('NOTIFICATIONS[0].type') === 'aqui' && pr.run('NOTIFICATIONS[0].text').includes('te ha saludado'));
pr.run('registerArrival("p3")'); pr.run('location.hash = "#/chat/c2"; renderChat("c2")');
check('chat del plan: "Estoy aquí"', pr.html('view-page').includes("pingPlanChat('p3','c2')"));
pr.run('pingPlanChat("p3", "c2")'); check('aviso al grupo de que estás', pr.run('getConversation("c2").messages.slice(-1)[0].ping') === 'p3' && !pr.html('view-page').includes("pingPlanChat('p3','c2')"));
pr.nav('mapa'); h = pr.html('map'); rendered += h;
check('mapa: tu chincheta animada en el lugar del plan, con cuántos estáis', /class="pin public\s+live"/.test(h) && h.includes('pin-here') && h.includes('estás aquí'));
pr.run('selectPlace("debod")'); h = pr.html('map-sheet');
check('mapa: quién está contigo, con enlace a su perfil', h.includes('Estás en Atardecer en el Templo de Debod') && h.includes("go('u/lucia')"));
check('solo ves a otros en planes donde has registrado la llegada', pr.run('peopleHere("p9").length') === 0 && pr.run('peopleHere("p12").length') === 0);
const pr2 = createEnv(prs);
check('persisten tu visibilidad por plan y los saludos', pr2.run('myPresence("p2").mode') === 'solo' && pr2.run('pinged("p2", "marco")'));

// --- Chispas: posibles planes ("Estoy pensando… ¿alguien se anima?") ---
const chs = {};
const ch = createEnv(chs);
ch.nav('feed'); h = ch.html('feed-list'); rendered += h;
check('Disponibles: tira de chispas con "¿quién se anima?" y "Lanza una chispa"', h.includes('Chispas · ¿quién se anima?') && h.includes("go('chispa/ch1')") && h.includes('Lanza una chispa') && count(h, /class="cell /g) === 15);
ch.run('IDEAS.push({ id:"chx", authorId:"nora", title:"Solo amigos", text:"x", category:"social", when:"finde", limit:false, min:2, who:"amigos", approval:false, cost:"gratis", people:[], status:"abierta", at:Date.now() })');
check('una chispa "solo amigos" no la ve quien no es amigo', !ch.run('visibleIdeas().some(x => x.id === "chx")') && ch.run('areFriends("me", "nora")') === false);
ch.nav('chispa/ch1'); h = ch.html('view-page'); rendered += h;
check('ficha de la chispa: quién la lanza, cuándo, dónde, plazas, mínimo y gastos', h.includes('Marco T.') && h.includes('está pensando') && h.includes('Este finde') && h.includes('La Pedriza') && h.includes('2 de 6') && h.includes('Mínimo 3') && h.includes('Gasolina a escote'));
check('ficha: "Me apunto", "Quizás" y escribir', h.includes('Me apunto') && h.includes('Quizás') && h.includes("openDm('marco')"));
ch.run('answerIdea("ch1", "si")');
check('me apunto: sumas una plaza y se llega al mínimo', ch.run('myIdeaStatus(getIdea("ch1"))') === 'si' && ch.html('view-page').includes('3 de 6') && ch.html('view-page').includes('Te apuntas'));
ch.run('answerIdea("ch1", "quizas")'); check('quizás', ch.run('myIdeaStatus(getIdea("ch1"))') === 'quizas');
ch.run('answerIdea("ch1", null)'); check('ya no me interesa', ch.run('myIdeaStatus(getIdea("ch1"))') === null);
ch.run('IDEAS.push({ id:"chf", authorId:"lucia", title:"Llena", text:"x", category:"cultura", when:"finde", limit:true, max:2, min:2, who:"todos", approval:false, cost:"gratis", people:[{ userId:"ana", status:"si" }], status:"abierta", at:Date.now() })');
ch.nav('chispa/chf'); ch.run('answerIdea("chf", "si")');
check('con límite de plazas: completa, no se puede apuntar', ch.run('ideaFull(getIdea("chf"))') && ch.run('myIdeaStatus(getIdea("chf"))') === null && ch.html('view-page').includes('Completa'));
ch.nav('chispa/ch3'); check('con "decido yo quién va", el botón es "Quiero ir"', ch.html('view-page').includes('Quiero ir')); ch.run('answerIdea("ch3", "si")');
check('"decido yo quién va": tu respuesta queda pendiente', ch.run('myIdeaStatus(getIdea("ch3"))') === 'pendiente' && ch.html('view-page').includes('Pendiente de Sara'));
ch.run('simulateIdeaAccept("ch3")'); check('te aceptan: aviso de chispa', ch.run('myIdeaStatus(getIdea("ch3"))') === 'si' && ch.run('NOTIFICATIONS[0].type') === 'chispa');
ch.run('IDEAS.push({ id:"cho", authorId:"marco", title:"Vieja", text:"x", category:"social", when:"sin_fecha", limit:false, min:2, who:"todos", approval:false, cost:"gratis", people:[], status:"abierta", at: Date.now() - 8 * 86400000 })');
check('sin convertirse en plan, caduca a los 7 días', ch.run('ideaState(getIdea("cho"))') === 'caducada' && !ch.run('visibleIdeas().some(x => x.id === "cho")'));
// Lanzar una chispa
ch.run('go("crear")'); ch.run('renderCreateChooser()'); check('crear: opción "Chispa"', ch.html('view-page').includes("go('crear-chispa')"));
ch.nav('crear-chispa'); h = ch.html('view-page'); rendered += h;
check('lanzar: qué, cuándo, dónde, plazas, mínimo, quién y gastos', ['¿Qué te apetece?', 'Cuándo', 'Dónde (aproximado)', 'Plazas', 'Sin límite', 'Con límite', 'Mínimo para hacerlo', 'Quién puede apuntarse', 'Decido yo quién va', 'Gastos', 'A escote'].every((x) => h.includes(x)));
ch.run('setIdeaCategory("fiesta")'); check('cada tema propone su configuración: fiesta, sin límite', ch.run('state.ideaDraft.limit') === false && ch.run('state.ideaDraft.min') === 3);
ch.run('setIdeaCategory("cultura")'); check('cultura: grupo pequeño (4)', ch.run('state.ideaDraft.limit') === true && ch.run('state.ideaDraft.max') === 4);
ch.run('setIdeaCategory("outdoor")');
const nIdeas = ch.run('IDEAS.length'); ch.run('publishIdea()'); check('sin título no se lanza', ch.run('IDEAS.length') === nIdeas);
set(ch, 'f-ititle', 'Ir a pescar al pantano'); set(ch, 'f-itext', 'Estoy pensando ir a pescar el sábado temprano. ¿Alguien se anima?'); set(ch, 'f-izone', 'Pantano de San Juan'); set(ch, 'f-imax', '4'); set(ch, 'f-imin', '6');
ch.run('publishIdea()'); check('el mínimo no puede pasar del máximo', ch.run('IDEAS.length') === nIdeas);
set(ch, 'f-imin', '3'); ch.run('publishIdea()');
const myIdea = ch.run('IDEAS[0]');
check('chispa lanzada con su configuración', myIdea.authorId === 'me' && myIdea.title === 'Ir a pescar al pantano' && myIdea.max === 4 && myIdea.min === 3 && myIdea.zone === 'Pantano de San Juan' && myIdea.status === 'abierta');
ch.run(`getIdea("${myIdea.id}").people.push({ userId:"nora", status:"si" }, { userId:"marco", status:"si" }); renderIdea("${myIdea.id}")`); h = ch.html('view-page'); rendered += h;
check('quien la lanza: llega al mínimo y puede confirmar el plan', h.includes('Ya sois 3') && h.includes('Confirmar el plan') && h.includes('Descartar'));
ch.run(`convertIdea("${myIdea.id}")`); ch.nav('crear-plan'); h = ch.html('view-page');
check('convertir: el plan sale relleno con la chispa', h.includes('Convirtiendo tu chispa en plan') && h.includes('value="Ir a pescar al pantano"'));
ch.run('publishPlan()');
const fromIdea = ch.run('PLANS[0]');
check('plan publicado (más opciones): con reserva; los apuntados, pendientes de confirmar', fromIdea.title === 'Ir a pescar al pantano' && fromIdea.joinType === 'apuntado' && fromIdea.joined === 0
  && ch.run(`getPlan("${fromIdea.id}").ideaInvites.filter(v => v.status === "pendiente").length`) === 2);
ch.run(`answerPlanInvite("${fromIdea.id}", "nora", true)`);
check('al confirmar, entra en el plan y en su chat', ch.run(`getPlan("${fromIdea.id}").joined`) === 1 && ch.run(`planChat("${fromIdea.id}").members.includes("nora")`) && !ch.run(`planChat("${fromIdea.id}").members.includes("marco")`));
ch.nav('chispa/' + myIdea.id);
check('la chispa ya es plan, con enlace', ch.run(`getIdea("${myIdea.id}").status`) === 'convertida' && ch.html('view-page').includes('¡Ya es un plan!') && ch.html('view-page').includes(`go('plan/${fromIdea.id}')`));
// Solicitud por defecto si está abierta a cualquiera
ch.run('state.ideaDraft = null'); ch.nav('crear-chispa');
check('abierta a cualquiera: "decido yo quién va" activado por defecto', ch.run('state.ideaDraft.approval') === true && ch.html('view-page').includes('recomendado si la abres a cualquiera'));
ch.run('setIdeaField("who", "amigos")'); check('con amigos o seguidores: entra directo', ch.run('state.ideaDraft.approval') === false);
ch.run('setIdeaField("who", "todos")'); check('vuelve a cualquiera: otra vez con solicitud', ch.run('state.ideaDraft.approval') === true);
ch.run('setIdeaField("approval", false); setIdeaField("who", "amigos"); setIdeaField("who", "todos")'); check('si lo cambias tú, se respeta', ch.run('state.ideaDraft.approval') === false);
// Confirmar el plan: solo lo que falta y quién pasa
ch.run('state.ideaDraft = null'); ch.nav('crear-chispa'); set(ch, 'f-ititle', 'Pachanga de fútbol'); set(ch, 'f-itext', '¿Partidillo el jueves?'); set(ch, 'f-izone', 'Parque del Oeste'); ch.run('setIdeaCategory("deporte")'); ch.run('publishIdea()');
const id2 = ch.run('IDEAS[0].id');
ch.run(`getIdea("${id2}").people.push({ userId:"nora", status:"si" }, { userId:"marco", status:"si" }, { userId:"lucia", status:"si" }); checkIdeaReady(getIdea("${id2}"))`);
check('al llegar al mínimo: aviso "¿lo hacemos?"', ch.run('NOTIFICATIONS[0].text').includes('¿lo hacemos? Confirma el plan'));
ch.run(`openConfirmIdea("${id2}")`); h = ch.html('overlay'); rendered += h;
check('confirmar el plan: solo día y hora, punto de encuentro y quién pasa (todos marcados)', h.includes('Día y hora') && h.includes('Punto de encuentro') && h.includes('Quién pasa al plan') && count(h, /class="switch on"/g) === 3 && h.includes('Más opciones'));
ch.run('toggleIdeaPick("lucia")'); set(ch, 'f-cdate', '2030-05-10T19:00'); set(ch, 'f-cmeet', 'Puerta del parque'); ch.run(`confirmIdeaPlan("${id2}")`);
const plc = ch.run('PLANS[0]');
check('plan creado con el día y el punto de encuentro; solo pasan los elegidos', plc.title === 'Pachanga de fútbol' && plc.meetPoint === 'Puerta del parque' && plc.ideaInvites.length === 2 && !plc.ideaInvites.some(v => v.userId === 'lucia') && ch.run(`getIdea("${id2}").status`) === 'convertida');
ch.nav('plan/' + plc.id); h = ch.html('view-detail'); rendered += h;
check('ficha del plan: punto de encuentro y quién ha confirmado', h.includes('Punto de encuentro: <b>Puerta del parque</b>') && h.includes('De la chispa') && h.includes('Por confirmar') && h.includes('Demo: pasan 24 h'));
ch.run(`answerPlanInvite("${plc.id}", "nora", true); expirePlanInvites("${plc.id}")`);
check('quien no confirma en 24 h pierde la plaza', ch.run(`getPlan("${plc.id}").ideaInvites.find(v => v.userId === "marco").status`) === 'caducada' && ch.run(`getPlan("${plc.id}").joined`) === 1);
// Automático
ch.run('state.ideaDraft = null'); ch.nav('crear-chispa'); set(ch, 'f-ititle', 'Paella en el río'); set(ch, 'f-itext', 'x'); set(ch, 'f-izone', 'Playa de Madrid Río');
ch.run('setIdeaField("when", "fecha")'); set(ch, 'f-idate', '2030-06-01T13:00'); ch.run('setIdeaField("auto", true); setIdeaField("approval", false)'); set(ch, 'f-ititle', 'Paella en el río'); set(ch, 'f-itext', 'x'); set(ch, 'f-izone', 'Playa de Madrid Río'); ch.run('publishIdea()');
const id3 = ch.run('IDEAS[0].id');
check('automática: solo con día concreto y zona', ch.run(`getIdea("${id3}").auto`) === true);
const nPlAuto = ch.run('PLANS.length'); ch.run(`getIdea("${id3}").people.push({ userId:"nora", status:"si" }, { userId:"marco", status:"si" }); checkIdeaReady(getIdea("${id3}"))`);
check('automática: al llegar al mínimo se hace plan sola y avisa', ch.run('PLANS.length') === nPlAuto + 1 && ch.run(`getIdea("${id3}").status`) === 'convertida' && ch.run('NOTIFICATIONS[0].text').includes('ya es plan'));
// Te apuntas a la chispa de otra persona y se hace plan: confirmas en 24 h
ch.nav('chispa/ch2'); ch.run('answerIdea("ch2", "si")');
check('al apuntarte y llegar al mínimo, quien la lanzó lo confirmará', ch.run('getIdea("ch2").simConfirm') === true);
ch.run('simulateAuthorConfirms("ch2")'); const plo = ch.run('getIdea("ch2").planId');
check('la chispa ya es plan: te pide confirmar que vas', ch.run('NOTIFICATIONS[0].text').includes('¿Vas? Confírmalo en 24 h') && !ch.run(`state.joined.has("${plo}")`));
ch.nav('plan/' + plo); h = ch.html('view-detail'); rendered += h;
check('ficha: "¿vas?" con "Sí, voy" y "No puedo"', h.includes('Ya es plan: ¿vas?') && h.includes('Sí, voy') && h.includes('No puedo'));
ch.run(`answerPlanInvite("${plo}", "me", true)`);
check('sí, voy: apuntado y en el chat del plan', ch.run(`state.joined.has("${plo}")`) && ch.run(`planChat("${plo}").members.includes("me")`) && !ch.html('view-detail').includes('Ya es plan: ¿vas?'));
ch.run('openReport("marco", null, { objectType:"chispa", ideaId:"ch1" })');
check('reportar una chispa', ch.html('overlay').includes('Reportar la chispa') && ch.html('overlay').includes('Se adjunta la chispa'));
ch.run('closeOverlay(); state.ideaDraft = null'); ch.nav('crear-chispa'); set(ch, 'f-ititle', 'Quedada'); set(ch, 'f-itext', 'Te voy a matar'); ch.run('publishIdea()');
check('el filtro automático también vale para las chispas', ch.run('IDEAS[0].held') === true && !ch.run('(() => { const x = IDEAS[0]; x.authorId = "lucia"; const v = canSeeIdea(x); x.authorId = "me"; return v; })()'));
const ch2 = createEnv(chs);
check('persisten las chispas y las respuestas', ch2.run(`getIdea("${myIdea.id}").status`) === 'convertida' && ch2.run('myIdeaStatus(getIdea("ch3"))') === 'si');

// --- Herramientas internas: panel de administración ---
const ads = {};
const ad = createEnv(ads);
ad.nav('ajustes'); h = ad.html('view-page');
check('ajustes ▸ Prototipo: entrada al panel de administración', h.includes("go('admin')") && h.includes('Panel de administración'));
ad.nav('admin'); h = ad.html('view-page'); rendered += h;
check('admin: pestañas usuarios, planes, negocios, categorías, moderación y registro', ['Resumen','Usuarios','Planes','Negocios','Categorías','Moderación','Registro'].every(t => h.includes(`<span>${t}</span>`)) && h.includes('Herramienta interna del equipo'));
check('admin: cifra principal (asistencias de la semana) con su variación', h.includes('Asistencias verificadas esta semana') && h.includes('<b>86</b>') && h.includes('+21 % frente a la semana anterior'));
check('admin: gráfico de columnas de una serie, con tabla y descripción accesible', h.includes('class="wk-chart"') && count(h, /class="wk-col"/g) === 4 && h.includes('aria-label="Asistencias verificadas por semana: 37, 55, 71, 86"') && h.includes('Ver como tabla') && count(h, /class="wk-val"/g) === 1);
const hyps = ad.run('pilotHypotheses()').map(x => x.status).join(',');
check('admin: hipótesis H1-H6 con el semáforo de plan-validacion-madrid', hyps === 'ambar,verde,ambar,verde,ambar,verde' && h.includes('st-warn') && h.includes('st-good') && h.includes('<span>Ajustar</span>') && h.includes('<span>Seguir</span>'));
ad.run('PILOT_STATS.registros = 120');
check('admin: H1 en rojo si no llega a 150 registros', ad.run('pilotHypotheses()[0].status') === 'rojo');
ad.run('PILOT_STATS.registros = 236; PILOT_STATS.incidentesGraves = 1');
check('admin: H6 en rojo con cualquier incidente grave', ad.run('pilotHypotheses()[5].status') === 'rojo');
ad.run('PILOT_STATS.incidentesGraves = 0');
check('admin: datos vivos de la demo', h.includes('Esta demo, ahora') && h.includes('Planes activos') && h.includes('Negocios por verificar'));
// Usuarios
ad.run("renderAdmin('usuarios')"); h = ad.html('view-page'); rendered += h;
check('admin ▸ usuarios: lista con verificación y estado', h.includes('Marco') && h.includes('Verificada') && h.includes('Activa'));
ad.run("state.adminQ = 'luc'; renderAdminList()");
check('admin ▸ usuarios: buscar', ad.html('adm-list').includes('Lucía') && !ad.html('adm-list').includes('Marco'));
ad.run("openAdminUser('marco')"); h = ad.html('overlay');
check('admin ▸ ficha: datos, nota interna y acciones', h.includes('Nota interna') && h.includes('Revocar la verificación') && h.includes('Suspender 7 días'));
set(ad, 'f-anote', 'Habla con soporte el lunes'); ad.run("saveAdminNote('marco')");
ad.run("adminSetVerified('marco', false)");
check('admin: revocar la verificación', ad.run('getUser("marco").verified') === false && ad.html('overlay').includes('Dar por verificada'));
ad.run("adminSuspend('marco', true)");
check('admin: suspender 7 días (usa el estado de moderación)', ad.run('isSanctioned("marco")') === true && ad.html('overlay').includes('Reactivar la cuenta'));
ad.run("adminSuspend('marco', false)");
check('admin: reactivar', ad.run('isSanctioned("marco")') === false);
// Planes
ad.run("closeOverlay(); state.adminPlanFilter = 'pago'; renderAdmin('planes')"); h = ad.html('view-page');
const nPaid = ad.run('PLANS.filter(p => p.paid).length');
check('admin ▸ planes: filtro de pago', count(h, /class="adm-row"/g) === nPaid);
const featId = ad.run('PLANS.filter(p => !p.paid && !isCancelled(p) && p.when > Date.now()).slice(-1)[0].id');
ad.run(`adminPlan("${featId}", "destacar")`); ad.run('state.filtersOpen = false'); ad.nav('feed'); ad.run("setContentTab('disponibles')");
check('admin: destacar un plan lo pone el primero en Descubrir', ad.run('filteredPlans().sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))[0].id') === featId && ad.html('feed-list').includes('Destacado'));
ad.run(`adminPlan("${featId}", "retirar")`);
check('admin: retirar un plan lo quita de Descubrir', !ad.run('filteredPlans()').some(p => p.id === featId) && ad.run(`planAdminState(getPlan("${featId}"))`) === 'Retirado');
ad.run(`adminPlan("${featId}", "restaurar")`);
const payPlan = ad.run("PAYMENTS.find(x => !x.past && x.status === 'retenido').planId");
ad.run(`adminPlan("${payPlan}", "cancelar")`);
check('admin: cancelar un plan de pago reembolsa a todos', ad.run(`isCancelled(getPlan("${payPlan}"))`) && ad.run(`PAYMENTS.filter(x => x.planId === "${payPlan}" && !x.past).every(x => x.status === 'reembolsado')`));
// Negocios
ad.run("renderAdmin('negocios')"); h = ad.html('view-page'); rendered += h;
check('admin ▸ negocios: cola con documentos y lugar reclamado', h.includes('Bar La Parra') && h.includes('Reclama el lugar') && h.includes('Titularidad del local') && h.includes('Pedir documentos') && h.includes('<em>3</em>'));
check('el lugar aún no está verificado', ad.run('getPlace("clamores").verified') === false);
ad.run("decideBiz('bv4', 'aprobar')");
check('admin: verificar un negocio que reclama un lugar lo marca como suyo', ad.run('BIZ_VERIFICATIONS.find(b => b.id === "bv4").status') === 'verificado' && ad.run('getPlace("clamores").verified') === true);
ad.run("decideBiz('bv3', 'documentos')");
check('admin: pedir los documentos que faltan', ad.run('BIZ_VERIFICATIONS.find(b => b.id === "bv3").status') === 'faltan_documentos' && ad.run('BIZ_VERIFICATIONS.find(b => b.id === "bv3").note').includes('Licencia de actividad'));
ad.run("decideBiz('bv2', 'rechazar')");
check('admin: rechazar', ad.run('BIZ_VERIFICATIONS.find(b => b.id === "bv2").status') === 'rechazado');
const nBiz = ad.run('BIZ_VERIFICATIONS.length');
ad.run("state.draftProfile = null"); ad.nav('nuevo-perfil'); set(ad, 'f-npname', 'Taller Barro'); set(ad, 'f-npuser', 'tallerbarro'); set(ad, 'f-npcat', 'Cultura'); ad.run('createProfile()');
check('crear un perfil profesional lo pone en la cola de verificación', ad.run('BIZ_VERIFICATIONS.length') === nBiz + 1 && ad.run('BIZ_VERIFICATIONS.slice(-1)[0].name') === 'Taller Barro' && ad.run('BIZ_VERIFICATIONS.slice(-1)[0].status') === 'pendiente');
// Categorías
ad.run("renderAdmin('categorias')"); h = ad.html('view-page'); rendered += h;
check('admin ▸ categorías: lista con recuento de planes', h.includes('Outdoor') || h.includes('planes · Activa'));
set(ad, 'f-newcat', 'Juegos de mesa'); ad.run('addCategory()');
check('admin: crear una categoría (sale al crear un plan y en los filtros)', ad.run('activeCategories().some(c => c.id === "juegos-de-mesa")') && ad.html('feed-filters').includes('Juegos de mesa'));
ad.run("openCatEdit('juegos-de-mesa')"); set(ad, 'f-catname', 'Juegos'); ad.run("catAction('juegos-de-mesa', 'renombrar')");
check('admin: renombrar', ad.run('getCategory("juegos-de-mesa").label') === 'Juegos');
const nViaj = ad.run('PLANS.filter(p => p.category === "viajeros").length'), nSoc = ad.run('PLANS.filter(p => p.category === "social").length');
ad.run("openCatEdit('viajeros')"); set(ad, 'f-catinto', 'social'); ad.run("catAction('viajeros', 'fusionar')");
check('admin: fusionar mueve los planes y la quita de los filtros', ad.run('PLANS.filter(p => p.category === "social").length') === nViaj + nSoc && !ad.run('activeCategories().some(c => c.id === "viajeros")') && !ad.html('feed-filters').includes('data-v="viajeros"'));
ad.run("catAction('juegos-de-mesa', 'jubilar')");
check('admin: jubilar (deja de salir al crear)', !ad.run('activeCategories().some(c => c.id === "juegos-de-mesa")'));
ad.run("state.ideaDraft = null"); ad.nav('crear-chispa');
check('las chispas usan las categorías activas', !ad.html('view-page').includes("setIdeaCategory('viajeros')") && ad.html('view-page').includes("setIdeaCategory('social')"));
// Moderación y registro
ad.run("renderAdmin('moderacion')"); h = ad.html('view-page');
check('admin ▸ moderación: resumen y acceso al panel', h.includes('En cola') && h.includes('Abrir el panel de moderación'));
ad.run("renderAdmin('registro')"); h = ad.html('view-page'); rendered += h;
check('admin ▸ registro: cada acción con quién y qué', ['Nota interna','Verificación revocada','Suspende la cuenta 7 días','Destaca el plan','Cancela el plan','Verifica el negocio','Fusiona la categoría','Jubila la categoría'].every(t => h.includes(t)) && h.includes('Tú (admin)'));
const ad2 = createEnv(ads);
check('persiste lo del equipo (categorías, negocios, verificación, registro)', ad2.run('getCategory("juegos-de-mesa").label') === 'Juegos' && !ad2.run('activeCategories().some(c => c.id === "viajeros")') && ad2.run('getPlace("clamores").verified') === true
  && ad2.run('getUser("marco").verified') === false && ad2.run('ADMIN_LOG.length') >= 10 && ad2.run('BIZ_VERIFICATIONS.find(b => b.id === "bv3").status') === 'faltan_documentos');

// --- Agenda: calendario de tus planes (día, semana, mes y año) ---
const ags = {};
const ag = createEnv(ags);
ag.nav('notificaciones'); h = ag.html('view-page'); rendered += h;
check('notificaciones: acceso a la agenda (tarjeta y botón)', h.includes('Tu agenda') && h.includes("go('agenda')") && h.includes('Próximo: ') && h.includes('aria-label="Agenda"'));
ag.nav('agenda'); h = ag.html('view-page'); rendered += h;
check('agenda: vistas de día, semana, mes y año (semana por defecto)', ['Día','Semana','Mes','Año'].every(t => h.includes(`<span>${t}</span>`)) && h.includes('aria-selected="true" onclick="agSet(\'semana\')"') && count(h, /class="ag-wd /g) === 7 && h.includes('>Hoy<'));
const k9 = ag.run('dayKey(getPlan("p9").when)');
ag.nav('agenda/dia/' + k9); h = ag.html('view-page'); rendered += h;
check('agenda ▸ día: el plan al que vas, en su hora, con lugar y estado', h.includes('class="ag-day"') && h.includes('Cata de vinos naturales') && h.includes('<em>Vas</em>') && h.includes('class="ag-hr"'));
const d0 = ag.run('dayKey(state.agDate)'); ag.run('agStep(1)');
check('agenda: siguiente día', ag.run('dayKey(state.agDate)') === ag.run(`dayKey(addDays(parseDay("${d0}"), 1))`));
ag.run('state.requested.add("p6"); getPlan("p10").hostId = "me"; getPlan("p11").waitlist = ["me"]; state.joined.add("p12"); getPlan("p12").status = "cancelado"');
check('agenda: qué entra (vas, organizas, solicitud, lista de espera, cancelado)', ag.run('planAgendaKind(getPlan("p9"))') === 'vas' && ag.run('planAgendaKind(getPlan("p10"))') === 'organizas'
  && ag.run('planAgendaKind(getPlan("p6"))') === 'solicitud' && ag.run('planAgendaKind(getPlan("p11"))') === 'espera' && ag.run('planAgendaKind(getPlan("p12"))') === 'cancelado' && ag.run('planAgendaKind(getPlan("p4"))') === null);
check('agenda: tu historial (fuiste y cancelaste)', ag.run('agendaItems().filter(i => i.kind === "asististe").length') === 8 && ag.run('agendaItems().filter(i => i.id.startsWith("h-") && i.kind === "cancelado").length') === 1);
ag.nav('agenda/mes/' + k9); h = ag.html('view-page'); rendered += h;
check('agenda ▸ mes: cuadrícula con puntos y los planes del día elegido', h.includes('class="ag-grid"') && count(h, /class="ag-cell/g) % 7 === 0 && h.includes('Cata de vinos naturales') && h.includes('Ver el día') && h.includes('k-firm'));
ag.run('state.agView = "semana"'); ag.nav('agenda/semana/' + ag.run('dayKey(getPlan("p6").when)')); h = ag.html('view-page');
check('agenda ▸ semana: lo pendiente se distingue (solicitud enviada)', h.includes('Solicitud enviada') && h.includes('ag-row k-pend'));
const kh = ag.run('dayKey(AGENDA_HISTORY[2].when)');
ag.nav('agenda/ano/' + kh); h = ag.html('view-page'); rendered += h;
check('agenda ▸ año: doce meses con los días con plan marcados', count(h, /class="ag-mini"/g) === 12 && h.includes('class="on') && h.includes('Agenda'));
ag.run(`agSet('mes', '${kh}')`);
check('agenda: del año al mes', ag.run('state.agView') === 'mes' && ag.html('view-page').includes('Rooftop Sunset Sessions · edición de septiembre'));
ag.run('state.ideaDraft = null'); ag.nav('crear-chispa'); set(ag, 'f-ititle', 'Barbacoa en la sierra'); set(ag, 'f-itext', 'x'); set(ag, 'f-izone', 'Cercedilla');
ag.run('setIdeaField("when", "fecha")'); set(ag, 'f-idate', '2030-07-04T13:00'); set(ag, 'f-ititle', 'Barbacoa en la sierra'); set(ag, 'f-itext', 'x'); set(ag, 'f-izone', 'Cercedilla'); ag.run('publishIdea()');
check('agenda: las chispas con día también aparecen', ag.run('agendaItems().some(i => i.kind === "chispa" && i.title === "Barbacoa en la sierra")'));
ag.nav('plan/p9'); h = ag.html('view-detail');
check('ficha del plan: ver en tu agenda y añadir al calendario del móvil', h.includes(`go('agenda/dia/${k9}')`) && h.includes('Añadir al calendario del móvil'));
const ics = ag.run('icsText(agendaItems().filter(i => i.planId === "p9" || i.planId === "p6"))');
check('.ics: calendario válido (UTC, CRLF, escapado, líneas cortas, aviso 2 h antes)', ics.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0') && ics.trim().endsWith('END:VCALENDAR') && count(ics, /BEGIN:VEVENT/g) >= 2
  && /DTSTART:\d{8}T\d{6}Z/.test(ics) && ics.includes('TRIGGER:-PT2H') && ics.includes('STATUS:TENTATIVE') && ics.includes('STATUS:CONFIRMED') && ics.split('\r\n').every(l => l.length <= 75) && !/\r?\n(?!\s|[A-Z-]+[:;]|$)/.test(ics.replace(/\r\n/g, '\n').replace(/\n /g, '')));
check('.ics: escapa comas y punto y coma', ag.run('icsEscape("a, b; c")') === 'a\\, b\\; c');
ag.run('openAgendaExport()'); h = ag.html('overlay');
const tok = ag.run('calToken()');
check('suscripción: dirección webcal personal y revocable', h.includes('webcal://planes.app/agenda/' + tok + '.ics') && h.includes('Revocar la dirección'));
ag.run('revokeCalFeed()');
check('revocar cambia la dirección', ag.run('calToken()') !== tok);
const ag2 = createEnv(ags);
check('persiste la dirección del calendario', ag2.run('ME.calToken') === ag.run('ME.calToken'));
ag.run('delete getPlan("p10").hostId; freshWorld()');
check('cuenta nueva: agenda vacía', ag.run('agendaItems().filter(i => i.kind !== "chispa").length') === 0);

// --- Novedades del plan: registro de cambios y avisos, con notificación a los apuntados ---
const nvs = {};
const nv = createEnv(nvs);
nv.nav('plan/p9'); h = nv.html('view-detail'); rendered += h;
check('ficha: sección Novedades con los cambios y avisos del anfitrión', h.includes('id="novedades"') && h.includes('<h4>Novedades') && h.includes('Habrá algo de picar') && h.includes('Cambio de fecha u hora') && h.includes('Vinos Vivos ·'));
check('novedades: marca lo que no habías visto', count(h, /class="upd-new"/g) === 1 && h.includes('1 sin ver'));
nv.nav('feed'); nv.nav('plan/p9'); h = nv.html('view-detail');
check('novedades: al volver, ya vistas', !h.includes('class="upd-new"') && !h.includes('sin ver'));
const nN = nv.run('NOTIFICATIONS.length');
nv.run('demoHostUpdate("p9")'); h = nv.html('view-detail');
check('cambio de hora del anfitrión: novedad, notificación y chat', nv.run('planUpdates(getPlan("p9"))[0].type') === 'fecha' && nv.run('NOTIFICATIONS.length') === nN + 1
  && nv.run('NOTIFICATIONS[0].text').startsWith('Cata de vinos naturales · cambio de fecha u hora: Nueva fecha:') && nv.run('NOTIFICATIONS[0].planId') === 'p9' && nv.run('planChat("p9").messages.slice(-1)[0].text').startsWith('Cambio de fecha u hora'));
check('cambio de hora: hay que volver a reconfirmar y la agenda se mueve', !nv.run('state.reconfirmed.has("p9")') && nv.run('agendaItems().find(i => i.planId === "p9").start.getTime()') === nv.run('new Date(getPlan("p9").when).getTime()'));
nv.run('ME.notifPrefs = Object.assign(notifPrefs(), { cambio:false })');
const nN2 = nv.run('NOTIFICATIONS.length');
nv.run('addPlanUpdate(getPlan("p9"), "aviso", "Traed chaqueta", { by:"host" })');
check('con las novedades desactivadas no llegan los avisos…', nv.run('NOTIFICATIONS.length') === nN2);
nv.run('addPlanUpdate(getPlan("p9"), "lugar", "Nuevo lugar: Sala Clamores, planta baja.", { by:"host" })');
check('…pero los cambios de lugar, hora y las cancelaciones llegan siempre', nv.run('NOTIFICATIONS.length') === nN2 + 1);
nv.run('addPlanUpdate(getPlan("p8"), "aviso", "Traed esterilla", { by:"host" })');
check('a quien no va al plan no le llegan', nv.run('NOTIFICATIONS.length') === nN2 + 1);
nv.run('getPlan("p8").waitlist = ["me"]; addPlanUpdate(getPlan("p8"), "fecha", "Nueva fecha: domingo.", { by:"host" })');
check('los cambios importantes también llegan a la lista de espera', nv.run('NOTIFICATIONS.length') === nN2 + 2);
nv.nav('plan/p9'); h = nv.html('view-detail');
check('novedades: se muestran 3 y "Ver todas"', count(h, /class="upd /g) === 3 && h.includes('Ver todas ('));
nv.run('state.updAll = "p9"; renderDetail("p9")');
check('ver todas', count(nv.html('view-detail'), /class="upd /g) === nv.run('planUpdates(getPlan("p9")).length'));
// El anfitrión publica una novedad
nv.nav('crear'); nv.run("setDraft('access','libre')"); set(nv, 'f-title', 'Paseo nocturno por el Retiro'); set(nv, 'f-desc', 'Ruta tranquila.'); nv.run('publishPlan()');
const hp = nv.run('PLANS[0].id');
nv.nav('plan/' + hp); h = nv.html('view-detail');
check('anfitrión: Novedades vacía con "Publicar una novedad"', h.includes('Aún no hay novedades') && h.includes('Publicar una novedad'));
nv.run(`openPlanUpdate("${hp}")`); set(nv, 'f-upd', 'Traed linterna: la vuelta es de noche'); nv.run(`publishPlanUpdate("${hp}")`);
check('anfitrión: publicar una novedad (en Novedades y en el chat)', nv.run(`planUpdates(getPlan("${hp}"))[0].text`) === 'Traed linterna: la vuelta es de noche' && nv.run(`planUpdates(getPlan("${hp}"))[0].by`) === 'me' && nv.html('view-detail').includes('Traed linterna'));
nv.run(`openPlanUpdate("${hp}")`); set(nv, 'f-upd', 'Te voy a matar'); nv.run(`publishPlanUpdate("${hp}")`);
check('el filtro también vale para las novedades', nv.run(`planUpdates(getPlan("${hp}")).length`) === 1);
nv.nav('editar-plan/' + hp); set(nv, 'f-edate', '2030-06-20T21:30'); set(nv, 'f-enote', 'Por el calor, mejor más tarde.'); nv.run(`saveEditPlan("${hp}")`);
check('editar la hora con explicación: queda el antes, el después y el motivo', nv.run(`planUpdates(getPlan("${hp}"))[0].text`).includes('(antes: ') && nv.run(`planUpdates(getPlan("${hp}"))[0].text`).endsWith('Por el calor, mejor más tarde.'));
nv.run(`confirmCancelPlan("${hp}")`);
check('cancelar el plan queda en Novedades', nv.run(`planUpdates(getPlan("${hp}"))[0].type`) === 'cancelado');
nv.run('state.joined.add("p11"); adminPlan("p11", "cancelar")');
check('cancelación del equipo: novedad y aviso a quien va', nv.run('planUpdates(getPlan("p11"))[0].by') === 'equipo' && nv.run('NOTIFICATIONS[0].text').startsWith('Mercado de diseño independiente · plan cancelado'));
const nv2 = createEnv(nvs);
check('persisten las novedades y lo visto', nv2.run(`planUpdates(getPlan("${hp}")).length`) === 3 && nv2.run('ME.seenUpdates.p9') > 0);

// --- Recordatorios de los planes a los que vas ---
const rms = {};
const rm = createEnv(rms);
check('recordatorios: el del día antes de la cata no se repite al abrir', rm.run('NOTIFICATIONS.filter(n => n.type === "recordatorio" && n.planId === "p9").length') === 1);
const nR = rm.run('NOTIFICATIONS.length');
rm.run('getPlan("p1").when = new Date(Date.now() + 5 * 3600000); state.joined.add("p1"); checkReminders()');
check('apuntarse a un plan de hoy: llega solo el recordatorio más cercano (el del día)', rm.run('NOTIFICATIONS.length') === nR + 1 && /^(Hoy|Mañana) a las/.test(rm.run('NOTIFICATIONS[0].text')) && rm.run('NOTIFICATIONS[0].text').includes('Reconfirma que vas') && rm.run('NOTIFICATIONS[0].planId') === 'p1');
rm.run('checkReminders()');
check('cada recordatorio se envía una vez', rm.run('NOTIFICATIONS.length') === nR + 1);
rm.run('getPlan("p1").when = new Date(Date.now() + 90 * 60000); checkReminders()');
check('2 h antes: lugar y QR de llegada', rm.run('NOTIFICATIONS.length') === nR + 2 && /^En (1 h|2 h|90 min): El himno de la Victoria · Vermutería Victoria\. Al llegar, registra tu llegada/.test(rm.run('NOTIFICATIONS[0].text')));
rm.run('getPlan("p1").when = new Date(Date.now() + 10 * 60000); checkReminders()');
check('al empezar (15 min antes)', rm.run('NOTIFICATIONS.length') === nR + 3 && rm.run('NOTIFICATIONS[0].text').startsWith('Empieza en 10 min: El himno de la Victoria'));
rm.run('addPlanUpdate(getPlan("p1"), "fecha", "Nueva fecha: más tarde.", { by:"host" }); getPlan("p1").when = new Date(Date.now() + 100 * 60000); checkReminders()');
check('si cambia la hora, los recordatorios se vuelven a programar', rm.run('NOTIFICATIONS[0].text').startsWith('En ') && rm.run('NOTIFICATIONS[0].type') === 'recordatorio');
rm.run('getPlan("p10").hostId = "me"; getPlan("p10").when = new Date(Date.now() + 100 * 60000); checkReminders()');
check('quien organiza también recibe los suyos', rm.run('NOTIFICATIONS[0].text').includes('empieza Running club al anochecer. Ten a mano el QR de llegada'));
rm.run('openNotifPrefs()'); h = rm.html('overlay');
check('preferencias: recordatorios el día antes, 2 h antes y al empezar', h.includes('Recordatorios de tus planes') && h.includes('El día antes') && h.includes('2 horas antes') && h.includes('Al empezar') && h.includes("toggleReminderPref('horas')"));
rm.run("toggleReminderPref('horas')"); const nR2 = rm.run('NOTIFICATIONS.length');
rm.run('getPlan("p2").when = new Date(Date.now() + 100 * 60000); state.joined.add("p2"); checkReminders()');
check('sin el de 2 h antes, no llega (pero queda como enviado)', rm.run('NOTIFICATIONS.length') === nR2 && rm.run('ME.remindersSent.p2.horas') === true);
const nR6 = rm.run('NOTIFICATIONS.length'); rm.run('getPlan("p6").when = new Date(Date.now() + 100 * 60000); checkReminders()');
check('a los planes a los que no vas no llegan', rm.run('NOTIFICATIONS.length') === nR6);
rm.nav('plan/p9'); h = rm.html('view-detail');
check('ficha: demo del recordatorio de 2 h antes', h.includes("demoReminder('p9')"));
rm.run("toggleReminderPref('horas'); demoReminder('p9')");
check('demo: llega el recordatorio de 2 h antes', rm.run('NOTIFICATIONS[0].planId') === 'p9' && rm.run('NOTIFICATIONS[0].text').startsWith('En 2 h: Cata de vinos naturales · Sala Clamores'));
const rm2 = createEnv(rms);
check('persiste qué recordatorios se han enviado', rm2.run('ME.remindersSent.p1.horas') === true && rm2.run('ME.remindersSent.p10.horas') === true && rm2.run('reminderPrefs().horas') === true);

// --- Planes por videollamada: públicos o privados, con o sin comentarios, unirse libre o con aprobación ---
const vcs = {};
const vc = createEnv(vcs);
vc.nav('feed'); vc.run("setContentTab('disponibles')"); h = vc.html('feed-list');
check('feed: planes por videollamada, con "En directo" el que está en marcha', h.includes('Videollamada') && h.includes('En directo') && h.includes('Online'));
check('privada: la ves porque estás apuntada', vc.run('filteredPlans().some(p => p.id === "p15")'));
vc.run('state.joined.delete("p15")');
check('privada: si no estás dentro, no sale en Descubrir ni en la búsqueda', !vc.run('filteredPlans().some(p => p.id === "p15")') && !vc.run('JSON.stringify(searchAll("lectura"))').includes('p15'));
vc.run('state.joined.add("p15")');
vc.run("state.mode = 'online'");
check('filtro "Dónde": solo videollamadas', vc.run('filteredPlans().every(p => isOnline(p))') && vc.run('filteredPlans().length') === 3 && vc.run('activeFilters().some(f => f[2] === "Videollamada")'));
vc.run('clearFilters()');
check('quitar filtros también quita "Dónde"', vc.run('state.mode') === 'todos');
vc.nav('plan/p13'); h = vc.html('view-detail'); rendered += h;
check('ficha: la videollamada (pública, comentarios, quién se une, duración) y en directo', h.includes('<h4>La videollamada</h4>') && h.includes('Con comentarios') && h.includes('Con aprobación del anfitrión, hasta 8 personas') && h.includes('En directo ahora') && h.includes('No se graba') && h.includes('Videollamada · Pública con comentarios'));
check('ficha: sin lugar, sin QR ni chinchetas; botón "Ver en directo"', !h.includes('<h4>Lugar</h4>') && !h.includes('QR del anfitrión.') && h.includes('Ver en directo'));
vc.run('enterCall("p13", true)'); vc.nav('sala/p13'); h = vc.html('view-page'); rendered += h;
check('sala como espectador: escenario, comentarios y "Pedir unirme"', vc.run('state.call.role') === 'espectador' && h.includes('class="room-stage') && h.includes('Estás mirando') && h.includes('Pedir unirme') && h.includes('A mí me funcionó') && h.includes('Comenta'));
set(vc, 'call-msg', 'Muy buen tema'); vc.run('sendCallComment("p13")');
check('comentar en directo', vc.run('getPlan("p13").callComments.slice(-1)[0].text') === 'Muy buen tema' && vc.run('getPlan("p13").callComments.slice(-1)[0].userId') === 'me');
const nCm = vc.run('getPlan("p13").callComments.length'); set(vc, 'call-msg', 'Te voy a matar'); vc.run('sendCallComment("p13")');
check('los comentarios pasan por los filtros', vc.run('getPlan("p13").callComments.length') === nCm);
vc.run('askJoinCall("p13")');
check('con aprobación: espera a que el anfitrión le deje entrar', vc.run('state.call.asked') === true && vc.html('view-page').includes('Esperando al anfitrión'));
vc.run('admitMe(getPlan("p13"))'); h = vc.html('view-page');
check('dentro de la llamada: micro, cámara, mano y salir', vc.run('state.call.role') === 'participante' && vc.run('state.joined.has("p13")') && h.includes('<span>Micro</span>') && h.includes('<span>Cámara</span>') && h.includes('<span>Mano</span>') && h.includes('Tú'));
vc.run("toggleCall('mic'); toggleCall('hand')"); h = vc.html('view-page');
check('silenciarse y levantar la mano', vc.run('state.call.mic') === false && vc.run('state.call.hand') === true && h.includes('class="tile-hand"'));
vc.run('demoCallTime("p13"); leaveCall()');
check('10 minutos en la llamada cuentan como asistencia', vc.run('state.attended.has("p13")') && vc.run('state.call') === null);
vc.run('getPlan("p14").when = new Date(Date.now() - 60000)'); vc.nav('plan/p14');
check('pública sin comentarios, libre: "Ver en directo"', vc.html('view-detail').includes('Sin comentarios') && vc.html('view-detail').includes('Cualquiera, hasta 12 personas'));
vc.run('enterCall("p14", true)'); vc.nav('sala/p14'); h = vc.html('view-page');
check('sin comentarios: no se puede escribir; unirse sin esperar', h.includes('Comentarios desactivados') && !h.includes('id="call-msg"') && h.includes('Unirme a la llamada'));
vc.run('askJoinCall("p14")');
check('libre: entras directamente si hay sitio', vc.run('state.call.role') === 'participante' && vc.run('state.joined.has("p14")'));
vc.nav('feed');
check('al salir de la sala se cuelga', vc.run('state.call') === null);
vc.run('state.joined.delete("p15"); getPlan("p15").when = new Date(Date.now() - 60000); enterCall("p15", true)');
check('privada: no se puede mirar desde fuera', vc.run('state.call') === null);
vc.run('state.joined.add("p15")');
check('recordatorios y agenda de una videollamada', vc.run('reminderText(getPlan("p15"), "horas", 7200000)').includes('por videollamada') && vc.run('agWhere(getPlan("p15"))') === 'Videollamada');
// Crear una videollamada privada con aprobación
vc.run("state.draft = Object.assign(state.draft, { mode:'presencial', ovis:'publica', ocom:'si', ojoin:'libre' })"); vc.nav('crear-plan'); h = vc.html('view-page');
check('crear: "Dónde" (en persona o videollamada) y sus opciones', h.includes('En persona') && h.includes('Videollamada') && h.includes('Quién la ve') && h.includes('Comentarios de quien mira') && h.includes('Quién se une a la llamada') && h.includes('Límite de personas en la llamada'));
vc.run("setDraft('mode','online'); setDraft('ovis','privada'); setDraft('ojoin','aprobacion')"); set(vc, 'f-olimit', '5'); set(vc, 'f-odur', '45'); set(vc, 'f-title', 'Tertulia de cine'); set(vc, 'f-desc', 'Hablamos de pelis.');
vc.run('publishPlan()'); const vp = vc.run('PLANS[0]');
check('publicar: privada, sin comentarios, con aprobación, límite y duración', vp.title === 'Tertulia de cine' && vp.placeId === null && vp.online.visibility === 'privada' && vp.online.comments === false && vp.online.join === 'aprobacion' && vp.groupMax === 5 && vp.approval === 'manual' && vp.durationMin === 45);
check('portada: las videollamadas de ejemplo tienen foto; sin foto, una de videollamada o del tema', vc.run('["p13","p14","p15"].every(id => !!getPlan(id).photo)') && vc.run(`planCover(getPlan("${vp.id}"))`) === vc.run('ONLINE_COVER')
  && vc.run('planCover({ category:"gastro" })') === vc.run('getPlan("p1").photo') && vc.run('planCover({ category:"nueva" })') === vc.run('DEFAULT_COVER'));
check('privada: no tiene página pública con vista previa', vc.run(`postIsPublic(getPlan("${vp.id}"))`) === false && vc.run('postIsPublic(getPlan("p14"))') === true);
vc.run(`getPlan("${vp.id}").when = new Date(Date.now() - 60000); enterCall("${vp.id}")`); vc.nav('sala/' + vp.id); h = vc.html('view-page');
check('anfitrión: entra y puede gestionar', vc.run('state.call.role') === 'participante' && h.includes('Gestionar'));
vc.run(`state.call.lobby.push("nora"); openCallManage("${vp.id}")`); h = vc.html('overlay');
check('gestionar: quién quiere unirse, quién está, comentarios y finalizar', h.includes('Quieren unirse') && h.includes('Nora V.') && h.includes('Finalizar para todos'));
vc.run(`callLobby("${vp.id}", "nora", true)`);
check('dejar entrar', vc.run('state.call.admitted.includes("nora")') && vc.run(`getPlan("${vp.id}").joined`) === 1);
vc.run(`callMod("${vp.id}", "nora", "expulsar")`);
check('sacar de la llamada', vc.run('state.call.kicked.includes("nora")') && vc.run(`getPlan("${vp.id}").joined`) === 0);
vc.run(`endCall("${vp.id}")`); vc.nav('plan/' + vp.id);
check('finalizar para todos', vc.run(`getPlan("${vp.id}").callEnded`) === true && vc.html('view-detail').includes('La videollamada ha terminado'));
const vc2 = createEnv(vcs);
check('persisten las videollamadas y sus comentarios', vc2.run(`getPlan("${vp.id}").online.visibility`) === 'privada' && vc2.run('getPlan("p13").callComments.some(m => m.text === "Muy buen tema")'));

const pdir0 = path.join(__dirname, '..', 'prototipo');
// --- Compartir: web pública con vista previa, enlaces que abren la app y menú nativo ---
const wdir = path.join(__dirname, '..', 'prototipo', 'web');
const wread = (f) => { try { return fs.readFileSync(path.join(wdir, f), 'utf8'); } catch (err) { return ''; } };
const sh = createEnv({});
let wp = wread('plan/p2.html');
check('web: página del plan con etiquetas Open Graph y Twitter (imagen 1200×630)', ['og:title', 'og:description', 'og:image" content="https://images.unsplash.com/', 'og:image:width" content="1200"', 'twitter:card" content="summary_large_image"', 'og:locale" content="es_ES"'].every((x) => wp.includes(x)));
check('web: "Abrir en la app" lleva a la misma pantalla de la app', wp.includes('href="../../standalone.html#/plan/p2"') && wp.includes("display-mode: standalone"));
const webGen = require('./build-web.js');
check('web: plan íntimo en un lugar público, sin el sitio exacto; en un negocio, con él', webGen.planWhere({ groupMax:6, placeId:'debod' }) === 'Zona aproximada · Madrid'
  && webGen.planWhere({ groupMax:6, placeId:'clamores' }) === 'Sala Clamores · Madrid' && webGen.planWhere({ groupMax:30, placeId:'debod' }) === 'Templo de Debod · Madrid');
check('web: lo generado coincide con prototipo/web/ (node scripts/build-web.js)', Object.entries(webGen.files).every(([f, c]) => wread(f) === c));
const secretPlan = sh.run('(PLANS.find(p => p.secret) || {}).id');
check('web: plan secreto, sin el sitio', !secretPlan || wread(`plan/${secretPlan}.html`).includes('Zona aproximada'));
const pubPosts = sh.run('POSTS.filter(po => postIsPublic(po)).map(po => po.id)');
const privPosts = sh.run('POSTS.filter(po => !postIsPublic(po)).map(po => po.id)');
check('web: una página por publicación pública y ninguna de las privadas', pubPosts.every((id) => wread(`p/${id}.html`).includes('og:image')) && privPosts.length > 0 && privPosts.every((id) => !wread(`p/${id}.html`)));
wp = wread('u/irenec.html');
check('web: perfil privado sin publicaciones', wp.includes('Esta cuenta es privada') && !wp.includes('w-grid') && wp.includes('Cuenta privada'));
check('web: perfil público con sus publicaciones', wread('u/lucia.html').includes('w-grid') && wread('u/lucia.html').includes('#/u/lucia'));
check('web: página genérica para lo creado en la demo y portada', wread('abrir.html').includes("standalone.html#/' + r") && wread('index.html').includes('plan/p2.html'));
let aasa = null, alinks = null; try { aasa = JSON.parse(wread('.well-known/apple-app-site-association')); alinks = JSON.parse(wread('.well-known/assetlinks.json')); } catch (err) {}
check('web: asociación de dominio para universal links (iOS) y App Links (Android)', !!aasa && aasa.applinks.details[0].components.some((c) => c['/'] === '/plan/*') && !!alinks && alinks[0].target.package_name && alinks[0].relation[0].includes('handle_all_urls'));
check('web: la web pública no tiene emojis', !/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u.test(['plan/p2.html', 'u/lucia.html', 'abrir.html', 'index.html'].map(wread).join('')));
check('enlace sin web publicada: dominio de la app', sh.run('postUrl(getPlan("p2"))') === 'https://planes.app/plan/p2' && sh.run('postUrl(getUser("lucia"))') === 'https://planes.app/u/lucia');
sh.run('Object.assign(location, { protocol:"https:", hostname:"diego.github.io", origin:"https://diego.github.io", pathname:"/RED-SOCIAL/prototipo/standalone.html" })');
const WB = 'https://diego.github.io/RED-SOCIAL/prototipo/web/';
check('enlace con la web publicada: lleva a su página', sh.run('postUrl(getPlan("p2"))') === WB + 'plan/p2.html' && sh.run('postUrl(POSTS.find(p => p.id === "po8"))') === WB + 'p/po8.html' && sh.run('postUrl(ME)') === WB + 'u/marina.html');
const seedUrls = sh.run('[...PLANS.filter(p => !isPrivateCall(p)), ...POSTS.filter(postIsPublic), ...USERS.filter(u => !u.managedBy)].map(postUrl)');
check('cada enlace de los datos de ejemplo tiene su página generada', seedUrls.every((u) => u.startsWith(WB) && !u.includes('abrir.html') && fs.existsSync(path.join(wdir, u.slice(WB.length)))));
sh.run('POSTS.unshift({ id:"npo1", authorId:"me", kind:"foto", imgs:[], media:["g-dark"], caption:"Nueva", likes:0, comments:[] })');
check('videollamada privada: sin página pública, el enlace abre la app', sh.run('postUrl(getPlan("p15"))') === WB + 'abrir.html#/plan/p15' && !fs.existsSync(path.join(wdir, 'plan', 'p15.html')) && fs.existsSync(path.join(wdir, 'plan', 'p14.html')));
check('lo creado en la demo: enlace a abrir.html con el destino', sh.run('postUrl(POSTS[0])') === WB + 'abrir.html#/p/npo1');
sh.run('ME.handle = "@marina.nueva"'); check('perfil con otro usuario: enlace a abrir.html', sh.run('postUrl(ME)') === WB + 'abrir.html#/u/me'); sh.run('ME.handle = "@marina"');
// Compartir perfiles
sh.nav('perfil'); check('perfil: "Compartir perfil" abre la hoja', sh.html('view-perfil').includes("openShare('u:me')"));
sh.run('openShare("u:lucia")'); h = sh.html('overlay'); rendered += h;
check('compartir perfil: vista previa, enlace, imagen y QR; sin story', h.includes('Compartir perfil') && h.includes('Lucía R. (@lucia)') && h.includes('Código QR') && !h.includes('Añadir a tu story') && !h.includes('Compartir en otras apps'));
check('perfil privado: la vista previa no enseña sus fotos', sh.run('shareMeta(getUser("irene")).description') === 'Cuenta privada en planes' && sh.run('shareMeta(getUser("irene")).image') === '');
sh.run('state.share.to = ["lucia"]; sendShareInApp()');
check('enviar un perfil por mensaje: tarjeta con el perfil', sh.run('dmWith("lucia").messages.slice(-1)[0].share') === 'u:lucia' && sh.run('msgShareCard("u:lucia")').includes('Lucía R.') && sh.run('msgPreview({ from:"me", share:"u:lucia" }, dmWith("lucia"))').includes('perfil'));
sh.run('openUserMenu("marco")'); check('perfil ajeno (⋯): compartir el perfil', sh.html('overlay').includes("openShare('u:marco')"));
sh.run('openShareQr("plan:p2")'); h = sh.html('overlay'); rendered += h;
check('código QR del enlace', h.includes('qr-box') && h.includes(WB + 'plan/p2.html'));
// Menú de compartir nativo
sh.run('globalThis.__shared = null; globalThis.navigator = { share: (d) => { __shared = d; return Promise.resolve(); }, canShare: () => true }');
sh.run('openShare("plan:p2")'); check('con menú nativo: botón "Compartir en otras apps"', sh.html('overlay').includes('Compartir en otras apps'));
sh.run('systemShare("plan:p2")');
check('menú nativo: comparte el enlace (la vista previa la genera la web), sin esperar a la imagen', sh.run('__shared && __shared.url') === WB + 'plan/p2.html' && sh.run('__shared.title') === sh.run('getPlan("p2").title') && !sh.run('__shared.files'));
// Enlaces que abren la app
sh.nav('p/po8'); check('enlace a una publicación: se abre en la app', sh.html('overlay').includes('data-post="po8"'));
sh.run('closeOverlay()'); sh.nav('p/no-existe'); check('enlace roto: aviso', sh.run('document.getElementById("toast").textContent').includes('ya no está disponible'));
sh.nav('plan/no-existe'); check('plan que ya no existe: página de aviso', sh.html('view-page').includes('Este plan ya no está disponible'));
const dst = {};
const nd = createEnv(dst, { sinSesion: true, hash: '#/plan/p2' }); rendered += nd.html('auth');
check('enlace sin sesión: se recuerda y se explica en la bienvenida', dst['planes-destino'] === '#/plan/p2' && nd.html('auth').includes('Te han compartido el plan «Atardecer en el Templo de Debod»'));
nd.run('loginDemo()'); check('al entrar, lleva al enlace compartido', nd.run('location.hash') === '#/plan/p2' && !('planes-destino' in dst));
// Recibir desde el menú de compartir del móvil
check('recibir: reconoce enlaces de planes', sh.run('sharedLink("mira " + location.origin + "/RED-SOCIAL/prototipo/web/u/lucia.html")') === 'u/lucia' && sh.run('sharedLink("https://planes.app/plan/p4")') === 'plan/p4'
  && sh.run('sharedLink("x/web/abrir.html#/p/npo1")') === 'p/npo1' && sh.run('sharedLink("hola")') === null);
sh.run('applyShared({ title:"", text:"", url:"https://planes.app/plan/p4" }, [])'); check('recibir un enlace de planes: lo abre', sh.run('location.hash') === '#/plan/p4');
sh.run('applyShared({ title:"", text:"Qué atardecer", url:"" }, [])');
check('recibir texto: nueva publicación con el texto en el pie', sh.run('location.hash') === '#/crear-post' && sh.run('state.draftPost.caption') === 'Qué atardecer' && sh.html('view-page').includes('Qué atardecer'));
let mf = null; try { mf = JSON.parse(fs.readFileSync(path.join(pdir0, 'manifest.webmanifest'), 'utf8')); } catch (err) {}
check('PWA: sale en el menú de compartir (share_target con fotos y vídeos) y captura los enlaces', !!mf && mf.share_target.method === 'POST' && mf.share_target.params.files[0].accept.includes('image/*') && mf.handle_links === 'preferred'
  && fs.readFileSync(path.join(pdir0, 'sw.js'), 'utf8').includes('recibir-compartido'));

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
