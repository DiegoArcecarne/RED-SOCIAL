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
  { id: 'clamores',  name: 'Sala Clamores',       kind: 'negocio', verified: false, city: 'Madrid', category: 'cultura', hashtag: '#clamoresjazz',      x: 60, y: 30, rating: 4.5 },
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
    when: hoursFromNow(46), groupMin: 10, groupMax: 40, joined: 40,
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
    when: hoursFromNow(20), groupMin: 8, groupMax: 24, joined: 15,
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
  p3: { cancelPolicy: 'moderada' },
  p4: { approval: 'manual', cancelPolicy: 'estricta' },
  p6: { approval: 'manual', groupId: 'g1' },
  p7: { waitlist: ['x1','x2','x3'] },   // completo: tres personas esperan plaza
  p9: { groupId: 'g2' },
};
PLANS.forEach((p) => {
  const e = PLAN_EXTRA[p.id] || {};
  p.approval = (p.joinType === 'libre') ? 'libre' : (e.approval || 'automatica');
  p.groupId = e.groupId || null;
  p.cancelPolicy = e.cancelPolicy || 'flexible';   // flexible | moderada | estricta (solo cuenta en los de pago)
  p.waitlist = e.waitlist ? e.waitlist.slice() : [];
  p.status = 'activo';                              // activo | cancelado
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
    joinedPlanIds:['p9'],   // apuntada a la cata de mañana (toca reconfirmar)
    stats:{ noShows:0, lateCancels:0 },
    dmMode:'solicitud',   // quién puede escribirte: cerrado | solicitud | abierto (por defecto, bajo solicitud)
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
  // Perfil privado: para ver sus publicaciones hay que pedir seguirla.
  { id:'irene', name:'Irene C.', handle:'@irenec', initials:'IC', type:'usuario', verified:true, profilePublic:false,
    bio:'Fotografía, montaña y vermú.', followers:96, following:110, ratings:{ default:'publica', publica:'todos', privada:'solo_yo' }, attendedPlanIds:['p5'] },
  // Cuenta con reportes pendientes: sirve para probar el panel de moderación.
  { id:'alexv', name:'Álex V.', handle:'@alex.v', initials:'AV', type:'usuario', verified:true, followers:14, following:390, ratings:{ default:'publica', publica:'todos', privada:'solo_yo' }, attendedPlanIds:['p3'] },
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
    comments:[{userId:'sara',text:'Qué noche. Repito el viernes'},{userId:'marco',text:'El DJ, brutal'},{id:'cm-a1',userId:'alexv',text:'Menudo DJ más malo, sois todos unos pringados'}] },
  { id:'po8',  authorId:'lucia', planId:'p2', trackId:'t1', kind:'carrusel', media:['g-sunset','g-sunset'], imgs:['1495567720989-cebdbdd97913','1502680390469-be75c86b636f'], ago:3,
    caption:'Debod a las 21:40. Gracias a @marcot y a todos los que os acercasteis #atardecerdebod', likes:118,
    comments:[{userId:'marco',text:'El mejor atardecer de Madrid, sin discusión'},{userId:'ana',text:'La próxima no me lo pierdo'},{userId:'marco',text:'@marina tienes que venir la próxima'}] },
  { id:'po9',  authorId:'marco', planId:'p10', trackId:'t4', kind:'video', duration:31, media:['g-dark'], imgs:['1486218119243-13883505764c'], ago:8,
    caption:'5 km al anochecer con el club. Ritmo de grupo, nadie se queda atrás #runningmadrid', likes:76,
    comments:[{userId:'ana',text:'¿Vale para principiantes?'},{userId:'marco',text:'@anap sí, hay grupo de ritmo suave'},
      // Retirado por moderación (venta de entradas fuera de la app): Marina puede apelar.
      {id:'cm-m1',userId:'me',text:'Vendo 2 entradas para el rooftop, escríbeme al 600 123 456',removed:true}] },
  { id:'po10', authorId:'sara', planId:'p1', trackId:'t6', kind:'foto', media:['g-wine'], imgs:['1514362545857-3bc16c4c7d1b'], ago:14,
    caption:'El himno de la Victoria no defrauda. Fui sola y salí con plan para el sábado #himnovictoria', likes:203,
    comments:[{userId:'nora',text:'Eso es justo lo que buscaba al llegar a Burgos'}] },
  { id:'po11', authorId:'david', planId:'p7', trackId:'t3', kind:'carrusel', media:['g-grape','g-grape'], imgs:['1511192336575-5a79af67a629','1493225457124-a3eb161ffa5f'], ago:20,
    caption:'Jazz en Clamores. Sala pequeña, sonido enorme. Gracias @marina por la recomendación #clamoresjazz', likes:89,
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
  { id:'pv7', authorId:'david', trackId:'t6', kind:'foto', media:['g-sunset'], imgs:['1529156069898-49953e39b3ac'], ago:50, taggedUserIds:['me','marco'],
    caption:'Los de siempre, desde el colegio', likes:132, comments:[] },
  { id:'pv9', authorId:'irene', kind:'foto', media:['g-forest'], imgs:['1507525428034-b723cf961d3e'], ago:16,
    caption:'Cala escondida, nadie a la vista #escapadas', likes:71, comments:[] },
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
// Solicitudes para seguir perfiles privados: [quien pide, a quién].
const FOLLOW_REQUESTS = [];
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
  { id:'ra16', userId:'irene', planId:'p5', stars:5, visibility:null, daysAgo:9, text:'El amanecer desde arriba, de lo mejor del año.' },
  { id:'ra15', userId:'nora', planId:'p9', stars:5, visibility:null, daysAgo:7, text:'Seis vinos y una mesa de desconocidos que ya no lo son.' },
];

/* Mensajería. Dos tipos de conversación:
   - dm: mensaje directo 1:1. status: 'aceptada'; 'solicitud' (te escribe alguien que no
     conoces: cae en Solicitudes) o 'enviada' (tu primer mensaje a quien no te conoce:
     solo uno hasta que acepte).
   - plan: chat de grupo de un plan, para coordinarse.
   min: minutos desde el mensaje. share: publicación ('po8') o plan ('plan:p2') compartido.
   img: foto adjunta (las de desconocidos llegan difuminadas). */
const CONVERSATIONS = [
  { id:'c1', type:'dm', with:'lucia', status:'aceptada', unread:2, messages:[
    { from:'me', text:'¡Qué bien lo pasamos en Debod!', min:1500 },
    { from:'lucia', text:'Total. El jueves repetimos, ¿te apuntas?', min:42 },
    { from:'lucia', share:'plan:p2', min:41 } ] },
  { id:'c2', type:'plan', planId:'p3', members:['me','azotea','lucia','sara','marco'], unread:3, messages:[
    { from:'azotea', text:'Hola a todos. Abrimos puertas a las 20:00; la primera consumición va incluida.', min:180 },
    { from:'sara', text:'¿Hay sitio para dejar la bici?', min:95 },
    { from:'azotea', text:'Sí, en el patio de la entrada.', min:90 },
    { from:'marco', text:'Llego un poco tarde, guardadme sitio cerca del DJ', min:12 } ] },
  { id:'c3', type:'dm', with:'marco', status:'aceptada', unread:0, messages:[
    { from:'marco', share:'plan:p10', text:'¿Te vienes a correr el martes?', min:300 },
    { from:'me', text:'¡Claro! ¿Ritmo suave?', min:290 },
    { from:'marco', text:'Hay grupo de ritmo suave, sí', min:285 } ] },
  { id:'c4', type:'plan', planId:'p5', members:['me','david','marco'], unread:0, messages:[
    { from:'david', text:'Quedamos a las 6:15 en el parking del puerto.', min:900 },
    { from:'marco', text:'¿Hace falta frontal?', min:880 },
    { from:'david', text:'Sí, hasta que amanezca.', min:870 } ] },
  { id:'c5', type:'dm', with:'david', status:'aceptada', unread:0, messages:[
    { from:'david', share:'po11', text:'Esto te va a gustar', min:2000 } ] },
  { id:'c6', type:'dm', with:'nora', status:'solicitud', unread:1, messages:[
    { from:'nora', text:'¡Hola! Vi que fuiste a la cata de vinos naturales. Acabo de llegar a Burgos y busco gente para planes así.', min:65 },
    { from:'nora', img:'1474722883778-792e7990302f', min:64 } ] },
];
const getConversation = (id) => CONVERSATIONS.find((c) => c.id === id);
/* Confianza y seguridad (confianza.js). En la app real todo esto vive en el servidor.
   REPORTS: reportes de usuarios y avisos del filtro automático (el reportado nunca sabe
   quién reporta). objectType: usuario | conversacion | publicacion | comentario | mensaje | plan.
   status: en_cola | resuelto | desestimado. */
const minsAgo = (m) => Date.now() - m * 60000;
const REPORTS = [
  { id:'rp1', reporterId:'lucia', targetUserId:'alexv', objectType:'comentario', postId:'po7', commentId:'cm-a1', reason:'acoso',
    evidence:'Menudo DJ más malo, sois todos unos pringados', source:'usuario', status:'en_cola', at: minsAgo(50) },
  { id:'rp2', reporterId:'sara', targetUserId:'alexv', objectType:'conversacion', reason:'spam',
    evidence:'Gana 300 € a la semana desde casa. Entra en bit.ly/dinero-ya', source:'usuario', status:'en_cola', at: minsAgo(190) },
  { id:'rp3', reporterId:null, targetUserId:'alexv', objectType:'conversacion', reason:'peligro', autoCategory:'amenaza',
    evidence:'Sé dónde vives, ya nos veremos', source:'automatico', status:'en_cola', at: minsAgo(12) },
  { id:'rp4', reporterId:'ana', targetUserId:'david', objectType:'usuario', reason:'otro',
    evidence:'No me gusta cómo habla en los planes', source:'usuario', status:'en_cola', at: minsAgo(1500) },
];
// Decisiones de moderación (con su exposición de motivos) y apelaciones.
const MOD_ACTIONS = [
  { id:'ma1', targetUserId:'me', action:'retirar', objectType:'comentario', postId:'po9', commentId:'cm-m1', reason:'spam',
    evidence:'Vendo 2 entradas para el rooftop, escríbeme al 600 123 456', automated:true, status:'vigente', at: minsAgo(2 * 1440), appeal:null },
];
// Estado de moderación de cada cuenta: avisos, suspensión, alcance y si puede organizar.
const USER_MOD = { alexv: { strikes:1 } };
// Alertas SOS, planes compartidos con contactos de confianza y avisos de "he llegado bien".
const SAFETY_EVENTS = [];

/* Quién está ahora en cada plan (ha registrado su llegada), con su visibilidad: todos los
   del plan, solo amigos o nadie; y si va solo o en grupo. Salen en el punto del plan, nunca
   en su posición exacta, y solo los ve quien también está en el plan (planes.js). */
const PLAN_PRESENCE = {
  p2: [ { userId:'lucia', vis:'todos', mode:'grupo' }, { userId:'marco', vis:'todos', mode:'solo' }, { userId:'nora', vis:'todos', mode:'solo' },
        { userId:'ana', vis:'amigos', mode:'grupo' }, { userId:'david', vis:'nadie', mode:'solo' } ],
  p3: [ { userId:'sara', vis:'todos', mode:'grupo' }, { userId:'marco', vis:'todos', mode:'solo' }, { userId:'irene', vis:'amigos', mode:'solo' } ],
  p12:[ { userId:'nora', vis:'todos', mode:'solo' }, { userId:'lucia', vis:'todos', mode:'grupo' } ],
};

/* Chispas: posibles planes ("Estoy pensando ir a pescar, ¿alguien se anima?"). Si se anima
   suficiente gente, se convierten en plan; si no, caducan (chispas.js).
   when: hoy | finde | semana | fecha (con date) | sin_fecha. limit: false = sin límite de plazas.
   who: todos | seguidores | amigos; approval: decide quien la lanza. cost: gratis | a_escote | cada_uno.
   people: { userId, status: si | quizas | pendiente }. */
const IDEAS = [
  { id:'ch1', authorId:'marco', title:'Subir a la Pedriza el domingo temprano', text:'Estoy pensando subir a La Pedriza el domingo a las 8. Ruta media, unas 4 horas. ¿Alguien se anima?',
    category:'outdoor', when:'finde', zone:'La Pedriza, Manzanares el Real', limit:true, max:6, min:3, who:'todos', approval:false, cost:'a_escote', costNote:'Gasolina a escote',
    people:[{ userId:'nora', status:'si' }, { userId:'david', status:'quizas' }], status:'abierta', at: minsAgo(180) },
  { id:'ch2', authorId:'lucia', title:'Vermú en La Latina', text:'¿Vermú el sábado a mediodía por La Latina? Sin plan fijo, vamos viendo.',
    category:'gastro', when:'finde', zone:'La Latina, Madrid', limit:false, min:2, who:'todos', approval:false, cost:'cada_uno',
    people:[{ userId:'ana', status:'si' }, { userId:'sara', status:'si' }, { userId:'marco', status:'quizas' }], status:'abierta', at: minsAgo(60) },
  { id:'ch3', authorId:'sara', title:'El Prado gratis el miércoles', text:'El Prado es gratis de 18 a 20 h. Me apetece ir el miércoles y luego tomar algo. Somos pocos para no ir en manada.',
    category:'cultura', when:'semana', zone:'Museo del Prado', limit:true, max:4, min:2, who:'todos', approval:true, cost:'gratis',
    people:[{ userId:'irene', status:'si' }], status:'abierta', at: minsAgo(400) },
];

/* Herramientas internas (admin.js; en la app real, una web aparte con acceso por roles).
   Verificación de negocios: documentos, estado y, si reclaman un lugar del mapa, cuál.
   status: pendiente | faltan_documentos | verificado | rechazado. */
const BIZ_VERIFICATIONS = [
  { id:'bv1', userId:'azotea', name:'Azotea Círculo', taxId:'B12345674', category:'Ocio nocturno', address:'Centro, Madrid', placeId:'azotea', claim:true,
    docs:['CIF','Licencia de actividad','Titularidad del local'], status:'verificado', at: minsAgo(40 * 1440), decidedAt: minsAgo(39 * 1440) },
  { id:'bv2', userId:null, name:'Bar La Parra', taxId:'B87654321', category:'Bar', address:'Lavapiés, Madrid', placeId:'lavapies', claim:false, contact:'Javier R.',
    docs:['CIF','Licencia de actividad'], missing:['Titularidad del local'], status:'pendiente', at: minsAgo(300) },
  { id:'bv3', userId:null, name:'Vinos Vivos', taxId:'B11223344', category:'Organizador de eventos', address:'Madrid', contact:'Elena M.',
    docs:['CIF','Seguro de responsabilidad civil'], status:'pendiente', at: minsAgo(1500) },
  { id:'bv4', userId:null, name:'Sala Clamores', taxId:'B99887766', category:'Cultura', address:'Chamberí, Madrid', placeId:'clamores', claim:true, contact:'Pablo G.',
    docs:['CIF','Licencia de actividad','Titularidad del local'], status:'pendiente', at: minsAgo(30) },
];
// Métricas del piloto por semana (simuladas: en la app real salen del registro de eventos).
const PILOT_WEEKS = [
  { w:'Semana 1', registros:62, activos:41, planes:9,  apuntados:58,  asistencias:37 },
  { w:'Semana 2', registros:71, activos:66, planes:13, apuntados:84,  asistencias:55 },
  { w:'Semana 3', registros:48, activos:83, planes:16, apuntados:102, asistencias:71 },
  { w:'Semana 4', registros:55, activos:97, planes:19, apuntados:121, asistencias:86 },
];
// Valores acumulados del piloto para las hipótesis H1-H6 de docs/plan-validacion-madrid.md (simulados).
const PILOT_STATS = { registros:236, activacion:44, asistenciaGratis:64, asistenciaPago:88, repeticion:27, aforoPago:73, planesConFotos:41, valoracion:4.4, incidentesGraves:0, semana:4, semanas:6 };

/* Pagos (pagos.js; en la app real, Stripe Connect). Cada pago es una reserva de un plan de
   pago: el dinero queda retenido hasta que el plan se celebra y después se paga al
   anfitrión, menos la comisión del 15 %. status: pendiente (aceptado, falta pagar) |
   retenido | liberado (celebrado, en camino al anfitrión) | pagado | reembolsado |
   reembolso_parcial | en_revision (reclamación abierta). */
const PAYMENT_METHODS = [ { id:'pm1', brand:'Visa', last4:'4242', exp:'12/28', isDefault:true } ];
const PAYMENTS = [
  { id:'pay1', planId:'p9', planTitle:'Cata de vinos naturales', hostName:'Vinos Vivos', userId:'me', amount:22, refunded:0,
    status:'retenido', method:'Visa ···· 4242', at: minsAgo(3 * 1440), receiptNo:'PL-2026-000118' },
  { id:'pay2', planId:'p3', planTitle:'Rooftop Sunset Sessions · edición de septiembre', hostName:'Azotea Círculo', userId:'me', amount:18, refunded:0,
    status:'pagado', method:'Visa ···· 4242', at: minsAgo(26 * 1440), paidOutAt: minsAgo(22 * 1440), receiptNo:'PL-2026-000097', past:true },
  { id:'pay3', planId:'p7', planTitle:'Jazz íntimo en Clamores · edición de agosto', hostName:'Sala Clamores', userId:'me', amount:14, refunded:14,
    status:'reembolsado', method:'Visa ···· 4242', at: minsAgo(50 * 1440), refundedAt: minsAgo(47 * 1440), refundReason:'Cancelaste con más de 24 h: reembolso completo', receiptNo:'PL-2026-000061', past:true },
];

/* Notificaciones. type: recordatorio | solicitud | mensaje | cambio | plaza | fiabilidad.
   min: minutos desde que llegó (las nuevas guardan "at"). */
const NOTIFICATIONS = [
  { id:'n1', type:'recordatorio', planId:'p9', min:30, read:false, text:'Mañana: Cata de vinos naturales. Reconfirma que vas para no perder tu plaza.' },
  { id:'n2', type:'cambio', planId:'p3', min:180, read:false, text:'Cambio en Rooftop Sunset Sessions: abren puertas a las 20:00 en lugar de a las 20:30.' },
  { id:'n3', type:'solicitud', planId:'p6', route:'solicitudes/p6', min:240, read:true, text:'Lucía y Ana quieren ir a Ruta de tapas para viajeros. Como admin del grupo, decides tú.' },
  { id:'n4', type:'mensaje', convId:'c1', min:42, read:true, text:'Lucía R.: El jueves repetimos, ¿te apuntas?' },
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
    STORIES, LIVES, LIVE_CHAT, TRACKS, FOLLOWS, FOLLOW_REQUESTS, RATINGS, follows, areFriends, CONVERSATIONS, getConversation, REPORTS, NOTIFICATIONS,
    MOD_ACTIONS, USER_MOD, SAFETY_EVENTS, PAYMENT_METHODS, PAYMENTS, PLAN_PRESENCE, IDEAS, BIZ_VERIFICATIONS, PILOT_WEEKS, PILOT_STATS,
    getPlace, getPlan, getCategory, getUser, getGroup, getTrack, postsByUser, postOrigin, requestsForPlan,
  });
}
