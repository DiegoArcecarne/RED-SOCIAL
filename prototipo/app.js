/* =========================================================================
   Prototipo visual — App de planes. Modo oscuro tipo Instagram, sin emojis.
   ========================================================================= */

const state = {
  contentTab: 'disponibles',   // vividas | disponibles | stories | menciones
  navTab: 'feed',              // feed | mapa
  size: 'todos',               // todos | intimo | mediano | grande
  category: 'todas',
  price: 'todos',              // todos | gratis | pago
  selectedPlace: null,
  joined: new Set(),
};

/* ---------- iconos SVG monolínea (sin emojis) ---------- */
const SVG = {
  grid:    '<svg viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="7" height="7" rx="1.4"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.4"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.4"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.4"/></svg>',
  map:     '<svg viewBox="0 0 24 24"><path d="M9 4 3.5 6.2v13.6L9 17.6l6 2.2 5.5-2.2V3.9L15 6.1z"/><path d="M9 4v13.6M15 6.1v13.7"/></svg>',
  pin:     '<svg viewBox="0 0 24 24"><path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z"/><circle cx="12" cy="10" r="2.4"/></svg>',
  users:   '<svg viewBox="0 0 24 24"><circle cx="9.5" cy="8" r="3.1"/><path d="M3.8 19a5.7 5.7 0 0 1 11.4 0"/><path d="M16 5.3a3.1 3.1 0 0 1 0 5.4"/><path d="M17.2 13.6A5.7 5.7 0 0 1 20.2 19"/></svg>',
  clock:   '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.4"/><path d="M12 7.4V12l3 1.9"/></svg>',
  check:   '<svg viewBox="0 0 24 24"><path d="M4.8 12.5 9.5 17 19 6.6"/></svg>',
  star:    '<svg viewBox="0 0 24 24" class="fill"><path d="M12 3.6l2.6 5.2 5.8.8-4.2 4.1 1 5.7L12 16.8 6.8 19.4l1-5.7L3.6 9.6l5.8-.8z"/></svg>',
  shield:  '<svg viewBox="0 0 24 24"><path d="M12 3.5l7 2.5v5c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9v-5z"/><path d="M9.2 12.2 11.2 14l3.6-3.8"/></svg>',
  alert:   '<svg viewBox="0 0 24 24"><path d="M12 4 2.8 20h18.4z"/><path d="M12 10v4M12 17.1v.1"/></svg>',
  user:    '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.3"/><path d="M5.6 19a6.4 6.4 0 0 1 12.8 0"/></svg>',
  lock:    '<svg viewBox="0 0 24 24"><rect x="5" y="10.4" width="14" height="9.2" rx="2"/><path d="M8 10.4V8a4 4 0 0 1 8 0v2.4"/></svg>',
  chevR:   '<svg viewBox="0 0 24 24"><path d="M9 5.5 15.5 12 9 18.5"/></svg>',
  chevL:   '<svg viewBox="0 0 24 24"><path d="M15 5.5 8.5 12 15 18.5"/></svg>',
  heart:   '<svg viewBox="0 0 24 24" class="fill"><path d="M12 20s-7-4.4-7-9.5A3.8 3.8 0 0 1 12 7a3.8 3.8 0 0 1 7 3.5C19 15.6 12 20 12 20z"/></svg>',
  repeat:  '<svg viewBox="0 0 24 24"><path d="M4 9.5 6.5 7 9 9.5"/><path d="M6.5 7H15a5 5 0 0 1 5 5"/><path d="M20 14.5 17.5 17 15 14.5"/><path d="M17.5 17H9a5 5 0 0 1-5-5"/></svg>',
};
function ico(name){ return `<i class="ico">${SVG[name]||''}</i>`; }

/* ---------- utilidades ---------- */
function fmtCountdown(date){
  const diff = date - Date.now();
  if (diff <= 0) return 'En marcha';
  const h = Math.floor(diff/3600000);
  const d = Math.floor(h/24);
  if (d >= 1) return `${d} d ${h%24} h`;
  const m = Math.floor((diff%3600000)/60000);
  return `${h} h ${m} min`;
}
function fmtWhen(date){
  const dias=['dom','lun','mar','mié','jue','vie','sáb'];
  const h = date.getHours().toString().padStart(2,'0');
  const min = date.getMinutes().toString().padStart(2,'0');
  return `${dias[date.getDay()]} · ${h}:${min}`;
}
function sizeBucket(p){
  if (p.groupMax <= 8) return 'intimo';
  if (p.groupMax <= 20) return 'mediano';
  return 'grande';
}
function sizeLabel(p){ return {intimo:'Íntimo',mediano:'Mediano',grande:'Grande'}[sizeBucket(p)]; }
function initials(name){ return name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase(); }
function levelTag(p){
  if (p.level===1) return `<span class="tag tag-line">${ico('repeat')} Recurrente</span>`;
  if (p.paid)      return `<span class="tag">Experiencia</span>`;
  return `<span class="tag tag-free">Gratis</span>`;
}
function priceTag(p){ return p.paid ? `<span class="cell-price">${p.price} €</span>` : `<span class="cell-price free">Gratis</span>`; }
function rating(n){ return `<span class="rate">${ico('star')} ${n}</span>`; }
function toast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg;t.classList.add('show');
  clearTimeout(t._tmo);t._tmo=setTimeout(()=>t.classList.remove('show'),1900);
}

/* ---------- filtrado ---------- */
function filteredPlans(){
  return PLANS.filter(p=>{
    if (state.size!=='todos' && sizeBucket(p)!==state.size) return false;
    if (state.category!=='todas' && p.category!==state.category) return false;
    if (state.price==='gratis' && p.paid) return false;
    if (state.price==='pago' && !p.paid) return false;
    return true;
  });
}

/* ---------- GRID tipo Instagram (Disponibles) ---------- */
function gridCell(p){
  const place = getPlace(p.placeId);
  const loc = p.secret ? 'Zona aprox.' : place.name;
  return `
  <button class="cell ${p.gradient}" onclick="go('plan/${p.id}')" aria-label="${p.title}">
    <span class="cell-scrim"></span>
    <span class="cell-top">${priceTag(p)}${p.secret?`<span class="cell-ic">${ico('lock')}</span>`:(p.level===1?`<span class="cell-ic">${ico('repeat')}</span>`:'')}</span>
    <span class="cell-info">
      <span class="cell-title">${p.title}</span>
      <span class="cell-meta">${loc} · ${ico('users')} ${p.joined}/${p.groupMax}</span>
    </span>
  </button>`;
}
function renderFeed(){
  const plans = filteredPlans();
  const cont = document.getElementById('feed-list');
  if (!plans.length){ cont.innerHTML = emptyTab('grid','Sin planes con esos filtros','Prueba a ampliar el tamaño de grupo o el tema.'); return; }
  cont.innerHTML = `<div class="grid">${plans.map(gridCell).join('')}</div>`;
}

/* ---------- Vividas (aftermovies, también en grid) ---------- */
function renderVividas(){
  const cells = AFTERMOVIES.concat(AFTERMOVIES).slice(0,6).map((a,i)=>`
    <button class="cell ${a.gradient}" onclick="toast('Aftermovie · ${a.hashtag}')" aria-label="${a.planTitle}">
      <span class="cell-scrim"></span>
      <span class="cell-top"><span class="cell-like">${ico('heart')} ${a.likes}</span></span>
      <span class="cell-info"><span class="cell-title">${a.hashtag}</span><span class="cell-meta">${a.author}</span></span>
    </button>`).join('');
  return `<div class="vividas-head">Vividas · lo que ya ha pasado</div><div class="grid">${cells}</div>`;
}

function emptyTab(icon,title,text){
  return `<div class="empty-tab"><span class="empty-ic">${ico(icon)}</span><h3>${title}</h3><p>${text}</p></div>`;
}

function renderContent(){
  const filters = document.getElementById('feed-filters');
  const list = document.getElementById('feed-list');
  document.querySelectorAll('.content-tabs button').forEach(b=>{
    b.classList.toggle('active', b.dataset.tab===state.contentTab);
  });
  if (state.contentTab==='disponibles'){
    filters.style.display='flex';
    renderFeed();
  } else {
    filters.style.display='none';
    if (state.contentTab==='vividas') list.innerHTML = renderVividas();
    else if (state.contentTab==='stories') list.innerHTML = emptyTab('clock','Stories · el “ahora mismo”','Contenido efímero de planes en marcha. El prototipo se centra en Descubrir, Mapa y la ficha de plan.');
    else list.innerHTML = emptyTab('user','Menciones','Aquí llegan los planes y stories donde te etiquetan. Una mención no se asocia a tu perfil hasta que la aceptas.');
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
      <span class="pin-dot">${inner}</span><span class="pin-cap">${pl.secret?'·····':pl.name}</span>
    </button>`;
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
    <span class="mini-info">
      <span class="mini-t">${p.title}</span>
      <span class="mini-m">${fmtWhen(p.when)} · ${sizeLabel(p)} · ${p.joined}/${p.groupMax}</span>
    </span>
    <span class="mini-price ${p.paid?'paid':''}">${p.paid?p.price+' €':'Gratis'}</span>
  </button>`;
}
function selectPlace(id){
  state.selectedPlace = state.selectedPlace===id ? null : id;
  renderMap();
}

/* ---------- detalle ---------- */
function renderDetail(id){
  const p = getPlan(id);
  const place = getPlace(p.placeId);
  const cat = getCategory(p.category);
  const joined = state.joined.has(p.id);
  const view = document.getElementById('view-detail');
  const att = ['SM','DL','NV','JR','AP'].slice(0, Math.min(5, p.joined));
  view.innerHTML = `
    <div class="detail-hero ${p.gradient}">
      <span class="hero-scrim"></span>
      <button class="back-btn" onclick="history.back()" aria-label="Atrás">${ico('chevL')}</button>
      <div class="hero-content">
        <div class="tags-row">${levelTag(p)} <span class="tag tag-line">${cat.label}</span>${p.secret?`<span class="tag tag-line">${ico('lock')} Secreto</span>`:''}</div>
        <h2>${p.title}</h2>
        <div class="hero-loc">${ico('pin')} ${p.secret?'Zona aprox. · Madrid':place.name+' · '+place.city}</div>
      </div>
    </div>
    <div class="detail-body">
      <div class="kpis">
        <div class="kpi"><div class="v">${fmtCountdown(p.when)}</div><div class="k">${ico('clock')} empieza en</div></div>
        <div class="kpi"><div class="v">${sizeLabel(p)}</div><div class="k">${ico('users')} ${p.groupMin}–${p.groupMax}</div></div>
        <div class="kpi"><div class="v">${p.joined}</div><div class="k">apuntados</div></div>
      </div>

      ${p.secret?`<div class="secret-note"><span class="sn-ic">${ico('lock')}</span><p>La ubicación exacta se revela 2 horas antes del plan. El secreto es parte de la experiencia: pagas la reserva, no por “ver la dirección”.</p></div>`:''}

      <div class="block"><h4>El plan</h4><p>${p.summary}</p></div>

      <div class="block">
        <h4>Anfitrión</h4>
        <div class="host-card">
          <span class="avatar">${initials(p.host.name)}</span>
          <div class="meta">
            <div class="n">${p.host.name} ${p.host.verified?`<span class="vchk">${ico('check')}</span>`:''} ${p.host.business?'<span class="biz">Negocio</span>':''}</div>
            <div class="s">${rating(p.host.rating)} · responde del plan</div>
          </div>
        </div>
        <div class="trust-row">
          <span class="trust">${ico('shield')} Identidad verificada</span>
          <span class="trust">${ico('check')} Fiabilidad ${p.host.reliability}%</span>
          <span class="trust">${ico('star')} Reseñas reales</span>
        </div>
      </div>

      <div class="block">
        <h4>Quién va</h4>
        <div class="attendees">
          ${att.map(a=>`<span class="avatar sm">${a}</span>`).join('')}
          <span class="more">+${Math.max(0,p.joined-att.length)} personas afines van</span>
        </div>
      </div>

      <div class="block">
        <h4>Lugar</h4>
        <button class="place-link" onclick="go('mapa');selectPlace('${place.id}')">
          <span class="mini-thumb ${p.gradient}"></span>
          <span class="pl-info">
            <span class="pl-n">${p.secret?'Zona aproximada · centro de Madrid':place.name}</span>
            <span class="pl-s">${place.city} · ${place.kind==='negocio'?'Negocio verificado':'Lugar público'} · ${place.hashtag}</span>
          </span>
          <span class="pl-arrow">${ico('chevR')}</span>
        </button>
      </div>

      <div class="block">
        <h4>Seguridad</h4>
        <div class="trust-row">
          <span class="trust">${ico('pin')} Punto de encuentro in-app</span>
          <span class="trust">${ico('alert')} Botón SOS</span>
          <span class="trust">${ico('user')} Contacto de confianza</span>
        </div>
      </div>

      <div class="block">
        <h4>Reseñas de ediciones anteriores</h4>
        ${REVIEWS.map(r=>`<div class="review"><div class="top"><span>${r.author}</span><span class="st">${Array(r.stars).fill(ico('star')).join('')}</span></div><p>${r.text}</p></div>`).join('')}
      </div>

      <div class="action-bar">
        <div class="pr"><div class="v">${p.paid?p.price+' €':'Gratis'}</div><div class="k">${p.paid?'pago seguro · escrow':'sin coste'}</div></div>
        <button class="btn-join ${joined?'joined':''}" onclick="toggleJoin('${p.id}')">${joined?'Apuntado · ver chat':'Apuntarme'}</button>
      </div>
    </div>`;
}
function toggleJoin(id){
  const p=getPlan(id);
  if (state.joined.has(id)){ state.joined.delete(id); toast('Has salido del plan'); }
  else {
    state.joined.add(id);
    toast(p.paid?'Reserva retenida en escrow':'Apuntado · verifica tu identidad antes del plan');
  }
  renderDetail(id);
}

/* ---------- router ---------- */
function go(path){ location.hash = '#/'+path; }
function showView(name){
  ['feed','mapa','detail'].forEach(v=>{
    document.getElementById('view-'+v).classList.toggle('hidden', v!==name);
  });
  document.getElementById('appbar-tabs').style.display = (name==='feed')?'block':'none';
  document.querySelectorAll('.tabbar button').forEach(b=>{
    b.classList.toggle('active', b.dataset.nav===(name==='detail'?state.navTab:name));
  });
}
function router(){
  const hash = location.hash.replace(/^#\//,'') || 'feed';
  const [route,arg] = hash.split('/');
  if (route==='plan' && arg){ renderDetail(arg); showView('detail'); document.getElementById('view-detail').scrollTop=0; }
  else if (route==='mapa'){ state.navTab='mapa'; renderMap(); showView('mapa'); }
  else { state.navTab='feed'; renderContent(); showView('feed'); }
}

/* ---------- filtros ---------- */
function buildFilters(){
  const cont = document.getElementById('feed-filters');
  const sizes=[['todos','Todos'],['intimo','Íntimo'],['mediano','Mediano'],['grande','Grande']];
  const prices=[['todos','Todo'],['gratis','Gratis'],['pago','Pago']];
  cont.innerHTML = `
    <div class="chips" id="chips-cat">
      <button class="chip active" data-v="todas">Todos</button>
      ${CATEGORIES.map(c=>`<button class="chip" data-v="${c.id}">${c.label}</button>`).join('')}
    </div>
    <div class="seg-row">
      <div class="seg" id="seg-size">${sizes.map(([v,l])=>`<button data-v="${v}" class="${v==='todos'?'active':''}">${l}</button>`).join('')}</div>
      <div class="seg" id="seg-price">${prices.map(([v,l])=>`<button data-v="${v}" class="${v==='todos'?'active':''}">${l}</button>`).join('')}</div>
    </div>`;
  cont.querySelector('#seg-size').onclick = e=>{ const b=e.target.closest('button'); if(!b)return; state.size=b.dataset.v; setActive('#seg-size button',b); renderFeed(); };
  cont.querySelector('#seg-price').onclick = e=>{ const b=e.target.closest('button'); if(!b)return; state.price=b.dataset.v; setActive('#seg-price button',b); renderFeed(); };
  cont.querySelector('#chips-cat').onclick = e=>{ const b=e.target.closest('button'); if(!b)return; state.category=b.dataset.v; setActive('#chips-cat button',b); renderFeed(); };
}
function setActive(sel,el){ document.querySelectorAll(sel).forEach(x=>x.classList.remove('active')); el.classList.add('active'); }

/* ---------- init ---------- */
function init(){
  buildFilters();
  document.querySelectorAll('.content-tabs button').forEach(b=>{ b.onclick=()=>{ state.contentTab=b.dataset.tab; renderContent(); }; });
  document.querySelectorAll('.tabbar button').forEach(b=>{ b.onclick=()=>go(b.dataset.nav); });
  window.addEventListener('hashchange', router);
  router();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
