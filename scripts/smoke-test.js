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
    _html: '', dataset: {}, style: {}, value: '', textContent: '', scrollTop: 0,
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    set innerHTML(v) { this._html = v; }, get innerHTML() { return this._html; },
    set onclick(f) {}, querySelector() { return makeEl(); }, querySelectorAll() { return []; },
  };
}

// Crea un entorno aislado; `store` hace de localStorage y se comparte entre entornos
// para simular una recarga de la página.
function createEnv(store) {
  const reg = {};
  const ctx = {
    console, setTimeout, clearTimeout,
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
check('perfil profesional: badge y condiciones pendientes', h.includes('Profesional') && h.includes('pendiente de definir'));
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
check('crear publicación: 9 opciones', ['Vincular a un plan', 'Ubicación', 'Etiquetar personas', 'Texto alternativo', 'Audiencia',
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

// --- Creación + persistencia tras "recargar" ---
const nPlans = a.run('PLANS.length');
a.run('publishPlan()');
const newId = a.run('PLANS[0].id');
check('publicar plan añade un plan', a.run('PLANS.length') === nPlans + 1);
a.run('publishPost(); publishGroup(); registerArrival("p2")');
const b = createEnv(store);   // misma "memoria" del navegador, entorno nuevo
check('persistencia: el plan creado sobrevive a recargar', b.run(`PLANS.some(p => p.id === "${newId}")`));
check('persistencia: la asistencia registrada sobrevive', b.run('state.attended.has("p2")'));
check('persistencia: los planes base conservan fecha futura', b.run('getPlan("p1").when > new Date()'));
const c = createEnv({ 'planes-proto-v1': '{corrupto' });
check('persistencia: datos corruptos no rompen la demo', c.run('PLANS.length') === 12);

// --- Sin emojis en la interfaz ---
const emoji = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;
check('ninguna vista contiene emojis', !emoji.test(rendered));

console.log(failures ? `\n${failures} comprobación(es) fallida(s)` : '\nTodo OK');
process.exit(failures ? 1 : 0);
