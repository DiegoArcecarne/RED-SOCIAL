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
function createEnv(store) {
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
check('persistencia: los planes base conservan fecha futura', b.run('getPlan("p1").when > new Date()'));
const c = createEnv({ [a.run('STORE_KEY')]: '{corrupto' });
check('persistencia: datos corruptos no rompen la demo', c.run('PLANS.length') === 12);

// --- Sin emojis en la interfaz ---
const emoji = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;
check('ninguna vista contiene emojis', !emoji.test(rendered));

console.log(failures ? `\n${failures} comprobación(es) fallida(s)` : '\nTodo OK');
process.exit(failures ? 1 : 0);
