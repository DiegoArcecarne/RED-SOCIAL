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
  draft: { cover:'g-grape', size:'mediano', cat:'social', access:'libre', price:'gratis' },
  draftPostKind: 'foto',
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
function escapeHtml(s){ return (s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function val(id){ const el=document.getElementById(id); return el?el.value:''; }
function toast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg;t.classList.add('show');
  clearTimeout(t._tmo);t._tmo=setTimeout(()=>t.classList.remove('show'),2100);
}
function typeBadge(u){ return u.type==='profesional' ? `<span class="pro-badge">${ico('briefcase')} Profesional</span>` : ''; }

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
    <span class="cell-scrim"></span>
    <span class="cell-corner" title="${p.paid?'De pago':'Gratis'}">${freeIcon(p)}</span>
    <span class="cell-info">
      <span class="cell-title">${escapeHtml(p.title)}</span>
      <span class="cell-meta">${escapeHtml(loc)} · ${ico('geo')} ${p.attended}</span>
    </span>
  </button>`;
}
function renderFeed(){
  const plans = filteredPlans();
  const cont = document.getElementById('feed-list');
  cont.innerHTML = plans.length ? `<div class="grid">${plans.map(gridCell).join('')}</div>`
    : emptyTab('grid','Sin planes con esos filtros','Prueba a ampliar el tamaño de grupo o el tema.');
}
function renderVividasTab(){
  const cells = AFTERMOVIES.concat(AFTERMOVIES).slice(0,6).map(a=>`
    <button class="cell ${a.gradient}" onclick="toast('Aftermovie · ${a.hashtag}')" aria-label="${a.planTitle}">
      <span class="cell-scrim"></span><span class="cell-corner">${ico('heart')}</span>
      <span class="cell-info"><span class="cell-title">${a.hashtag}</span><span class="cell-meta">${a.author}</span></span>
    </button>`).join('');
  return `<div class="grid">${cells}</div>`;
}
function emptyTab(icon,title,text){ return `<div class="empty-tab"><span class="empty-ic">${ico(icon)}</span><h3>${title}</h3><p>${text}</p></div>`; }
function renderContent(){
  const filters = document.getElementById('feed-filters');
  const list = document.getElementById('feed-list');
  document.querySelectorAll('.content-tabs button').forEach(b=> b.classList.toggle('active', b.dataset.tab===state.contentTab));
  if (state.contentTab==='disponibles'){ filters.style.display='flex'; renderFeed(); }
  else {
    filters.style.display='none';
    if (state.contentTab==='vividas') list.innerHTML = renderVividasTab();
    else if (state.contentTab==='stories') list.innerHTML = emptyTab('live','Stories · el “ahora mismo”','Contenido efímero de planes en marcha. El prototipo se centra en las vistas principales y los flujos de creación.');
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
    return `<button class="pin ${placeKindClass(pl)} ${sel}" style="left:${pl.x}%;top:${pl.y}%" onclick="selectPlace('${pl.id}')" aria-label="${pl.name}">
      <span class="pin-dot">${inner}</span><span class="pin-cap">${pl.secret?'·····':pl.name}</span></button>`;
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
    <h3>${pl.secret?'Lugar por desvelar':pl.name} ${pl.verified?`<span class="vchk">${ico('check')}</span>`:''}</h3>
    <div class="sub">${pl.kind==='negocio'?'Negocio verificado':'Lugar público'} · ${pl.city} · ${rating(pl.rating)} · ${pl.hashtag}</div>
    ${plans.length?plans.map(miniPlan).join(''):'<div class="sub">Sin planes próximos en este lugar.</div>'}`;
}
function miniPlan(p){
  return `<button class="mini-plan" onclick="go('plan/${p.id}')">
    <span class="mini-thumb ${p.gradient}"></span>
    <span class="mini-info"><span class="mini-t">${escapeHtml(p.title)}</span>
      <span class="mini-m">${fmtWhen(p.when)} · ${sizeLabel(p)} · ${ico('geo')} ${p.attended}</span></span>
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
  toast(state.presencePublic ? 'Llegada verificada por ubicación · presencia pública' : 'Llegada verificada por ubicación · presencia privada');
  renderDetail(id);
}
function requestAttendance(id){
  if (state.requested.has(id)) return;
  state.requested.add(id);
  REQUESTS.push({ id:'r'+Date.now(), planId:id, userId:'me', status:'pendiente', message:'Solicitud enviada desde el prototipo.' });
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
  const priv = p.attendedPrivate;
  const whoBlock = `
    <div class="block"><h4>Quién asiste · verificado por ubicación</h4>
      <div class="attendees">
        ${pubList.map(a=>`<span class="avatar sm">${a}</span>`).join('')}
        <span class="more">${ico('geo')} ${p.attended} asistentes reales${priv?` · ${priv} en privado`:''}</span>
      </div>
      <p class="hint">Los asistentes en privado cuentan en el total pero no se listan.</p></div>`;

  const pend = requestsForPlan(p.id).filter(r=>r.status==='pendiente').length;
  const manageBlock = canManage(p) ? `
    <div class="block"><h4>Organización</h4>
      <p class="hint">Este plan es del grupo <b>${escapeHtml(group?group.name:'')}</b> y requiere aprobación. Como admin, gestionas las solicitudes.</p>
      <button class="btn-ghost" onclick="go('solicitudes/${p.id}')">${ico('users')} Gestionar solicitudes${pend?` · ${pend} pendientes`:''}</button>
    </div>` : (group ? `<div class="block"><h4>Organización</h4><p class="hint">Plan del grupo <b>${escapeHtml(group.name)}</b>. Las solicitudes las aprueban sus admins.</p></div>` : '');

  view.innerHTML = `
    <div class="detail-hero ${p.gradient}">
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
        <div class="kpi"><div class="v">${p.attended}</div><div class="k">${ico('geo')} asistentes</div></div>
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
          <div class="meta"><div class="n">${escapeHtml(p.host.name)} ${p.host.verified?`<span class="vchk">${ico('check')}</span>`:''} ${p.host.business?`<span class="pro-badge sm">${ico('briefcase')} Profesional</span>`:''}</div>
            <div class="s">${rating(p.host.rating)} · responde del plan</div></div>
          <span class="pl-arrow">${ico('chevR')}</span>
        </button>
        <div class="trust-row"><span class="trust">${ico('shield')} Identidad verificada</span><span class="trust">${ico('check')} Fiabilidad ${p.host.reliability}%</span></div>
      </div>
      <div class="block"><h4>Lugar</h4>
        <button class="place-link" onclick="go('mapa');selectPlace('${place?place.id:''}')">
          <span class="mini-thumb ${p.gradient}"></span>
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
    const p = getPlan(planId), u = getUser(r.userId);
    p.attended = (p.attended||0)+1;
    if (u && !p.publicAttendees.includes(u.initials)) p.publicAttendees.unshift(u.initials);
    toast('Solicitud aceptada · ahora es asistente');
  } else toast('Solicitud rechazada');
  renderRequests(planId);
}

/* ---------- perfil ---------- */
function profileGridPosts(uid){
  const posts = postsByUser(uid);
  if (!posts.length) return `<div class="empty-tab"><span class="empty-ic">${ico('image')}</span><p>Aún no hay publicaciones.</p></div>`;
  return `<div class="grid">${posts.map(po=>`
    <button class="cell ${po.media[0]}" onclick="toast('Publicación · ${po.kind}')" aria-label="${escapeHtml(po.caption)}">
      <span class="cell-scrim"></span><span class="cell-corner">${ico(POST_ICON[po.kind]||'image')}</span>
      <span class="cell-info"><span class="cell-meta">${ico('heart')} ${po.likes}</span></span>
    </button>`).join('')}</div>`;
}
function profileGridVividas(u){
  const plans = (u.attendedPlanIds||[]).map(getPlan).filter(Boolean);
  if (!plans.length) return `<div class="empty-tab"><span class="empty-ic">${ico('play')}</span><p>Aún no hay Vividas.</p></div>`;
  return `<div class="grid">${plans.map(p=>`
    <button class="cell ${p.gradient}" onclick="go('plan/${p.id}')" aria-label="${escapeHtml(p.title)}">
      <span class="cell-scrim"></span><span class="cell-corner">${freeIcon(p)}</span>
      <span class="cell-info"><span class="cell-title">${escapeHtml(p.title)}</span></span></button>`).join('')}</div>`;
}
function renderProfile(uid){
  const me = (uid==='me' || !uid);
  const u = me ? ME : getUser(uid);
  if (!u){ document.getElementById(me?'view-perfil':'view-page').innerHTML = '<div class="empty-tab"><p>Perfil no encontrado.</p></div>'; return; }
  const container = me ? document.getElementById('view-perfil') : document.getElementById('view-page');
  const tab = state.profileTab;
  const proExtra = u.type==='profesional' ? `
    <div class="block"><h4>${ico('briefcase')} Información de negocio</h4>
      <div class="kv"><span>Categoría</span><b>${escapeHtml(u.business?.category||'—')}</b></div>
      <div class="kv"><span>Web</span><b>${escapeHtml(u.business?.web||'—')}</b></div>
      <div class="kv"><span>Dirección</span><b>${escapeHtml(u.business?.address||'—')}</b></div>
      <p class="hint">Condiciones y plan de la cuenta profesional: <b>pendiente de definir</b> (decisión de negocio abierta).</p>
    </div>` : '';
  const head = me ? '' : pageHead(u.name);
  container.innerHTML = `${head}
    <div class="profile-head">
      <span class="avatar lg">${u.initials||initials(u.name)}</span>
      <div class="ph-main">
        <div class="ph-top"><span class="ph-name">${escapeHtml(u.name)} ${u.verified?`<span class="vchk">${ico('check')}</span>`:''}</span>
          ${me?`<button class="ph-priv" onclick="go('ajustes')">${ico('gear')} Ajustes</button>`:`<button class="ph-priv" onclick="toast('Siguiendo a ${escapeHtml(u.name)}')">Seguir</button>`}</div>
        <div class="ph-handle">${u.handle} ${typeBadge(u)}</div>
        <div class="ph-stats">
          <span><b>${postsByUser(u.id).length}</b> publicaciones</span>
          <span><b>${(u.attendedPlanIds||[]).length}</b> asistidos</span>
          <span><b>${u.followers||0}</b> seguidores</span>
        </div>
      </div>
    </div>
    ${u.bio?`<p class="bio">${escapeHtml(u.bio)}</p>`:''}
    ${proExtra}
    ${(me && !u.profilePublic)?`<div class="priv-banner">${ico('lock')} Perfil privado: solo tus seguidores aprobados ven tu actividad.</div>`:''}
    <div class="prof-tabs">
      <button class="${tab==='posts'?'active':''}" onclick="setProfileTab('posts','${u.id}')">${ico('grid')} Publicaciones</button>
      <button class="${tab==='vividas'?'active':''}" onclick="setProfileTab('vividas','${u.id}')">${ico('play')} Vividas</button>
    </div>
    <div id="profile-grid">${tab==='posts'?profileGridPosts(u.id):profileGridVividas(u)}</div>`;
}
function setProfileTab(t, uid){ state.profileTab=t; renderProfile(uid==='me'?'me':uid); }

/* ---------- ajustes ---------- */
function renderSettings(){
  const view = document.getElementById('view-page');
  const row = (icon,label,extra='')=>`<button class="set-row" onclick="toast('Pendiente en el prototipo')"><span class="sr-ic">${ico(icon)}</span><span class="sr-l">${label}</span>${extra}<span class="pl-arrow">${ico('chevR')}</span></button>`;
  view.innerHTML = pageHead('Configuración') + `
    <div class="page-body">
      <div class="set-group"><div class="set-title">Cuenta</div>
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
      <div class="set-group"><div class="set-title">General</div>
        ${row('bell','Notificaciones')}
        ${row('shield','Seguridad y verificación')}
        ${row('card','Pagos y reembolsos')}
        ${row('doc','Datos y legal')}
      </div>
      <div class="set-group">
        <button class="set-row danger" onclick="toast('Sesión cerrada (demo)')"><span class="sr-ic">${ico('logout')}</span><span class="sr-l">Cerrar sesión</span></button>
      </div>
    </div>`;
}
function toggleProfilePrivacy(){ ME.profilePublic = !ME.profilePublic; renderSettings(); }
function togglePresenceDefault(){ ME.presencePublic = !ME.presencePublic; state.presencePublic = ME.presencePublic; renderSettings(); }

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
      <div class="field"><label>Nombre del grupo</label><input id="f-gname" placeholder="Ej. Runners Madrid" value="${escapeHtml(state.draftGName||'')}" /></div>
      <div class="field"><label>Descripción</label><textarea id="f-gabout" rows="2" placeholder="¿De qué va el grupo?">${escapeHtml(state.draftGAbout||'')}</textarea></div>
      <div class="field"><label>Miembros y roles</label>
        <p class="hint">Tú eres admin por defecto. Puedes nombrar varios admins.</p>
        ${memberRows}</div>
      <div class="form-actions"><button class="btn-primary" onclick="publishGroup()">${ico('check')} Crear grupo</button></div>
    </div>`;
}
function setMember(uid, role){ state.draftGName=val('f-gname'); state.draftGAbout=val('f-gabout'); if(role===undefined) delete state.draftMembers[uid]; else state.draftMembers[uid]=role; renderCreateGroup(); }
function publishGroup(){
  const name = val('f-gname').trim() || 'Nuevo grupo';
  const about = val('f-gabout').trim() || 'Grupo creado desde el prototipo.';
  const members = [{userId:'me',role:'admin'}].concat(Object.entries(state.draftMembers).map(([userId,role])=>({userId,role})));
  const g = { id:'g'+Date.now(), name, about, gradient:'g-dark', members, planIds:[] };
  GROUPS.unshift(g); state.draftMembers={}; state.draftGName=''; state.draftGAbout='';
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
      <div class="field"><label>Título</label><input id="f-title" placeholder="Ej. Atardecer en el mirador" /></div>
      <div class="field"><label>Descripción</label><textarea id="f-desc" rows="3" placeholder="¿En qué consiste el plan?"></textarea></div>
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
  const title = val('f-title').trim() || 'Plan sin título';
  const desc = val('f-desc').trim() || 'Plan creado desde el prototipo.';
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
  toast('Plan publicado'); go('plan/'+plan.id);
}
function renderCreatePost(){
  const view = document.getElementById('view-page');
  const k = state.draftPostKind;
  const sample = ['g-grape','g-sunset','g-forest'];
  const preview = k==='carrusel'
    ? `<div class="post-prev carrusel">${sample.map((c,i)=>`<span class="pp ${c}">${i===0?'':''}</span>`).join('')}<span class="pp-dots">1 / ${sample.length}</span></div>`
    : `<div class="post-prev"><span class="pp ${sample[0]}">${k==='video'?`<span class="play-ov">${ico('play')}</span>`:''}</span></div>`;
  view.innerHTML = pageHead('Nueva publicación') + `
    <div class="page-body form">
      <div class="field"><label>Tipo</label>
        <div class="iseg" id="d-postkind">
          <button class="${k==='foto'?'active':''}" onclick="setPostKind('foto')">${ico('image')}<span>Foto</span></button>
          <button class="${k==='video'?'active':''}" onclick="setPostKind('video')">${ico('video')}<span>Vídeo</span></button>
          <button class="${k==='carrusel'?'active':''}" onclick="setPostKind('carrusel')">${ico('stack')}<span>Carrusel</span></button></div></div>
      <div class="field"><label>Vista previa</label>${preview}<span class="add-media center">${ico('image')} Añadir desde galería</span></div>
      <div class="field"><label>Pie de texto</label><textarea id="f-caption" rows="3" placeholder="Escribe un pie...">${escapeHtml(state.draftCaption||'')}</textarea></div>
      <div class="form-actions"><button class="btn-primary" onclick="publishPost()">${ico('check')} Publicar</button></div>
    </div>`;
}
function setPostKind(k){ state.draftCaption = val('f-caption'); state.draftPostKind=k; renderCreatePost(); }
function publishPost(){
  const k = state.draftPostKind;
  const caption = val('f-caption').trim() || 'Nueva publicación';
  const media = k==='carrusel' ? ['g-grape','g-sunset','g-forest'] : [k==='video'?'g-grape':'g-sunset'];
  POSTS.unshift({ id:'npo'+Date.now(), authorId:'me', kind:k, media, caption, likes:0 });
  state.draftCaption=''; toast('Publicación creada'); state.profileTab='posts'; go('perfil');
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
  const hash = location.hash.replace(/^#\//,'') || 'feed';
  const [route,arg] = hash.split('/');
  switch(route){
    case 'mapa':    state.navTab='mapa'; renderMap(); showView('mapa'); break;
    case 'grupos':  state.navTab='grupos'; renderGroups(); showView('grupos'); break;
    case 'perfil':  state.navTab='perfil'; renderProfile('me'); showView('perfil'); break;
    case 'plan':    renderDetail(arg); showView('detail'); scrollTop('detail'); break;
    case 'u':       renderProfile(arg); showView('page'); scrollTop('page'); break;
    case 'grupo':   renderGroupDetail(arg); showView('page'); scrollTop('page'); break;
    case 'ajustes': renderSettings(); showView('page'); scrollTop('page'); break;
    case 'solicitudes': renderRequests(arg); showView('page'); scrollTop('page'); break;
    case 'crear':   renderCreateChooser(); showView('page'); scrollTop('page'); break;
    case 'crear-plan':  renderCreatePlan(); showView('page'); scrollTop('page'); break;
    case 'crear-post':  renderCreatePost(); showView('page'); scrollTop('page'); break;
    case 'crear-grupo': renderCreateGroup(); showView('page'); scrollTop('page'); break;
    default:        state.navTab='feed'; renderContent(); showView('feed');
  }
}

/* ---------- init ---------- */
function init(){
  buildFilters();
  document.querySelectorAll('.content-tabs button').forEach(b=>{ b.onclick=()=>{ state.contentTab=b.dataset.tab; renderContent(); }; });
  document.querySelectorAll('.tabbar button').forEach(b=>{ b.onclick=()=>go(b.dataset.nav==='crear'?'crear':b.dataset.nav); });
  window.addEventListener('hashchange', router);
  router();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
