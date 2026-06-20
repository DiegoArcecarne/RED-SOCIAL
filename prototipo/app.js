/* =========================================================================
   Prototipo visual — lógica de navegación y render (vanilla JS)
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

/* ---------- utilidades ---------- */
function fmtCountdown(date){
  const diff = date - Date.now();
  if (diff <= 0) return 'En marcha';
  const h = Math.floor(diff/3600000);
  const d = Math.floor(h/24);
  if (d >= 1) return `faltan ${d} d ${h%24} h`;
  const m = Math.floor((diff%3600000)/60000);
  return `faltan ${h} h ${m} min`;
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
function sizeLabel(p){
  return {intimo:'Íntimo',mediano:'Mediano',grande:'Grande'}[sizeBucket(p)];
}
function initials(name){
  return name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();
}
function levelBadge(p){
  if (p.level===1) return '<span class="badge anchor">⚓ Ancla recurrente</span>';
  if (p.paid)      return '<span class="badge paid">€ Experiencia</span>';
  return '<span class="badge free">Gratis</span>';
}
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

/* ---------- componentes ---------- */
function planCard(p){
  const place = getPlace(p.placeId);
  const cat = getCategory(p.category);
  const pct = Math.min(100, Math.round(p.joined/p.groupMax*100));
  return `
  <article class="plan-card" onclick="go('plan/${p.id}')">
    <div class="plan-cover ${p.gradient}">
      <span class="emoji">${p.emoji}</span>
      <div class="badges">
        ${levelBadge(p)}
        ${p.secret?'<span class="badge secret">🤫 Lugar secreto</span>':''}
        <span class="badge">${cat.emoji} ${cat.label}</span>
      </div>
    </div>
    <div class="plan-body">
      <div class="plan-title">${p.title}</div>
      <div class="plan-meta">
        <span>📍 ${p.secret?'Zona aprox. · Madrid':place.name}</span><span class="dot"></span>
        <span>👥 ${sizeLabel(p)}</span><span class="dot"></span>
        <span class="countdown">⏳ ${fmtCountdown(p.when)}</span>
      </div>
      <div class="host-row">
        <div class="avatar">${initials(p.host.name)}</div>
        <span class="host-name">${p.host.name}</span>
        ${p.host.verified?'<span class="verified" title="Verificado">✔</span>':''}
        <span class="stars">★ ${p.host.rating}</span>
      </div>
      <div class="group-bar">
        <div class="track"><div class="fill" style="width:${pct}%"></div></div>
        <div class="lbl"><span>${p.joined} apuntados</span><span>${p.groupMax-p.joined} plazas libres</span></div>
      </div>
    </div>
  </article>`;
}

function renderFeed(){
  const plans = filteredPlans();
  const cont = document.getElementById('feed-list');
  if (!plans.length){ cont.innerHTML = `<div class="empty-tab"><div class="big">🔍</div><h3>Sin planes con esos filtros</h3><p>Prueba a ampliar el tamaño de grupo o el tema.</p></div>`; return; }
  cont.innerHTML = plans.map(planCard).join('');
}

function renderVividas(){
  // aftermovies + inyección de 1 plan disponible (regla del producto)
  const inject = PLANS[2];
  const grid = AFTERMOVIES.map(a=>`
    <div class="after-card" onclick="toast('Aftermovie · ${a.hashtag}')">
      <div class="after-cover ${a.gradient}"><span class="emoji">${a.emoji}</span><span class="h">${a.hashtag}</span></div>
      <div class="after-foot"><span>${a.author}</span><span>❤ ${a.likes}</span></div>
    </div>`).join('');
  return `
    <div class="section-title">Vividas · lo que ya ha pasado</div>
    <div class="after-grid">${grid}</div>
    <div class="injected-note">— porque vienes viendo planes de azotea —</div>
    ${planCard(inject)}`;
}

function emptyTab(emoji,title,text){
  return `<div class="empty-tab"><div class="big">${emoji}</div><h3>${title}</h3><p>${text}</p></div>`;
}

function renderContent(){
  const feedView = document.getElementById('view-feed');
  const filters = document.getElementById('feed-filters');
  const list = document.getElementById('feed-list');
  // sincroniza pestañas
  document.querySelectorAll('.content-tabs button').forEach(b=>{
    b.classList.toggle('active', b.dataset.tab===state.contentTab);
  });
  if (state.contentTab==='disponibles'){
    filters.style.display='flex';
    renderFeed();
  } else {
    filters.style.display='none';
    if (state.contentTab==='vividas') list.innerHTML = renderVividas();
    else if (state.contentTab==='stories') list.innerHTML = emptyTab('🟣','Stories · el "ahora mismo"','Contenido efímero de planes en marcha. En el prototipo nos centramos en Descubrir, Mapa y la ficha de plan.');
    else list.innerHTML = emptyTab('@','Menciones','Aquí llegan los planes y stories donde te etiquetan. Una mención no se asocia a tu perfil hasta que la aceptas.');
  }
}

/* ---------- mapa ---------- */
function renderMap(){
  const map = document.getElementById('map');
  const pins = PLACES.map(pl=>{
    const cls = pl.secret ? 'secret' : (pl.kind==='negocio' ? 'business' : '');
    const sel = state.selectedPlace===pl.id ? 'selected' : '';
    const ic = pl.secret ? '🤫' : (getCategory(pl.category)?.emoji || '📍');
    return `<button class="pin ${cls} ${sel}" style="left:${pl.x}%;top:${pl.y}%" onclick="selectPlace('${pl.id}')">
      <span class="dot"><span>${ic}</span></span><span class="cap">${pl.secret?'?':pl.name}</span>
    </button>`;
  }).join('');
  map.innerHTML = `
    <div class="map-hint">📍 Madrid · ${PLACES.length} lugares cerca · toca un pin</div>
    ${pins}
    <div class="map-legend">
      <div class="row"><span class="legend-dot" style="background:#13c296"></span>Negocio verificado</div>
      <div class="row"><span class="legend-dot" style="background:#ff5a5f"></span>Lugar público</div>
      <div class="row"><span class="legend-dot" style="background:#22222e"></span>Secreto</div>
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
    <h3>${pl.secret?'🤫 Lugar por desvelar':pl.name} ${pl.verified?'<span class="verified">✔</span>':''}</h3>
    <div class="sub">${pl.kind==='negocio'?'Negocio verificado':'Lugar público'} · ${pl.city} · ★ ${pl.rating} · ${pl.hashtag}</div>
    ${plans.length?plans.map(miniPlan).join(''):'<div class="sub">Sin planes próximos en este lugar.</div>'}`;
}
function miniPlan(p){
  const place=getPlace(p.placeId);
  return `<div class="mini-plan" onclick="go('plan/${p.id}')">
    <div class="ic ${p.gradient}">${p.emoji}</div>
    <div class="info">
      <div class="t">${p.title}</div>
      <div class="m">${fmtWhen(p.when)} · 👥 ${sizeLabel(p)} · ${p.joined}/${p.groupMax}</div>
    </div>
    <div class="price ${p.paid?'paid':''}">${p.paid?p.price+' €':'Gratis'}</div>
  </div>`;
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
      <button class="back-btn" onclick="history.back()">‹</button>
      <span class="emoji">${p.emoji}</span>
      <div>
        <div class="badges" style="margin-bottom:8px">${levelBadge(p)} <span class="badge">${cat.emoji} ${cat.label}</span></div>
        <h2>${p.title}</h2>
      </div>
    </div>
    <div class="detail-body">
      <div class="kpis">
        <div class="kpi"><div class="v cd">${fmtCountdown(p.when)}</div><div class="k">empieza</div></div>
        <div class="kpi"><div class="v">${sizeLabel(p)}</div><div class="k">${p.groupMin}–${p.groupMax} pers.</div></div>
        <div class="kpi"><div class="v">${p.joined}</div><div class="k">apuntados</div></div>
      </div>

      ${p.secret?`<div class="secret-note"><span class="ic">🤫</span><p>La ubicación exacta se revela 2 horas antes del plan. El secreto es parte de la experiencia: aquí pagas la reserva, no por "ver la dirección".</p></div>`:''}

      <div class="block"><h4>El plan</h4><p>${p.summary}</p></div>

      <div class="block">
        <h4>Anfitrión</h4>
        <div class="host-card">
          <div class="avatar">${initials(p.host.name)}</div>
          <div class="meta">
            <div class="n">${p.host.name} ${p.host.verified?'<span class="verified">✔</span>':''} ${p.host.business?'<span class="trust green">🏢 Negocio</span>':''}</div>
            <div class="s">★ ${p.host.rating} · responde del plan</div>
          </div>
        </div>
        <div class="trust-row">
          <span class="trust green">🛡️ Identidad verificada</span>
          <span class="trust">👍 Fiabilidad ${p.host.reliability}%</span>
          <span class="trust">⭐ Reseñas reales</span>
        </div>
      </div>

      <div class="block">
        <h4>Quién va</h4>
        <div class="attendees">
          ${att.map(a=>`<div class="avatar">${a}</div>`).join('')}
          <span class="more">+${Math.max(0,p.joined-att.length)} personas afines van</span>
        </div>
      </div>

      <div class="block">
        <h4>Lugar</h4>
        <div class="place-link" onclick="go('mapa');selectPlace('${place.id}')">
          <div class="pic">${p.secret?'🤫':'📍'}</div>
          <div>
            <div style="font-weight:700;font-size:14.5px">${p.secret?'Zona aproximada · centro de Madrid':place.name}</div>
            <div style="font-size:12.5px;color:var(--ink-soft)">${place.city} · ${place.kind==='negocio'?'Negocio verificado':'Lugar público'} · ${place.hashtag}</div>
          </div>
          <span class="arrow">›</span>
        </div>
      </div>

      <div class="block">
        <h4>Seguridad</h4>
        <div class="trust-row">
          <span class="trust">📍 Punto de encuentro in-app</span>
          <span class="trust">🆘 Botón SOS</span>
          <span class="trust">👤 Contacto de confianza</span>
        </div>
      </div>

      <div class="block">
        <h4>Reseñas de ediciones anteriores</h4>
        ${REVIEWS.map(r=>`<div class="review"><div class="top"><span>${r.author}</span><span class="st">${'★'.repeat(r.stars)}</span></div><p>${r.text}</p></div>`).join('')}
      </div>

      <div class="action-bar">
        <div class="pr"><div class="v">${p.paid?p.price+' €':'Gratis'}</div><div class="k">${p.paid?'pago seguro (escrow)':'sin coste'}</div></div>
        <button class="btn-join ${joined?'joined':''}" onclick="toggleJoin('${p.id}')">${joined?'✓ Apuntado — ver chat':'Apuntarme'}</button>
      </div>
    </div>`;
}
function toggleJoin(id){
  const p=getPlan(id);
  if (state.joined.has(id)){ state.joined.delete(id); toast('Has salido del plan'); }
  else {
    state.joined.add(id);
    toast(p.paid?'Reserva retenida en escrow ✓':'¡Apuntado! Verifica tu identidad antes del plan');
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

/* ---------- init ---------- */
function buildFilters(){
  const cont = document.getElementById('feed-filters');
  const sizes=[['todos','Todos'],['intimo','Íntimo'],['mediano','Mediano'],['grande','Grande']];
  const prices=[['todos','Todo'],['gratis','Gratis'],['pago','Pago']];
  cont.innerHTML = `
    <div class="seg" id="seg-size">${sizes.map(([v,l])=>`<button data-v="${v}" class="${v==='todos'?'active':''}">${l}</button>`).join('')}</div>
    <div class="chips" id="chips-cat">
      <button class="chip active" data-v="todas">Todos los temas</button>
      ${CATEGORIES.map(c=>`<button class="chip" data-v="${c.id}">${c.emoji} ${c.label}</button>`).join('')}
    </div>
    <div class="seg" id="seg-price" style="max-width:230px">${prices.map(([v,l])=>`<button data-v="${v}" class="${v==='todos'?'active':''}">${l}</button>`).join('')}</div>`;

  cont.querySelector('#seg-size').onclick = e=>{ const b=e.target.closest('button'); if(!b)return;
    state.size=b.dataset.v; setActive('#seg-size button',b); renderFeed(); };
  cont.querySelector('#seg-price').onclick = e=>{ const b=e.target.closest('button'); if(!b)return;
    state.price=b.dataset.v; setActive('#seg-price button',b); renderFeed(); };
  cont.querySelector('#chips-cat').onclick = e=>{ const b=e.target.closest('button'); if(!b)return;
    state.category=b.dataset.v; setActive('#chips-cat button',b); renderFeed(); };
}
function setActive(sel,el){ document.querySelectorAll(sel).forEach(x=>x.classList.remove('active')); el.classList.add('active'); }

function init(){
  buildFilters();
  document.querySelectorAll('.content-tabs button').forEach(b=>{
    b.onclick=()=>{ state.contentTab=b.dataset.tab; renderContent(); };
  });
  document.querySelectorAll('.tabbar button').forEach(b=>{
    b.onclick=()=>go(b.dataset.nav);
  });
  window.addEventListener('hashchange', router);
  router();
}
document.addEventListener('DOMContentLoaded', init);
