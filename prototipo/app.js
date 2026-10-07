/* =========================================================================
   Prototipo visual — App de planes. Modo oscuro tipo Instagram, sin emojis.
   Vistas: feed, mapa, grupos, perfil, detalle + creación (plan/post/grupo),
   solicitudes, ajustes. Datos mock en data.js.
   ========================================================================= */

const state = {
  contentTab: 'disponibles',
  navTab: 'feed',
  size: 'todos', category: 'todas', price: 'todos',
  selectedPlace: null,
  joined: new Set(), attended: new Set(), requested: new Set(),
  presencePublic: (typeof ME !== 'undefined') ? ME.presencePublic : true,
  profileTab: 'posts',                 // posts | vividas
  profileFilter: 'todo',               // publicaciones del perfil: todo | plan | vida
  wallFilter: 'todo',                  // publicaciones del muro: todo | plan | vida
  draft: { cover:'g-grape', size:'mediano', cat:'social', access:'libre', price:'gratis' },
  draftPost: { origin:'plan', kind:'foto', caption:'', tags:[], place:'', planId:'', alt:'', audience:'publico', comments:true, hideLikes:false, alsoStory:false, trackId:'' },
  storySound: true,                    // las stories suenan con su música (se puede silenciar)
  musicQuery: '', musicMood: 'todas',  // filtros del selector de música
  draftMembers: {},                    // userId -> 'admin' | 'miembro'
  pendingGroup: null,                  // grupo preseleccionado al crear plan
};

/* ---------- iconos SVG monolínea ---------- */
const SVG = {
  home:'<svg viewBox="0 0 24 24"><path d="M4 11 12 4l8 7M6 9.5V20h12V9.5"/></svg>',
  grid:'<svg viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="7" height="7" rx="1.4"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.4"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.4"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.4"/></svg>',
  play:'<svg viewBox="0 0 24 24"><rect x="3.5" y="4.5" width="17" height="15" rx="3.5"/><path d="M10.5 9.2v5.6l4.5-2.8z" class="fill"/></svg>',
  live:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.4"/><circle cx="12" cy="12" r="2.6" class="fill"/></svg>',
  at:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.6"/><path d="M15.6 12v1.6a2.4 2.4 0 0 0 4.4-1.6 8 8 0 1 0-3.2 6.4"/></svg>',
  map:'<svg viewBox="0 0 24 24"><path d="M9 4 3.5 6.2v13.6L9 17.6l6 2.2 5.5-2.2V3.9L15 6.1z"/><path d="M9 4v13.6M15 6.1v13.7"/></svg>',
  pin:'<svg viewBox="0 0 24 24"><path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z"/><circle cx="12" cy="10" r="2.4"/></svg>',
  geo:'<svg viewBox="0 0 24 24"><path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z"/><path d="M9.1 9.9 11 11.9l3.2-3.5"/></svg>',
  user:'<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.3"/><path d="M5.6 19a6.4 6.4 0 0 1 12.8 0"/></svg>',
  users:'<svg viewBox="0 0 24 24"><circle cx="9.5" cy="8" r="3.1"/><path d="M3.8 19a5.7 5.7 0 0 1 11.4 0"/><path d="M16 5.3a3.1 3.1 0 0 1 0 5.4"/><path d="M17.2 13.6A5.7 5.7 0 0 1 20.2 19"/></svg>',
  group:'<svg viewBox="0 0 24 24"><circle cx="12" cy="7.5" r="2.7"/><circle cx="5.5" cy="10" r="2.3"/><circle cx="18.5" cy="10" r="2.3"/><path d="M7.5 18a4.5 4.5 0 0 1 9 0M2.5 17.5a3.5 3.5 0 0 1 3.4-3.2M21.5 17.5a3.5 3.5 0 0 0-3.4-3.2"/></svg>',
  layers:'<svg viewBox="0 0 24 24"><path d="M12 4 3 8.5l9 4.5 9-4.5z"/><path d="M3 12.5 12 17l9-4.5"/></svg>',
  clock:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.4"/><path d="M12 7.4V12l3 1.9"/></svg>',
  check:'<svg viewBox="0 0 24 24"><path d="M4.8 12.5 9.5 17 19 6.6"/></svg>',
  star:'<svg viewBox="0 0 24 24" class="fill"><path d="M12 3.6l2.6 5.2 5.8.8-4.2 4.1 1 5.7L12 16.8 6.8 19.4l1-5.7L3.6 9.6l5.8-.8z"/></svg>',
  shield:'<svg viewBox="0 0 24 24"><path d="M12 3.5l7 2.5v5c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9v-5z"/><path d="M9.2 12.2 11.2 14l3.6-3.8"/></svg>',
  alert:'<svg viewBox="0 0 24 24"><path d="M12 4 2.8 20h18.4z"/><path d="M12 10v4M12 17.1v.1"/></svg>',
  lock:'<svg viewBox="0 0 24 24"><rect x="5" y="10.4" width="14" height="9.2" rx="2"/><path d="M8 10.4V8a4 4 0 0 1 8 0v2.4"/></svg>',
  globe:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.4"/><path d="M3.6 12h16.8M12 3.6c2.4 2.4 2.4 14.4 0 16.8M12 3.6c-2.4 2.4-2.4 14.4 0 16.8"/></svg>',
  chevR:'<svg viewBox="0 0 24 24"><path d="M9 5.5 15.5 12 9 18.5"/></svg>',
  chevL:'<svg viewBox="0 0 24 24"><path d="M15 5.5 8.5 12 15 18.5"/></svg>',
  heart:'<svg viewBox="0 0 24 24" class="fill"><path d="M12 20s-7-4.4-7-9.5A3.8 3.8 0 0 1 12 7a3.8 3.8 0 0 1 7 3.5C19 15.6 12 20 12 20z"/></svg>',
  repeat:'<svg viewBox="0 0 24 24"><path d="M4 9.5 6.5 7 9 9.5"/><path d="M6.5 7H15a5 5 0 0 1 5 5"/><path d="M20 14.5 17.5 17 15 14.5"/><path d="M17.5 17H9a5 5 0 0 1-5-5"/></svg>',
  ticket:'<svg viewBox="0 0 24 24"><path d="M4 8.5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1-2 2H6a2 2 0 0 1-2-2 2 2 0 0 0 0-4z"/><path d="M14.5 7v10"/></svg>',
  euro:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.4"/><path d="M15 9.3a4 4 0 1 0 0 5.4M8 11h5M8 13h4"/></svg>',
  plus:'<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  image:'<svg viewBox="0 0 24 24"><rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><circle cx="9" cy="10" r="1.8"/><path d="M5 18.5l5-5 4 4 2.5-2.5 3 3"/></svg>',
  video:'<svg viewBox="0 0 24 24"><rect x="3" y="6.5" width="13" height="11" rx="2.5"/><path d="M16 10.5l5-2.8v8.6l-5-2.8z"/></svg>',
  stack:'<svg viewBox="0 0 24 24"><rect x="8" y="4" width="12" height="12" rx="2.5"/><path d="M4 8v9.5A2.5 2.5 0 0 0 6.5 20H16"/></svg>',
  gear:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 3.5v2.2M12 18.3v2.2M4.7 7.5l1.9 1.1M17.4 15.4l1.9 1.1M19.3 7.5l-1.9 1.1M6.6 15.4l-1.9 1.1"/></svg>',
  briefcase:'<svg viewBox="0 0 24 24"><rect x="3.5" y="7.5" width="17" height="11" rx="2"/><path d="M8.5 7.5V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1.5M3.5 12h17"/></svg>',
  close:'<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  bell:'<svg viewBox="0 0 24 24"><path d="M6.5 10a5.5 5.5 0 0 1 11 0c0 4 1.5 5.5 1.5 5.5H5s1.5-1.5 1.5-5.5z"/><path d="M10 18.5a2 2 0 0 0 4 0"/></svg>',
  card:'<svg viewBox="0 0 24 24"><rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3 9.5h18"/></svg>',
  doc:'<svg viewBox="0 0 24 24"><path d="M6 3.5h8l4 4V20a.5.5 0 0 1-.5.5h-11A.5.5 0 0 1 6 20z"/><path d="M14 3.5V8h4"/></svg>',
  logout:'<svg viewBox="0 0 24 24"><path d="M14 7V5a1.5 1.5 0 0 0-1.5-1.5h-7A1.5 1.5 0 0 0 4 5v14a1.5 1.5 0 0 0 1.5 1.5h7A1.5 1.5 0 0 0 14 19v-2"/><path d="M9 12h11m-3-3 3 3-3 3"/></svg>',
  mountain:'<svg viewBox="0 0 24 24"><path d="M3 19 9.5 8l3.5 5.4 2-3L21 19z"/></svg>',
  music:'<svg viewBox="0 0 24 24"><path d="M9 18V6l10-2v10"/><circle cx="6.5" cy="18" r="2.3"/><circle cx="16.5" cy="14" r="2.3"/></svg>',
  food:'<svg viewBox="0 0 24 24"><path d="M7 3v8M5 3v4a2 2 0 0 0 4 0V3M7 11v10"/><path d="M16.5 3c-1.5 0-2.5 2-2.5 4.5S15.5 12 16.5 12v9"/></svg>',
  landmark:'<svg viewBox="0 0 24 24"><path d="M4 9.5 12 4l8 5.5M6 9.5V17M10 9.5V17M14 9.5V17M18 9.5V17M4 20h16"/></svg>',
  flag:'<svg viewBox="0 0 24 24"><path d="M6 21V4M6 4h11l-2 3.2L17 11H6"/></svg>',
  leaf:'<svg viewBox="0 0 24 24"><path d="M5 19C5 11 11 5 19 5c0 8-6 14-14 14z"/><path d="M5.5 18.5C9 15 12 13 16 11.8"/></svg>',
  chat:'<svg viewBox="0 0 24 24"><path d="M5 5h14v10H9.5L5 19z"/></svg>',
  compass:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.4"/><path d="M15.6 8.4 13 13l-4.6 2.6L11 11z" class="fill"/></svg>',
  hash:'<svg viewBox="0 0 24 24"><path d="M9 4 7.5 20M16.5 4 15 20M4.5 9h15M4 15h15"/></svg>',
  tag:'<svg viewBox="0 0 24 24"><path d="M11.5 3H20v8.5l-8.5 8.5L3 11.5z"/><circle cx="15.5" cy="8.5" r="1.5"/></svg>',
  link:'<svg viewBox="0 0 24 24"><path d="M9.5 14.5 14.5 9.5"/><path d="M8 12l-2 2a3 3 0 0 0 4.2 4.2l2-2"/><path d="M16 12l2-2a3 3 0 0 0-4.2-4.2l-2 2"/></svg>',
  eye:'<svg viewBox="0 0 24 24"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/></svg>',
  heartO:'<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-9.5A3.8 3.8 0 0 1 12 7a3.8 3.8 0 0 1 7 3.5C19 15.6 12 20 12 20z"/></svg>',
  send:'<svg viewBox="0 0 24 24"><path d="M21 3 10.5 13.5"/><path d="M21 3 14.5 21l-4-7.5L3 9.5z"/></svg>',
  bookmark:'<svg viewBox="0 0 24 24"><path d="M6.5 3.5h11v17l-5.5-4-5.5 4z"/></svg>',
  bookmarkF:'<svg viewBox="0 0 24 24" class="fill"><path d="M6.5 3.5h11v17l-5.5-4-5.5 4z"/></svg>',
  mute:'<svg viewBox="0 0 24 24"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>',
  cast:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="2.2" class="fill"/><path d="M8.2 8.2a5.4 5.4 0 0 0 0 7.6M15.8 8.2a5.4 5.4 0 0 1 0 7.6M5.4 5.4a9.3 9.3 0 0 0 0 13.2M18.6 5.4a9.3 9.3 0 0 1 0 13.2"/></svg>',
  volume:'<svg viewBox="0 0 24 24"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4.2 4.2 0 0 1 0 6M18.2 6.5a8 8 0 0 1 0 11"/></svg>',
  playS:'<svg viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z"/></svg>',
  pause:'<svg viewBox="0 0 24 24"><path d="M8.5 5.5v13M15.5 5.5v13"/></svg>',
  search:'<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.4"/><path d="M15.7 15.7 20 20"/></svg>',
  dots:'<svg viewBox="0 0 24 24"><circle cx="5.5" cy="12" r="1.4" class="fill"/><circle cx="12" cy="12" r="1.4" class="fill"/><circle cx="18.5" cy="12" r="1.4" class="fill"/></svg>',
  download:'<svg viewBox="0 0 24 24"><path d="M12 4v11m-4.5-4.5L12 15l4.5-4.5"/><path d="M5 19.5h14"/></svg>',
  phone:'<svg viewBox="0 0 24 24"><rect x="7" y="3" width="10" height="18" rx="2.4"/><path d="M11 17.5h2"/></svg>',
};
function ico(name){ return `<i class="ico">${SVG[name]||''}</i>`; }
const ICON_FOR_CAT = { outdoor:'mountain', fiesta:'music', gastro:'food', cultura:'landmark', deporte:'flag', bienestar:'leaf', social:'chat', viajeros:'compass' };
const POST_ICON = { foto:'image', video:'video', carrusel:'stack' };

/* ---------- utilidades ---------- */
function fmtCountdown(date){
  const diff = date - Date.now();
  if (diff <= 0) return 'En marcha';
  const h = Math.floor(diff/3600000), d = Math.floor(h/24);
  if (d >= 1) return `${d} d ${h%24} h`;
  const m = Math.floor((diff%3600000)/60000);
  return `${h} h ${m} min`;
}
function fmtWhen(date){
  const dias=['dom','lun','mar','mié','jue','vie','sáb'];
  return `${dias[date.getDay()]} · ${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`;
}
function sizeBucket(p){ if (p.groupMax<=8) return 'intimo'; if (p.groupMax<=20) return 'mediano'; return 'grande'; }
function sizeLabel(p){ return {intimo:'Íntimo',mediano:'Mediano',grande:'Grande'}[sizeBucket(p)]; }
function initials(name){ return name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase(); }
function rating(n){ return `<span class="rate">${ico('star')} ${n}</span>`; }
function freeIcon(p){ return p.secret ? ico('lock') : (p.paid ? ico('euro') : ico('ticket')); }
function uimg(slug,s){ s=s||500; return `https://images.unsplash.com/photo-${slug}?w=${s}&h=${s}&fit=crop&q=60`; }
// Imagen de portada sobre el degradado; si no carga se elimina y queda el degradado (fallback).
function coverImg(slug,s){ return slug ? `<img class="cover-img" src="${uimg(slug,s)}" alt="" loading="lazy" onerror="this.remove()">` : ''; }
function escapeHtml(s){ return (s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function val(id){ const el=document.getElementById(id); return el?el.value:''; }
function toast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg;t.classList.add('show');
  clearTimeout(t._tmo);t._tmo=setTimeout(()=>t.classList.remove('show'),2100);
}
// Cuenta profesional: solo el icono (el texto sobra; se explica al pasar o leer en voz alta).
function typeBadge(u){ return u.type==='profesional' ? `<span class="pro-ic" title="Cuenta profesional" aria-label="Cuenta profesional" role="img">${ico('briefcase')}</span>` : ''; }

/* ---------- longitud máxima de los textos (propuesta en PRODUCTO.md) ----------
   Un único sitio para todos los límites: los campos los aplican con maxlength,
   enseñan un contador "n/máx" y al guardar se recorta por si acaso. */
const LIMITS = {
  name:30, username:30, bio:150, web:100, address:120,
  planTitle:60, planDesc:1000, caption:2200, alt:250, comment:500,
  liveTitle:60, liveMsg:200, groupName:50, groupAbout:300, rating:500,
};
const USERNAME_MIN = 3;
function clip(s, key){ return (s || '').trim().slice(0, LIMITS[key]); }
// Atributos de un campo con límite: maxlength y actualización del contador al escribir.
function lim(id, key){ return `id="${id}" maxlength="${LIMITS[key]}" oninput="countChars(this,'${key}')"`; }
function counter(id, key, v){ return `<span class="cnt" id="cnt-${id}">${(v || '').length}/${LIMITS[key]}</span>`; }
function countChars(el, key){
  const c = document.getElementById('cnt-' + el.id); if (!c) return;
  const n = el.value.length, m = LIMITS[key];
  c.textContent = n + '/' + m; c.classList.toggle('near', n >= m * 0.9);
}
// Nombre de usuario: 3–30 caracteres, solo minúsculas, números, punto y guion bajo;
// sin punto al principio ni al final, sin dos puntos seguidos, y único.
function usernameError(u, selfId){
  if (u.length < USERNAME_MIN) return `Mínimo ${USERNAME_MIN} caracteres.`;
  if (u.length > LIMITS.username) return `Máximo ${LIMITS.username} caracteres.`;
  if (!/^[a-z0-9._]+$/.test(u)) return 'Solo minúsculas, números, punto (.) y guion bajo (_), sin espacios ni tildes.';
  if (/^\.|\.$/.test(u)) return 'No puede empezar ni terminar en punto.';
  if (u.includes('..')) return 'No puede tener dos puntos seguidos.';
  if (USERS.some(x => x.id !== selfId && (x.handle || '').toLowerCase() === '@' + u)) return 'Ese nombre de usuario ya está cogido.';
  return '';
}

/* ---------- umbral de anonimato de la presencia privada ----------
   Con pocos asistentes, mostrar el total delataría a quien fue en privado
   ("4 asistentes" y 3 caras visibles → se deduce quién falta). Por debajo de
   PRIVACY_MIN solo se cuentan y muestran los asistentes visibles. */
const PRIVACY_MIN = 10;
function attendanceView(p){
  const total = p.attended || 0;
  if (total >= PRIVACY_MIN) return { n: total, label: 'asistentes reales', priv: p.attendedPrivate || 0, below: false };
  const visible = Math.min((p.publicAttendees || []).length, total);
  return { n: visible, label: 'asistentes visibles', priv: 0, below: true };
}

/* ---------- persistencia local (localStorage) ----------
   Lo creado en la demo (planes, publicaciones, grupos, solicitudes, asistencias)
   sobrevive a recargar la página. Si el navegador bloquea el almacenamiento,
   la demo sigue funcionando en memoria. "Restablecer demo" en Ajustes lo borra. */
const STORE_KEY = 'planes-proto-v4';
function saveState(){
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      plans: PLANS.map(p => ({ ...p, when: p.when instanceof Date ? p.when.toISOString() : p.when })),
      posts: POSTS, groups: GROUPS, requests: REQUESTS, stories: STORIES, ratings: RATINGS, follows: FOLLOWS,
      me: { profilePublic: ME.profilePublic, presencePublic: ME.presencePublic, attendedPlanIds: ME.attendedPlanIds,
            name: ME.name, handle: ME.handle, initials: ME.initials, bio: ME.bio, business: ME.business, ratings: ME.ratings },
      sets: { joined: [...state.joined], attended: [...state.attended], requested: [...state.requested] },
    }));
  } catch (e) { /* sin almacenamiento: la demo funciona en memoria */ }
}
function loadState(){
  let snap = null;
  try { snap = JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch (e) { return; }
  if (!snap) return;
  // Los planes base conservan su fecha relativa a hoy; los creados en la demo, la suya.
  const baseWhen = new Map(PLANS.map(p => [p.id, p.when]));
  const saved = (snap.plans || []).map(p => ({ ...p, when: baseWhen.get(p.id) || new Date(p.when) }));
  const savedIds = new Set(saved.map(p => p.id));
  const merged = saved.concat(PLANS.filter(p => !savedIds.has(p.id))); // planes base nuevos tras una actualización
  if (merged.length) PLANS.splice(0, PLANS.length, ...merged);
  if (Array.isArray(snap.posts)) POSTS.splice(0, POSTS.length, ...snap.posts);
  if (Array.isArray(snap.groups)) GROUPS.splice(0, GROUPS.length, ...snap.groups);
  if (Array.isArray(snap.requests)) REQUESTS.splice(0, REQUESTS.length, ...snap.requests);
  if (Array.isArray(snap.stories)) STORIES.splice(0, STORIES.length, ...snap.stories);
  if (Array.isArray(snap.ratings)) RATINGS.splice(0, RATINGS.length, ...snap.ratings);
  if (Array.isArray(snap.follows)) FOLLOWS.splice(0, FOLLOWS.length, ...snap.follows);
  if (snap.me) Object.assign(ME, snap.me);
  if (snap.sets) {
    state.joined = new Set(snap.sets.joined || []);
    state.attended = new Set(snap.sets.attended || []);
    state.requested = new Set(snap.sets.requested || []);
  }
  state.presencePublic = ME.presencePublic;
}
function resetDemo(){
  try { localStorage.removeItem(STORE_KEY); } catch (e) {}
  location.hash = '#/feed';
  location.reload();
}

/* ---------- filtrado feed ---------- */
function filteredPlans(){
  return PLANS.filter(p=>{
    if (state.size!=='todos' && sizeBucket(p)!==state.size) return false;
    if (state.category!=='todas' && p.category!==state.category) return false;
    if (state.price==='gratis' && p.paid) return false;
    if (state.price==='pago' && !p.paid) return false;
    return true;
  });
}
function gridCell(p){
  const place = getPlace(p.placeId);
  const loc = p.secret ? 'Zona aprox.' : (place ? place.name : 'Madrid');
  return `
  <button class="cell ${p.gradient}" onclick="go('plan/${p.id}')" aria-label="${escapeHtml(p.title)}">
    ${coverImg(p.photo,500)}
    <span class="cell-scrim"></span>
    <span class="cell-corner" title="${p.paid?'De pago':'Gratis'}">${freeIcon(p)}</span>
    <span class="cell-info">
      <span class="cell-title">${escapeHtml(p.title)}</span>
      <span class="cell-meta">${escapeHtml(loc)} · ${ico('geo')} ${attendanceView(p).n}</span>
    </span>
  </button>`;
}
function renderFeed(){
  const plans = filteredPlans();
  const cont = document.getElementById('feed-list');
  cont.innerHTML = plans.length ? `<div class="grid">${plans.map(gridCell).join('')}</div>`
    : emptyTab('grid','Sin planes con esos filtros','Prueba a ampliar el tamaño de grupo o el tema.');
}
/* ======================= MURO (Vividas), STORIES Y DIRECTOS ======================= */
function agoLabel(h){ if (h < 1) return 'ahora'; if (h < 24) return `hace ${Math.round(h)} h`; return `hace ${Math.round(h/24)} d`; }
function minLabel(m){ return m < 1 ? 'ahora' : (m < 60 ? `hace ${m} min` : `hace ${Math.round(m/60)} h`); }
function setContentTab(t){ stopMusic(); state.contentTab = t; renderContent(); scrollTop('feed'); }

// Publicaciones del muro, de la más reciente a la más antigua.
function wallPosts(){ return POSTS.slice().sort((a,b)=>(a.ago||0)-(b.ago||0)); }

// Filtro por origen: experiencias de planes o momentos de la vida de cada uno.
function byOrigin(posts, f){ return f === 'todo' ? posts : posts.filter(po => postOrigin(po) === f); }
function originFilter(posts, cur, call, vidaLabel){
  const opts = [['todo','Todo','layers'],['plan','Planes','ticket'],['vida',vidaLabel,'heartO']];
  return `<div class="iseg origin-seg" role="tablist">${opts.map(([v,l,n]) =>
    `<button class="${cur===v?'active':''}" role="tab" aria-selected="${cur===v}" onclick="${call(v)}">${ico(n)}<span>${l}</span><em>${byOrigin(posts, v).length}</em></button>`).join('')}</div>`;
}
function setWallFilter(f){ stopMusic(); state.wallFilter = f; renderContent(); scrollTop('feed'); }

// Botón de sonido sobre la foto, el carrusel o el vídeo (si la publicación lleva música).
function soundBtn(po){
  return po.trackId ? `<button class="pm-mute ${musicNow.src===po.id?'on':''}" data-music="${po.id}" onclick="event.stopPropagation();togglePostMusic('${po.id}')" aria-label="Activar o silenciar la música">${ico('mute')}${ico('volume')}</button>` : '';
}
function postMedia(po){
  const imgs = (po.imgs && po.imgs.length) ? po.imgs : [''];
  const grad = (i)=> (po.media||[])[i] || (po.media||[])[0] || 'g-dark';
  const burst = `<span class="burst">${ico('heart')}</span>`;
  if (po.kind==='carrusel' && imgs.length > 1){
    return `<div class="pm pm-car">
      <div class="car-track" onscroll="carouselDots(this,'${po.id}')">${imgs.map((s,i)=>`<div class="car-slide ${grad(i)}" ondblclick="likePost('${po.id}',true)">${coverImg(s,700)}</div>`).join('')}</div>
      <span class="pm-count" id="cc-${po.id}">1/${imgs.length}</span>
      <div class="car-dots" id="cd-${po.id}">${imgs.map((_,i)=>`<i class="${i===0?'on':''}"></i>`).join('')}</div>${soundBtn(po)}${burst}</div>`;
  }
  if (po.kind==='video'){
    const d = po.duration || 20;
    // Vídeo simulado: la portada con movimiento lento y una barra de progreso.
    return `<div class="pm pm-video ${grad(0)}" onclick="toggleVideo(this)" ondblclick="likePost('${po.id}',true)">
      <div class="kb">${coverImg(imgs[0],700)}</div>
      <span class="pm-play">${ico('play')}</span>
      <span class="pm-dur">0:${String(d).padStart(2,'0')}</span>
      ${po.trackId ? soundBtn(po) : `<span class="pm-mute">${ico('mute')}</span>`}
      <span class="pm-bar"><i style="animation-duration:${d}s"></i></span>${burst}</div>`;
  }
  return `<div class="pm ${grad(0)}" ondblclick="likePost('${po.id}',true)">${coverImg(imgs[0],700)}${soundBtn(po)}${burst}</div>`;
}

function postCard(po){
  const u = getUser(po.authorId) || { id:'', name:'Usuario', initials:'?', handle:'' };
  const plan = po.planId ? getPlan(po.planId) : null;
  const place = plan ? getPlace(plan.placeId) : (po.placeId ? getPlace(po.placeId) : null);
  const placeName = plan && plan.secret ? 'Zona aproximada' : (place ? place.name : '');
  const liked = !!po.likedByMe;
  const comments = po.comments || [];
  const commentsOff = po.commentsEnabled === false;
  const likesHidden = po.hideLikes && po.authorId !== 'me';
  return `<article class="post" data-post="${po.id}">
    <header class="post-h">
      <button class="post-av" onclick="go('u/${u.id}')" aria-label="Perfil de ${escapeHtml(u.name)}">${escapeHtml(u.initials || initials(u.name))}</button>
      <div class="post-who">
        <button class="post-name" onclick="go('u/${u.id}')">${escapeHtml(u.name)} ${u.verified?`<span class="vchk">${ico('check')}</span>`:''}${typeBadge(u)}</button>
        <span class="post-sub">${placeName?escapeHtml(placeName)+' · ':''}${agoLabel(po.ago||0)}</span>
        ${postMusicLine(po)}
      </div>
      <span class="post-kind" title="${po.kind}">${ico(POST_ICON[po.kind]||'image')}</span>
    </header>
    ${postMedia(po)}
    <div class="post-actions">
      <button class="pa ${liked?'liked':''}" onclick="likePost('${po.id}')" aria-label="Me gusta" aria-pressed="${liked}">${ico(liked?'heart':'heartO')}</button>
      ${commentsOff ? '' : `<button class="pa" onclick="openComments('${po.id}')" aria-label="Comentarios">${ico('chat')}</button>`}
      <button class="pa" onclick="openShare('${po.id}')" aria-label="Compartir">${ico('send')}</button>
      <span class="pa-sp"></span>
      <button class="pa ${po.savedByMe?'saved':''}" onclick="savePost('${po.id}')" aria-label="Guardar" aria-pressed="${!!po.savedByMe}">${ico(po.savedByMe?'bookmarkF':'bookmark')}</button>
    </div>
    <div class="post-body">
      <div class="post-likes">${likesHidden ? 'Le gusta a varias personas' : `${po.likes||0} Me gusta`}</div>
      <p class="post-cap"><b>${escapeHtml(u.handle || u.name)}</b> ${highlightCaption(po.caption||'')}</p>
      ${plan ? `<button class="post-plan" onclick="go('plan/${plan.id}')">${ico('link')}<span>${escapeHtml(plan.title)}</span>${ico('chevR')}</button>` : ''}
      ${commentsOff ? '<div class="post-off">Comentarios desactivados</div>'
        : (comments.length ? `<button class="post-more" onclick="openComments('${po.id}')">Ver ${comments.length===1?'1 comentario':'los '+comments.length+' comentarios'}</button>` : '')}
    </div>
  </article>`;
}

// Plan inyectado en el muro (regla de producto: 1 cada 5 publicaciones), de la
// misma categoría que las publicaciones que se acaban de ver.
function injectedPlan(seen, used){
  let cat = null;
  for (let i = seen.length - 1; i >= 0; i--){ const p = seen[i].planId && getPlan(seen[i].planId); if (p){ cat = p.category; break; } }
  const upcoming = PLANS.filter(p => p.when > new Date() && !used.has(p.id));
  const pick = upcoming.find(p => p.category === cat) || upcoming[0];
  if (!pick) return '';
  used.add(pick.id);
  const place = getPlace(pick.placeId);
  const seats = pick.joinType==='libre' ? 'Plan libre' : `Quedan ${Math.max(0, pick.groupMax - pick.joined)} plazas`;
  return `<button class="inject ${pick.gradient}" onclick="go('plan/${pick.id}')">
    ${coverImg(pick.photo,700)}<span class="inject-scrim"></span>
    <span class="inject-tag">Puedes hacerlo tú</span>
    <span class="inject-info">
      <span class="inject-t">${escapeHtml(pick.title)}</span>
      <span class="inject-m"><span>${ico('clock')} ${fmtCountdown(pick.when)}</span><span>${ico('pin')} ${escapeHtml(pick.secret?'Zona aprox.':(place?place.name:''))}</span><span>${freeIcon(pick)} ${pick.paid?pick.price+' €':'Gratis'}</span><span>${ico('users')} ${seats}</span></span>
      <span class="inject-cta">Ver plan ${ico('chevR')}</span>
    </span></button>`;
}

// Stories agrupadas por persona: la persona con la story más reciente va primero
// y sus stories se reproducen de la más antigua a la más nueva.
function storyGroups(){
  const by = {};
  STORIES.forEach(s => { (by[s.userId] = by[s.userId] || []).push(s); });
  return Object.keys(by).map(userId => {
    const list = by[userId].slice().sort((a,b)=>b.minAgo-a.minAgo);
    return { userId, list, latest: Math.min(...list.map(s=>s.minAgo)) };
  }).sort((a,b)=>a.latest-b.latest);
}

// Tira "Ahora mismo" dentro del muro: directos y stories destacadas.
function storiesStrip(){
  const lives = LIVES.map(l => { const u = getUser(l.userId) || { name:'' };
    return `<button class="ss live" onclick="openLive('${l.id}')"><span class="ss-img">${coverImg(l.img,240)}<span class="ss-badge">En directo</span></span><span class="ss-n">${escapeHtml(u.name)}</span></button>`; }).join('');
  const st = storyGroups().map((g,i) => { const u = getUser(g.userId) || { name:'' }; const last = g.list[g.list.length-1];
    return `<button class="ss" onclick="openStory(${i})"><span class="ss-img">${coverImg(last.img,240)}</span><span class="ss-n">${escapeHtml(u.name)}</span></button>`; }).join('');
  return `<section class="strip"><div class="strip-h">${ico('live')} Ahora mismo<button class="strip-all" onclick="setContentTab('stories')">Ver todo</button></div><div class="strip-row">${lives}${st}</div></section>`;
}

function renderWall(){
  const all = wallPosts();
  const posts = byOrigin(all, state.wallFilter);
  const used = new Set();
  let out = `<div class="wall-filter">${originFilter(all, state.wallFilter, v => `setWallFilter('${v}')`, 'Vida')}</div>`;
  if (!posts.length) out += emptyTab('image', 'Nada por aquí todavía', 'Cuando la gente a la que sigues publique, lo verás aquí.');
  posts.forEach((po,i) => {
    out += postCard(po);
    if (i === 1) out += storiesStrip();
    if ((i + 1) % 5 === 0) out += injectedPlan(posts.slice(0, i + 1), used);
  });
  return `<div class="wall">${out}</div>`;
}

function renderStoriesTab(){
  const lives = LIVES.map(l => { const u = getUser(l.userId) || { name:'' }; const p = getPlan(l.planId);
    return `<button class="live-card" onclick="openLive('${l.id}')">${coverImg(l.img,600)}<span class="lc-scrim"></span>
      <span class="live-badge">${ico('cast')} En directo</span><span class="lc-view">${ico('eye')} ${l.viewers}</span>
      <span class="lc-info"><span class="lc-t">${escapeHtml(l.title)}</span><span class="lc-m">${escapeHtml(u.name)}${p?' · '+escapeHtml(p.title):''} · ${minLabel(l.startedMin)}</span></span></button>`; }).join('');
  const tiles = storyGroups().map((g,i) => { const u = getUser(g.userId) || { name:'', initials:'' }; const last = g.list[g.list.length-1]; const p = getPlan(last.planId);
    return `<button class="st-tile" onclick="openStory(${i})">${coverImg(last.img,420)}<span class="st-scrim"></span>
      <span class="st-ring">${escapeHtml(u.initials||'')}</span><span class="st-count">${g.list.length}</span>
      <span class="st-info"><span class="st-n">${escapeHtml(u.name)}</span><span class="st-m">${p?escapeHtml(p.title)+' · ':''}${minLabel(g.latest)}</span></span></button>`; }).join('');
  return `<div class="stories-tab">
    ${LIVES.length ? `<div class="sec-h">${ico('cast')} En directo ahora</div><div class="live-row">${lives}</div>` : ''}
    <div class="sec-h">${ico('live')} Stories de hoy<span class="sec-s">desaparecen a las 24 h</span></div>
    <div class="st-grid"><button class="st-tile st-add" onclick="newStory()"><span class="st-plus">${ico('plus')}</span><span class="st-n">Tu story</span></button>${tiles}</div>
  </div>`;
}
function newStory(){ state.draftPost = freshPostDraft(); state.draftPost.alsoStory = true; go('crear-post'); }

/* ======================= MÚSICA ======================= */
/* Motor de audio: sintetiza en el navegador (Web Audio API) las pistas de TRACKS a
   partir de su patrón. Sin archivos ni canciones reales, así que no hay derechos
   de autor en juego y funciona sin conexión. Solo suena tras un toque del usuario. */
const Music = (() => {
  let ctx = null, master = null, bus = null, noise = null, timer = null, track = null, step = 0, next = 0;
  const AC = () => window.AudioContext || window.webkitAudioContext;
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  function ensure(){
    if (ctx) return true;
    const C = AC(); if (!C) return false;
    try { ctx = new C(); } catch (e) { return false; }
    master = ctx.createGain(); master.gain.value = 0.55;
    const comp = ctx.createDynamicsCompressor ? ctx.createDynamicsCompressor() : null;
    if (comp){ master.connect(comp); comp.connect(ctx.destination); } else master.connect(ctx.destination);
    return true;
  }
  function env(g, t, attack, peak, dur){
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }
  function tone(midi, t, dur, type, peak, cutoff, attack){
    const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    o.type = type; o.frequency.setValueAtTime(hz(midi), t);
    f.type = 'lowpass'; f.frequency.value = cutoff;
    o.connect(f); f.connect(g); g.connect(bus);
    env(g, t, attack || 0.01, peak, dur);
    o.start(t); o.stop(t + dur + 0.05);
  }
  function kick(t){
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.16);
    o.connect(g); g.connect(bus); env(g, t, 0.004, 0.9, 0.28);
    o.start(t); o.stop(t + 0.3);
  }
  function hat(t){
    if (!noise){
      const len = Math.floor(ctx.sampleRate * 0.1); noise = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = noise.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noise; f.type = 'highpass'; f.frequency.value = 7000;
    s.connect(f); f.connect(g); g.connect(bus); env(g, t, 0.002, 0.16, 0.05);
    s.start(t); s.stop(t + 0.08);
  }
  // Un paso de semicorchea: acorde de fondo al empezar cada compás, batería, bajo y melodía.
  function playStep(t){
    const tr = track, sd = 60 / tr.bpm / 4, i = step % 16;
    const ch = tr.chords[Math.floor(step / 16) % tr.chords.length];
    const note = (c) => ch[(parseInt(c, 10) - 1) % ch.length];
    if (i === 0) ch.forEach(n => tone(n, t, sd * 16 * 0.97, tr.pad || 'triangle', 0.045, 1600, 0.3));
    if (tr.kick[i] === 'x') kick(t);
    if (tr.hat[i] === 'x') hat(t);
    if (/\d/.test(tr.bass[i])) tone(note(tr.bass[i]) - 24, t, sd * 1.8, 'triangle', 0.3, 650);
    if (/\d/.test(tr.lead[i])) tone(note(tr.lead[i]) + 12, t, sd * 2.6, tr.leadWave || 'sine', 0.09, 2800);
  }
  // Programador con margen: agenda los pasos de los próximos 120 ms.
  function tick(){
    if (!track) return;
    const sd = 60 / track.bpm / 4;
    while (next < ctx.currentTime + 0.12){
      playStep(next + (step % 2 && track.swing ? track.swing * sd : 0));
      next += sd; step++;
    }
  }
  function stop(){
    clearInterval(timer); timer = null; track = null;
    if (bus){ const old = bus; try { old.gain.setTargetAtTime(0, ctx.currentTime, 0.04); } catch (e) {} setTimeout(() => old.disconnect(), 400); bus = null; }
  }
  function play(tr){
    if (!tr || !ensure()) return false;
    stop();
    if (ctx.resume) ctx.resume();
    bus = ctx.createGain(); bus.gain.value = 1; bus.connect(master);
    track = tr; step = 0; next = ctx.currentTime + 0.06;
    tick(); timer = setInterval(tick, 25);
    return true;
  }
  return { play, stop, supported: () => !!AC() };
})();

// Qué suena ahora y desde dónde: id de publicación, 'story' o 'pv:<pista>' (escucha previa).
const musicNow = { trackId:null, src:null };
function trackLabel(t){ return `${t.artist} · ${t.title}`; }
function playTrack(trackId, src){
  const t = getTrack(trackId); if (!t) return false;
  if (!Music.play(t)){ toast('Este navegador no puede reproducir audio'); return false; }
  musicNow.trackId = trackId; musicNow.src = src;
  refreshMusicUi(); return true;
}
function stopMusic(){
  if (!musicNow.src) return;
  Music.stop(); musicNow.trackId = null; musicNow.src = null;
  refreshMusicUi();
}
// Marca como activos los botones de lo que está sonando (data-music = origen).
function refreshMusicUi(){
  document.querySelectorAll('[data-music]').forEach(el => el.classList.toggle('on', !!musicNow.src && el.dataset.music === musicNow.src));
}
function togglePostMusic(id){
  const po = POSTS.find(p => p.id === id); if (!po || !po.trackId) return;
  if (musicNow.src === id) stopMusic(); else playTrack(po.trackId, id);
}
// Línea de música bajo el nombre del autor (como en Instagram); toca para escuchar.
function postMusicLine(po){
  const t = po.trackId && getTrack(po.trackId); if (!t) return '';
  return `<button class="post-music ${musicNow.src===po.id?'on':''}" data-music="${po.id}" onclick="togglePostMusic('${po.id}')" aria-label="Escuchar ${escapeHtml(trackLabel(t))}">
    ${ico('music')}<span class="eq"><i></i><i></i><i></i></span><span class="pmu-t">${escapeHtml(trackLabel(t))}</span></button>`;
}

/* ---------- selector de música (al crear una publicación o story) ---------- */
// Las cuentas profesionales solo pueden usar música libre de derechos (ver PRODUCTO.md).
function availableTracks(){ return ME.type === 'profesional' ? TRACKS.filter(t => t.free) : TRACKS; }
function openMusicPicker(){
  capturePostInputs();
  state.musicQuery = ''; state.musicMood = 'todas';
  showOverlay('ov-sheet', `<div class="sheet-bg" onclick="closeMusicPicker()"></div>
    <div class="sheet mp" role="dialog" aria-label="Añadir música">
      <div class="sheet-h"><span>Añadir música</span><button class="sv-x" onclick="closeMusicPicker()" aria-label="Cerrar">${ico('close')}</button></div>
      <div class="mp-search">${ico('search')}<input id="mp-q" placeholder="Busca por canción, artista o ambiente" oninput="state.musicQuery=this.value;renderMusicList()"></div>
      <div class="chips mp-moods" id="mp-moods"></div>
      <div class="sheet-list mp-list" id="mp-list"></div>
      <p class="mp-note">${ME.type==='profesional' ? 'Como cuenta profesional solo puedes usar música libre de derechos. ' : ''}Pistas originales de la demo, generadas en tu navegador.</p>
    </div>`);
  renderMusicList();
}
function setMusicMood(m){ state.musicMood = m; renderMusicList(); }
function renderMusicList(){
  const moods = ['todas', ...new Set(availableTracks().map(t => t.mood))];
  const chips = document.getElementById('mp-moods');
  if (chips) chips.innerHTML = moods.map(m => `<button class="${state.musicMood===m?'active':''}" onclick="setMusicMood('${m}')"><span>${m==='todas'?'Todas':escapeHtml(m)}</span></button>`).join('');
  const q = (state.musicQuery || '').trim().toLowerCase();
  const list = availableTracks().filter(t => (state.musicMood === 'todas' || t.mood === state.musicMood)
    && (!q || [t.title, t.artist, t.mood].some(s => s.toLowerCase().includes(q))));
  const el = document.getElementById('mp-list'); if (!el) return;
  el.innerHTML = list.map(t => `<div class="mp-row">
      <button class="mp-play ${musicNow.src==='pv:'+t.id?'on':''}" data-music="pv:${t.id}" onclick="previewTrack('${t.id}')" aria-label="Escuchar ${escapeHtml(t.title)}"><span class="mp-cover ${t.cover}"></span>${ico('playS')}${ico('pause')}</button>
      <span class="mp-info"><b>${escapeHtml(t.title)}</b><span>${escapeHtml(t.artist)} · ${escapeHtml(t.mood)} · ${t.bpm} bpm${t.free?' · <em>Libre</em>':''}</span></span>
      <button class="mp-use ${state.draftPost.trackId===t.id?'active':''}" onclick="chooseTrack('${t.id}')">${state.draftPost.trackId===t.id?'Elegida':'Usar'}</button>
    </div>`).join('') || '<p class="hint">No hay pistas que coincidan con la búsqueda.</p>';
}
function previewTrack(id){ if (musicNow.src === 'pv:' + id) stopMusic(); else playTrack(id, 'pv:' + id); }
function chooseTrack(id){
  state.draftPost.trackId = id;
  closeOverlay();
  const t = getTrack(id); if (t) toast('Música: ' + trackLabel(t));
  renderCreatePost();
}
function closeMusicPicker(){ closeOverlay(); }
function clearPostTrack(ev){ if (ev && ev.stopPropagation) ev.stopPropagation(); capturePostInputs(); state.draftPost.trackId = ''; renderCreatePost(); }
// Activa o silencia la música de las stories (por defecto suenan).
function toggleStorySound(){
  state.storySound = !state.storySound;
  renderStory();
}
function syncStoryMusic(){
  const g = storyGroups()[storyState.g], s = g && g.list[storyState.i];
  if (!s) return;
  if (!state.storySound || !s.trackId){ if (musicNow.src === 'story') stopMusic(); return; }
  if (musicNow.src !== 'story' || musicNow.trackId !== s.trackId) playTrack(s.trackId, 'story');
}

/* ---------- interacciones con publicaciones ---------- */
function rerenderPost(id){
  const po = POSTS.find(p=>p.id===id); if (!po) return;
  document.querySelectorAll(`[data-post="${id}"]`).forEach(el => { el.outerHTML = postCard(po); });
}
function likePost(id, fromDouble){
  const po = POSTS.find(p=>p.id===id); if (!po) return;
  if (fromDouble && po.likedByMe){ burst(id); return; }
  po.likedByMe = !po.likedByMe;
  po.likes = Math.max(0, (po.likes||0) + (po.likedByMe ? 1 : -1));
  saveState(); rerenderPost(id);
  if (fromDouble) burst(id);
}
function burst(id){
  document.querySelectorAll(`[data-post="${id}"]`).forEach(el => { el.classList.add('burst-on'); setTimeout(()=>el.classList.remove('burst-on'), 850); });
}
function savePost(id){
  const po = POSTS.find(p=>p.id===id); if (!po) return;
  po.savedByMe = !po.savedByMe; saveState(); rerenderPost(id);
  toast(po.savedByMe ? 'Guardada en tu colección' : 'Quitada de tu colección');
}
function toggleVideo(el){ el.classList.toggle('playing'); }
function carouselDots(track, id){
  const i = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
  const dots = document.getElementById('cd-'+id);
  if (dots) Array.from(dots.children).forEach((d,k)=>d.classList.toggle('on', k===i));
  const c = document.getElementById('cc-'+id);
  if (c && dots) c.textContent = (i+1) + '/' + dots.children.length;
}

/* ---------- compartir: dentro de la app y en otras apps ----------
   Fuera de la app se comparte un enlace público a la publicación. Esa página lleva
   etiquetas Open Graph (og:title, og:description, og:image) y por eso WhatsApp,
   Telegram, etc. enseñan la vista previa con la imagen, igual que la imagen
   destacada de WordPress. og:image es una imagen 1200×630 generada a partir de la
   foto de la publicación (shareImage). Solo las publicaciones públicas se comparten
   fuera; dentro, se envían a personas que sigues o se añaden a tu story. */
const PUBLIC_BASE = 'https://planes.app';   // dominio provisional, como la marca
function postUrl(po){ return `${PUBLIC_BASE}/p/${po.id}`; }
function postIsPublic(po){
  const author = getUser(po.authorId) || {};
  return (po.audience || 'publico') === 'publico' && author.profilePublic !== false;
}
// Metadatos Open Graph de la página pública de la publicación.
function shareMeta(po){
  const u = getUser(po.authorId) || { name:'' };
  const plan = po.planId && getPlan(po.planId);
  const cap = (po.caption || '').replace(/\s+/g, ' ').trim();
  return {
    title: `${u.name} en planes${plan ? ' · ' + plan.title : ''}`,
    description: cap.length > 120 ? cap.slice(0, 117).trimEnd() + '…' : cap,
    image: (po.imgs || [])[0] || '', url: postUrl(po), domain: PUBLIC_BASE.replace(/^https?:\/\//, ''),
  };
}
function shareText(po){ const m = shareMeta(po); return `${m.description ? m.description + ' ' : ''}${m.url}`; }
function externalShareUrl(po, app){
  const m = shareMeta(po), t = encodeURIComponent(shareText(po));
  return { whatsapp: `https://wa.me/?text=${t}`, telegram: `https://t.me/share/url?url=${encodeURIComponent(m.url)}&text=${encodeURIComponent(m.description)}` }[app];
}
function shareTargets(){ return USERS.filter(u => u.id !== 'me' && follows('me', u.id)); }
function openShare(id){
  const po = POSTS.find(p => p.id === id); if (!po) return;
  stopMusic();
  state.share = { id, to: [] };
  renderShareSheet();
}
function renderShareSheet(){
  const po = POSTS.find(p => p.id === state.share.id); if (!po) return;
  const m = shareMeta(po), pub = postIsPublic(po), sel = state.share.to;
  const people = shareTargets().map(u => `<button class="sh-person ${sel.includes(u.id)?'on':''}" onclick="toggleShareTo('${u.id}')" aria-pressed="${sel.includes(u.id)}">
      <span class="avatar">${escapeHtml(u.initials||initials(u.name))}${sel.includes(u.id)?`<i class="sh-ok">${ico('check')}</i>`:''}</span><span>${escapeHtml(u.name.split(' ')[0])}</span></button>`).join('');
  const ext = (app, icon, label) => `<a class="sh-app" href="${externalShareUrl(po, app)}" target="_blank" rel="noopener" onclick="logShare('${po.id}','${app}')"><span class="sh-ic">${ico(icon)}</span><span>${label}</span></a>`;
  const btn = (fn, icon, label) => `<button class="sh-app" onclick="${fn}"><span class="sh-ic">${ico(icon)}</span><span>${label}</span></button>`;
  showOverlay('ov-sheet', `<div class="sheet-bg" onclick="closeOverlay()"></div>
    <div class="sheet sh" role="dialog" aria-label="Compartir">
      <div class="sheet-h"><span>Compartir</span><button class="sv-x" onclick="closeOverlay()" aria-label="Cerrar">${ico('close')}</button></div>
      <div class="sheet-list">
        <div class="sh-sec">Enviar en planes</div>
        <div class="sh-people">${people || '<p class="hint">Aún no sigues a nadie.</p>'}</div>
        ${sel.length ? `<div class="sheet-in sh-msg"><input id="sh-msg" maxlength="${LIMITS.comment}" placeholder="Escribe un mensaje…"><button class="btn-primary sm" onclick="sendShareInApp()">Enviar</button></div>` : ''}
        ${pub || po.authorId === 'me' ? `<button class="sh-row" onclick="shareToStory('${po.id}')">${ico('live')}<span>Añadir a tu story</span>${ico('chevR')}</button>` : ''}
        <div class="sh-sec">Compartir fuera</div>
        ${pub ? `<div class="og-card" aria-label="Vista previa del enlace">
            <span class="og-img ${(po.media||[])[0]||'g-dark'}">${coverImg(m.image, 700)}</span>
            <span class="og-txt"><span class="og-d">${escapeHtml(m.domain)}</span><b>${escapeHtml(m.title)}</b><span>${escapeHtml(m.description)}</span></span></div>
          <p class="hint">Así se ve el enlace en WhatsApp, Telegram o un SMS: con la imagen de la publicación.</p>
          <div class="sh-apps">
            ${ext('whatsapp', 'chat', 'WhatsApp')}${ext('telegram', 'send', 'Telegram')}
            ${btn(`copyShareLink('${po.id}')`, 'link', 'Copiar enlace')}${btn(`downloadShareImage('${po.id}')`, 'download', 'Imagen')}${btn(`systemShare('${po.id}')`, 'dots', 'Más')}
          </div>`
        : `<p class="hint sh-lock">${ico('lock')} Esta publicación no es pública: solo se puede enviar dentro de planes a quien ya puede verla.</p>`}
      </div></div>`);
}
function toggleShareTo(uid){
  const msg = val('sh-msg'), t = state.share.to, i = t.indexOf(uid);
  if (i >= 0) t.splice(i, 1); else t.push(uid);
  renderShareSheet();
  const el = document.getElementById('sh-msg'); if (el && msg) el.value = msg;
}
function logShare(id, dest, to){
  const po = POSTS.find(p => p.id === id); if (!po) return;
  po.shares = (po.shares || 0) + 1;
  (po.shareLog = po.shareLog || []).push({ dest, to: to || null });
  saveState();
}
function sendShareInApp(){
  const to = state.share.to.slice(); if (!to.length) return;
  clip(val('sh-msg'), 'comment');   // el mensaje viajaría con el envío (mensajería: fuera del MVP)
  logShare(state.share.id, 'chat', to);
  const names = to.map(id => (getUser(id) || {}).name || '').map(n => n.split(' ')[0]);
  closeOverlay();
  toast('Enviada a ' + (names.length > 2 ? names.slice(0, 2).join(', ') + ' y ' + (names.length - 2) + ' más' : names.join(' y ')));
}
function shareToStory(id){
  const po = POSTS.find(p => p.id === id); if (!po) return;
  const u = getUser(po.authorId) || { handle:'' };
  STORIES.unshift({ id:'ss'+Date.now(), userId:'me', planId:po.planId||null, img:(po.imgs||[])[0]||'', minAgo:0,
    trackId:po.trackId||null, sharedPostId:po.id, text: po.authorId === 'me' ? (po.caption||'') : 'Publicación de ' + u.handle });
  logShare(id, 'story');
  closeOverlay(); toast('Añadida a tu story');
}
function copyShareLink(id){
  const po = POSTS.find(p => p.id === id); if (!po) return;
  const url = postUrl(po);
  const done = () => { logShare(id, 'copiar'); toast('Enlace copiado'); };
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, () => toast(url));
    else toast(url);
  } catch (e) { toast(url); }
}
// Imagen para compartir (og:image): 1200×630 con la foto, el pie, el autor y la marca.
function shareImage(po){
  return new Promise(resolve => {
    const c = document.createElement && document.createElement('canvas');
    const g = c && c.getContext && c.getContext('2d');
    if (!g) return resolve(null);
    c.width = 1200; c.height = 630;
    const m = shareMeta(po), u = getUser(po.authorId) || { name:'' };
    const finish = (img) => {
      g.fillStyle = '#16141c'; g.fillRect(0, 0, 1200, 630);
      if (img){ const r = Math.max(1200 / img.width, 630 / img.height), w = img.width * r, h = img.height * r; g.drawImage(img, (1200 - w) / 2, (630 - h) / 2, w, h); }
      const grd = g.createLinearGradient(0, 260, 0, 630); grd.addColorStop(0, 'rgba(0,0,0,0)'); grd.addColorStop(1, 'rgba(0,0,0,.85)');
      g.fillStyle = grd; g.fillRect(0, 0, 1200, 630);
      g.fillStyle = '#fff'; g.font = '700 44px system-ui, -apple-system, Segoe UI, sans-serif';
      const words = (m.description || m.title).split(' '); const lines = ['']; 
      words.forEach(w => { const l = lines[lines.length - 1]; if (g.measureText(l + w).width > 1080 && l) lines.push(w + ' '); else lines[lines.length - 1] = l + w + ' '; });
      lines.slice(0, 2).forEach((l, i) => g.fillText(i === 1 && lines.length > 2 ? l.trim() + '…' : l.trim(), 60, 500 + i * 54 - (lines.length > 1 ? 54 : 0)));
      g.font = '500 28px system-ui, -apple-system, Segoe UI, sans-serif'; g.fillStyle = 'rgba(255,255,255,.8)';
      g.fillText(`${u.name} · ${m.domain}`, 60, 580);
      g.font = '800 34px system-ui, -apple-system, Segoe UI, sans-serif'; g.fillStyle = '#fff'; g.textAlign = 'right';
      g.fillText('planes', 1140, 580);
      c.toBlob(b => resolve(b), 'image/jpeg', 0.85);
    };
    if (!m.image) return finish(null);
    const img = new Image(); img.crossOrigin = 'anonymous';
    img.onload = () => finish(img); img.onerror = () => finish(null);
    img.src = uimg(m.image, 1200);
  });
}
function downloadShareImage(id){
  const po = POSTS.find(p => p.id === id); if (!po) return;
  shareImage(po).then(b => {
    if (!b){ toast('Este navegador no puede generar la imagen'); return; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `planes-${po.id}.jpg`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    logShare(id, 'imagen'); toast('Imagen descargada');
  });
}
// Hoja de compartir del sistema (móvil): imagen + texto + enlace, si el navegador lo permite.
function systemShare(id){
  const po = POSTS.find(p => p.id === id); if (!po) return;
  const m = shareMeta(po);
  if (typeof navigator === 'undefined' || !navigator.share){ copyShareLink(id); return; }
  shareImage(po).then(b => {
    const data = { title: m.title, text: m.description, url: m.url };
    if (b && typeof File !== 'undefined'){ const f = new File([b], `planes-${po.id}.jpg`, { type:'image/jpeg' }); if (navigator.canShare && navigator.canShare({ files:[f] })) data.files = [f]; }
    navigator.share(data).then(() => logShare(id, 'sistema'), () => {});
  });
}

/* ---------- capa superpuesta: publicación, comentarios, stories, directos ---------- */
let overlayTimer = null;
function overlayEl(){ return document.getElementById('overlay'); }
function showOverlay(cls, html){ const o = overlayEl(); o.className = 'overlay ' + cls; o.innerHTML = html; o.hidden = false; }
function closeOverlay(){
  clearInterval(overlayTimer); overlayTimer = null;
  const o = overlayEl();
  if (musicNow.src === 'story' || String(musicNow.src).startsWith('pv:') || o.className.includes('ov-post')) stopMusic();
  o.hidden = true; o.innerHTML = ''; o.className = 'overlay';
}
function openPost(id){
  const po = POSTS.find(p=>p.id===id); if (!po) return;
  showOverlay('ov-post', `<div class="post-top"><button class="sv-x" onclick="closeOverlay()" aria-label="Cerrar">${ico('chevL')}</button><span>Publicación</span></div>${postCard(po)}`);
}
function openComments(id){
  const po = POSTS.find(p=>p.id===id); if (!po) return;
  if (!overlayEl().hidden && overlayEl().className.includes('ov-post')) state.sheetReturn = id;
  const list = (po.comments||[]).map(c => { const u = getUser(c.userId) || { name:c.userId, initials:'?' };
    return `<div class="cm"><span class="post-av sm">${escapeHtml(u.initials||'')}</span><p><b>${escapeHtml(u.handle||u.name)}</b> ${highlightCaption(c.text)}</p></div>`; }).join('')
    || '<p class="hint">Aún no hay comentarios. Escribe el primero.</p>';
  showOverlay('ov-sheet', `<div class="sheet-bg" onclick="closeSheet()"></div>
    <div class="sheet" role="dialog" aria-label="Comentarios">
      <div class="sheet-h"><span>Comentarios</span><button class="sv-x" onclick="closeSheet()" aria-label="Cerrar">${ico('close')}</button></div>
      <div class="sheet-list">${list}</div>
      <div class="sheet-in"><input id="cm-input" maxlength="${LIMITS.comment}" placeholder="Añade un comentario…" onkeydown="if(event.key==='Enter')addComment('${id}')"><button class="pa" onclick="addComment('${id}')" aria-label="Publicar comentario">${ico('send')}</button></div>
    </div>`);
}
function closeSheet(){ const back = state.sheetReturn; state.sheetReturn = null; closeOverlay(); if (back) openPost(back); }
function addComment(id){
  const text = clip(val('cm-input'), 'comment'); if (!text) return;
  const po = POSTS.find(p=>p.id===id); if (!po) return;
  (po.comments = po.comments || []).push({ userId:'me', text });
  saveState(); openComments(id); rerenderPost(id);
}

// Visor de stories: 5 s por story, toque a la izquierda o a la derecha para navegar.
const STORY_MS = 5000;
const storyState = { g:0, i:0, t:0 };
function openStory(g){
  Object.assign(storyState, { g, i:0, t:0 });
  renderStory();
  clearInterval(overlayTimer); overlayTimer = setInterval(tickStory, 100);
}
function tickStory(){
  storyState.t += 100;
  if (storyState.t >= STORY_MS) storyNext();
  else { const b = document.getElementById('sv-cur'); if (b) b.style.width = (storyState.t/STORY_MS*100) + '%'; }
}
function storyNext(){
  const groups = storyGroups(), g = groups[storyState.g];
  storyState.t = 0;
  if (g && storyState.i < g.list.length - 1) storyState.i++;
  else if (storyState.g < groups.length - 1){ storyState.g++; storyState.i = 0; }
  else { closeOverlay(); return; }
  renderStory();
}
function storyPrev(){
  storyState.t = 0;
  if (storyState.i > 0) storyState.i--;
  else if (storyState.g > 0){ storyState.g--; storyState.i = storyGroups()[storyState.g].list.length - 1; }
  renderStory();
}
function renderStory(){
  const g = storyGroups()[storyState.g]; if (!g){ closeOverlay(); return; }
  const s = g.list[storyState.i];
  const u = getUser(g.userId) || { name:'', initials:'?' };
  const p = getPlan(s.planId);
  const t = s.trackId && getTrack(s.trackId);
  const soundOn = !!(t && state.storySound);
  showOverlay('ov-story', `<div class="sv-media">${coverImg(s.img,800)}</div><div class="sv-shade"></div>
    <div class="sv-bars">${g.list.map((_,i)=>`<span class="sv-bar"><i ${i===storyState.i?'id="sv-cur"':''} style="width:${i<storyState.i?100:(i===storyState.i?storyState.t/STORY_MS*100:0)}%"></i></span>`).join('')}</div>
    <div class="sv-head"><span class="post-av">${escapeHtml(u.initials||'')}</span>
      <span class="sv-who"><b>${escapeHtml(u.name)}</b><span>${minLabel(s.minAgo)}${p?' · '+escapeHtml(p.title):''}</span></span>
      ${t ? `<button class="sv-x sv-sound ${soundOn?'on':''}" data-music="story" onclick="toggleStorySound()" aria-label="${soundOn?'Silenciar':'Activar sonido'}">${ico('mute')}${ico('volume')}</button>` : ''}
      <button class="sv-x" onclick="closeOverlay()" aria-label="Cerrar">${ico('close')}</button></div>
    ${t ? `<div class="sv-music ${soundOn?'on':''}" data-music="story">${ico('music')}<span class="eq"><i></i><i></i><i></i></span><span><b>${escapeHtml(t.title)}</b> · ${escapeHtml(t.artist)}</span></div>` : ''}
    <button class="sv-tap prev" onclick="storyPrev()" aria-label="Story anterior"></button>
    <button class="sv-tap next" onclick="storyNext()" aria-label="Story siguiente"></button>
    <p class="sv-text">${escapeHtml(s.text)}</p>
    ${p ? `<button class="sv-cta" onclick="closeOverlay();go('plan/${p.id}')">${ico('pin')} Ver el plan</button>` : ''}`);
  syncStoryMusic();
}

// Directo: espectadores y chat simulados que se actualizan solos.
const liveState = { id:null, host:false, viewers:0, chat:[], idx:0 };
function openLive(id, host){
  const l = LIVES.find(x=>x.id===id); if (!l) return;
  stopMusic();
  Object.assign(liveState, { id, host:!!host, viewers:l.viewers, chat:[], idx:0 });
  renderLive();
  clearInterval(overlayTimer); overlayTimer = setInterval(tickLive, 1600);
}
function tickLive(){
  liveState.chat.push(LIVE_CHAT[liveState.idx % LIVE_CHAT.length]); liveState.idx++;
  if (liveState.chat.length > 6) liveState.chat.shift();
  liveState.viewers = Math.max(1, liveState.viewers + Math.round(Math.random()*6) - 2);
  renderLiveChat();
}
function renderLive(){
  const l = LIVES.find(x=>x.id===liveState.id); if (!l){ closeOverlay(); return; }
  const u = getUser(l.userId) || { name:'', initials:'?' };
  const p = getPlan(l.planId);
  showOverlay('ov-live', `<div class="sv-media kb-on">${coverImg(l.img,800)}</div><div class="sv-shade"></div>
    <div class="sv-head"><span class="post-av">${escapeHtml(u.initials||'')}</span>
      <span class="sv-who"><b>${escapeHtml(u.name)}</b><span>${escapeHtml(l.title)}</span></span>
      <span class="live-badge">${ico('cast')} En directo</span><span class="lv-view" id="lv-view">${ico('eye')} ${liveState.viewers}</span>
      <button class="sv-x" onclick="${liveState.host?'endLive()':'closeOverlay()'}" aria-label="Cerrar">${ico('close')}</button></div>
    ${liveState.host ? `<div class="lv-host">${ico('shield')} Emites desde «${escapeHtml(p?p.title:'')}». No enfoques a quien no quiera salir.</div>` : ''}
    <div class="lv-chat" id="lv-chat"></div>
    <div class="lv-hearts" id="lv-hearts"></div>
    <div class="lv-bar">
      <input id="lv-input" class="lv-input" maxlength="${LIMITS.liveMsg}" placeholder="Escribe un comentario…" onkeydown="if(event.key==='Enter')sendLiveMsg()">
      <button class="pa" onclick="sendLiveMsg()" aria-label="Enviar">${ico('send')}</button>
      <button class="pa lv-like" onclick="liveHeart()" aria-label="Me gusta">${ico('heart')}</button>
      ${liveState.host ? `<button class="lv-cta end" onclick="endLive()">Finalizar</button>`
        : (p ? `<button class="lv-cta" onclick="closeOverlay();go('plan/${p.id}')">Ir al plan</button>` : '')}
    </div>`);
  renderLiveChat();
}
function renderLiveChat(){
  const c = document.getElementById('lv-chat');
  if (c) c.innerHTML = liveState.chat.map(m=>`<p><b>${escapeHtml(m.name)}</b> ${escapeHtml(m.text)}</p>`).join('');
  const v = document.getElementById('lv-view'); if (v) v.innerHTML = `${ico('eye')} ${liveState.viewers}`;
}
function sendLiveMsg(){
  const t = clip(val('lv-input'), 'liveMsg'); if (!t) return;
  liveState.chat.push({ name:ME.name, text:t }); if (liveState.chat.length > 6) liveState.chat.shift();
  const i = document.getElementById('lv-input'); if (i) i.value = '';
  renderLiveChat();
}
function liveHeart(){
  const h = document.getElementById('lv-hearts'); if (!h || !document.createElement) return;
  const el = document.createElement('i'); el.className = 'ico'; el.innerHTML = SVG.heart;
  el.style.left = (8 + Math.random()*28) + 'px'; h.appendChild(el);
  setTimeout(()=>el.remove(), 1700);
}
function renderCreateLive(){
  const view = document.getElementById('view-page');
  const options = PLANS.filter(p => (ME.attendedPlanIds||[]).includes(p.id) || p.host.name===ME.name || state.joined.has(p.id));
  view.innerHTML = pageHead('Emitir en directo') + `<div class="page-body form">
    <div class="field"><label for="f-liveplan">Plan desde el que emites</label>
      <select id="f-liveplan">${options.map(p=>`<option value="${p.id}">${escapeHtml(p.title)}</option>`).join('')}</select>
      <p class="hint">Solo se emite desde un plan en marcha al que asistes o que organizas.</p></div>
    <div class="field"><label for="f-livetitle">Título ${counter('f-livetitle','liveTitle')}</label><input ${lim('f-livetitle','liveTitle')} placeholder="Ej. Atardecer en directo desde Debod" /></div>
    <div class="block"><h4>${ico('shield')} Antes de empezar</h4><p class="hint">Pide permiso antes de enfocar a alguien; quien tenga su presencia en privado no debe salir. Los directos se pueden reportar y se moderan mientras se emiten.</p></div>
    <div class="form-actions"><button class="btn-primary" onclick="startLive()">${ico('cast')} Empezar directo</button></div>
  </div>`;
}
function startLive(){
  const planId = val('f-liveplan') || (PLANS[0] && PLANS[0].id);
  const p = getPlan(planId);
  const title = clip(val('f-livetitle'), 'liveTitle') || ('En directo desde ' + (p ? p.title : 'un plan'));
  const l = { id:'lme'+Date.now(), userId:'me', planId, img:(p && p.photo) || '', title, viewers:1, startedMin:0 };
  LIVES.unshift(l);
  state.contentTab = 'stories'; go('feed');
  openLive(l.id, true);
}
function endLive(){
  const i = LIVES.findIndex(x => x.id===liveState.id && x.userId==='me');
  if (i >= 0) LIVES.splice(i, 1);
  closeOverlay(); toast('Directo finalizado');
  if (state.contentTab==='stories') renderContent();
}
function emptyTab(icon,title,text){ return `<div class="empty-tab"><span class="empty-ic">${ico(icon)}</span><h3>${title}</h3><p>${text}</p></div>`; }
function renderContent(){
  const filters = document.getElementById('feed-filters');
  const list = document.getElementById('feed-list');
  document.querySelectorAll('.content-tabs button').forEach(b=> b.classList.toggle('active', b.dataset.tab===state.contentTab));
  if (state.contentTab==='disponibles'){ filters.style.display='flex'; renderFeed(); }
  else {
    filters.style.display='none';
    if (state.contentTab==='vividas') list.innerHTML = renderWall();
    else if (state.contentTab==='stories') list.innerHTML = renderStoriesTab();
    else list.innerHTML = emptyTab('at','Menciones','Aquí llegan los planes y stories donde te etiquetan. Una mención no se asocia a tu perfil hasta que la aceptas.');
  }
}

/* ---------- mapa ---------- */
function placeKindClass(pl){ return pl.secret ? 'secret' : (pl.kind==='negocio' ? 'business' : 'public'); }
function renderMap(){
  const map = document.getElementById('map');
  const pins = PLACES.map(pl=>{
    const sel = state.selectedPlace===pl.id ? 'selected' : '';
    const inner = pl.secret ? ico('lock') : (pl.kind==='negocio' ? ico('shield') : ico('pin'));
    return `<button class="pin ${placeKindClass(pl)} ${sel}" style="left:${pl.x}%;top:${pl.y}%" onclick="selectPlace('${pl.id}')" aria-label="${escapeHtml(pl.name)}">
      <span class="pin-dot">${inner}</span><span class="pin-cap">${pl.secret?'·····':escapeHtml(pl.name)}</span></button>`;
  }).join('');
  map.innerHTML = `
    <div class="map-hint">${ico('pin')} Madrid · ${PLACES.length} lugares cerca · toca un pin</div>
    ${pins}
    <div class="map-legend">
      <span class="lg"><i class="lgd business"></i>Negocio verificado</span>
      <span class="lg"><i class="lgd public"></i>Lugar público</span>
      <span class="lg"><i class="lgd secret"></i>Secreto</span>
    </div>`;
  renderMapSheet();
}
function renderMapSheet(){
  const sheet = document.getElementById('map-sheet');
  if (!state.selectedPlace){
    sheet.innerHTML = `<h3>Planes cerca de ti</h3><div class="sub">Toca un lugar en el mapa para ver sus planes y su histórico.</div>` +
      PLANS.slice(0,4).map(miniPlan).join('');
    return;
  }
  const pl = getPlace(state.selectedPlace);
  const plans = PLANS.filter(p=>p.placeId===pl.id);
  sheet.innerHTML = `
    <h3>${pl.secret?'Lugar por desvelar':escapeHtml(pl.name)} ${pl.verified?`<span class="vchk">${ico('check')}</span>`:''}</h3>
    <div class="sub">${pl.kind==='negocio'?'Negocio verificado':'Lugar público'} · ${pl.city} · ${rating(pl.rating)} · ${pl.hashtag}</div>
    ${plans.length?plans.map(miniPlan).join(''):'<div class="sub">Sin planes próximos en este lugar.</div>'}`;
}
function miniPlan(p){
  return `<button class="mini-plan" onclick="go('plan/${p.id}')">
    <span class="mini-thumb ${p.gradient}">${coverImg(p.photo,120)}</span>
    <span class="mini-info"><span class="mini-t">${escapeHtml(p.title)}</span>
      <span class="mini-m">${fmtWhen(p.when)} · ${sizeLabel(p)} · ${ico('geo')} ${attendanceView(p).n}</span></span>
    <span class="mini-corner">${freeIcon(p)}</span></button>`;
}
function selectPlace(id){ state.selectedPlace = state.selectedPlace===id ? null : id; renderMap(); }

/* ---------- asistencia + presencia ---------- */
function togglePresence(id){ state.presencePublic = !state.presencePublic; renderDetail(id); }
function registerArrival(id){
  const p = getPlan(id);
  if (state.attended.has(id)) return;
  state.attended.add(id); p.attended = (p.attended||0)+1;
  if (state.presencePublic){ if(!p.publicAttendees.includes(ME.initials)) p.publicAttendees.unshift(ME.initials); }
  else { p.attendedPrivate = (p.attendedPrivate||0)+1; }
  if (!ME.attendedPlanIds.includes(id)) ME.attendedPlanIds.push(id);
  saveState();
  toast(state.presencePublic ? 'Llegada verificada por ubicación · presencia pública' : 'Llegada verificada por ubicación · presencia privada');
  renderDetail(id);
}
function requestAttendance(id){
  if (state.requested.has(id)) return;
  state.requested.add(id);
  REQUESTS.push({ id:'r'+Date.now(), planId:id, userId:'me', status:'pendiente', message:'Solicitud enviada desde el prototipo.' });
  saveState();
  toast('Solicitud de asistencia enviada · pendiente de aprobación');
  renderDetail(id);
}
function canManage(p){ // ¿puede el usuario actual gestionar solicitudes de este plan?
  if (p.approval!=='manual') return false;
  if (p.groupId){ const g=getGroup(p.groupId); return g && g.members.some(m=>m.userId==='me' && m.role==='admin'); }
  return false;
}

/* ---------- detalle ---------- */
function accessTag(p){
  if (p.approval==='manual') return `<span class="tag tag-line">${ico('check')} Con aprobación</span>`;
  if (p.joinType==='libre') return `<span class="tag tag-line">${ico('globe')} Asistencia libre</span>`;
  return `<span class="tag tag-line">${ico('check')} Apuntarse</span>`;
}
function renderDetail(id){
  const p = getPlan(id);
  const place = getPlace(p.placeId);
  const cat = getCategory(p.category);
  const libre = p.joinType==='libre';
  const manual = p.approval==='manual';
  const joined = state.joined.has(p.id);
  const attended = state.attended.has(p.id);
  const requested = state.requested.has(p.id);
  const group = p.groupId ? getGroup(p.groupId) : null;
  const view = document.getElementById('view-detail');

  let cta;
  if (attended) cta = `<button class="btn-join done" disabled>${ico('check')} Asististe · verificado</button>`;
  else if (libre || joined) cta = `<button class="btn-join" onclick="registerArrival('${p.id}')">${ico('geo')} Registrar mi llegada</button>`;
  else if (manual) cta = requested
      ? `<button class="btn-join done" disabled>${ico('clock')} Solicitud enviada</button>`
      : `<button class="btn-join" onclick="requestAttendance('${p.id}')">Solicitar asistencia</button>`;
  else cta = `<button class="btn-join" onclick="toggleJoin('${p.id}')">Apuntarme</button>`;

  const pub = state.presencePublic;
  const presence = `
    <div class="block"><h4>Tu presencia</h4>
      <div class="toggle-row" onclick="togglePresence('${p.id}')">
        <span class="tg-ic">${ico(pub?'globe':'lock')}</span>
        <span class="tg-info"><span class="tg-n">${pub?'Pública':'Privada'}</span>
          <span class="tg-s">${pub?'Apareces entre los asistentes del plan':'Solo en tu perfil; no se te lista en el plan'}</span></span>
        <span class="switch ${pub?'on':''}"><span class="knob"></span></span>
      </div></div>`;

  const pubList = p.publicAttendees.slice(0,6);
  const av = attendanceView(p);
  const whoBlock = `
    <div class="block"><h4>Quién asiste · verificado por ubicación</h4>
      <div class="attendees">
        ${pubList.map(a=>`<span class="avatar sm">${escapeHtml(a)}</span>`).join('')}
        <span class="more">${ico('geo')} ${av.n} ${av.label}${av.priv?` · ${av.priv} en privado`:''}</span>
      </div>
      <p class="hint">${av.below
        ? `Con menos de ${PRIVACY_MIN} asistentes solo se cuentan los visibles, para que nadie pueda deducir quién fue en privado.`
        : 'Los asistentes en privado cuentan en el total pero no se listan.'}</p></div>`;

  const pend = requestsForPlan(p.id).filter(r=>r.status==='pendiente').length;
  const manageBlock = canManage(p) ? `
    <div class="block"><h4>Organización</h4>
      <p class="hint">Este plan es del grupo <b>${escapeHtml(group?group.name:'')}</b> y requiere aprobación. Como admin, gestionas las solicitudes.</p>
      <button class="btn-ghost" onclick="go('solicitudes/${p.id}')">${ico('users')} Gestionar solicitudes${pend?` · ${pend} pendientes`:''}</button>
    </div>` : (group ? `<div class="block"><h4>Organización</h4><p class="hint">Plan del grupo <b>${escapeHtml(group.name)}</b>. Las solicitudes las aprueban sus admins.</p></div>` : '');

  view.innerHTML = `
    <div class="detail-hero ${p.gradient}">
      ${coverImg(p.photo,820)}
      <span class="hero-scrim"></span>
      <button class="back-btn" onclick="history.back()" aria-label="Atrás">${ico('chevL')}</button>
      <div class="hero-content">
        <div class="tags-row">
          ${accessTag(p)}
          <span class="tag tag-line">${ico(ICON_FOR_CAT[p.category]||'hash')} ${cat?cat.label:''}</span>
          <span class="tag tag-line">${freeIcon(p)} ${p.paid?'De pago':'Gratis'}</span>
          ${p.secret?`<span class="tag tag-line">${ico('lock')} Secreto</span>`:''}
        </div>
        <h2>${escapeHtml(p.title)}</h2>
        <div class="hero-loc">${ico('pin')} ${p.secret?'Zona aprox. · Madrid':(place?place.name+' · '+place.city:'Madrid')}</div>
      </div>
    </div>
    <div class="detail-body">
      <div class="kpis">
        <div class="kpi"><div class="v">${fmtCountdown(p.when)}</div><div class="k">${ico('clock')} empieza en</div></div>
        <div class="kpi"><div class="v">${libre?'Libre':sizeLabel(p)}</div><div class="k">${ico('users')} ${libre?'sin aforo':p.groupMin+'–'+p.groupMax}</div></div>
        <div class="kpi"><div class="v">${av.n}</div><div class="k">${ico('geo')} ${av.below?'visibles':'asistentes'}</div></div>
      </div>
      ${p.secret?`<div class="secret-note"><span class="sn-ic">${ico('lock')}</span><p>La ubicación exacta se revela 2 horas antes del plan. El secreto es parte de la experiencia.</p></div>`:''}
      <div class="block"><h4>El plan</h4><p>${escapeHtml(p.summary)}</p>
        <p class="hint">${manual?'Plan con aprobación: envía una solicitud; el creador o los admins la aceptan o rechazan.':(libre?'Plan libre: no hace falta apuntarse. Tu asistencia se registra por geolocalización al llegar.':'Plan apuntado: requiere apuntarse. Al llegar, tu asistencia se verifica por geolocalización.')}</p>
      </div>
      ${manageBlock}
      ${whoBlock}
      ${presence}
      <div class="block"><h4>Anfitrión</h4>
        <button class="host-card linkable" onclick="go('u/${p.host.business?'azotea':'me'}')">
          <span class="avatar">${initials(p.host.name)}</span>
          <div class="meta"><div class="n">${escapeHtml(p.host.name)} ${p.host.verified?`<span class="vchk">${ico('check')}</span>`:''} ${p.host.business?typeBadge({type:'profesional'}):''}</div>
            <div class="s">${rating(p.host.rating)} · responde del plan</div></div>
          <span class="pl-arrow">${ico('chevR')}</span>
        </button>
        <div class="trust-row"><span class="trust">${ico('shield')} Identidad verificada</span><span class="trust">${ico('check')} Fiabilidad ${p.host.reliability}%</span></div>
      </div>
      <div class="block"><h4>Lugar</h4>
        <button class="place-link" onclick="go('mapa');selectPlace('${place?place.id:''}')">
          <span class="mini-thumb ${p.gradient}">${coverImg(p.photo,120)}</span>
          <span class="pl-info"><span class="pl-n">${p.secret?'Zona aproximada · centro de Madrid':(place?place.name:'Madrid')}</span>
            <span class="pl-s">${place?place.city+' · '+(place.kind==='negocio'?'Negocio verificado':'Lugar público')+' · '+place.hashtag:''}</span></span>
          <span class="pl-arrow">${ico('chevR')}</span></button>
      </div>
      <div class="block"><h4>Seguridad</h4>
        <div class="trust-row"><span class="trust">${ico('pin')} Punto de encuentro in-app</span><span class="trust">${ico('alert')} Botón SOS</span><span class="trust">${ico('user')} Contacto de confianza</span></div>
      </div>
      <div class="block"><h4>Reseñas de ediciones anteriores</h4>
        ${REVIEWS.map(r=>`<div class="review"><div class="top"><span>${r.author}</span><span class="st">${Array(r.stars).fill(ico('star')).join('')}</span></div><p>${r.text}</p></div>`).join('')}
      </div>
      <div class="action-bar">
        <div class="pr"><div class="v">${p.paid?p.price+' €':'Gratis'}</div><div class="k">${p.paid?'pago seguro · escrow':(libre?'plan libre':'sin coste')}</div></div>
        ${cta}
      </div>
    </div>`;
}
function toggleJoin(id){
  const p=getPlan(id);
  if (state.joined.has(id)) state.joined.delete(id);
  else { state.joined.add(id); toast(p.paid?'Reserva retenida en escrow':'Apuntado · verifica tu identidad antes del plan'); }
  saveState();
  renderDetail(id);
}

/* ---------- solicitudes (aprobación) ---------- */
function renderRequests(planId){
  const p = getPlan(planId);
  const group = p.groupId ? getGroup(p.groupId) : null;
  const admins = group ? group.members.filter(m=>m.role==='admin').map(m=>getUser(m.userId)) : [];
  const reqs = requestsForPlan(planId);
  const rowsHtml = reqs.map(r=>{
    const u = getUser(r.userId) || { name:r.userId, initials:'?' };
    const st = r.status;
    return `<div class="req">
      <span class="avatar">${u.initials||initials(u.name)}</span>
      <div class="req-info"><div class="req-n">${escapeHtml(u.name)}</div><div class="req-m">${escapeHtml(r.message||'')}</div></div>
      ${st==='pendiente'
        ? `<div class="req-actions"><button class="ico-btn ok" onclick="resolveRequest('${r.id}','aceptada','${planId}')" aria-label="Aceptar">${ico('check')}</button>
           <button class="ico-btn no" onclick="resolveRequest('${r.id}','rechazada','${planId}')" aria-label="Rechazar">${ico('close')}</button></div>`
        : `<span class="req-state ${st}">${st==='aceptada'?'Aceptada':'Rechazada'}</span>`}
    </div>`;
  }).join('') || `<p class="hint">No hay solicitudes para este plan.</p>`;

  const view = document.getElementById('view-page');
  view.innerHTML = pageHead('Solicitudes de asistencia') + `
    <div class="page-body">
      <div class="block"><h4>${escapeHtml(p.title)}</h4>
        ${group?`<p class="hint">Aprueban los admins del grupo <b>${escapeHtml(group.name)}</b>: ${admins.map(a=>escapeHtml(a.name)).join(', ')}.</p>`
                :'<p class="hint">Las aprueba el creador del plan.</p>'}
      </div>
      <div class="block"><h4>Solicitudes (${reqs.filter(r=>r.status==='pendiente').length} pendientes)</h4>${rowsHtml}</div>
    </div>`;
}
function resolveRequest(reqId, decision, planId){
  const r = REQUESTS.find(x=>x.id===reqId); if(!r) return;
  r.status = decision;
  if (decision==='aceptada'){
    // Aceptar inscribe al usuario; la asistencia real se verifica al llegar, no se suma aquí.
    const p = getPlan(planId);
    p.joined = (p.joined||0)+1;
    if (r.userId==='me') state.joined.add(planId);
    toast('Solicitud aceptada · inscrito; su asistencia se verificará al llegar');
  } else toast('Solicitud rechazada');
  saveState();
  renderRequests(planId);
}

/* ---------- perfil ---------- */
function profileGridPosts(uid){
  const me = uid === 'me';
  const all = postsByUser(uid).slice().sort((a,b)=>(a.ago||0)-(b.ago||0));
  const f = state.profileFilter;
  const posts = byOrigin(all, f);
  const filter = all.length ? `<div class="prof-filter">${originFilter(all, f, v => `setProfileFilter('${v}','${uid}')`, me ? 'Tu vida' : 'Su vida')}</div>` : '';
  const emptyText = { todo:'Aún no hay publicaciones.', plan:'Aún no hay publicaciones de planes.', vida: me ? 'Aún no has compartido nada de tu vida.' : 'Aún no ha compartido nada de su vida.' }[f];
  if (!posts.length) return `${filter}<div class="empty-tab"><span class="empty-ic">${ico('image')}</span><p>${emptyText}</p></div>`;
  return `${filter}<div class="grid">${posts.map(po=>{ const plan = po.planId && getPlan(po.planId);
    return `
    <button class="cell ${po.media[0]}" onclick="openPost('${po.id}')" aria-label="${escapeHtml(po.caption)}">
      ${coverImg((po.imgs||[])[0],500)}
      <span class="cell-scrim"></span><span class="cell-corner">${ico(POST_ICON[po.kind]||'image')}</span>
      <span class="cell-info"><span class="cell-meta">${plan ? `${ico('ticket')} <span class="cm-t">${escapeHtml(plan.title)}</span>` : `${ico('heart')} ${po.likes}`}</span></span>
    </button>`; }).join('')}</div>`;
}
function setProfileFilter(f, uid){ stopMusic(); state.profileFilter = f; const g = document.getElementById('profile-grid'); if (g) g.innerHTML = profileGridPosts(uid); }
function profileGridVividas(u){
  const plans = (u.attendedPlanIds||[]).map(getPlan).filter(Boolean);
  if (!plans.length) return `<div class="empty-tab"><span class="empty-ic">${ico('play')}</span><p>Aún no hay Vividas.</p></div>`;
  return `<div class="grid">${plans.map(p=>`
    <button class="cell ${p.gradient}" onclick="go('plan/${p.id}')" aria-label="${escapeHtml(p.title)}">
      ${coverImg(p.photo,500)}
      <span class="cell-scrim"></span><span class="cell-corner">${freeIcon(p)}</span>
      <span class="cell-info"><span class="cell-title">${escapeHtml(p.title)}</span></span></button>`).join('')}</div>`;
}
function renderProfile(uid){
  const me = (uid==='me' || !uid);
  const u = me ? ME : getUser(uid);
  if (!u){ document.getElementById(me?'view-perfil':'view-page').innerHTML = '<div class="empty-tab"><p>Perfil no encontrado.</p></div>'; return; }
  const container = me ? document.getElementById('view-perfil') : document.getElementById('view-page');
  const tab = state.profileTab;
  const fid = me ? 'me' : u.id;
  if (state.profileFilterUid !== fid){ state.profileFilterUid = fid; state.profileFilter = 'todo'; }  // cada perfil empieza en "Todo"
  // Datos de negocio sin etiquetas, como en Instagram: categoría en gris y una
  // línea con dirección y web. Lo obvio ("Categoría", "Web"...) no se escribe.
  const biz = (u.type==='profesional' && u.business) || null;
  const bizLinks = biz ? [
    biz.address ? `<span>${ico('pin')} ${escapeHtml(biz.address)}</span>` : '',
    biz.web ? `<button class="ph-web" onclick="toast('Abriría ${escapeHtml(biz.web)}')">${ico('link')} ${escapeHtml(biz.web)}</button>` : '',
  ].join('') : '';
  const about = (biz && biz.category ? `<span class="ph-cat">${escapeHtml(biz.category)}</span>` : '')
    + (u.bio ? `<span>${escapeHtml(u.bio)}</span>` : '')
    + (bizLinks ? `<span class="ph-biz">${bizLinks}</span>` : '');
  const nPosts = postsByUser(u.id).length, nAtt = (u.attendedPlanIds||[]).length;
  const head = me ? '' : pageHead(u.handle || u.name);   // como en Instagram: el @usuario arriba, el nombre abajo
  container.innerHTML = `${head}
    <div class="profile-head">
      <span class="avatar lg">${u.initials||initials(u.name)}</span>
      <div class="ph-main">
        <div class="ph-top"><span class="ph-name">${escapeHtml(u.name)} ${u.verified?`<span class="vchk">${ico('check')}</span>`:''}${typeBadge(u)}</span>
          ${me?`<button class="ph-priv" onclick="go('ajustes')">${ico('gear')} Ajustes</button>`:followButton(u)}</div>
        ${!me && follows(u.id,'me') && !follows('me',u.id) ? '<span class="follows-you">Te sigue</span>' : ''}
        ${me ? `<div class="ph-handle">${u.handle}</div>` : ''}
        <div class="ph-stats">
          <span><b>${nPosts}</b> ${nPosts===1?'publicación':'publicaciones'}</span>
          <span><b>${nAtt}</b> ${nAtt===1?'asistido':'asistidos'}</span>
          <span><b>${u.followers||0}</b> seguidores</span>
        </div>
      </div>
    </div>
    ${about ? `<p class="bio">${about}</p>` : ''}
    ${me ? `<div class="ph-actions"><button class="ph-btn" onclick="go('editar-perfil')">Editar perfil</button><button class="ph-btn" onclick="toast('Compartir perfil estará disponible en la app')">Compartir perfil</button></div>` : ''}
    ${(me && !u.profilePublic)?`<div class="priv-banner">${ico('lock')} Perfil privado: solo tus seguidores aprobados ven tu actividad.</div>`:''}
    <div class="prof-tabs" role="tablist">${[['posts','grid','Publicaciones'],['vividas','play','Vividas'],['valoraciones','star','Valoraciones']].map(([t,i,l])=>
      `<button class="${tab===t?'active':''}" role="tab" aria-selected="${tab===t}" aria-label="${l}" title="${l}" onclick="setProfileTab('${t}','${u.id}')">${ico(i)}<span class="pt-l">${l}</span></button>`).join('')}
    </div>
    <div id="profile-grid">${tab==='posts'?profileGridPosts(me?'me':u.id):(tab==='vividas'?profileGridVividas(u):profileRatings(u, me))}</div>`;
}
function setProfileTab(t, uid){ state.profileTab=t; renderProfile(uid==='me'?'me':uid); }

/* ---------- valoraciones de planes y quién las ve ----------
   Cada valoración es pública o privada: por defecto según la configuración general
   de su autor y, si quiere, cambiada para ese plan. El autor decide además quién ve
   las públicas y quién las privadas: todos, sus seguidores o sus amigos (las privadas
   también "solo yo"). Seguidor = te sigue; amigo = os seguís los dos. */
const AUD_LABEL = { todos:'Todos', seguidores:'Seguidores', amigos:'Amigos', solo_yo:'Solo tú' };
const AUD_OPTIONS = { publica:['todos','seguidores','amigos'], privada:['seguidores','amigos','solo_yo'] };
function ratingPrefs(u){ return Object.assign({ default:'publica', publica:'todos', privada:'solo_yo' }, (u && u.ratings) || {}); }
function ratingVis(r){ return r.visibility || ratingPrefs(getUser(r.userId)).default; }
function ratingAudience(r){ return ratingPrefs(getUser(r.userId))[ratingVis(r)]; }
// Relación de quien mira (viewer) con el autor (owner).
function relation(ownerId, viewerId){
  if (ownerId === viewerId) return 'yo';
  if (areFriends(ownerId, viewerId)) return 'amigo';
  return follows(viewerId, ownerId) ? 'seguidor' : 'nadie';
}
function canSeeRating(r, viewerId){
  const rel = relation(r.userId, viewerId || 'me'), aud = ratingAudience(r);
  if (rel === 'yo') return true;
  if (aud === 'todos') return true;
  if (aud === 'seguidores') return rel === 'seguidor' || rel === 'amigo';
  if (aud === 'amigos') return rel === 'amigo';
  return false;   // solo_yo
}
function stars(n){ return `<span class="r-stars" aria-label="${n} de 5">${[1,2,3,4,5].map(i=>`<i class="${i<=n?'on':''}">${SVG.star}</i>`).join('')}</span>`; }
function visChip(r){
  const vis = ratingVis(r);
  return `<button class="vis-chip" onclick="openRatingSheet('${r.planId}')">${ico(vis==='publica'?'globe':'lock')} ${vis==='publica'?'Pública':'Privada'} · ${AUD_LABEL[ratingAudience(r)]}${r.visibility?'':' <span class="vc-gen">(general)</span>'}</button>`;
}
function ratingCard(r, own){
  const p = getPlan(r.planId); if (!p) return '';
  return `<div class="rating">
    <button class="r-thumb ${p.gradient}" onclick="go('plan/${p.id}')" aria-label="${escapeHtml(p.title)}">${coverImg(p.photo,200)}</button>
    <div class="r-body">
      <button class="r-title" onclick="go('plan/${p.id}')">${escapeHtml(p.title)}</button>
      <div class="r-meta">${stars(r.stars)}<span>hace ${r.daysAgo || 0} d</span></div>
      ${r.text ? `<p class="r-text">${escapeHtml(r.text)}</p>` : ''}
      ${own ? visChip(r) : ''}
    </div></div>`;
}
function profileRatings(u, me){
  const uid = me ? 'me' : u.id;
  const mine = RATINGS.filter(r => r.userId === uid).sort((a,b)=>(a.daysAgo||0)-(b.daysAgo||0));
  if (!me){
    const visible = mine.filter(r => canSeeRating(r, 'me'));
    // No se dice cuántas hay ocultas: delataría a qué planes fue.
    return visible.length ? `<div class="ratings">${visible.map(r => ratingCard(r, false)).join('')}</div>`
      : `<div class="empty-tab"><span class="empty-ic">${ico('star')}</span><p>No hay valoraciones que puedas ver.</p></div>`;
  }
  const pr = ratingPrefs(ME);
  const pending = (ME.attendedPlanIds || []).filter(id => !mine.some(r => r.planId === id)).map(getPlan).filter(Boolean);
  return `<div class="ratings">
    <button class="r-prefs" onclick="go('ajustes')">${ico('eye')}<span>Por defecto, <b>${pr.default==='publica'?'públicas':'privadas'}</b>. Públicas: ${AUD_LABEL[pr.publica]} · Privadas: ${AUD_LABEL[pr.privada]}</span>${ico('chevR')}</button>
    ${pending.map(p => `<div class="rating pending"><span class="r-thumb ${p.gradient}">${coverImg(p.photo,200)}</span>
      <div class="r-body"><span class="r-title">${escapeHtml(p.title)}</span><span class="r-meta">Asististe · sin valorar</span>
      <button class="vis-chip solid" onclick="openRatingSheet('${p.id}')">${ico('star')} Valorar</button></div></div>`).join('')}
    ${mine.map(r => ratingCard(r, true)).join('')}
  </div>`;
}

// Hoja para valorar un plan o cambiar su valoración y su visibilidad.
function openRatingSheet(planId){
  const r = RATINGS.find(x => x.userId === 'me' && x.planId === planId);
  state.rateDraft = { planId, stars: r ? r.stars : 0, text: r ? r.text : '', visibility: r ? r.visibility : null };
  renderRatingSheet();
}
function renderRatingSheet(){
  const d = state.rateDraft, p = getPlan(d.planId), pr = ratingPrefs(ME);
  const opts = [[null, `General (${pr.default==='publica'?'pública':'privada'})`, 'gear'], ['publica','Pública','globe'], ['privada','Privada','lock']];
  const eff = d.visibility || pr.default;
  showOverlay('ov-sheet', `<div class="sheet-bg" onclick="closeOverlay()"></div>
    <div class="sheet" role="dialog" aria-label="Valorar plan">
      <div class="sheet-h"><span>${escapeHtml(p ? p.title : 'Valorar')}</span><button class="sv-x" onclick="closeOverlay()" aria-label="Cerrar">${ico('close')}</button></div>
      <div class="sheet-list form">
        <div class="rate-pick" role="radiogroup" aria-label="Estrellas">${[1,2,3,4,5].map(i=>`<button class="${i<=d.stars?'on':''}" onclick="setRateField('stars',${i})" aria-label="${i} estrellas">${SVG.star}</button>`).join('')}</div>
        <div class="field"><label for="f-rtext">Tu opinión ${counter('f-rtext','rating',d.text)}</label>
          <textarea ${lim('f-rtext','rating')} rows="3" placeholder="¿Qué tal estuvo? Ayuda a otros a decidir">${escapeHtml(d.text||'')}</textarea></div>
        <div class="field"><label>Quién la ve</label>
          <div class="iseg">${opts.map(([v,l,n])=>`<button class="${d.visibility===v?'active':''}" onclick="setRateField('visibility',${v?`'${v}'`:'null'})">${ico(n)}<span>${l}</span></button>`).join('')}</div>
          <p class="hint">${eff==='publica'?'Pública':'Privada'}: la ${ratingAudienceText(pr[eff])}. Quién ve cada tipo se cambia en Ajustes.</p></div>
        <div class="form-actions"><button class="btn-primary" onclick="saveRating()">${ico('check')} Guardar</button></div>
      </div></div>`);
}
function ratingAudienceText(aud){ return { todos:'puede ver cualquiera', seguidores:'ven tus seguidores', amigos:'ven tus amigos (os seguís los dos)', solo_yo:'ves solo tú' }[aud]; }
function setRateField(k, v){ state.rateDraft.text = val('f-rtext'); state.rateDraft[k] = v; renderRatingSheet(); }
function saveRating(){
  const d = state.rateDraft; d.text = clip(val('f-rtext'), 'rating');
  if (!d.stars){ toast('Elige de 1 a 5 estrellas'); return; }
  let r = RATINGS.find(x => x.userId === 'me' && x.planId === d.planId);
  if (!r){ r = { id:'ra'+Date.now(), userId:'me', planId:d.planId, daysAgo:0 }; RATINGS.unshift(r); }
  Object.assign(r, { stars:d.stars, text:d.text, visibility:d.visibility });
  saveState(); closeOverlay(); toast('Valoración guardada');
  state.profileTab = 'valoraciones'; renderProfile('me');
}
// Configuración general (Ajustes ▸ Privacidad ▸ Valoraciones).
function setRatingPref(k, v){ ME.ratings = Object.assign(ratingPrefs(ME), { [k]: v }); saveState(); renderSettings(); }

/* ---------- seguir / amigos ---------- */
function toggleFollow(uid){
  const i = FOLLOWS.findIndex(([a,b]) => a === 'me' && b === uid);
  const u = getUser(uid) || { name:'' };
  if (i >= 0){ FOLLOWS.splice(i, 1); toast('Has dejado de seguir a ' + u.name); }
  else { FOLLOWS.push(['me', uid]); toast(areFriends('me', uid) ? 'Ahora sois amigos: os seguís los dos' : 'Siguiendo a ' + u.name); }
  saveState(); renderProfile(uid);
}
function followButton(u){
  const iFollow = follows('me', u.id), theyFollow = follows(u.id, 'me');
  const label = iFollow ? (theyFollow ? `${ico('check')} Amigos` : 'Siguiendo') : (theyFollow ? 'Seguir también' : 'Seguir');
  return `<button class="ph-priv ${iFollow?'':'primary'}" onclick="toggleFollow('${u.id}')">${label}</button>`;
}

/* ---------- editar perfil ---------- */
const BIZ_CATEGORIES = ['Ocio nocturno','Restaurante','Bar','Cafetería','Cultura','Deporte','Bienestar','Organizador de eventos','Turismo','Otro'];
function renderEditProfile(){
  const view = document.getElementById('view-page');
  const u = ME, biz = u.business || {};
  const pro = u.type === 'profesional';
  const field = (id, key, label, value, extra='') => `<div class="field"><label for="${id}">${label} ${counter(id, key, value)}</label>
    <input ${lim(id, key)} value="${escapeHtml(value||'')}" ${extra} /></div>`;
  view.innerHTML = pageHead('Editar perfil') + `<div class="page-body form">
    <div class="ep-photo"><span class="avatar lg" id="ep-av">${escapeHtml(u.initials || initials(u.name))}</span>
      <button class="pb-action" onclick="toast('Cambiar la foto estará disponible en la app')">Cambiar foto</button></div>
    ${field('f-pname', 'name', 'Nombre', u.name, 'placeholder="Tu nombre o el de tu negocio" autocomplete="name"')}
    <div class="field"><label for="f-puser">Nombre de usuario ${counter('f-puser', 'username', (u.handle||'').replace(/^@/,''))}</label>
      <div class="at-input"><span>@</span><input id="f-puser" maxlength="${LIMITS.username}" value="${escapeHtml((u.handle||'').replace(/^@/,''))}" autocapitalize="none" spellcheck="false" oninput="this.value=this.value.toLowerCase();countChars(this,'username');checkUsername()" /></div>
      <p class="hint" id="ep-user-msg">De ${USERNAME_MIN} a ${LIMITS.username} caracteres: minúsculas, números, punto y guion bajo.</p></div>
    <div class="field"><label for="f-pbio">Descripción ${counter('f-pbio', 'bio', u.bio)}</label>
      <textarea ${lim('f-pbio','bio')} rows="3" placeholder="Cuéntale a la gente quién eres y qué planes te gustan">${escapeHtml(u.bio||'')}</textarea></div>
    ${pro ? `<div class="adv-title">Cuenta profesional</div>
      <div class="field"><label for="f-pcat">Categoría</label><select id="f-pcat">${BIZ_CATEGORIES.map(c=>`<option ${biz.category===c?'selected':''}>${c}</option>`).join('')}</select></div>
      ${field('f-pweb', 'web', 'Web', biz.web, 'placeholder="tunegocio.es" inputmode="url" autocapitalize="none"')}
      ${field('f-paddr', 'address', 'Dirección', biz.address, 'placeholder="Calle, número, ciudad"')}` : ''}
    <div class="form-actions"><button class="btn-primary" onclick="saveProfile()">${ico('check')} Guardar</button></div>
  </div>`;
}
function checkUsername(){
  const msg = document.getElementById('ep-user-msg'); if (!msg) return '';
  const err = usernameError(val('f-puser').trim(), ME.id);
  msg.textContent = err || 'Disponible.';
  msg.classList.toggle('err', !!err);
  return err;
}
function saveProfile(){
  const name = clip(val('f-pname'), 'name');
  if (!name){ toast('El nombre no puede estar vacío'); return; }
  const user = val('f-puser').trim().toLowerCase();
  const err = usernameError(user, ME.id);
  if (err){ checkUsername(); toast(err); return; }
  ME.name = name; ME.handle = '@' + user; ME.initials = initials(name);
  ME.bio = clip(val('f-pbio'), 'bio');
  if (ME.type === 'profesional'){
    ME.business = { ...(ME.business||{}), category: val('f-pcat') || (ME.business||{}).category,
      web: clip(val('f-pweb'), 'web'), address: clip(val('f-paddr'), 'address') };
  }
  saveState();
  toast('Perfil actualizado'); go('perfil');
}

/* ---------- ajustes ---------- */
function renderSettings(){
  const view = document.getElementById('view-page');
  const row = (icon,label,extra='')=>`<button class="set-row" onclick="toast('Pendiente en el prototipo')"><span class="sr-ic">${ico(icon)}</span><span class="sr-l">${label}</span>${extra}<span class="pl-arrow">${ico('chevR')}</span></button>`;
  view.innerHTML = pageHead('Configuración') + `
    <div class="page-body">
      <div class="set-group"><div class="set-title">Cuenta</div>
        <button class="set-row" onclick="go('editar-perfil')"><span class="sr-ic">${ico('user')}</span><span class="sr-l">Editar perfil</span><span class="pl-arrow">${ico('chevR')}</span></button>
        <div class="set-row static"><span class="sr-ic">${ico('briefcase')}</span><span class="sr-l">Tipo de cuenta</span>
          <span class="pro-badge sm">${ME.type==='profesional'?'Profesional':'Usuario'}</span></div>
        <button class="set-row" onclick="toast('Cuentas profesionales: condiciones y precios pendientes de definir')"><span class="sr-ic">${ico('briefcase')}</span><span class="sr-l">Cambiar a cuenta profesional</span><span class="soon">Pendiente</span><span class="pl-arrow">${ico('chevR')}</span></button>
      </div>
      <div class="set-group"><div class="set-title">Privacidad</div>
        <div class="toggle-row set" onclick="toggleProfilePrivacy()">
          <span class="tg-ic">${ico(ME.profilePublic?'globe':'lock')}</span>
          <span class="tg-info"><span class="tg-n">Perfil ${ME.profilePublic?'público':'privado'}</span><span class="tg-s">Quién puede ver tu actividad</span></span>
          <span class="switch ${ME.profilePublic?'on':''}"><span class="knob"></span></span></div>
        <div class="toggle-row set" onclick="togglePresenceDefault()">
          <span class="tg-ic">${ico(ME.presencePublic?'globe':'lock')}</span>
          <span class="tg-info"><span class="tg-n">Presencia por defecto: ${ME.presencePublic?'pública':'privada'}</span><span class="tg-s">Cómo apareces al registrar tu llegada</span></span>
          <span class="switch ${ME.presencePublic?'on':''}"><span class="knob"></span></span></div>
      </div>
      <div class="set-group"><div class="set-title">Valoraciones de planes</div>
        ${(() => { const pr = ratingPrefs(ME); const seg = (k, opts) => `<div class="iseg">${opts.map(([v,l,n])=>`<button class="${pr[k]===v?'active':''}" onclick="setRatingPref('${k}','${v}')">${ico(n)}<span>${l}</span></button>`).join('')}</div>`;
          const audIco = { todos:'globe', seguidores:'users', amigos:'heartO', solo_yo:'lock' };
          const nFriends = USERS.filter(x => x.id !== 'me' && areFriends('me', x.id)).length;
          return `<div class="set-box">
            <span class="sb-l">Tus valoraciones, por defecto</span>${seg('default', [['publica','Públicas','globe'],['privada','Privadas','lock']])}
            <span class="sb-l">Quién ve las públicas</span>${seg('publica', AUD_OPTIONS.publica.map(v=>[v,AUD_LABEL[v],audIco[v]]))}
            <span class="sb-l">Quién ve las privadas</span>${seg('privada', AUD_OPTIONS.privada.map(v=>[v,AUD_LABEL[v],audIco[v]]))}
            <p class="hint">Seguidores: quien te sigue. Amigos: quien te sigue y a quien sigues (tienes ${nFriends}). En cada plan puedes hacer una valoración pública o privada desde tu perfil ▸ Valoraciones.</p></div>`; })()}
      </div>
      <div class="set-group"><div class="set-title">General</div>
        ${row('bell','Notificaciones')}
        ${row('shield','Seguridad y verificación')}
        ${row('card','Pagos y reembolsos')}
        ${row('doc','Datos y legal')}
      </div>
      <div class="set-group"><div class="set-title">Prototipo</div>
        <div class="set-row static"><span class="sr-ic">${ico('image')}</span><span class="sr-l">Fotos de Unsplash (licencia Unsplash)</span></div>
        <button class="set-row" onclick="resetDemo()"><span class="sr-ic">${ico('repeat')}</span><span class="sr-l">Restablecer demo</span><span class="soon">borra lo creado</span></button>
      </div>
      <div class="set-group">
        <button class="set-row danger" onclick="toast('Sesión cerrada (demo)')"><span class="sr-ic">${ico('logout')}</span><span class="sr-l">Cerrar sesión</span></button>
      </div>
    </div>`;
}
function toggleProfilePrivacy(){ ME.profilePublic = !ME.profilePublic; saveState(); renderSettings(); }
function togglePresenceDefault(){ ME.presencePublic = !ME.presencePublic; state.presencePublic = ME.presencePublic; saveState(); renderSettings(); }

/* ---------- grupos ---------- */
function roleBadge(role){ return role==='admin' ? `<span class="role admin">${ico('shield')} Admin</span>` : `<span class="role">Miembro</span>`; }
function renderGroups(){
  const view = document.getElementById('view-grupos');
  const cards = GROUPS.map(g=>{
    const mine = g.members.find(m=>m.userId==='me');
    return `<button class="group-card" onclick="go('grupo/${g.id}')">
      <span class="group-cover ${g.gradient}">${ico('group')}</span>
      <span class="gc-info"><span class="gc-n">${escapeHtml(g.name)}</span>
        <span class="gc-m">${g.members.length} miembros · ${g.planIds.length} planes</span></span>
      ${mine?roleBadge(mine.role):''}<span class="pl-arrow">${ico('chevR')}</span></button>`;
  }).join('');
  view.innerHTML = `
    <div class="page-bar"><span class="pb-title">Grupos</span>
      <button class="pb-action" onclick="go('crear-grupo')">${ico('plus')} Crear</button></div>
    <div class="page-body">${cards || emptyTab('group','Sin grupos','Crea un grupo para organizar planes con varios admins.')}</div>`;
}
function renderGroupDetail(id){
  const g = getGroup(id);
  const view = document.getElementById('view-page');
  if (!g){ view.innerHTML = pageHead('Grupo')+'<div class="empty-tab"><p>Grupo no encontrado.</p></div>'; return; }
  const admins = g.members.filter(m=>m.role==='admin').map(m=>getUser(m.userId)?.name||m.userId);
  const members = g.members.map(m=>{ const u=getUser(m.userId)||{name:m.userId,initials:'?'};
    return `<button class="member" onclick="go('u/${m.userId}')"><span class="avatar sm">${u.initials||initials(u.name)}</span>
      <span class="mem-n">${escapeHtml(u.name)}${m.userId==='me'?' (tú)':''}</span>${roleBadge(m.role)}</button>`; }).join('');
  const plans = g.planIds.map(getPlan).filter(Boolean).map(miniPlan).join('') || '<p class="hint">Aún no hay planes en el grupo.</p>';
  view.innerHTML = pageHead(g.name) + `
    <div class="page-body">
      <div class="group-hero ${g.gradient}">${ico('group')}</div>
      <p class="bio">${escapeHtml(g.about)}</p>
      <div class="block"><h4>Miembros (${g.members.length})</h4>${members}
        <p class="hint">Las solicitudes de asistencia a los planes del grupo las aprueban los admins: <b>${admins.map(escapeHtml).join(', ')}</b>.</p></div>
      <div class="block"><h4>Planes del grupo</h4>${plans}
        <button class="btn-ghost" onclick="state.pendingGroup='${g.id}';go('crear-plan')">${ico('plus')} Crear plan en el grupo</button></div>
    </div>`;
}
function renderCreateGroup(){
  const view = document.getElementById('view-page');
  const others = USERS.filter(u=>u.id!=='me');
  const memberRows = others.map(u=>{
    const role = state.draftMembers[u.id];
    return `<div class="pick-row">
      <span class="avatar sm">${u.initials}</span><span class="pick-n">${escapeHtml(u.name)} ${typeBadge(u)}</span>
      <div class="role-seg">
        <button class="${role===undefined?'active':''}" onclick="setMember('${u.id}',undefined)">No</button>
        <button class="${role==='miembro'?'active':''}" onclick="setMember('${u.id}','miembro')">Miembro</button>
        <button class="${role==='admin'?'active':''}" onclick="setMember('${u.id}','admin')">Admin</button>
      </div></div>`;
  }).join('');
  view.innerHTML = pageHead('Crear grupo') + `
    <div class="page-body form">
      <div class="field"><label for="f-gname">Nombre del grupo ${counter('f-gname','groupName',state.draftGName)}</label><input ${lim('f-gname','groupName')} placeholder="Ej. Runners Madrid" value="${escapeHtml(state.draftGName||'')}" /></div>
      <div class="field"><label for="f-gabout">Descripción ${counter('f-gabout','groupAbout',state.draftGAbout)}</label><textarea ${lim('f-gabout','groupAbout')} rows="2" placeholder="¿De qué va el grupo?">${escapeHtml(state.draftGAbout||'')}</textarea></div>
      <div class="field"><label>Miembros y roles</label>
        <p class="hint">Tú eres admin por defecto. Puedes nombrar varios admins.</p>
        ${memberRows}</div>
      <div class="form-actions"><button class="btn-primary" onclick="publishGroup()">${ico('check')} Crear grupo</button></div>
    </div>`;
}
function setMember(uid, role){ state.draftGName=val('f-gname'); state.draftGAbout=val('f-gabout'); if(role===undefined) delete state.draftMembers[uid]; else state.draftMembers[uid]=role; renderCreateGroup(); }
function publishGroup(){
  const name = clip(val('f-gname'), 'groupName') || 'Nuevo grupo';
  const about = clip(val('f-gabout'), 'groupAbout') || 'Grupo creado desde el prototipo.';
  const members = [{userId:'me',role:'admin'}].concat(Object.entries(state.draftMembers).map(([userId,role])=>({userId,role})));
  const g = { id:'g'+Date.now(), name, about, gradient:'g-dark', members, planIds:[] };
  GROUPS.unshift(g); state.draftMembers={}; state.draftGName=''; state.draftGAbout='';
  saveState();
  toast('Grupo creado'); go('grupo/'+g.id);
}

/* ---------- creación: chooser / plan / post ---------- */
function renderCreateChooser(){
  const view = document.getElementById('view-page');
  const opt=(icon,t,s,route)=>`<button class="choose" onclick="go('${route}')"><span class="ch-ic">${ico(icon)}</span>
    <span class="ch-tx"><span class="ch-t">${t}</span><span class="ch-s">${s}</span></span><span class="pl-arrow">${ico('chevR')}</span></button>`;
  view.innerHTML = pageHead('Crear') + `<div class="page-body">
    ${opt('pin','Plan','Organiza una quedada: libre o con aprobación','crear-plan')}
    ${opt('image','Publicación','Foto, vídeo o carrusel para tu perfil','crear-post')}
    ${opt('group','Grupo','Reúne gente con varios admins','crear-grupo')}
    ${opt('cast','Directo','Emite en vivo desde un plan en marcha','crear-directo')}
  </div>`;
}
function renderCreatePlan(){
  const view = document.getElementById('view-page');
  const d = state.draft;
  const covers = ['g-grape','g-wine','g-sunset','g-forest','g-dark'];
  const sizes=[['intimo','Íntimo','user'],['mediano','Mediano','users'],['grande','Grande','group']];
  const adminGroups = GROUPS.filter(g=>g.members.some(m=>m.userId==='me'&&m.role==='admin'));
  if (state.pendingGroup) d.group = state.pendingGroup;
  view.innerHTML = pageHead('Crear plan') + `
    <div class="page-body form">
      <div class="field"><label>Portada</label>
        <div class="cover-pick" id="cover-pick">${covers.map(c=>`<button class="sw ${c} ${d.cover===c?'active':''}" data-v="${c}" onclick="setDraft('cover','${c}')"></button>`).join('')}
          <span class="add-media">${ico('image')} Añadir fotos/vídeo</span></div></div>
      <div class="field"><label for="f-title">Título ${counter('f-title','planTitle')}</label><input ${lim('f-title','planTitle')} placeholder="Ej. Atardecer en el mirador" /></div>
      <div class="field"><label for="f-desc">Descripción ${counter('f-desc','planDesc')}</label><textarea ${lim('f-desc','planDesc')} rows="3" placeholder="¿En qué consiste el plan?"></textarea></div>
      <div class="field"><label>Lugar</label>
        <div class="mini-map">${ico('map')} Selecciona en el mapa</div>
        <select id="f-place">${PLACES.map(pl=>`<option value="${pl.id}">${pl.name} · ${pl.city}</option>`).join('')}</select></div>
      <div class="field"><label>Fecha y hora</label><input id="f-date" type="datetime-local" /></div>
      <div class="field"><label>Tamaño de grupo</label>
        <div class="iseg" id="d-size">${sizes.map(([v,l,n])=>`<button data-v="${v}" class="${d.size===v?'active':''}" onclick="setDraft('size','${v}')">${ico(n)}<span>${l}</span></button>`).join('')}</div></div>
      <div class="field"><label>Tema</label>
        <div class="chips" id="d-cat">${CATEGORIES.map(c=>`<button data-v="${c.id}" class="${d.cat===c.id?'active':''}" onclick="setDraft('cat','${c.id}')">${ico(ICON_FOR_CAT[c.id])}<span>${c.label}</span></button>`).join('')}</div></div>
      <div class="field"><label>Precio</label>
        <div class="iseg" id="d-price">
          <button data-v="gratis" class="${d.price==='gratis'?'active':''}" onclick="setDraft('price','gratis')">${ico('ticket')}<span>Gratis</span></button>
          <button data-v="pago" class="${d.price==='pago'?'active':''}" onclick="setDraft('price','pago')">${ico('euro')}<span>De pago</span></button></div>
        <input id="f-price" type="number" min="0" placeholder="Precio en € (si es de pago)" style="margin-top:8px" /></div>
      <div class="field"><label>Tipo de asistencia</label>
        <div class="iseg" id="d-access">
          <button data-v="libre" class="${d.access==='libre'?'active':''}" onclick="setDraft('access','libre')">${ico('globe')}<span>Libre</span></button>
          <button data-v="aprobacion" class="${d.access==='aprobacion'?'active':''}" onclick="setDraft('access','aprobacion')">${ico('check')}<span>Con aprobación</span></button></div>
        <p class="hint" id="access-hint">${d.access==='aprobacion'?'Recibirás solicitudes de asistencia y decides a quién aceptas.':'Cualquiera puede asistir; la presencia se verifica por ubicación.'}</p></div>
      <div class="field"><label>Grupo organizador (opcional)</label>
        <select id="f-group"><option value="">Ninguno</option>${adminGroups.map(g=>`<option value="${g.id}" ${d.group===g.id?'selected':''}>${g.name}</option>`).join('')}</select>
        <p class="hint">Si eliges un grupo, sus admins aprueban las solicitudes.</p></div>
      <div class="form-actions"><button class="btn-primary" onclick="publishPlan()">${ico('check')} Publicar plan</button></div>
    </div>`;
}
function setDraft(key,v){
  state.draft[key]=v;
  const id={cover:'cover-pick',size:'d-size',cat:'d-cat',price:'d-price',access:'d-access'}[key];
  const c=id&&document.getElementById(id);
  if(c) c.querySelectorAll('button').forEach(b=>b.classList.toggle('active', b.dataset.v===v));
  if(key==='access'){ const h=document.getElementById('access-hint'); if(h) h.textContent = v==='aprobacion'
    ? 'Recibirás solicitudes de asistencia y decides a quién aceptas.'
    : 'Cualquiera puede asistir; la presencia se verifica por ubicación.'; }
}
function publishPlan(){
  const d = state.draft;
  const title = clip(val('f-title'), 'planTitle') || 'Plan sin título';
  const desc = clip(val('f-desc'), 'planDesc') || 'Plan creado desde el prototipo.';
  const placeId = val('f-place') || PLACES[0].id;
  const dateRaw = val('f-date');
  const when = dateRaw ? new Date(dateRaw) : new Date(Date.now()+24*3600*1000);
  const paid = d.price==='pago';
  const price = paid ? (parseInt(val('f-price'),10) || 10) : 0;
  const ranges = { intimo:[2,8], mediano:[6,20], grande:[15,60] }[d.size];
  const groupId = val('f-group') || null;
  const access = d.access;
  const plan = {
    id:'np'+Date.now(), title, summary:desc, placeId, category:d.cat, gradient:d.cover,
    level:2, paid, price, recurring:false, secret:false,
    host:{ name:ME.name, business:ME.type==='profesional', verified:ME.verified, rating:5.0, reliability:100 },
    when, groupMin:ranges[0], groupMax:ranges[1], joined:0, attended:0, publicAttendees:[], attendedPrivate:0,
    joinType: access==='libre' ? 'libre' : 'apuntado',
    approval: access==='aprobacion' ? 'manual' : (access==='libre' ? 'libre' : 'automatica'),
    groupId,
  };
  PLANS.unshift(plan);
  if (groupId){ const g=getGroup(groupId); if(g) g.planIds.unshift(plan.id); }
  state.pendingGroup = null;
  saveState();
  toast('Plan publicado'); go('plan/'+plan.id);
}
function freshPostDraft(){ return { origin:'plan', kind:'foto', caption:'', tags:[], place:'', planId:'', alt:'', audience:'publico', comments:true, hideLikes:false, alsoStory:false, trackId:'' }; }
function capturePostInputs(){
  const d=state.draftPost;
  d.caption=val('f-caption'); d.alt=val('f-alt');
  d.place=val('f-postplace'); d.planId=val('f-postplan');
}
function highlightCaption(text){
  return escapeHtml(text)
    .replace(/(^|\s)(@[\wáéíóúñ]+)/gi,'$1<span class="mention">$2</span>')
    .replace(/(^|\s)(#[\wáéíóúñ]+)/gi,'$1<span class="hash">$2</span>');
}
function updateCaptionPreview(){
  const el=document.getElementById('cap-preview'); if(!el) return;
  const t=val('f-caption');
  el.innerHTML = t ? highlightCaption(t) : '<span class="ph">La vista previa del pie aparecerá aquí…</span>';
}
function renderCreatePost(){
  const view = document.getElementById('view-page');
  const d = state.draftPost, k = d.kind;
  const tr = d.trackId && getTrack(d.trackId);
  const musicSticker = tr ? `<span class="pp-music">${ico('music')} ${escapeHtml(trackLabel(tr))}</span>` : '';
  const sample = [['g-grape','1566737236500-c8ac43014a67'],['g-sunset','1495567720989-cebdbdd97913'],['g-forest','1551632811-561732d1e306']];
  const preview = k==='carrusel'
    ? `<div class="post-prev carrusel">${sample.map(([c,ph])=>`<span class="pp ${c}">${coverImg(ph,500)}</span>`).join('')}<span class="pp-dots">1 / ${sample.length}</span>${musicSticker}</div>`
    : `<div class="post-prev"><span class="pp ${sample[0][0]}">${coverImg(sample[0][1],700)}${k==='video'?`<span class="play-ov">${ico('play')}</span>`:''}${musicSticker}</span></div>`;
  // planes vinculables: a los que asististe o que creaste
  const linkable = linkablePlans();
  const fromPlan = d.origin === 'plan' && linkable.length > 0;
  const aud=[['publico','Público','globe'],['seguidores','Seguidores','users'],['amigos','Amigos','heartO']];
  const tagChips = USERS.filter(u=>u.id!=='me').map(u=>`<button class="tag-chip ${d.tags.includes(u.id)?'active':''}" onclick="togglePostTag('${u.id}')">${ico('user')} ${escapeHtml(u.name)}</button>`).join('');
  const optRow=(icon,label,key,sub='')=>`<div class="opt-row" onclick="togglePostOpt('${key}')"><span class="or-ic">${ico(icon)}</span>
    <span class="or-l">${label}${sub?`<span class="or-s">${sub}</span>`:''}</span>
    <span class="switch ${d[key]?'on':''}"><span class="knob"></span></span></div>`;
  view.innerHTML = pageHead('Nueva publicación') + `
    <div class="page-body form">
      <div class="field"><label>Qué compartes</label>
        <div class="iseg" id="d-postorigin">
          <button class="${fromPlan?'active':''}" onclick="setPostField('origin','plan')">${ico('ticket')}<span>Un plan</span></button>
          <button class="${fromPlan?'':'active'}" onclick="setPostField('origin','vida')">${ico('heartO')}<span>Tu vida</span></button></div>
        ${fromPlan ? `<select id="f-postplan" class="or-sel wide" aria-label="Plan del que compartes la experiencia">${linkable.map(p=>`<option value="${p.id}" ${d.planId===p.id?'selected':''}>${escapeHtml(p.title)}</option>`).join('')}</select>
          <p class="hint">Queda ligada al plan y cuenta como prueba social; en tu perfil sale dentro de "Planes".</p>`
        : `<p class="hint">${linkable.length ? 'Un momento tuyo, sin plan: sale en tu perfil, dentro de "Tu vida".' : 'Aún no has asistido a ningún plan; puedes compartir momentos de tu vida.'}</p>`}</div>
      <div class="field"><label>Formato</label>
        <div class="iseg" id="d-postkind">
          <button class="${k==='foto'?'active':''}" onclick="setPostField('kind','foto')">${ico('image')}<span>Foto</span></button>
          <button class="${k==='video'?'active':''}" onclick="setPostField('kind','video')">${ico('video')}<span>Vídeo</span></button>
          <button class="${k==='carrusel'?'active':''}" onclick="setPostField('kind','carrusel')">${ico('stack')}<span>Carrusel</span></button></div></div>
      <div class="field"><label>Vista previa</label>${preview}<span class="add-media center">${ico('image')} Añadir desde galería</span></div>

      <div class="field"><label for="f-caption">Pie de texto ${counter('f-caption','caption',d.caption)}</label>
        <textarea id="f-caption" maxlength="${LIMITS.caption}" rows="3" placeholder="Escribe un pie… usa @ para mencionar y # para temas" oninput="updateCaptionPreview();countChars(this,'caption')">${escapeHtml(d.caption||'')}</textarea>
        <div class="cap-preview" id="cap-preview">${d.caption?highlightCaption(d.caption):'<span class="ph">La vista previa del pie aparecerá aquí…</span>'}</div></div>

      <div class="field"><label>Audiencia</label>
        <div class="iseg" id="d-audience">${aud.map(([v,l,n])=>`<button class="${d.audience===v?'active':''}" onclick="setPostField('audience','${v}')">${ico(n)}<span>${l}</span></button>`).join('')}</div>
        <p class="hint">Coherente con tu perfil: en un perfil privado, "Público" se limita a tus seguidores aprobados.</p></div>

      <div class="adv-title">Añadir a la publicación</div>
      <div class="opt-list">
        <div class="opt-row" onclick="openMusicPicker()"><span class="or-ic">${ico('music')}</span>
          <span class="or-l">Música<span class="or-s">${tr ? escapeHtml(trackLabel(tr)) : `Añade una canción ${{foto:'a la foto',video:'al vídeo',carrusel:'al carrusel'}[k]||'a la publicación'}`}</span></span>
          ${tr ? `<button class="or-clear" onclick="clearPostTrack(event)" aria-label="Quitar música">${ico('close')}</button>` : `<span class="pl-arrow">${ico('chevR')}</span>`}</div>
        <div class="opt-row"><span class="or-ic">${ico('pin')}</span><span class="or-l">Ubicación</span>
          <select id="f-postplace" class="or-sel"><option value="">Sin ubicación</option>${PLACES.map(pl=>`<option value="${pl.id}" ${d.place===pl.id?'selected':''}>${escapeHtml(pl.name)} · ${pl.city}</option>`).join('')}</select></div>
      </div>

      <div class="field" style="margin-top:16px"><label>${ico('tag')} Etiquetar personas</label>
        <div class="tag-chips">${tagChips}</div></div>

      <div class="field"><label for="f-alt">${ico('doc')} Texto alternativo (accesibilidad) ${counter('f-alt','alt',d.alt)}</label>
        <input ${lim('f-alt','alt')} placeholder="Describe la imagen para lectores de pantalla" value="${escapeHtml(d.alt||'')}" /></div>

      <div class="adv-title">Opciones</div>
      <div class="opt-list">
        ${optRow('chat','Comentarios activos','comments','permitir comentarios')}
        ${optRow('eye','Ocultar el número de Me gusta','hideLikes','solo tú verás el total')}
        ${optRow('live','Compartir también en Stories','alsoStory','24 h en tu pestaña Stories')}
      </div>

      <div class="form-actions"><button class="btn-primary" onclick="publishPost()">${ico('check')} Publicar</button></div>
    </div>`;
}
// Planes que puedes vincular a una publicación: a los que asististe o que creaste.
function linkablePlans(){ return PLANS.filter(p=> (ME.attendedPlanIds||[]).includes(p.id) || p.host.name===ME.name); }
function setPostField(key,v){ capturePostInputs(); state.draftPost[key]=v; renderCreatePost(); }
function togglePostTag(uid){ capturePostInputs(); const t=state.draftPost.tags; const i=t.indexOf(uid); if(i>=0) t.splice(i,1); else t.push(uid); renderCreatePost(); }
function togglePostOpt(key){ capturePostInputs(); state.draftPost[key]=!state.draftPost[key]; renderCreatePost(); }
function publishPost(){
  capturePostInputs();
  const d = state.draftPost, k = d.kind;
  const caption = clip(d.caption, 'caption') || 'Nueva publicación';
  const media = k==='carrusel' ? ['g-grape','g-sunset','g-forest'] : [k==='video'?'g-grape':'g-sunset'];
  const mentions = (caption.match(/@[\wáéíóúñ]+/gi)||[]);
  const hashtags = (caption.match(/#[\wáéíóúñ]+/gi)||[]);
  const sample = ['1566737236500-c8ac43014a67','1495567720989-cebdbdd97913','1551632811-561732d1e306'];
  const imgs = k==='carrusel' ? sample : [sample[0]];
  const id = 'npo'+Date.now();
  const linkable = linkablePlans();
  const planId = (d.origin === 'plan' && linkable.length) ? (linkable.some(p => p.id === d.planId) ? d.planId : linkable[0].id) : null;
  POSTS.unshift({
    id, authorId:'me', kind:k, media, imgs, caption, likes:0, ago:0, comments:[], duration: k==='video' ? 15 : undefined,
    placeId:d.place||null, taggedUserIds:[...d.tags], planId, altText:clip(d.alt, 'alt'),
    mentions, hashtags, audience:d.audience, commentsEnabled:d.comments, hideLikes:d.hideLikes, sharedToStory:d.alsoStory,
    trackId:d.trackId||null,
  });
  const story = d.alsoStory;
  if (story) STORIES.unshift({ id:'s'+id, userId:'me', planId, img:imgs[0], minAgo:0, trackId:d.trackId||null, text:caption });
  state.draftPost = freshPostDraft();
  saveState();
  toast(story ? 'Publicación creada · compartida en Stories' : 'Publicación creada');
  // Tu perfil se abre en el apartado donde ha quedado la publicación.
  state.profileTab='posts'; state.profileFilterUid='me'; state.profileFilter = planId ? 'plan' : 'vida';
  go('perfil');
}

/* ---------- helpers de página ---------- */
function pageHead(title){ return `<div class="page-bar"><button class="pb-back" onclick="history.back()" aria-label="Atrás">${ico('chevL')}</button><span class="pb-title">${escapeHtml(title)}</span><span style="width:34px"></span></div>`; }

/* ---------- filtros del feed ---------- */
function buildFilters(){
  const cont = document.getElementById('feed-filters');
  const sizes=[['todos','Todos','layers'],['intimo','Íntimo','user'],['mediano','Mediano','users'],['grande','Grande','group']];
  const prices=[['todos','Todo','layers'],['gratis','Gratis','ticket'],['pago','Pago','euro']];
  const ichip=(v,l,name,act)=>`<button data-v="${v}" class="${act?'active':''}">${ico(name)}<span>${l}</span></button>`;
  cont.innerHTML = `
    <div class="chips" id="chips-cat">${ichip('todas','Todos','hash',true)}${CATEGORIES.map(c=>ichip(c.id,c.label,ICON_FOR_CAT[c.id]||'hash',false)).join('')}</div>
    <div class="seg-row">
      <div class="iseg" id="seg-size">${sizes.map(([v,l,n])=>ichip(v,l,n,v==='todos')).join('')}</div>
      <div class="iseg" id="seg-price">${prices.map(([v,l,n])=>ichip(v,l,n,v==='todos')).join('')}</div></div>`;
  cont.querySelector('#seg-size').onclick = e=>{ const b=e.target.closest('button'); if(!b)return; state.size=b.dataset.v; setActive('#seg-size button',b); renderFeed(); };
  cont.querySelector('#seg-price').onclick = e=>{ const b=e.target.closest('button'); if(!b)return; state.price=b.dataset.v; setActive('#seg-price button',b); renderFeed(); };
  cont.querySelector('#chips-cat').onclick = e=>{ const b=e.target.closest('button'); if(!b)return; state.category=b.dataset.v; setActive('#chips-cat button',b); renderFeed(); };
}
function setActive(sel,el){ document.querySelectorAll(sel).forEach(x=>x.classList.remove('active')); el.classList.add('active'); }

/* ---------- router ---------- */
function go(path){ location.hash = '#/'+path; }
const VIEWS = ['feed','mapa','grupos','perfil','detail','page'];
function showView(name){
  VIEWS.forEach(v=> document.getElementById('view-'+v).classList.toggle('hidden', v!==name));
  document.getElementById('appbar-tabs').style.display = (name==='feed')?'block':'none';
  const navFor = { feed:'feed', mapa:'mapa', grupos:'grupos', perfil:'perfil' };
  const active = navFor[name] || state.navTab;
  document.querySelectorAll('.tabbar button').forEach(b=> b.classList.toggle('active', b.dataset.nav===active));
}
function scrollTop(v){ const el=document.getElementById('view-'+v); if(el) el.scrollTop=0; }
function router(){
  stopMusic();
  const hash = location.hash.replace(/^#\//,'') || 'feed';
  const [route,arg] = hash.split('/');
  switch(route){
    case 'mapa':    state.navTab='mapa'; renderMap(); showView('mapa'); break;
    case 'grupos':  state.navTab='grupos'; renderGroups(); showView('grupos'); break;
    case 'perfil':  state.navTab='perfil'; renderProfile('me'); showView('perfil'); break;
    case 'plan':    renderDetail(arg); showView('detail'); scrollTop('detail'); break;
    case 'u':       renderProfile(arg); showView('page'); scrollTop('page'); break;
    case 'grupo':   renderGroupDetail(arg); showView('page'); scrollTop('page'); break;
    case 'editar-perfil': renderEditProfile(); showView('page'); scrollTop('page'); break;
    case 'ajustes': renderSettings(); showView('page'); scrollTop('page'); break;
    case 'solicitudes': renderRequests(arg); showView('page'); scrollTop('page'); break;
    case 'crear':   renderCreateChooser(); showView('page'); scrollTop('page'); break;
    case 'crear-plan':  renderCreatePlan(); showView('page'); scrollTop('page'); break;
    case 'crear-post':  renderCreatePost(); showView('page'); scrollTop('page'); break;
    case 'crear-grupo': renderCreateGroup(); showView('page'); scrollTop('page'); break;
    case 'crear-directo': renderCreateLive(); showView('page'); scrollTop('page'); break;
    default:        state.navTab='feed'; renderContent(); showView('feed');
  }
}

/* ---------- init ---------- */
function init(){
  loadState();
  window.addEventListener('pagehide', saveState);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopMusic(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !overlayEl().hidden) (liveState.host ? endLive() : closeOverlay()); });
  buildFilters();
  document.querySelectorAll('.content-tabs button').forEach(b=>{ b.onclick=()=>setContentTab(b.dataset.tab); });
  document.querySelectorAll('.tabbar button').forEach(b=>{ b.onclick=()=>go(b.dataset.nav==='crear'?'crear':b.dataset.nav); });
  window.addEventListener('hashchange', router);
  router();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
