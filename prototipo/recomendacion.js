/* =========================================================================
   Recomendación por intereses y anuncios en Descubrir, sin píxeles (issue #28).
   Fase 1 (piloto): reglas y puntos a mano, con lo que pasa dentro de la app.
   - Disponibles y Vividas se ordenan por lo que te interesa: los temas que elegiste,
     los planes a los que fuiste, lo que guardas, buscas y miras, a quién sigues y
     quién va. Cuentan también la fecha y la frescura; lo que pediste no ver, resta.
   - Cada plan dice "Por qué ves este plan" y se puede quitar ("No me interesa") o
     pedir menos de su tema. Todo se revisa en Ajustes ▸ Tus intereses.
   - Si te opones a las recomendaciones (Tus datos), el orden es por fecha y no se
     guarda nada para recomendarte.
   - Anuncios: en Vividas, como mucho uno de cada dos huecos de plan inyectado; en la
     búsqueda, uno arriba de los planes y solo si tiene que ver con lo que buscas.
   En la app real: docs/recomendacion-y-anuncios.md.
   ========================================================================= */
const RECO_LOG_MAX = 200;   // eventos guardados en el móvil (en el servidor, 90 días)
const RECO_DAYS = 30;       // las vistas cuentan durante 30 días
const recoOn = () => typeof consentValue !== 'function' || consentValue('personalizacion');
const recoPrefs = () => Object.assign({ hiddenPlans: [], lessCats: [], hiddenPosts: [] }, ME.reco || {});
function setRecoPrefs(patch){ ME.reco = Object.assign(recoPrefs(), patch); saveState(); }
const catLabel = (id) => (getCategory(id) || {}).label || 'este tema';

// Registro de eventos propio: lo apunta la app, no un píxel. Solo tipo, plan o tema y hora.
function recoEvent(type, data){
  if (!recoOn()) return;   // si te opones, no se guarda nada para recomendarte
  ME.recoLog = (ME.recoLog || []).concat([Object.assign({ type, at: Date.now() }, data || {})]).slice(-RECO_LOG_MAX);
}
function recoView(planId){ const p = getPlan(planId); if (p && !isHost(p)){ recoEvent('vista', { planId, cat: p.category }); saveState(); } }

// Señales de una persona (todas de dentro de la app y visibles en Tus intereses).
function recoSignals(){
  const pr = recoPrefs(), since = Date.now() - RECO_DAYS * 86400000;
  const chosen = new Set(ME.interests || []), went = new Set();
  (ME.attendedPlanIds || []).forEach(id => { const p = getPlan(id); if (p) went.add(p.category); });
  const views = {}, saved = {};
  (ME.recoLog || []).filter(e => e.type === 'vista' && e.at >= since && e.cat).forEach(e => { views[e.cat] = (views[e.cat] || 0) + 1; });
  POSTS.filter(po => po.savedByMe && po.planId).forEach(po => { const p = getPlan(po.planId); if (p) saved[p.category] = (saved[p.category] || 0) + 1; });
  const searches = (ME.recentSearches || []).slice(0, 5).map(q => norm(q).replace(/^[#@]/, '').trim()).filter(q => q.length >= 3);
  return { chosen, went, views, saved, searches, less: new Set(pr.lessCats) };
}
const hostUser = (p) => USERS.find(u => u.id === p.hostId) || USERS.find(u => u.name === (p.host || {}).name);
// Personas a las que sigues que han dicho que van (solo las que se dejan ver).
function friendsGoing(p){
  return (PLAN_PRESENCE[p.id] || []).filter(e => follows('me', e.userId) && !(ME.blocked || []).includes(e.userId)
    && (e.vis === 'todos' || (e.vis === 'amigos' && areFriends('me', e.userId)))).map(e => getUser(e.userId)).filter(Boolean);
}
const nameList = (l) => l.length === 1 ? l[0] : l.slice(0, -1).join(', ') + ' y ' + l[l.length - 1];

// Puntos de un plan y sus motivos, de más a menos peso.
function planScore(p, s){
  const hours = (new Date(p.when) - Date.now()) / 3600000;
  if (!recoOn()) return { score: (p.featured ? 1000 : 0) - hours, why: [p.featured ? 'Destacado por el equipo de Plannet' : 'Ordenado por fecha: tienes desactivadas las recomendaciones según tu actividad'] };
  s = s || recoSignals();
  const r = [], add = (pts, text) => r.push({ pts, text }), lab = catLabel(p.category);
  if (p.featured) add(100, 'Destacado por el equipo de Plannet');
  if (s.went.has(p.category)) add(4, `Has ido a planes de ${lab}`);
  else if (s.chosen.has(p.category)) add(3, `Elegiste ${lab} entre tus temas`);
  if (s.saved[p.category]) add(2, `Guardas publicaciones de planes de ${lab}`);
  if ((s.views[p.category] || 0) >= 2) add(1.5, `Has mirado varios planes de ${lab}`);
  const q = s.searches.find(x => [p.title, p.summary, lab, (getPlace(p.placeId) || {}).name].some(f => norm(f).includes(x)));
  if (q) add(3, `Buscaste «${q}»`);
  const fr = friendsGoing(p).map(u => u.name);
  if (fr.length) add(2 * Math.min(2, fr.length), `Va ${nameList(fr.slice(0, 2))}${fr.length > 2 ? ' y más' : ''}, a quien sigues`);
  const hu = hostUser(p);
  if (hu && hu.id !== 'me' && follows('me', hu.id)) add(2, `Sigues a ${hu.name}`);
  if (hours <= 48) add(2, 'Es en los próximos dos días');
  else if (hours <= 168) add(1, 'Es esta semana');
  else if (hours > 336) add(-1, '');
  if ((p.host || {}).reliability >= 97) add(0.5, `Anfitrión con un ${p.host.reliability} % de fiabilidad`);
  if (isFull(p)) add(-1, '');
  if (s.less.has(p.category)) add(-6, `Pediste ver menos planes de ${lab}`);
  // Arranque en frío o plan sin señales: lo que está eligiendo la gente.
  add(Math.min(1, (p.joined || 0) / Math.max(1, p.groupMax || 1)), (p.joined || 0) > 0 && p.joinType !== 'libre' ? `Lo están eligiendo: ${p.joined} ${p.joined === 1 ? 'persona apuntada' : 'personas apuntadas'}` : '');
  const why = r.filter(x => x.text && (x.pts > 0.5 || x.pts < 0)).sort((a, b) => Math.abs(b.pts) - Math.abs(a.pts)).map(x => x.text).filter(Boolean);
  return { score: r.reduce((t, x) => t + x.pts, 0), why: why.length ? why : ['Es un plan público de Descubrir'] };
}
// Ordena una lista de planes. Para que no salga todo del mismo tema, no más de 2 seguidos.
function rankPlans(plans){
  const s = recoOn() ? recoSignals() : null;
  const sorted = plans.map(p => ({ p, sc: planScore(p, s).score })).sort((a, b) => b.sc - a.sc).map(x => x.p);
  if (!s) return sorted;
  const out = [], rest = sorted.slice();
  while (rest.length){
    const n = out.length, run = n >= 2 && out[n - 1].category === out[n - 2].category ? out[n - 1].category : null;
    const i = run ? rest.findIndex(p => p.category !== run && !p.featured) : -1;
    out.push(rest.splice(i >= 0 ? i : 0, 1)[0]);
  }
  return out;
}
// Planes que se pueden enseñar fuera de los filtros (muro, búsqueda).
const discoverable = (p) => !isCancelled(p) && !p.removed && !p.held && canSeeOnline(p) && new Date(p.when) > Date.now() && !recoPrefs().hiddenPlans.includes(p.id);

/* ---------- Vividas ---------- */
function postScore(po, s){
  const fresh = -(po.ago || 0) / 24;   // un punto menos por día
  if (!recoOn()) return { score: fresh, why: ['Ordenado por fecha: tienes desactivadas las recomendaciones según tu actividad'] };
  s = s || recoSignals();
  const r = [], add = (pts, text) => r.push({ pts, text }), u = getUser(po.authorId) || { name: '' }, p = po.planId && getPlan(po.planId);
  if (po.authorId !== 'me' && follows('me', po.authorId)) add(2, `Sigues a ${u.name}`);
  if (p && state.attended.has(p.id)) add(1.5, 'Es de un plan al que fuiste');
  else if (p && (s.went.has(p.category) || s.chosen.has(p.category))) add(1.5, `Es de un plan de ${catLabel(p.category)}, un tema que te interesa`);
  if (p && s.less.has(p.category)) add(-4, `Pediste ver menos planes de ${catLabel(p.category)}`);
  add(Math.log10(1 + (po.likes || 0)) * 0.5, (po.likes || 0) >= 100 ? 'Está gustando mucho' : '');
  if ((po.ago || 0) < 24) add(0.5, 'Es de hoy');
  const why = r.filter(x => x.text).sort((a, b) => Math.abs(b.pts) - Math.abs(a.pts)).map(x => x.text);
  return { score: fresh + r.reduce((t, x) => t + x.pts, 0), why: why.length ? why : ['Es una publicación reciente y pública'] };
}
function rankPosts(posts){
  if (!recoOn()) return posts.slice().sort((a, b) => (a.ago || 0) - (b.ago || 0));
  const s = recoSignals();
  return posts.map(po => ({ po, sc: postScore(po, s).score })).sort((a, b) => b.sc - a.sc).map(x => x.po);
}
function openPostWhy(id){
  const po = POSTS.find(p => p.id === id); if (!po) return;
  const why = postScore(po).why, p = po.planId && getPlan(po.planId);
  showOverlay('ov-sheet', `<div class="sheet-bg" onclick="closeOverlay()"></div><div class="sheet" role="dialog" aria-label="Por qué ves esta publicación">
    <div class="sheet-h"><span>Por qué ves esto</span><button class="sv-x" onclick="closeOverlay()" aria-label="Cerrar">${ico('close')}</button></div>
    <div class="sheet-list"><ul class="ad-why">${why.slice(0, 3).map(w => `<li>${ico('check')}<span>${escapeHtml(w)}</span></li>`).join('')}</ul>
      <p class="hint">Solo usamos lo que haces dentro de Plannet. Nada de lo que haces en otras webs o apps, ni lo que hablas en los chats.</p>
      <button class="sh-row" onclick="hidePost('${id}')">${ico('eye')}<span>No me interesa</span>${ico('chevR')}</button>
      ${p ? `<button class="sh-row" onclick="closeOverlay();toggleLessCat('${p.category}')">${ico('close')}<span>Ver menos planes de ${escapeHtml(catLabel(p.category))}</span>${ico('chevR')}</button>` : ''}
      <button class="sh-row" onclick="closeOverlay();go('intereses')">${ico('sliders')}<span>Tus intereses</span>${ico('chevR')}</button></div></div>`);
}
function hidePost(id){
  const po = POSTS.find(p => p.id === id), p = po && po.planId && getPlan(po.planId);
  setRecoPrefs({ hiddenPosts: recoPrefs().hiddenPosts.concat(id) });
  recoEvent('no_interesa', { postId: id, cat: p ? p.category : null }); saveState();
  closeOverlay(); toast('No volverás a ver esta publicación'); recoRefresh();
}

/* ---------- en la ficha del plan ---------- */
function recoBlock(p){
  if (isCancelled(p) || isHost(p) || (typeof planAgendaKind === 'function' && planAgendaKind(p))) return '';
  const pr = recoPrefs(), lab = catLabel(p.category), less = pr.lessCats.includes(p.category), hidden = pr.hiddenPlans.includes(p.id);
  return `<div class="block reco" id="reco"><h4>Por qué ves este plan</h4>
    <ul class="ad-why">${planScore(p).why.slice(0, 3).map(w => `<li>${ico('check')}<span>${escapeHtml(w)}</span></li>`).join('')}</ul>
    <div class="pl-actions"><button class="link-btn" onclick="notInterestedPlan('${p.id}')">${hidden ? 'Volver a enseñármelo' : 'No me interesa este plan'}</button>
      <button class="link-btn" onclick="toggleLessCat('${p.category}','${p.id}')">${less ? `Ver otra vez planes de ${escapeHtml(lab)}` : `Ver menos planes de ${escapeHtml(lab)}`}</button>
      <button class="link-btn dim" onclick="go('intereses')">Tus intereses</button></div></div>`;
}
function notInterestedPlan(id){
  const pr = recoPrefs(), on = !pr.hiddenPlans.includes(id), p = getPlan(id);
  setRecoPrefs({ hiddenPlans: on ? pr.hiddenPlans.concat(id) : pr.hiddenPlans.filter(x => x !== id) });
  if (on){ recoEvent('no_interesa', { planId: id, cat: p ? p.category : null }); saveState(); }
  toast(on ? 'No volverá a salir en Descubrir. Puedes deshacerlo en Tus intereses' : 'Vuelve a salir en Descubrir');
  if (location.hash === '#/plan/' + id) renderDetail(id); else recoRefresh();
}
function toggleLessCat(cat, planId){
  const pr = recoPrefs(), on = !pr.lessCats.includes(cat);
  setRecoPrefs({ lessCats: on ? pr.lessCats.concat(cat) : pr.lessCats.filter(x => x !== cat) });
  toast(on ? `Verás menos planes de ${catLabel(cat)}` : `Vuelves a ver planes de ${catLabel(cat)} como antes`);
  if (planId && location.hash === '#/plan/' + planId) renderDetail(planId); else recoRefresh();
}
function recoRefresh(){
  const h = location.hash || '';
  if (h === '#/intereses') renderInterests();
  else if (h.startsWith('#/buscar')) renderSearchResults();
  else if (!h || h === '#' || h.startsWith('#/feed')) renderContent();
}

/* ---------- Ajustes ▸ Tus intereses (con los parámetros del sistema, DSA art. 27) ---------- */
function renderInterests(){
  const s = recoSignals(), pr = recoPrefs(), on = recoOn(), view = document.getElementById('view-page');
  const chip = (c) => `<button class="tag-chip ${s.chosen.has(c.id) ? 'active' : ''}" aria-pressed="${s.chosen.has(c.id)}" onclick="toggleMyInterest('${c.id}')">${ico(ICON_FOR_CAT[c.id] || 'hash')} ${escapeHtml(c.label)}</button>`;
  const went = [...s.went].map(catLabel), hidden = pr.hiddenPlans.map(getPlan).filter(Boolean), nLog = (ME.recoLog || []).length;
  view.innerHTML = pageHead('Tus intereses') + `<div class="page-body">
    <div class="set-group"><div class="set-title">Recomendaciones</div>
      <div class="toggle-row set" onclick="toggleRecoConsent()"><span class="tg-ic">${ico('spark')}</span>
        <span class="tg-info"><span class="tg-n">Recomendaciones según tu actividad</span><span class="tg-s">${on ? 'Descubrir se ordena por lo que te interesa' : 'Desactivadas: Disponibles y Vividas se ordenan por fecha'}</span></span>
        <span class="switch ${on ? 'on' : ''}"><span class="knob"></span></span></div></div>
    <div class="set-group"><div class="set-title">Tus temas</div>
      <div class="set-box"><p class="hint">Los que elegiste al registrarte. Toca para añadir o quitar.</p><div class="tag-chips">${activeCategories().map(chip).join('')}</div>
        ${went.length ? `<p class="hint">Por los planes a los que has ido también cuentan: ${escapeHtml(nameList(went))}.</p>` : ''}</div></div>
    ${pr.lessCats.length ? `<div class="set-group"><div class="set-title">Ves menos de</div>${pr.lessCats.map(c => `<div class="set-row static"><span class="sr-ic">${ico(ICON_FOR_CAT[c] || 'hash')}</span><span class="sr-l">${escapeHtml(catLabel(c))}</span><button class="link-btn" onclick="toggleLessCat('${c}')">Quitar</button></div>`).join('')}</div>` : ''}
    ${hidden.length ? `<div class="set-group"><div class="set-title">Planes que no te interesan</div>${hidden.map(p => `<div class="set-row static"><span class="sr-ic">${ico('eye')}</span><span class="sr-l">${escapeHtml(p.title)}</span><button class="link-btn" onclick="notInterestedPlan('${p.id}')">Volver a enseñar</button></div>`).join('')}</div>` : ''}
    <div class="set-group"><div class="set-title">Qué tenemos en cuenta</div>
      <div class="set-box"><ul class="ad-why">
        <li>${ico('check')}<span>Los temas que eliges y los de los planes a los que vas</span></li>
        <li>${ico('check')}<span>Lo que guardas, buscas y miras en Plannet (los últimos ${RECO_DAYS} días)</span></li>
        <li>${ico('check')}<span>A quién sigues y quién de ellos va a un plan, si se deja ver</span></li>
        <li>${ico('check')}<span>La fecha, lo reciente que es y la fiabilidad del anfitrión</span></li>
        <li>${ico('check')}<span>Lo que pides no ver, que resta</span></li></ul>
        <p class="hint">Nunca: lo que haces en otras webs o apps, píxeles de seguimiento, el contenido de tus chats, tu lista de contactos ni datos de salud, religión, orientación o política. Los anuncios llevan siempre "Patrocinado" y se eligen aparte (Por qué lo ves, en cada anuncio).</p></div></div>
    <div class="set-group"><div class="set-title">Tu historial</div>
      <div class="set-box"><p class="hint">${nLog ? `${nLog} ${nLog === 1 ? 'acción guardada' : 'acciones guardadas'} para recomendarte (vistas de planes y lo que no te interesa).` : 'No hay acciones guardadas para recomendarte.'}</p>
        ${nLog ? `<button class="btn-ghost" onclick="clearRecoLog()">${ico('close')} Borrar mi historial de recomendación</button>` : ''}</div></div>
  </div>`;
}
function toggleMyInterest(id){ const l = ME.interests = (ME.interests || []).slice(); const i = l.indexOf(id); if (i >= 0) l.splice(i, 1); else l.push(id); ME.interests = l; saveState(); renderInterests(); }
function toggleRecoConsent(){
  toggleConsent('personalizacion');   // queda en el registro de consentimientos (confianza.js)
  if (!recoOn()) ME.recoLog = [];      // oponerse borra lo guardado para recomendar
  saveState(); renderInterests();
}
function clearRecoLog(){ ME.recoLog = []; saveState(); toast('Historial de recomendación borrado'); renderInterests(); }

/* ---------- anuncios en Descubrir (Vividas y búsqueda) ---------- */
const AD_SURFACE_LABEL = { agenda: 'tu agenda', muro: 'Vividas', busqueda: 'la búsqueda' };
// Cuenta una impresión una vez por vista (volver a pintar la misma pantalla no suma).
function countAdView(c, viewKey, surface, why){
  state.adWhy = Object.assign({}, state.adWhy, { [c.id]: why });
  state.adSurface = Object.assign({}, state.adSurface, { [c.id]: surface });
  state.adCounted = state.adCounted || {};
  if (state.adCounted[viewKey]) return;
  state.adCounted[viewKey] = true;
  const pr = adPrefs(), k = c.id + ':' + dayKey(Date.now());
  pr.seen[k] = (pr.seen[k] || 0) + 1; ME.adPrefs = pr;
  c.impressions = (c.impressions || 0) + 1; c.spent = Math.min(c.budget, (c.spent || 0) + AD_CPM / 1000);
  c.bySurface = Object.assign({}, c.bySurface, { [surface]: ((c.bySurface || {})[surface] || 0) + 1 });
}
// Elige un anuncio para una superficie. cats: los temas del contexto (lo que se ve o se busca).
function pickFeedAd(surface, cats, opts){
  opts = opts || {};
  const pr = adPrefs(), topics = myTopics(), today = dayKey(Date.now()), q = opts.q ? norm(opts.q).replace(/^[#@]/, '').trim() : '';
  let best = null;
  AD_CAMPAIGNS.filter(c => (c.surfaces || []).includes(surface) && adLive(c) && !(opts.used && opts.used.has(c.planId || c.id))
    && ((pr.seen[c.id + ':' + today] || 0) < AD_MAX_DAY || (state.adCounted || {})[opts.viewKey && opts.viewKey(c)])).forEach(c => {
    const p = adPlan(c), cc = p ? [p.category] : (c.categories || []), why = [];
    let pts = 0;
    if (q){
      const kw = (c.keywords || []).concat(p ? [p.title, catLabel(p.category)] : cc.map(catLabel)).map(norm);
      if (kw.some(k => k.includes(q) || (q.length >= 4 && q.includes(k))) || (cats || []).some(x => cc.includes(x))){ pts += 3; why.push(`Buscaste «${opts.q.trim()}»`); }
    } else if ((cats || []).some(x => cc.includes(x))){ pts += 2; why.push('Va con lo que estabas viendo'); }
    if (pr.interests && cc.some(x => topics.has(x))){ pts += 1; why.push(`Te interesan los planes de ${catLabel(cc.find(x => topics.has(x)))}`); }
    if (surface === 'busqueda' && !q) return;
    if (surface === 'busqueda' && !why.some(w => w.startsWith('Buscaste'))) return;   // en la búsqueda, solo si tiene que ver
    why.push('Es en Madrid, tu ciudad');
    const score = pts * 2 + (c.bid || 1);
    if (!best || score > best.score) best = { ad: c, why, score };
  });
  return best;
}
const sponsoredBar = (c) => `<div class="sp-bar"><em>Patrocinado</em><span>${escapeHtml(c.advertiser)}</span><button class="link-btn" onclick="openAdWhy('${c.id}')">Por qué lo ves</button></div>`;
// Hueco del muro con un anuncio: el plan promocionado como los inyectados, o la campaña de marca.
function sponsoredInject(pick, slot){
  const c = pick.ad, p = adPlan(c);
  countAdView(c, c.id + ':muro:' + slot, 'muro', pick.why);
  if (p){
    const place = getPlace(p.placeId), seats = p.joinType === 'libre' ? 'Plan libre' : `Quedan ${Math.max(0, p.groupMax - p.joined)} plazas`;
    return `<div class="inject-wrap">${sponsoredBar(c)}<button class="inject sp ${p.gradient}" onclick="clickAd('${c.id}')">
      ${coverImg(planCover(p), 700)}<span class="inject-scrim"></span>
      <span class="inject-info"><span class="inject-t">${escapeHtml(p.title)}</span>
        <span class="inject-m"><span>${ico('clock')} ${fmtCountdown(p.when)}</span><span>${ico('pin')} ${escapeHtml(isOnline(p) ? 'Videollamada' : (p.secret ? 'Zona aprox.' : (place ? place.name : 'Madrid')))}</span><span>${freeIcon(p)} ${p.paid ? p.price + ' €' : 'Gratis'}</span><span>${ico('users')} ${seats}</span></span>
        <span class="inject-cta">Ver plan ${ico('chevR')}</span></span></button></div>`;
  }
  return `<div class="inject-wrap">${sponsoredBar(c)}<button class="inject sp g-dark" onclick="clickAd('${c.id}')">
    ${coverImg(c.photo, 700)}<span class="inject-scrim"></span>
    <span class="inject-info"><span class="inject-t">${escapeHtml(c.title)}</span><span class="inject-m"><span>${escapeHtml(c.text)}</span></span>
      <span class="inject-cta">${escapeHtml(c.cta || 'Ver')} ${ico('chevR')}</span></span></button></div>`;
}
// Resultado patrocinado de la búsqueda (como mucho uno, encima de los planes).
function searchAdRow(q, plans){
  const cats = [...new Set(plans.map(p => p.category))];
  const pick = pickFeedAd('busqueda', cats, { q, viewKey: (c) => c.id + ':busqueda:' + norm(q) });
  if (!pick) return null;
  const c = pick.ad, p = adPlan(c);
  countAdView(c, c.id + ':busqueda:' + norm(q), 'busqueda', pick.why);
  const pl = p && getPlace(p.placeId), sub = p ? `${fmtWhen(new Date(p.when))} · ${isOnline(p) ? 'Videollamada' : (p.secret ? 'Zona aproximada' : (pl ? pl.name : 'Madrid'))}${p.paid ? ' · ' + p.price + ' €' : ' · Gratis'}` : c.text;
  return { planId: p ? p.id : null, html: `<div class="sr-ad">${sponsoredBar(c)}<button class="conv" onclick="saveRecentSearch(state.search.q);clickAd('${c.id}')"><span class="conv-av plan ${p ? p.gradient : 'g-dark'}">${coverImg(p ? planCover(p) : c.photo, 120)}</span>
    <span class="conv-main"><b>${escapeHtml(p ? p.title : c.title)}</b><span>${escapeHtml(sub)}</span></span></button></div>` };
}
