/* =========================================================================
   Datos de ejemplo (mock) del prototipo — coherentes con PRODUCTO.md
   ========================================================================= */

// Categorías de la taxonomía de arranque
const CATEGORIES = [
  { id: 'outdoor',   label: 'Outdoor' },
  { id: 'fiesta',    label: 'Fiesta' },
  { id: 'gastro',    label: 'Gastronomía' },
  { id: 'cultura',   label: 'Cultura' },
  { id: 'deporte',   label: 'Deporte' },
  { id: 'bienestar', label: 'Bienestar' },
  { id: 'social',    label: 'Social' },
  { id: 'viajeros',  label: 'Viajeros' },
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
    gradient: 'g-wine',
    summary: 'Cada noche a las 22:00, todo el bar canta. El ritual de Burgos que ya tiene gente: solo súmate.',
    secret: false,
  },
  {
    id: 'p2', title: 'Atardecer en el Templo de Debod', placeId: 'debod', category: 'outdoor',
    level: 2, paid: false, price: 0, recurring: false,
    host: { name: 'Lucía R.', business: false, verified: true, rating: 4.9, reliability: 96 },
    when: hoursFromNow(28), groupMin: 4, groupMax: 15, joined: 9,
    gradient: 'g-sunset',
    summary: 'Quedada para ver el mejor atardecer de Madrid. Traed manta y algo para picar.',
    secret: false,
  },
  {
    id: 'p3', title: 'Rooftop Sunset Sessions', placeId: 'azotea', category: 'fiesta',
    level: 3, paid: true, price: 18, recurring: false,
    host: { name: 'Azotea Círculo', business: true, verified: true, rating: 4.6, reliability: 98 },
    when: hoursFromNow(52), groupMin: 20, groupMax: 80, joined: 63,
    gradient: 'g-grape',
    summary: 'DJ set al atardecer en una de las mejores azoteas del centro. Primera consumición incluida.',
    secret: false,
  },
  {
    id: 'p4', title: 'Cena secreta · lugar por desvelar', placeId: 'secreto', category: 'gastro',
    level: 3, paid: true, price: 35, recurring: false,
    host: { name: 'Mesa 0 · Originals', business: true, verified: true, rating: 4.9, reliability: 100 },
    when: hoursFromNow(74), groupMin: 6, groupMax: 8, joined: 6,
    gradient: 'g-dark',
    summary: 'Ocho desconocidos, un menú de autor y una ubicación que se revela 2 horas antes. El secreto es parte del plan.',
    secret: true,
  },
  {
    id: 'p5', title: 'Trail al amanecer en la Sierra', placeId: 'sierra', category: 'deporte',
    level: 1, paid: false, price: 0, recurring: true,
    host: { name: 'Club Amanecer Trail', business: false, verified: true, rating: 4.8, reliability: 97 },
    when: hoursFromNow(20), groupMin: 5, groupMax: 20, joined: 12,
    gradient: 'g-forest',
    summary: 'Ruta suave de 8 km para ver salir el sol. Ritmo de grupo, nadie se queda atrás.',
    secret: false,
  },
  {
    id: 'p6', title: 'Ruta de tapas para viajeros', placeId: 'lavapies', category: 'viajeros',
    level: 2, paid: false, price: 0, recurring: false,
    host: { name: 'Marco T.', business: false, verified: true, rating: 4.7, reliability: 92 },
    when: hoursFromNow(31), groupMin: 4, groupMax: 12, joined: 7,
    gradient: 'g-sunset',
    summary: '¿Recién llegado a Madrid? Tapeo por Lavapiés con gente que también está de paso.',
    secret: false,
  },
  {
    id: 'p7', title: 'Jazz íntimo en Clamores', placeId: 'clamores', category: 'cultura',
    level: 3, paid: true, price: 14, recurring: false,
    host: { name: 'Sala Clamores', business: true, verified: true, rating: 4.5, reliability: 96 },
    when: hoursFromNow(46), groupMin: 10, groupMax: 40, joined: 22,
    gradient: 'g-grape',
    summary: 'Directo de jazz en formato reducido. Vente solo o con quien quieras: la sala hace el resto.',
    secret: false,
  },
  {
    id: 'p8', title: 'Yoga al sol en el Retiro', placeId: 'retiro', category: 'bienestar',
    level: 2, paid: false, price: 0, recurring: true,
    host: { name: 'Ana P.', business: false, verified: true, rating: 4.9, reliability: 98 },
    when: hoursFromNow(15), groupMin: 3, groupMax: 18, joined: 10,
    gradient: 'g-forest',
    summary: 'Sesión de 45 min para empezar el sábado con calma. Trae esterilla.',
    secret: false,
  },
  {
    id: 'p9', title: 'Cata de vinos naturales', placeId: 'clamores', category: 'gastro',
    level: 3, paid: true, price: 22, recurring: false,
    host: { name: 'Vinos Vivos', business: true, verified: true, rating: 4.7, reliability: 97 },
    when: hoursFromNow(40), groupMin: 8, groupMax: 24, joined: 15,
    gradient: 'g-wine',
    summary: 'Seis referencias de vino natural con un sumiller que te lo cuenta sin pretensiones.',
    secret: false,
  },
  {
    id: 'p10', title: 'Running club al anochecer', placeId: 'retiro', category: 'deporte',
    level: 1, paid: false, price: 0, recurring: true,
    host: { name: 'Madrid Night Runners', business: false, verified: true, rating: 4.8, reliability: 95 },
    when: hoursFromNow(9), groupMin: 6, groupMax: 30, joined: 18,
    gradient: 'g-dark',
    summary: '5 km a ritmo suave por el Retiro. Grupos por nivel, nadie corre solo.',
    secret: false,
  },
  {
    id: 'p11', title: 'Mercado de diseño independiente', placeId: 'lavapies', category: 'cultura',
    level: 2, paid: false, price: 0, recurring: false,
    host: { name: 'Carla D.', business: false, verified: true, rating: 4.6, reliability: 90 },
    when: hoursFromNow(34), groupMin: 4, groupMax: 25, joined: 11,
    gradient: 'g-grape',
    summary: 'Vuelta por los puestos de creadores locales y caña final con el grupo.',
    secret: false,
  },
  {
    id: 'p12', title: 'Cine de verano en azotea', placeId: 'azotea', category: 'cultura',
    level: 3, paid: true, price: 12, recurring: false,
    host: { name: 'Azotea Círculo', business: true, verified: true, rating: 4.6, reliability: 98 },
    when: hoursFromNow(60), groupMin: 15, groupMax: 50, joined: 29,
    gradient: 'g-sunset',
    summary: 'Proyección bajo las estrellas con manta y palomitas incluidas.',
    secret: false,
  },
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

// Foto temática (Unsplash, slug photo-<id>) por plan. Si no carga, cae al degradado.
const PLAN_PHOTO = {
  p1:'1514362545857-3bc16c4c7d1b',  // vermut / vino
  p2:'1495567720989-cebdbdd97913',  // atardecer
  p3:'1566737236500-c8ac43014a67',  // rooftop
  p4:'1414235077428-338989a2e8c0',  // cena / restaurante
  p5:'1551632811-561732d1e306',     // trail de montaña
  p6:'1555939594-58d7cb561ad1',     // tapas
  p7:'1493225457124-a3eb161ffa5f',  // concierto / jazz
  p8:'1545205597-3d9d02c29597',     // yoga en parque
  p9:'1474722883778-792e7990302f',  // cata de vinos
  p10:'1571008887538-b36bb32f4571', // running
  p11:'1555396273-367ea4eb4db5',    // mercado de diseño
  p12:'1489599849927-2ee91cede3ba', // cine
};
PLANS.forEach((p) => { p.photo = PLAN_PHOTO[p.id] || ''; });

// Usuarios (perfiles). type: 'usuario' normal o 'profesional' (cuenta de negocio).
const USERS = [
  { id:'me', name:'Marina', handle:'@marina', initials:'MA', type:'usuario', verified:true,
    bio:'Viajera y runner. Outdoor y gastronomía por Madrid.',
    profilePublic:true, presencePublic:true, followers:184, following:156,
    ratings:{ default:'publica', publica:'todos', privada:'amigos' },
    attendedPlanIds:['p1','p5','p8','p2','p3','p6','p9'] },
  { id:'azotea', name:'Azotea Círculo', handle:'@azoteacirculo', initials:'AC', type:'profesional', verified:true,
    bio:'Azotea y eventos en el centro de Madrid.', followers:5400, following:12,
    business:{ category:'Ocio nocturno', web:'azoteacirculo.es', address:'Centro, Madrid' },
    attendedPlanIds:['p3'] },
  { id:'lucia', name:'Lucía R.', handle:'@lucia', initials:'LR', type:'usuario', verified:true, followers:90, following:120, ratings:{ default:'publica', publica:'todos', privada:'amigos' }, attendedPlanIds:[] },
  { id:'marco', name:'Marco T.', handle:'@marcot', initials:'MT', type:'usuario', verified:true, followers:60, following:200, ratings:{ default:'publica', publica:'todos', privada:'amigos' }, attendedPlanIds:[] },
  { id:'ana',   name:'Ana P.',  handle:'@anap',   initials:'AP', type:'usuario', verified:true, followers:140, following:80, ratings:{ default:'publica', publica:'seguidores', privada:'solo_yo' }, attendedPlanIds:[] },
  { id:'sara',  name:'Sara M.', handle:'@saram',  initials:'SM', type:'usuario', verified:true, followers:210, following:190, ratings:{ default:'publica', publica:'amigos', privada:'solo_yo' }, attendedPlanIds:['p1'] },
  { id:'david', name:'David L.', handle:'@davidl', initials:'DL', type:'usuario', verified:true, followers:75, following:98, ratings:{ default:'privada', publica:'seguidores', privada:'solo_yo' }, attendedPlanIds:['p7','p5'] },
  { id:'nora',  name:'Nora V.', handle:'@norav',  initials:'NV', type:'usuario', verified:true, followers:330, following:240, ratings:{ default:'publica', publica:'todos', privada:'solo_yo' }, attendedPlanIds:['p9'] },
];
const ME = USERS[0]; // usuario actual

/* Publicaciones del muro (pestaña Vividas) y de los perfiles.
   kind: foto | video | carrusel. imgs: fotos (slug de Unsplash); media: degradado
   de respaldo por foto. planId: plan al que está vinculada. ago: horas desde que
   se publicó. duration: segundos, solo en vídeos (simulados con la portada). */
/* Publicaciones del muro y de los perfiles. Pueden ser experiencias de un plan
   (con planId: enlazan al plan y cuentan como prueba social) o momentos de la vida
   de cada uno (sin planId). */
const POSTS = [
  { id:'po7',  authorId:'azotea', planId:'p3', trackId:'t2', kind:'video', duration:24, media:['g-grape'], imgs:['1517457373958-b7bdd4587205'], ago:2,
    caption:'Sunset Sessions de anoche. Gracias a los 63 que subisteis #rooftopmadrid', likes:540,
    comments:[{userId:'sara',text:'Qué noche. Repito el viernes'},{userId:'marco',text:'El DJ, brutal'}] },
  { id:'po8',  authorId:'lucia', planId:'p2', trackId:'t1', kind:'carrusel', media:['g-sunset','g-sunset'], imgs:['1495567720989-cebdbdd97913','1502680390469-be75c86b636f'], ago:3,
    caption:'Debod a las 21:40. Gracias a @marcot y a todos los que os acercasteis #atardecerdebod', likes:118,
    comments:[{userId:'marco',text:'El mejor atardecer de Madrid, sin discusión'},{userId:'ana',text:'La próxima no me lo pierdo'}] },
  { id:'po9',  authorId:'marco', planId:'p10', trackId:'t4', kind:'video', duration:31, media:['g-dark'], imgs:['1486218119243-13883505764c'], ago:8,
    caption:'5 km al anochecer con el club. Ritmo de grupo, nadie se queda atrás #runningmadrid', likes:76,
    comments:[{userId:'ana',text:'¿Vale para principiantes?'},{userId:'marco',text:'@anap sí, hay grupo de ritmo suave'}] },
  { id:'po10', authorId:'sara', planId:'p1', trackId:'t6', kind:'foto', media:['g-wine'], imgs:['1514362545857-3bc16c4c7d1b'], ago:14,
    caption:'El himno de la Victoria no defrauda. Fui sola y salí con plan para el sábado #himnovictoria', likes:203,
    comments:[{userId:'nora',text:'Eso es justo lo que buscaba al llegar a Burgos'}] },
  { id:'po11', authorId:'david', planId:'p7', trackId:'t3', kind:'carrusel', media:['g-grape','g-grape'], imgs:['1511192336575-5a79af67a629','1493225457124-a3eb161ffa5f'], ago:20,
    caption:'Jazz en Clamores. Sala pequeña, sonido enorme #clamoresjazz', likes:89,
    comments:[{userId:'lucia',text:'¿Hay pase el jueves que viene?'}] },
  { id:'po12', authorId:'ana', planId:'p8', trackId:'t5', kind:'foto', media:['g-forest'], imgs:['1545205597-3d9d02c29597'], ago:26,
    caption:'Primera sesión de yoga al sol en el Retiro. Repetimos el sábado #retiromorning', likes:61,
    comments:[] },
  { id:'po1',  authorId:'me', planId:'p5', trackId:'t1', kind:'carrusel', media:['g-forest','g-forest','g-sunset'], imgs:['1551632811-561732d1e306','1454496522488-7a8e488e8606','1495567720989-cebdbdd97913'], ago:30,
    caption:'Finde de trail por la sierra con @davidl #trailamanecer', likes:64,
    comments:[{userId:'david',text:'La subida final, inolvidable'}] },
  { id:'po13', authorId:'nora', planId:'p9', trackId:'t6', kind:'carrusel', media:['g-wine','g-wine'], imgs:['1510812431401-41d2bd2722f3','1474722883778-792e7990302f'], ago:40,
    caption:'Seis vinos naturales y una mesa de desconocidos que ya no lo son #catadevinos', likes:132,
    comments:[{userId:'sara',text:'Apuntadísima a la próxima'}] },
  { id:'po15', authorId:'david', planId:'p5', trackId:'t4', kind:'video', duration:15, media:['g-forest'], imgs:['1454496522488-7a8e488e8606'], ago:44,
    caption:'Subida al mirador al amanecer. Merece cada paso #trailamanecer', likes:58,
    comments:[] },
  { id:'po3',  authorId:'me', planId:'p3', trackId:'t2', kind:'video', duration:18, media:['g-grape'], imgs:['1566737236500-c8ac43014a67'], ago:52,
    caption:'Rooftop al atardecer #rooftopmadrid', likes:120,
    comments:[{userId:'azotea',text:'Gracias por venir, Marina'}] },
  { id:'po14', authorId:'marco', planId:'p12', trackId:'t5', kind:'foto', media:['g-sunset'], imgs:['1505686994434-e3cc5abf1330'], ago:60,
    caption:'Palomitas, manta y peli bajo las estrellas #cinedeverano', likes:47,
    comments:[] },
  { id:'po2',  authorId:'me', planId:'p9', kind:'foto', media:['g-wine'], imgs:['1474722883778-792e7990302f'], ago:70,
    caption:'Noche de vinos naturales', likes:38, comments:[] },
  { id:'po4',  authorId:'me', planId:'p2', trackId:'t1', kind:'foto', media:['g-sunset'], imgs:['1495567720989-cebdbdd97913'], ago:96,
    caption:'Atardecer en Debod #atardecerdebod', likes:51, comments:[] },
  { id:'po5',  authorId:'me', planId:'p6', trackId:'t6', kind:'carrusel', media:['g-dark','g-wine','g-dark'], imgs:['1558370781-d6196949e317','1555939594-58d7cb561ad1','1414235077428-338989a2e8c0'], ago:120,
    caption:'Ruta de tapas por Lavapiés con gente de seis países #tapasviajeros', likes:29,
    comments:[{userId:'lucia',text:'Qué buena pinta todo'}] },
  { id:'po6',  authorId:'me', planId:'p8', kind:'foto', media:['g-forest'], imgs:['1506126613408-eca07ce68773'], ago:140,
    caption:'Yoga en el Retiro #retiromorning', likes:44, comments:[] },
  // Momentos de la vida de cada uno (sin plan vinculado)
  { id:'pv1', authorId:'lucia', trackId:'t5', kind:'foto', media:['g-dark'], imgs:['1495474472287-4d71bcdd2085'], ago:5,
    caption:'Café de domingo con mi hermana, antes de que se despierte Madrid', likes:94,
    comments:[{userId:'ana',text:'Ese sitio tiene el mejor flat white'}] },
  { id:'pv2', authorId:'marco', trackId:'t1', kind:'carrusel', media:['g-forest','g-sunset'], imgs:['1543466835-00a7907e9de1','1507525428034-b723cf961d3e'], ago:11,
    caption:'Primer día de playa de Toby. No quería volver #vacaciones', likes:211,
    comments:[{userId:'lucia',text:'Toby es el verdadero protagonista de tu perfil'},{userId:'sara',text:'Qué cara de felicidad'}] },
  { id:'pv3', authorId:'sara', trackId:'t6', kind:'foto', media:['g-sunset'], imgs:['1484723091739-30a097e8f929'], ago:18,
    caption:'Brunch de cumpleaños en casa. 30 y contando', likes:156,
    comments:[{userId:'nora',text:'Felicidades, Sara'}] },
  { id:'pv4', authorId:'nora', kind:'foto', media:['g-forest'], imgs:['1490645935967-10de6ba17061'], ago:22,
    caption:'Primera comida en el piso nuevo de Burgos. Ya huele a casa', likes:48, comments:[] },
  { id:'pv5', authorId:'ana', trackId:'t5', kind:'video', duration:20, media:['g-forest'], imgs:['1501785888041-af3ef285b470'], ago:34,
    caption:'Vacaciones en los Dolomitas. El agua era así de verde de verdad', likes:183, comments:[] },
  { id:'pv6', authorId:'me', trackId:'t1', kind:'carrusel', media:['g-sunset','g-dark'], imgs:['1500530855697-b586d89ba3ee','1519681393784-d120267933ba'], ago:36,
    caption:'Road trip con mis padres. De noche, estrellas y cero cobertura', likes:87,
    comments:[{userId:'david',text:'Ese cielo no es real'}] },
  { id:'pv7', authorId:'david', trackId:'t6', kind:'foto', media:['g-sunset'], imgs:['1529156069898-49953e39b3ac'], ago:50,
    caption:'Los de siempre, desde el colegio', likes:132, comments:[] },
  { id:'pv8', authorId:'me', kind:'foto', media:['g-dark'], imgs:['1513475382585-d06e58bcb0e0'], ago:80,
    caption:'Domingo de sofá y libro', likes:41, comments:[] },
];

/* Stories (24 h): el "ahora mismo" de los planes. minAgo: minutos desde que se
   publicó; dentro de cada usuario se reproducen de la más antigua a la más nueva. */
const STORIES = [
  { id:'s1', userId:'azotea', planId:'p3', img:'1517457373958-b7bdd4587205', minAgo:12, trackId:'t2', text:'La azotea está a tope. Quedan 10 plazas para esta noche' },
  { id:'s2', userId:'azotea', planId:'p3', img:'1566737236500-c8ac43014a67', minAgo:4,  trackId:'t2', text:'Empieza el DJ set' },
  { id:'s3', userId:'lucia',  planId:'p2', img:'1495567720989-cebdbdd97913', minAgo:25, trackId:'t1', text:'Somos 9 en Debod. Aún llegáis' },
  { id:'s4', userId:'marco',  planId:'p10', img:'1486218119243-13883505764c', minAgo:40, trackId:'t4', text:'Salimos en 15 minutos desde la Puerta de Alcalá' },
  { id:'s5', userId:'sara',   planId:'p1', img:'1510812431401-41d2bd2722f3', minAgo:65, trackId:'t6', text:'Brindis antes del himno' },
  { id:'s6', userId:'sara',   planId:'p1', img:'1514362545857-3bc16c4c7d1b', minAgo:50, trackId:'t6', text:'Calentando voces' },
  { id:'s7', userId:'nora',   planId:'p9', img:'1474722883778-792e7990302f', minAgo:180, text:'Últimas plazas para la cata del jueves' },
];

/* Biblioteca de música (ficticia). Pistas originales de la demo: no son canciones
   reales, se sintetizan en el navegador a partir de este patrón (sin archivos).
   free: libre de derechos (la única que podrían usar las cuentas profesionales).
   Patrón de 16 pasos por compás: chords = acordes en MIDI (uno por compás);
   kick/hat: 'x' = golpe; bass/lead: dígito = nota del acorde (1 = la primera). */
const TRACKS = [
  { id:'t1', title:'Golden hour', artist:'Brisa Norte', mood:'Tranquila', bpm:82, free:true, cover:'g-sunset',
    chords:[[53,57,60,64],[52,55,59,62],[50,53,57,60],[48,52,55,59]],
    kick:'x.......x.......', hat:'..x...x...x...x.', bass:'1.....1.....3...', lead:'1...3...2.....4.', pad:'triangle' },
  { id:'t2', title:'Azotea', artist:'Neón Cálido', mood:'Fiesta', bpm:122, free:false, cover:'g-grape',
    chords:[[57,60,64],[53,57,60],[48,52,55],[55,59,62]],
    kick:'x...x...x...x...', hat:'..x...x...x...x.', bass:'1..1..1.1..1..1.', lead:'1.3.2.3.1.3.2.3.', pad:'sawtooth', leadWave:'square' },
  { id:'t3', title:'Clamores, 2 a.m.', artist:'Trío Lavapiés', mood:'Jazz', bpm:96, free:false, cover:'g-dark', swing:0.3,
    chords:[[50,53,57,60],[55,59,62,65],[48,52,55,59],[57,61,64,67]],
    kick:'x.........x.....', hat:'x..x.xx..x.xx..x', bass:'1...3...2...4...', lead:'..4...3.....2...', pad:'sine' },
  { id:'t4', title:'Primer kilómetro', artist:'Ritmo Urbano', mood:'Energía', bpm:128, free:true, cover:'g-wine',
    chords:[[52,55,59],[48,52,55],[55,59,62],[50,54,57]],
    kick:'x...x...x...x...', hat:'x.x.x.x.x.x.x.x.', bass:'1.1.1.1.1.1.1.1.', lead:'1..2..3.1..2..3.', pad:'sawtooth', leadWave:'square' },
  { id:'t5', title:'Respira', artist:'Luz de Mañana', mood:'Calma', bpm:70, free:true, cover:'g-forest',
    chords:[[48,52,55,59],[45,48,52,55],[41,45,48,52],[43,47,50,52]],
    kick:'................', hat:'................', bass:'1...............', lead:'3.......2.......', pad:'sine' },
  { id:'t6', title:'Vermut y sobremesa', artist:'La Terraza', mood:'Sobremesa', bpm:110, free:false, cover:'g-sunset',
    chords:[[50,54,57,61],[47,50,54,57],[52,55,59,62],[45,49,52,55]],
    kick:'x...x...x...x...', hat:'x..x..x...x..x..', bass:'1..3..1.1..3..1.', lead:'..3.2...4..3....', pad:'triangle' },
];

/* Directos: emisiones en vivo desde un plan en marcha. */
const LIVES = [
  { id:'l1', userId:'azotea', planId:'p3', img:'1566737236500-c8ac43014a67', title:'Sunset Sessions en directo', viewers:214, startedMin:18 },
  { id:'l2', userId:'david',  planId:'p7', img:'1511192336575-5a79af67a629', title:'Jazz en Clamores, primer pase', viewers:87, startedMin:6 },
];

// Mensajes de ejemplo que aparecen en el chat de un directo.
const LIVE_CHAT = [
  { name:'Lucía R.', text:'Qué ambiente' },
  { name:'Pablo G.', text:'¿Quedan plazas para la próxima?' },
  { name:'Irene C.', text:'Voy para allá' },
  { name:'Marco T.', text:'Subid el volumen' },
  { name:'Ana P.', text:'Desde casa con envidia' },
  { name:'Tomás R.', text:'¿A qué hora acaba?' },
  { name:'Sara M.', text:'Me apunto a la siguiente' },
  { name:'Irene C.', text:'Brutal' },
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

/* Grafo social asimétrico: [quien sigue, a quién sigue]. Amigos = seguimiento
   mutuo (os seguís los dos). Seguidores = te siguen, aunque tú no a ellos. */
const FOLLOWS = [
  ['me','lucia'], ['lucia','me'], ['me','marco'], ['marco','me'], ['me','david'], ['david','me'],
  ['me','ana'], ['me','azotea'], ['sara','me'], ['nora','me'],
];
const follows  = (a, b) => FOLLOWS.some(([x, y]) => x === a && y === b);
const areFriends = (a, b) => follows(a, b) && follows(b, a);

/* Valoraciones que cada persona hace de los planes a los que asistió.
   visibility: 'publica' | 'privada' para ese plan, o null = usa su configuración general
   (USUARIO.ratings.default). Quién ve cada una lo decide USUARIO.ratings.publica / .privada. */
const RATINGS = [
  { id:'ra1', userId:'me', planId:'p1', stars:5, visibility:null, daysAgo:2, text:'Fui sola y salí con plan para el sábado. El himno, a todo pulmón.' },
  { id:'ra2', userId:'me', planId:'p5', stars:5, visibility:'privada', daysAgo:9, text:'La subida final cuesta, pero el amanecer lo compensa todo.' },
  { id:'ra3', userId:'me', planId:'p8', stars:4, visibility:null, daysAgo:12, text:'Muy buen ambiente. Lleva esterilla, que no sobran.' },
  { id:'ra4', userId:'me', planId:'p2', stars:5, visibility:'publica', daysAgo:16, text:'El mejor atardecer de Madrid y gente muy maja.' },
  { id:'ra5', userId:'me', planId:'p3', stars:4, visibility:null, daysAgo:20, text:'Buen DJ y vistas increíbles. Las copas, caras.' },
  { id:'ra6', userId:'me', planId:'p9', stars:3, visibility:'privada', daysAgo:30, text:'Los vinos bien, pero éramos demasiados para la sala.' },
  { id:'ra7', userId:'lucia', planId:'p2', stars:5, visibility:null, daysAgo:3, text:'Repetiría cada semana. Lo organicé yo y salió redondo.' },
  { id:'ra8', userId:'lucia', planId:'p1', stars:4, visibility:'privada', daysAgo:14, text:'Me gustó, aunque llegué tarde y estaba lleno.' },
  { id:'ra9', userId:'marco', planId:'p10', stars:5, visibility:null, daysAgo:8, text:'Ritmo para todos. Nadie se queda atrás.' },
  { id:'ra10', userId:'marco', planId:'p12', stars:4, visibility:'privada', daysAgo:21, text:'Buena peli, mucho frío al final.' },
  { id:'ra11', userId:'ana', planId:'p8', stars:5, visibility:null, daysAgo:5, text:'Mi primera vez haciendo yoga en grupo. Volveré.' },
  { id:'ra12', userId:'sara', planId:'p1', stars:5, visibility:null, daysAgo:6, text:'Ambientazo. Fui sola y volví con amigos.' },
  { id:'ra13', userId:'david', planId:'p7', stars:5, visibility:'publica', daysAgo:4, text:'Sala pequeña, sonido enorme.' },
  { id:'ra14', userId:'david', planId:'p5', stars:4, visibility:null, daysAgo:9, text:'Bien organizado, pero salimos con retraso.' },
  { id:'ra15', userId:'nora', planId:'p9', stars:5, visibility:null, daysAgo:7, text:'Seis vinos y una mesa de desconocidos que ya no lo son.' },
];

const getUser  = (id) => USERS.find((u) => u.id === id);
const getGroup = (id) => GROUPS.find((g) => g.id === id);
const getTrack = (id) => TRACKS.find((t) => t.id === id);
const postsByUser = (uid) => POSTS.filter((p) => p.authorId === uid);
// Origen de una publicación: experiencia de un plan (tiene plan vinculado) o de su vida.
const postOrigin = (po) => (po.planId ? 'plan' : 'vida');
const requestsForPlan = (pid) => REQUESTS.filter((r) => r.planId === pid);

// Exponer explícitamente en window: garantiza que app.js (otro <script>) y los
// manejadores inline encuentren los datos, sin depender del scope léxico compartido.
if (typeof window !== 'undefined') {
  Object.assign(window, {
    CATEGORIES, PLACES, PLANS, REVIEWS, ME, USERS, POSTS, GROUPS, REQUESTS,
    STORIES, LIVES, LIVE_CHAT, TRACKS, FOLLOWS, RATINGS, follows, areFriends,
    getPlace, getPlan, getCategory, getUser, getGroup, getTrack, postsByUser, postOrigin, requestsForPlan,
  });
}
