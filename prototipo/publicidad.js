/* =========================================================================
   Publicidad en la agenda: planes promocionados (el anfitrión paga por darlo a conocer)
   y campañas de marca. Sin píxeles ni rastreo fuera de la app (issue #28): se elige
   por contexto, con lo que ya sabe la app.
   - Qué cuenta: tus temas (los que elegiste y los de los planes a los que fuiste), que
     ese día lo tienes libre y tu ciudad. Nunca lo que hablas en los chats.
   - Cuánto: como mucho un anuncio por vista de la agenda (día, semana o el día elegido
     del mes) y cada anuncio, 3 veces al día. Nunca en el año, ni en notificaciones ni
     recordatorios, ni planes que ya están en tu agenda.
   - Siempre con la etiqueta "Patrocinado", quién paga y "Por qué lo ves".
   - Cualquier anfitrión puede promocionar su plan (presupuesto y días); el equipo lo
     revisa antes de que salga. En la app real: docs/publicidad.md.
   ========================================================================= */
const AD_CPM = 6;              // € por cada 1.000 veces que se ve (orientativo)
const AD_MAX_DAY = 3;          // veces al día que se repite un mismo anuncio
const AD_BUDGETS = [10, 25, 50];
const AD_DAYS = [3, 7, 14];
const adPrefs = () => Object.assign({ interests: true, hidden: [], hiddenAdvertisers: [], seen: {} }, ME.adPrefs || {});
function setAdPrefs(patch){ ME.adPrefs = Object.assign(adPrefs(), patch); saveState(); }
// Tus temas: los que elegiste y los de los planes a los que fuiste (datos de la propia app).
function myTopics(){
  const t = new Set(ME.interests || []);
  (ME.attendedPlanIds || []).forEach(id => { const p = getPlan(id); if (p) t.add(p.category); });
  return t;
}
const adPlan = (c) => c.planId ? getPlan(c.planId) : null;
function adLive(c){
  if (c.status !== 'activa' || (c.spent || 0) >= c.budget || (c.endsAt && Date.now() > c.endsAt)) return false;
  const pr = adPrefs(); if (pr.hidden.includes(c.id) || pr.hiddenAdvertisers.includes(c.advertiserId)) return false;
  if (c.advertiserId === 'me' || (c.planId && isHost(adPlan(c) || {}))) return false;   // tus propios anuncios no te salen
  const p = adPlan(c);
  if (c.planId && (!p || isCancelled(p) || p.removed || p.held || isPrivateCall(p) || new Date(p.when) < Date.now() || planAgendaKind(p))) return false;
  return true;
}
// Elige como mucho un anuncio para los días que se ven. Devuelve { ad, day } o null.
function pickAgendaAd(days, items){
  const today = startOfDay(Date.now()), topics = myTopics(), pr = adPrefs();
  const free = (d) => !itemsOn(items, d).some(i => i.kind !== 'cancelado');
  const seenToday = (c) => (pr.seen[c.id + ':' + dayKey(Date.now())] || 0) >= AD_MAX_DAY && !Object.keys(state.adCounted || {}).some(k => k.startsWith(c.id + ':' + (state.agView || '') + ':'));
  let best = null;
  AD_CAMPAIGNS.filter(c => (c.surfaces || []).includes('agenda') && adLive(c) && !seenToday(c)).forEach(c => {
    const p = adPlan(c);
    const day = p ? days.find(d => dayKey(d) === dayKey(p.when)) : days.find(d => d >= today && free(d));
    if (!day || day < today) return;
    const cats = p ? [p.category] : (c.categories || []);
    const why = [];
    if (pr.interests && cats.some(x => topics.has(x))) why.push(`Te interesan los planes de ${(getCategory(cats.find(x => topics.has(x))) || {}).label || 'este tema'}`);
    if (free(day)) why.push(`Tienes libre el ${DIAS_LARGOS[day.getDay()]}`);
    why.push('Es en Madrid, tu ciudad');
    const score = (why.length - 1) * 2 + (c.bid || 1);
    if (!best || score > best.score) best = { ad: c, day, why, score };
  });
  return best;
}
// La tarjeta: clara como anuncio, distinta de tus planes.
function adCard(pick){
  if (!pick) return '';
  const c = pick.ad, p = adPlan(c), pr = adPrefs(), k = c.id + ':' + dayKey(Date.now()), view = c.id + ':' + (state.agView || '') + ':' + dayKey(pick.day);
  // Una vista cuenta una vez (volver a pintar la misma pantalla no suma).
  state.adCounted = state.adCounted || {};
  if (!state.adCounted[view]){ state.adCounted[view] = true; pr.seen[k] = (pr.seen[k] || 0) + 1; c.impressions = (c.impressions || 0) + 1; c.spent = Math.min(c.budget, (c.spent || 0) + AD_CPM / 1000); ME.adPrefs = pr; }
  state.adWhy = Object.assign({}, state.adWhy, { [c.id]: pick.why });
  const title = p ? p.title : c.title, sub = p ? `${whenShort(new Date(p.when))} · ${agWhere(p)}${p.paid ? ' · ' + money(p.price) : ' · Gratis'}` : c.text;
  return `<div class="ag-ad" role="group" aria-label="Anuncio de ${escapeHtml(c.advertiser)}">
    <div class="ag-ad-h"><em>Patrocinado</em><span>${escapeHtml(c.advertiser)}</span><button class="link-btn" onclick="openAdWhy('${c.id}')">Por qué lo ves</button></div>
    <button class="ag-ad-b" onclick="clickAd('${c.id}')"><span class="mini-thumb g-dark">${coverImg(p ? planCover(p) : c.photo, 120)}</span>
      <span class="ag-main"><b>${escapeHtml(title)}</b><span>${escapeHtml(sub)}</span></span><span class="ag-ad-cta">${escapeHtml(p ? 'Ver plan' : (c.cta || 'Ver'))}</span></button></div>`;
}
function clickAd(id){
  const c = AD_CAMPAIGNS.find(x => x.id === id); if (!c) return;
  c.clicks = (c.clicks || 0) + 1; saveState();
  if (c.planId) return go('plan/' + c.planId);
  showOverlay('ov-sheet', `<div class="sheet-bg" onclick="closeOverlay()"></div><div class="sheet" role="dialog" aria-label="Anuncio">
    <div class="sheet-h"><span>${escapeHtml(c.advertiser)} · Patrocinado</span><button class="sv-x" onclick="closeOverlay()" aria-label="Cerrar">${ico('close')}</button></div>
    <div class="sheet-list"><div class="ad-hero g-dark">${coverImg(c.photo, 700)}</div><b>${escapeHtml(c.title)}</b><p class="hint">${escapeHtml(c.text)}</p>
      <button class="btn-primary" onclick="closeOverlay();toast('En la app real abre la web del anunciante')">${escapeHtml(c.cta || 'Ver')}</button></div></div>`);
}
function openAdWhy(id){
  const c = AD_CAMPAIGNS.find(x => x.id === id); if (!c) return;
  const why = (state.adWhy || {})[id] || ['Es en Madrid, tu ciudad'], pr = adPrefs();
  showOverlay('ov-sheet', `<div class="sheet-bg" onclick="closeOverlay()"></div><div class="sheet" role="dialog" aria-label="Por qué ves este anuncio">
    <div class="sheet-h"><span>Por qué lo ves</span><button class="sv-x" onclick="closeOverlay()" aria-label="Cerrar">${ico('close')}</button></div>
    <div class="sheet-list">
      <p class="hint">${escapeHtml(c.advertiser)} paga para que su ${c.planId ? 'plan' : 'anuncio'} salga en la agenda de gente como tú:</p>
      <ul class="ad-why">${why.map(w => `<li>${ico('check')}<span>${escapeHtml(w)}</span></li>`).join('')}</ul>
      <p class="hint">No usamos lo que haces fuera de la app, ni píxeles de seguimiento, ni lo que hablas en los chats. Como mucho, un anuncio en cada vista de tu agenda.</p>
      <button class="sh-row" onclick="hideAd('${id}')">${ico('eye')}<span>No me interesa este anuncio</span>${ico('chevR')}</button>
      <button class="sh-row" onclick="hideAdvertiser('${c.advertiserId}')">${ico('close')}<span>No ver anuncios de ${escapeHtml(c.advertiser)}</span>${ico('chevR')}</button>
      <div class="opt-row" onclick="setAdPrefs({ interests: !adPrefs().interests });openAdWhy('${id}')"><span class="or-ic">${ico('heartO')}</span><span class="or-l">Usar mis temas para elegir anuncios<span class="or-s">Si lo quitas, solo cuentan tu ciudad y tus días libres</span></span><span class="switch ${pr.interests ? 'on' : ''}"><span class="knob"></span></span></div>
      <button class="sh-row danger" onclick="closeOverlay();openReport('${c.advertiserId}', null, ${c.planId ? `{ objectType:'plan', planId:'${c.planId}' }` : 'null'})">${ico('alert')}<span>Reportar el anuncio</span>${ico('chevR')}</button>
    </div></div>`);
}
function hideAd(id){ setAdPrefs({ hidden: adPrefs().hidden.concat(id) }); closeOverlay(); toast('No volverás a ver este anuncio'); if (/^#\/agenda/.test(location.hash)) drawAgenda(); }
function hideAdvertiser(uid){ setAdPrefs({ hiddenAdvertisers: adPrefs().hiddenAdvertisers.concat(uid) }); closeOverlay(); toast('No verás más anuncios de esta cuenta'); if (/^#\/agenda/.test(location.hash)) drawAgenda(); }

/* ---------- el anfitrión promociona su plan ---------- */
const myCampaign = (planId) => AD_CAMPAIGNS.find(c => c.planId === planId && c.advertiserId === 'me' && c.status !== 'terminada');
// Estimación: veces que se verá con ese presupuesto y personas distintas (cada una lo ve unas 2,5 veces).
const adReach = (budget) => { const imp = Math.round(budget / AD_CPM * 1000); return { imp, people: Math.round(imp / 2.5) }; };
function promoBlock(p){
  if (!isHost(p) || isCancelled(p) || isPrivateCall(p)) return '';
  const c = myCampaign(p.id);
  if (!c) return `<button class="sh-row" onclick="openPromote('${p.id}')">${ico('spark')}<span>Promocionar este plan<span class="or-s">Que salga en la agenda de quien tiene libre y le gusta el tema</span></span>${ico('chevR')}</button>`;
  const st = { en_revision: 'En revisión por el equipo', activa: 'Activa', pausada: 'Pausada' }[c.status] || c.status;
  return `<div class="promo-box"><div class="promo-h">${ico('spark')}<b>Promoción · ${st}</b></div>
    <div class="promo-k"><span><b>${(c.impressions || 0).toLocaleString('es-ES')}</b>veces vista</span><span><b>${c.clicks || 0}</b>toques</span><span><b>${money2(c.spent || 0)}</b>de ${money(c.budget)}</span></div>
    <div class="pl-actions">${c.status === 'activa' ? `<button class="link-btn" onclick="setCampaign('${c.id}','pausada')">Pausar</button>` : (c.status === 'pausada' ? `<button class="link-btn" onclick="setCampaign('${c.id}','activa')">Reanudar</button>` : '')}
      <button class="link-btn" onclick="setCampaign('${c.id}','terminada')">Terminar (se devuelve lo no gastado)</button>${c.status === 'activa' ? `<button class="link-btn dim" onclick="demoAdTraffic('${c.id}')">Demo: pasa un día</button>` : ''}</div></div>`;
}
function openPromote(id){
  const p = getPlan(id); if (!p) return;
  const d = state.promo = state.promo && state.promo.planId === id ? state.promo : { planId: id, budget: 25, days: 7 };
  const r = adReach(d.budget), cat = getCategory(p.category), pm = PAYMENT_METHODS.find(m => m.isDefault) || PAYMENT_METHODS[0];
  showOverlay('ov-sheet', `<div class="sheet-bg" onclick="closeOverlay()"></div><div class="sheet" role="dialog" aria-label="Promocionar el plan">
    <div class="sheet-h"><span>Promocionar el plan</span><button class="sv-x" onclick="closeOverlay()" aria-label="Cerrar">${ico('close')}</button></div>
    <div class="sheet-list form">
      <p class="hint">Sale en la agenda, con la etiqueta "Patrocinado", de quien tiene libre el día del plan y le interesa ${escapeHtml(cat ? cat.label : 'el tema')}, en Madrid. Nunca en notificaciones.</p>
      <div class="field"><label>Presupuesto</label><div class="iseg">${AD_BUDGETS.map(b => `<button class="${d.budget === b ? 'active' : ''}" onclick="state.promo.budget=${b};openPromote('${id}')"><span>${b} €</span></button>`).join('')}</div></div>
      <div class="field"><label>Durante</label><div class="iseg">${AD_DAYS.map(n => `<button class="${d.days === n ? 'active' : ''}" onclick="state.promo.days=${n};openPromote('${id}')"><span>${n} días</span></button>`).join('')}</div>
        <p class="hint">Termina antes si llega el día del plan o se acaba el presupuesto.</p></div>
      <div class="promo-est"><b>Unas ${r.people.toLocaleString('es-ES')} personas</b><span>la verán ${r.imp.toLocaleString('es-ES')} veces en total (estimación)</span></div>
      <p class="hint">Pagas solo lo que se gaste; lo que sobre se devuelve. Antes de salir, el equipo lo revisa. Factura con IVA en Cobros.</p>
      <button class="btn-primary" onclick="confirmPromote('${id}')">${ico('card')} Pagar ${money(d.budget)}${pm ? ` con ${escapeHtml(pm.brand)} ···· ${escapeHtml(pm.last4)}` : ''}</button>
    </div></div>`);
}
function confirmPromote(id){
  const p = getPlan(id), d = state.promo; if (!p || !d) return;
  if (!PAYMENT_METHODS.length){ toast('Añade una tarjeta en Pagos para promocionar'); return; }
  const c = { id: newId('ad'), planId: id, advertiserId: 'me', advertiser: ME.name, surfaces: ['agenda'], budget: d.budget, days: d.days, bid: 1,
    status: 'en_revision', createdAt: Date.now(), endsAt: Math.min(new Date(p.when).getTime(), Date.now() + d.days * 86400000), impressions: 0, clicks: 0, spent: 0 };
  AD_CAMPAIGNS.push(c); state.promo = null; saveState(); closeOverlay(); toast('Pagado · el equipo lo revisa antes de que salga'); renderDetail(id);
  setTimeout(() => { if (c.status === 'en_revision'){ c.status = 'activa'; notify('pago', `Tu promoción de ${p.title} ya está activa.`, { planId: id }); saveState(); if (location.hash === '#/plan/' + id) renderDetail(id); } }, 3000);
}
function setCampaign(cid, status){
  const c = AD_CAMPAIGNS.find(x => x.id === cid); if (!c) return;
  c.status = status;
  if (status === 'terminada'){ const back = Math.max(0, c.budget - (c.spent || 0)); toast(`Promoción terminada · te devolvemos ${money2(back)}`); }
  else toast(status === 'pausada' ? 'Promoción pausada' : 'Promoción reanudada');
  saveState(); if (c.planId) renderDetail(c.planId);
}
// Demo: un día de promoción (en la app real, lo cuenta el servidor cada vez que se ve).
function demoAdTraffic(cid){
  const c = AD_CAMPAIGNS.find(x => x.id === cid); if (!c) return;
  const day = Math.round(adReach(c.budget).imp / c.days);
  c.impressions = (c.impressions || 0) + day; c.clicks = (c.clicks || 0) + Math.round(day * 0.03); c.spent = Math.min(c.budget, (c.spent || 0) + day * AD_CPM / 1000);
  saveState(); renderDetail(c.planId);
}
