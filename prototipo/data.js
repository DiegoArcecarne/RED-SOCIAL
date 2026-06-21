/* =========================================================================
   Datos de ejemplo (mock) del prototipo — coherentes con PRODUCTO.md
   ========================================================================= */

// Categorías de la taxonomía de arranque
const CATEGORIES = [
  { id: 'outdoor',   label: 'Outdoor',     emoji: '🏔️' },
  { id: 'fiesta',    label: 'Fiesta',      emoji: '🎉' },
  { id: 'gastro',    label: 'Gastronomía', emoji: '🍷' },
  { id: 'cultura',   label: 'Cultura',     emoji: '🎭' },
  { id: 'deporte',   label: 'Deporte',     emoji: '🏃' },
  { id: 'bienestar', label: 'Bienestar',   emoji: '🧘' },
  { id: 'social',    label: 'Social',      emoji: '🥂' },
  { id: 'viajeros',  label: 'Viajeros',    emoji: '🎒' },
];

// Lugares (entidad persistente). x/y = posición % sobre el mapa estilizado.
const PLACES = [
  { id: 'victoria',  name: 'Vermutería Victoria', kind: 'negocio', verified: true,  city: 'Burgos', category: 'gastro',  hashtag: '#himnovictoria',     x: 22, y: 30, rating: 4.8 },
  { id: 'azotea',    name: 'Azotea Círculo',      kind: 'negocio', verified: true,  city: 'Madrid', category: 'fiesta',  hashtag: '#rooftopmadrid',     x: 54, y: 44, rating: 4.6 },
  { id: 'debod',     name: 'Templo de Debod',     kind: 'publico', verified: false, city: 'Madrid', category: 'outdoor', hashtag: '#atardecerdebod',    x: 40, y: 52, rating: 4.9 },
  { id: 'retiro',    name: 'Parque del Retiro',   kind: 'publico', verified: false, city: 'Madrid', category: 'outdoor', hashtag: '#retiromorning',     x: 66, y: 60, rating: 4.7 },
  { id: 'clamores',  name: 'Sala Clamores',       kind: 'negocio', verified: true,  city: 'Madrid', category: 'cultura', hashtag: '#clamoresjazz',      x: 60, y: 30, rating: 4.5 },
  { id: 'sierra',    name: 'Mirador de la Sierra', kind: 'publico', verified: false, city: 'Madrid', category: 'deporte', hashtag: '#trailamanecer',     x: 30, y: 68, rating: 4.8 },
  { id: 'secreto',   name: 'Lugar por desvelar',  kind: 'publico', verified: false, city: 'Madrid', category: 'gastro',  hashtag: '#cenasecretamadrid', x: 48, y: 22, rating: 4.9, secret: true },
  { id: 'lavapies',  name: 'Plaza de Lavapiés',   kind: 'publico', verified: false, city: 'Madrid', category: 'viajeros', hashtag: '#tapasviajeros',    x: 72, y: 46, rating: 4.6 },
];

// Helper: fecha futura a partir de ahora
const hoursFromNow = (h) => new Date(Date.now() + h * 3600 * 1000);

// Planes (unidad atómica). level: 1 ancla recurrente, 2 usuario gratuito, 3 pago curado.
const PLANS = [
  {
    id: 'p1', title: 'El himno de la Victoria', placeId: 'victoria', category: 'gastro',
    level: 1, paid: false, price: 0, recurring: true,
    host: { name: 'Vermutería Victoria', business: true, verified: true, rating: 4.8, reliability: 99 },
    when: hoursFromNow(5), groupMin: 10, groupMax: 60, joined: 41,
    gradient: 'g-wine', emoji: '🍷',
    summary: 'Cada noche a las 22:00, todo el bar canta. El ritual de Burgos que ya tiene gente: solo súmate.',
    secret: false,
  },
  {
    id: 'p2', title: 'Atardecer en el Templo de Debod', placeId: 'debod', category: 'outdoor',
    level: 2, paid: false, price: 0, recurring: false,
    host: { name: 'Lucía R.', business: false, verified: true, rating: 4.9, reliability: 96 },
    when: hoursFromNow(28), groupMin: 4, groupMax: 15, joined: 9,
    gradient: 'g-sunset', emoji: '🌅',
    summary: 'Quedada para ver el mejor atardecer de Madrid. Traed manta y algo para picar.',
    secret: false,
  },
  {
    id: 'p3', title: 'Rooftop Sunset Sessions', placeId: 'azotea', category: 'fiesta',
    level: 3, paid: true, price: 18, recurring: false,
    host: { name: 'Azotea Círculo', business: true, verified: true, rating: 4.6, reliability: 98 },
    when: hoursFromNow(52), groupMin: 20, groupMax: 80, joined: 63,
    gradient: 'g-grape', emoji: '🌇',
    summary: 'DJ set al atardecer en una de las mejores azoteas del centro. Primera consumición incluida.',
    secret: false,
  },
  {
    id: 'p4', title: 'Cena secreta · lugar por desvelar', placeId: 'secreto', category: 'gastro',
    level: 3, paid: true, price: 35, recurring: false,
    host: { name: 'Mesa 0 · Originals', business: true, verified: true, rating: 4.9, reliability: 100 },
    when: hoursFromNow(74), groupMin: 6, groupMax: 8, joined: 6,
    gradient: 'g-dark', emoji: '🤫',
    summary: 'Ocho desconocidos, un menú de autor y una ubicación que se revela 2 horas antes. El secreto es parte del plan.',
    secret: true,
  },
  {
    id: 'p5', title: 'Trail al amanecer en la Sierra', placeId: 'sierra', category: 'deporte',
    level: 1, paid: false, price: 0, recurring: true,
    host: { name: 'Club Amanecer Trail', business: false, verified: true, rating: 4.8, reliability: 97 },
    when: hoursFromNow(20), groupMin: 5, groupMax: 20, joined: 12,
    gradient: 'g-forest', emoji: '🏃',
    summary: 'Ruta suave de 8 km para ver salir el sol. Ritmo de grupo, nadie se queda atrás.',
    secret: false,
  },
  {
    id: 'p6', title: 'Ruta de tapas para viajeros', placeId: 'lavapies', category: 'viajeros',
    level: 2, paid: false, price: 0, recurring: false,
    host: { name: 'Marco T.', business: false, verified: true, rating: 4.7, reliability: 92 },
    when: hoursFromNow(31), groupMin: 4, groupMax: 12, joined: 7,
    gradient: 'g-sunset', emoji: '🍢',
    summary: '¿Recién llegado a Madrid? Tapeo por Lavapiés con gente que también está de paso.',
    secret: false,
  },
  {
    id: 'p7', title: 'Jazz íntimo en Clamores', placeId: 'clamores', category: 'cultura',
    level: 3, paid: true, price: 14, recurring: false,
    host: { name: 'Sala Clamores', business: true, verified: true, rating: 4.5, reliability: 96 },
    when: hoursFromNow(46), groupMin: 10, groupMax: 40, joined: 22,
    gradient: 'g-grape', emoji: '🎷',
    summary: 'Directo de jazz en formato reducido. Vente solo o con quien quieras: la sala hace el resto.',
    secret: false,
  },
  {
    id: 'p8', title: 'Yoga al sol en el Retiro', placeId: 'retiro', category: 'bienestar',
    level: 2, paid: false, price: 0, recurring: true,
    host: { name: 'Ana P.', business: false, verified: true, rating: 4.9, reliability: 98 },
    when: hoursFromNow(15), groupMin: 3, groupMax: 18, joined: 10,
    gradient: 'g-forest', emoji: '🧘',
    summary: 'Sesión de 45 min para empezar el sábado con calma. Trae esterilla.',
    secret: false,
  },
  {
    id: 'p9', title: 'Cata de vinos naturales', placeId: 'clamores', category: 'gastro',
    level: 3, paid: true, price: 22, recurring: false,
    host: { name: 'Vinos Vivos', business: true, verified: true, rating: 4.7, reliability: 97 },
    when: hoursFromNow(40), groupMin: 8, groupMax: 24, joined: 15,
    gradient: 'g-wine', emoji: '',
    summary: 'Seis referencias de vino natural con un sumiller que te lo cuenta sin pretensiones.',
    secret: false,
  },
  {
    id: 'p10', title: 'Running club al anochecer', placeId: 'retiro', category: 'deporte',
    level: 1, paid: false, price: 0, recurring: true,
    host: { name: 'Madrid Night Runners', business: false, verified: true, rating: 4.8, reliability: 95 },
    when: hoursFromNow(9), groupMin: 6, groupMax: 30, joined: 18,
    gradient: 'g-dark', emoji: '',
    summary: '5 km a ritmo suave por el Retiro. Grupos por nivel, nadie corre solo.',
    secret: false,
  },
  {
    id: 'p11', title: 'Mercado de diseño independiente', placeId: 'lavapies', category: 'cultura',
    level: 2, paid: false, price: 0, recurring: false,
    host: { name: 'Carla D.', business: false, verified: true, rating: 4.6, reliability: 90 },
    when: hoursFromNow(34), groupMin: 4, groupMax: 25, joined: 11,
    gradient: 'g-grape', emoji: '',
    summary: 'Vuelta por los puestos de creadores locales y caña final con el grupo.',
    secret: false,
  },
  {
    id: 'p12', title: 'Cine de verano en azotea', placeId: 'azotea', category: 'cultura',
    level: 3, paid: true, price: 12, recurring: false,
    host: { name: 'Azotea Círculo', business: true, verified: true, rating: 4.6, reliability: 98 },
    when: hoursFromNow(60), groupMin: 15, groupMax: 50, joined: 29,
    gradient: 'g-sunset', emoji: '',
    summary: 'Proyección bajo las estrellas con manta y palomitas incluidas.',
    secret: false,
  },
];

// Aftermovies (pestaña Vividas) — prueba social de planes pasados
const AFTERMOVIES = [
  { id: 'a1', planTitle: 'El himno de la Victoria', placeId: 'victoria', hashtag: '#himnovictoria', emoji: '🍷', gradient: 'g-wine',   likes: 312, author: 'Vermutería Victoria' },
  { id: 'a2', planTitle: 'Rooftop Sunset',          placeId: 'azotea',   hashtag: '#rooftopmadrid', emoji: '🌇', gradient: 'g-grape',  likes: 540, author: 'Azotea Círculo' },
  { id: 'a3', planTitle: 'Atardecer en Debod',      placeId: 'debod',    hashtag: '#atardecerdebod', emoji: '🌅', gradient: 'g-sunset', likes: 198, author: 'Lucía R.' },
];

// Reseñas de ejemplo para la ficha de detalle
const REVIEWS = [
  { author: 'Sara M.', stars: 5, text: 'Ambientazo y gente muy maja. Fui sola y volví con planes para el finde.' },
  { author: 'David L.', stars: 5, text: 'El anfitrión súper atento, todo organizado al detalle.' },
  { author: 'Nora V.', stars: 4, text: 'Muy bien, repetiría. Solo le faltó que fuéramos un par más.' },
];

const getPlace = (id) => PLACES.find((p) => p.id === id);
const getPlan  = (id) => PLANS.find((p) => p.id === id);
const getCategory = (id) => CATEGORIES.find((c) => c.id === id);

/* ---- Capa B: tipo de inscripción + asistencia real (geolocalización) ----
   joinType:  'libre'    -> no hace falta apuntarse (p. ej. un atardecer abierto)
              'apuntado' -> requiere apuntarse (aforo limitado o de pago)
   attended:  asistentes reales detectados por geolocalización
   publicAttendees: presencia pública (se listan en el plan)
   attendedPrivate: presencia privada (cuentan en el agregado, no se listan)      */
const PLAN_ATTENDANCE = {
  p1:  { joinType: 'libre',    attended: 41, pub: ['SM','DL','NV','JR','AP','LT'] },
  p2:  { joinType: 'libre',    attended: 9,  pub: ['RG','MO','TC'] },
  p3:  { joinType: 'apuntado', attended: 58, pub: ['EK','FP','OD','BR','CM'] },
  p4:  { joinType: 'apuntado', attended: 6,  pub: ['IL','VS'] },
  p5:  { joinType: 'libre',    attended: 12, pub: ['HN','QA','ZD','WP'] },
  p6:  { joinType: 'apuntado', attended: 7,  pub: ['MT','GC'] },
  p7:  { joinType: 'apuntado', attended: 20, pub: ['JL','KP','RN','TS'] },
  p8:  { joinType: 'libre',    attended: 10, pub: ['AP','LM','NO'] },
  p9:  { joinType: 'apuntado', attended: 15, pub: ['DV','FE','GR'] },
  p10: { joinType: 'libre',    attended: 18, pub: ['MN','RU','SO','PB','LC'] },
  p11: { joinType: 'libre',    attended: 11, pub: ['CD','HV','OK'] },
  p12: { joinType: 'apuntado', attended: 27, pub: ['AZ','CI','NE','RO'] },
};
PLANS.forEach((p) => {
  const a = PLAN_ATTENDANCE[p.id] || {};
  p.joinType = a.joinType || (p.paid ? 'apuntado' : 'libre');
  p.attended = (a.attended != null) ? a.attended : p.joined;
  p.publicAttendees = a.pub || ['SM','DL','NV'];
  p.attendedPrivate = Math.max(0, p.attended - p.publicAttendees.length);
});

/* ---- Bloque de creación: aprobación de asistencia + grupo organizador ----
   approval: 'automatica' (cualquiera que se apunta entra) o 'manual'
             (el creador/los admins aceptan o rechazan cada solicitud).
   Para los planes libres no aplica (cualquiera asiste).
   groupId: si el plan se crea dentro de un grupo, sus admins aprueban.            */
const PLAN_EXTRA = {
  p4: { approval: 'manual' },
  p6: { approval: 'manual', groupId: 'g1' },
  p9: { groupId: 'g2' },
};
PLANS.forEach((p) => {
  const e = PLAN_EXTRA[p.id] || {};
  p.approval = (p.joinType === 'libre') ? 'libre' : (e.approval || 'automatica');
  p.groupId = e.groupId || null;
});

// Usuarios (perfiles). type: 'usuario' normal o 'profesional' (cuenta de negocio).
const USERS = [
  { id:'me', name:'Marina', handle:'@marina', initials:'MA', type:'usuario', verified:true,
    bio:'Viajera y runner. Outdoor y gastronomía por Madrid.',
    profilePublic:true, presencePublic:true, followers:184, following:156,
    attendedPlanIds:['p1','p5','p8'] },
  { id:'azotea', name:'Azotea Círculo', handle:'@azoteacirculo', initials:'AC', type:'profesional', verified:true,
    bio:'Azotea y eventos en el centro de Madrid.', followers:5400, following:12,
    business:{ category:'Ocio nocturno', web:'azoteacirculo.es', address:'Centro, Madrid' },
    attendedPlanIds:['p3'] },
  { id:'lucia', name:'Lucía R.', handle:'@lucia', initials:'LR', type:'usuario', verified:true, followers:90, following:120, attendedPlanIds:[] },
  { id:'marco', name:'Marco T.', handle:'@marcot', initials:'MT', type:'usuario', verified:true, followers:60, following:200, attendedPlanIds:[] },
  { id:'ana',   name:'Ana P.',  handle:'@anap',   initials:'AP', type:'usuario', verified:true, followers:140, following:80, attendedPlanIds:[] },
];
const ME = USERS[0]; // usuario actual

// Publicaciones (foto / video / carrusel). media = lista de portadas (degradados).
const POSTS = [
  { id:'po1', authorId:'me', kind:'carrusel', media:['g-forest','g-sunset','g-grape'], caption:'Finde de trail por la sierra', likes:64 },
  { id:'po2', authorId:'me', kind:'foto',     media:['g-wine'],   caption:'Noche de vinos naturales', likes:38 },
  { id:'po3', authorId:'me', kind:'video',    media:['g-grape'],  caption:'Rooftop al atardecer', likes:120 },
  { id:'po4', authorId:'me', kind:'foto',     media:['g-sunset'], caption:'Atardecer en Debod', likes:51 },
  { id:'po5', authorId:'me', kind:'carrusel', media:['g-dark','g-wine'], caption:'Ruta de tapas', likes:29 },
  { id:'po6', authorId:'me', kind:'foto',     media:['g-forest'], caption:'Yoga en el Retiro', likes:44 },
  { id:'po7', authorId:'azotea', kind:'video', media:['g-grape'], caption:'Sunset sessions', likes:540 },
];

// Grupos (tipo grupos de WhatsApp) con roles admin/miembro.
const GROUPS = [
  { id:'g1', name:'Runners Madrid', gradient:'g-forest',
    about:'Quedadas de running y trail por Madrid y la sierra.',
    members:[ {userId:'me',role:'admin'}, {userId:'marco',role:'admin'}, {userId:'ana',role:'miembro'}, {userId:'lucia',role:'miembro'} ],
    planIds:['p5','p10','p6'] },
  { id:'g2', name:'Planes Gastro', gradient:'g-wine',
    about:'Cenas, catas y rutas de tapas con buena gente.',
    members:[ {userId:'me',role:'miembro'}, {userId:'azotea',role:'admin'} ],
    planIds:['p9'] },
];

// Solicitudes de asistencia (para planes con aprobación manual).
const REQUESTS = [
  { id:'r1', planId:'p6', userId:'lucia', status:'pendiente', message:'¡Me encantaría! Soy de la zona y corro habitualmente.' },
  { id:'r2', planId:'p6', userId:'ana',   status:'pendiente', message:'¿Es apta para ritmo principiante?' },
  { id:'r3', planId:'p4', userId:'marco', status:'pendiente', message:'Reservo plaza para mí, ¡con muchas ganas!' },
];

const getUser  = (id) => USERS.find((u) => u.id === id);
const getGroup = (id) => GROUPS.find((g) => g.id === id);
const postsByUser = (uid) => POSTS.filter((p) => p.authorId === uid);
const requestsForPlan = (pid) => REQUESTS.filter((r) => r.planId === pid);

// Exponer explícitamente en window: garantiza que app.js (otro <script>) y los
// manejadores inline encuentren los datos, sin depender del scope léxico compartido.
if (typeof window !== 'undefined') {
  Object.assign(window, {
    CATEGORIES, PLACES, PLANS, AFTERMOVIES, REVIEWS, ME, USERS, POSTS, GROUPS, REQUESTS,
    getPlace, getPlan, getCategory, getUser, getGroup, postsByUser, requestsForPlan,
  });
}
