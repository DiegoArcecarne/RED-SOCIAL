/* =========================================================================
   Pagos (simulado en el navegador). En la app real: Stripe Connect, con el cobro en la
   plataforma y la transferencia al anfitrión después del plan. Ver docs/pagos.md.
   - Reservar y pagar un plan (tarjeta guardada o nueva, pago con el móvil, 3D Secure).
   - Dinero retenido hasta el plan; se paga al anfitrión 48 h después, menos el 15 %.
   - Reembolsos según la política de cancelación; el 100 % si cancela el anfitrión.
   - Reclamaciones: pausan el pago al anfitrión y van al panel de moderación.
   - Cobros del anfitrión: alta (datos fiscales, IBAN, verificación), saldo y facturas.
   - Recibos de cada pago y factura mensual de la comisión.
   ========================================================================= */
const COMMISSION = 0.15;            // comisión de planes (IVA incluido)
const VAT = 0.21;                   // IVA de la comisión
const RELEASE_HOURS = 48;           // se paga al anfitrión 48 h después del plan, si nadie reclama
const PAY_WINDOW_HOURS = 24;        // aceptado en un plan de pago: 24 h para pagar
const STRIPE_FEE = { pct: 0.015, fixed: 0.25 };   // tarjetas europeas (orientativo): lo asume planes
// Tarjetas de prueba (las de Stripe): cualquier otra válida se acepta.
const TEST_CARDS = { '4000002760003184': '3ds', '4000000000000002': 'rechazada', '4000000000009995': 'fondos' };

const round2 = (n) => Math.round(n * 100) / 100;
const money = (n) => (round2(n) % 1 ? round2(n).toFixed(2) : String(round2(n))).replace('.', ',') + ' €';
const money2 = (n) => round2(n).toFixed(2).replace('.', ',') + ' €';   // en recibos y facturas, siempre con céntimos
// Reparto de un importe cobrado: comisión (con su IVA) y lo que recibe el anfitrión.
function splitFor(gross){
  const fee = round2(gross * COMMISSION), base = round2(fee / (1 + VAT));
  return { gross: round2(gross), fee, feeBase: base, feeVat: round2(fee - base), net: round2(gross - fee), stripe: gross ? round2(gross * STRIPE_FEE.pct + STRIPE_FEE.fixed) : 0 };
}
const myPayment = (planId) => PAYMENTS.filter(x => x.userId === 'me' && x.planId === planId && !x.past).slice(-1)[0] || null;
const PAY_STATUS = { pendiente:'Falta pagar', retenido:'Retenido hasta el plan', liberado:'Celebrado · en camino al anfitrión', pagado:'Pagado al anfitrión',
  reembolsado:'Reembolsado', reembolso_parcial:'Reembolso parcial', en_revision:'Reclamación en revisión' };
function nextReceiptNo(){
  const n = PAYMENTS.reduce((m, x) => Math.max(m, parseInt(String(x.receiptNo || '').split('-').pop(), 10) || 0), 117) + 1;
  return 'PL-' + new Date().getFullYear() + '-' + String(n).padStart(6, '0');
}
function newPayment(p, userId, status){
  const x = { id: newId('pay'), planId: p.id, planTitle: p.title, hostName: (p.host || {}).name || '', userId, amount: p.price, refunded: 0,
    status, at: Date.now(), receiptNo: nextReceiptNo(), intent: 'pi_' + Math.random().toString(36).slice(2, 12) };
  PAYMENTS.push(x); return x;
}

/* ---------- reservar y pagar ---------- */
// Política de cancelación de un plan, con números (la misma que se enseña antes de pagar).
function policyLine(p){ const pol = CANCEL_POLICIES[p.cancelPolicy || 'flexible']; return `Cancelación ${pol.label.toLowerCase()}: ${pol.text}`; }
function openCheckout(planId){
  const p = getPlan(planId); if (!p) return;
  state.checkout = state.checkout && state.checkout.planId === planId ? state.checkout
    : { planId, method: (PAYMENT_METHODS.find(m => m.isDefault) || PAYMENT_METHODS[0] || { id:'nueva' }).id, save: true, err: '' };
  renderCheckout();
}
function renderCheckout(){
  const ck = state.checkout, p = getPlan(ck.planId); if (!p) return;
  const place = getPlace(p.placeId), pend = myPayment(p.id);
  const methods = PAYMENT_METHODS.map(m => `<button class="pay-opt ${ck.method === m.id ? 'on' : ''}" role="radio" aria-checked="${ck.method === m.id}" onclick="setCheckout('method','${m.id}')">
      <span class="rep-dot"></span>${ico('card')}<span>${escapeHtml(m.brand)} ···· ${escapeHtml(m.last4)}<span class="or-s">Caduca ${escapeHtml(m.exp)}</span></span></button>`).join('');
  showOverlay('ov-sheet', `<div class="sheet-bg" onclick="closeOverlay()"></div><div class="sheet" role="dialog" aria-label="Pagar la reserva">
    <div class="sheet-h"><span>Reservar plaza</span><button class="sv-x" onclick="closeOverlay()" aria-label="Cerrar">${ico('close')}</button></div>
    <div class="sheet-list form">
      <div class="ck-plan"><span class="mini-thumb ${p.gradient}">${coverImg(p.photo, 120)}</span><span><b>${escapeHtml(p.title)}</b>
        <span class="or-s">${fmtWhen(new Date(p.when))} · ${escapeHtml(p.secret ? 'Zona aproximada' : (place ? place.name : 'Madrid'))}</span></span></div>
      <div class="ck-row"><span>1 plaza</span><b>${money2(p.price)}</b></div>
      ${pend && pend.status === 'pendiente' ? `<p class="hint">${ico('clock')} Te han aceptado: paga antes de ${fmtWhen(new Date(pend.dueAt))} para confirmar tu plaza.</p>` : ''}
      <div class="pay-note">${ico('shield')}<p><b>Pago protegido.</b> Lo retenemos hasta el plan; al anfitrión le llega después de celebrarse. Si no se celebra, te devolvemos el 100 %.</p></div>
      <p class="hint">${escapeHtml(policyLine(p))}</p>
      <button class="btn-ghost pay-wallet" onclick="payWithWallet()">${ico('phone')} Pagar con el móvil (Apple Pay o Google Pay)</button>
      <div class="pay-or"><span>o con tarjeta</span></div>
      <div class="rep-list" role="radiogroup">${methods}
        <button class="pay-opt ${ck.method === 'nueva' ? 'on' : ''}" role="radio" aria-checked="${ck.method === 'nueva'}" onclick="setCheckout('method','nueva')"><span class="rep-dot"></span>${ico('plus')}<span>Tarjeta nueva</span></button></div>
      ${ck.method === 'nueva' ? `<div class="field"><label for="f-card">Número de tarjeta</label><input id="f-card" inputmode="numeric" autocomplete="cc-number" placeholder="1234 1234 1234 1234" maxlength="23" value="${escapeHtml(ck.card || '')}"></div>
        <div class="ck-two"><div class="field"><label for="f-exp">Caducidad</label><input id="f-exp" inputmode="numeric" autocomplete="cc-exp" placeholder="MM/AA" maxlength="5" value="${escapeHtml(ck.exp || '')}"></div>
          <div class="field"><label for="f-cvc">CVC</label><input id="f-cvc" inputmode="numeric" autocomplete="cc-csc" placeholder="123" maxlength="4"></div></div>
        <div class="opt-row" onclick="setCheckout('save', ${!ck.save})"><span class="or-ic">${ico('lock')}</span><span class="or-l">Guardar para la próxima vez</span><span class="switch ${ck.save ? 'on' : ''}"><span class="knob"></span></span></div>
        <p class="hint">Demo: 4242 4242 4242 4242 paga; 4000 0027 6000 3184 pide confirmar en tu banco; 4000 0000 0000 0002 es rechazada.</p>` : ''}
      ${ck.err ? `<p class="pay-err" role="alert">${ico('alert')} ${escapeHtml(ck.err)}</p>` : ''}
      <button class="btn-primary" onclick="payNow()">Pagar ${money2(p.price)}</button>
      <p class="hint">Los datos de la tarjeta van directamente al procesador de pagos (Stripe); planes no los guarda.</p>
    </div></div>`);
}
function setCheckout(k, v){ captureCard(); state.checkout[k] = v; state.checkout.err = ''; renderCheckout(); }
function captureCard(){ const ck = state.checkout; if (!ck || ck.method !== 'nueva') return; ck.card = val('f-card'); ck.exp = val('f-exp'); }
function luhn(num){ let sum = 0; num.split('').reverse().forEach((d, i) => { let n = +d; if (i % 2){ n *= 2; if (n > 9) n -= 9; } sum += n; }); return sum % 10 === 0; }
function cardBrand(num){ return /^4/.test(num) ? 'Visa' : (/^(5[1-5]|2[2-7])/.test(num) ? 'Mastercard' : (/^3[47]/.test(num) ? 'American Express' : 'Tarjeta')); }
// Comprueba la tarjeta como haría el formulario de Stripe. Devuelve un error o null.
function cardError(num, exp, cvc){
  if (!/^\d{13,19}$/.test(num) || !luhn(num)) return 'El número de la tarjeta no es válido.';
  const m = exp.match(/^(\d{2})\/(\d{2})$/); if (!m || +m[1] < 1 || +m[1] > 12) return 'Escribe la caducidad como MM/AA.';
  const end = new Date(2000 + +m[2], +m[1], 1); if (end <= new Date()) return 'La tarjeta está caducada.';
  if (!/^\d{3,4}$/.test(cvc)) return 'El CVC son los 3 o 4 números de detrás.';
  return null;
}
function payNow(){
  const ck = state.checkout; if (!ck) return;
  captureCard();
  let method = PAYMENT_METHODS.find(m => m.id === ck.method), outcome = 'ok';
  if (ck.method === 'nueva'){
    const num = (ck.card || '').replace(/\D/g, ''), exp = (ck.exp || '').trim(), cvc = val('f-cvc').trim();
    const err = cardError(num, exp, cvc); if (err){ ck.err = err; renderCheckout(); return; }
    outcome = TEST_CARDS[num] || 'ok';
    method = { id: newId('pm'), brand: cardBrand(num), last4: num.slice(-4), exp, isDefault: !PAYMENT_METHODS.length };
    ck.newMethod = method;
  }
  if (!method){ ck.err = 'Elige cómo pagar.'; renderCheckout(); return; }
  if (outcome === 'rechazada'){ ck.err = 'Tu banco ha rechazado el pago. Prueba con otra tarjeta.'; renderCheckout(); return; }
  if (outcome === 'fondos'){ ck.err = 'La tarjeta no tiene saldo suficiente.'; renderCheckout(); return; }
  if (outcome === '3ds') return open3ds(method);
  completePayment(method);
}
// Autenticación reforzada (PSD2 / 3D Secure): el banco pide confirmar el pago.
function open3ds(method){
  state.checkout.pending = method;
  showOverlay('ov-sheet', `<div class="sheet-bg"></div><div class="sheet" role="dialog" aria-label="Confirma el pago">
    <div class="sheet-h"><span>Confirma el pago en tu banco</span></div>
    <div class="sheet-list form"><div class="pay-note">${ico('lock')}<p>Tu banco pide confirmar este pago de <b>${money2(getPlan(state.checkout.planId).price)}</b> (autenticación reforzada). En el móvil se abriría la app de tu banco.</p></div>
      <button class="btn-primary" onclick="completePayment(state.checkout.pending)">Confirmar el pago</button>
      <button class="btn-ghost" onclick="state.checkout.err='Has cancelado la confirmación: no se ha cobrado nada.';renderCheckout()">Cancelar</button></div></div>`);
}
function payWithWallet(){ completePayment({ id:'wallet', brand:'Pago con el móvil', last4:'', exp:'' }); }
function completePayment(method){
  const ck = state.checkout, p = ck && getPlan(ck.planId); if (!p) return;
  if (ck.newMethod && ck.save && method === ck.newMethod){
    if (!PAYMENT_METHODS.length) method.isDefault = true;
    PAYMENT_METHODS.push(method);
  }
  const label = method.last4 ? `${method.brand} ···· ${method.last4}` : method.brand;
  let x = myPayment(p.id);
  if (x && x.status === 'pendiente'){ x.status = 'retenido'; x.at = Date.now(); delete x.dueAt; }
  else x = newPayment(p, 'me', 'retenido');
  x.method = label;
  state.checkout = null; closeOverlay();
  notify('pago', `Pago de ${money2(x.amount)} para ${p.title}. Lo retenemos hasta el plan. Recibo ${x.receiptNo}.`, { route:'pagos' });
  completeJoin(p.id, `Plaza reservada · ${money(x.amount)} retenidos hasta el plan`);
}

/* ---------- cancelaciones y reembolsos ---------- */
// Al cancelar tu asistencia: se reembolsa según la política del plan.
function refundMyPayment(p, rf){
  const x = myPayment(p.id); if (!x || !['retenido','pendiente'].includes(x.status)) return null;
  if (x.status === 'pendiente'){ PAYMENTS.splice(PAYMENTS.indexOf(x), 1); return null; }
  x.refunded = round2(rf.amount);
  x.status = rf.pct >= 100 ? 'reembolsado' : (rf.pct > 0 ? 'reembolso_parcial' : 'retenido');
  x.refundReason = rf.pct >= 100 ? 'Cancelaste a tiempo: reembolso completo' : (rf.pct > 0 ? `Política ${rf.policy.label.toLowerCase()}: reembolso del ${rf.pct} %` : `Política ${rf.policy.label.toLowerCase()}: sin reembolso`);
  if (rf.pct > 0){ x.refundedAt = Date.now(); notify('pago', `Te devolvemos ${money2(x.refunded)} de ${p.title}. Llega a tu tarjeta en 5-10 días hábiles.`, { route:'pagos' }); }
  if (rf.pct === 0) x.cancelled = true;   // la plaza se pierde y el importe va al anfitrión tras el plan
  return x;
}
// El anfitrión cancela (o el plan no llega al mínimo): reembolso completo a todos.
function refundAllForPlan(p, reason){
  PAYMENTS.filter(x => x.planId === p.id && !x.past && ['retenido','reembolso_parcial','pendiente','en_revision','liberado'].includes(x.status)).forEach(x => {
    x.refunded = x.amount; x.status = 'reembolsado'; x.refundedAt = Date.now(); x.refundReason = reason;
    if (x.userId === 'me') notify('pago', `${p.title} se ha cancelado: te devolvemos ${money2(x.amount)} (el 100 %).`, { route:'pagos' });
  });
}

/* ---------- después del plan: liberar y pagar al anfitrión ---------- */
function releasePlanPayments(planId){
  PAYMENTS.filter(x => x.planId === planId && !x.past && ['retenido','reembolso_parcial'].includes(x.status)).forEach(x => {
    x.status = 'liberado'; x.releaseAt = Date.now() + RELEASE_HOURS * 3600000;
  });
}
function payoutPlan(planId){
  PAYMENTS.filter(x => x.planId === planId && x.status === 'liberado').forEach(x => { x.status = 'pagado'; x.paidOutAt = Date.now(); });
}
// Demo: el anfitrión da el plan por celebrado; a las 48 h se le paga.
function demoHostPlanDone(planId){
  const p = getPlan(planId); if (!p) return;
  releasePlanPayments(planId); saveState();
  toast(`Plan celebrado: los cobros te llegarán en ${RELEASE_HOURS} h si nadie reclama`);
  if (location.hash.startsWith('#/cobros')) renderPayouts(); else renderDetail(planId);
}
function demoPayout(planId){
  payoutPlan(planId); saveState();
  const net = hostSales(planId).reduce((s, x) => s + splitFor(x.amount - x.refunded).net, 0);
  notify('pago', `Te hemos pagado ${money2(net)} de ${(getPlan(planId) || {}).title || 'tu plan'} a tu cuenta ${maskIban((ME.payouts || {}).iban)}.`, { route:'cobros' });
  renderPayouts();
}
// Demo: llegan reservas a un plan de pago tuyo.
function demoSales(planId, n){
  const p = getPlan(planId); if (!p || !p.paid) return;
  const buyers = USERS.filter(u => u.id !== 'me' && !u.managedBy && u.type !== 'profesional').slice(0, n || 3);
  buyers.forEach(u => { const x = newPayment(p, u.id, 'retenido'); x.method = 'Tarjeta'; p.joined = (p.joined || 0) + 1; });
  saveState(); notify('pago', `${buyers.length} reservas nuevas en ${p.title}: ${money2(buyers.length * p.price)} retenidos hasta el plan.`, { route:'cobros' });
  if (location.hash.startsWith('#/cobros')) renderPayouts(); else renderDetail(planId);
}

/* ---------- reclamaciones ---------- */
const CLAIM_REASONS = [['no_celebrado','El plan no se celebró'], ['distinto','Era muy distinto de lo anunciado'], ['cobro','Me han cobrado mal'], ['otro','Otro problema']];
const canClaim = (x) => x.userId === 'me' && ['retenido','liberado'].includes(x.status) && !x.past && !x.cancelled;
function openClaim(payId){
  const x = PAYMENTS.find(y => y.id === payId); if (!x) return;
  state.claim = { payId, reason: null };
  renderClaim();
}
function renderClaim(){
  const c = state.claim, x = PAYMENTS.find(y => y.id === c.payId); if (!x) return;
  showOverlay('ov-sheet', `<div class="sheet-bg" onclick="closeOverlay()"></div><div class="sheet" role="dialog" aria-label="Tengo un problema con este plan">
    <div class="sheet-h"><span>Tengo un problema</span><button class="sv-x" onclick="closeOverlay()" aria-label="Cerrar">${ico('close')}</button></div>
    <div class="sheet-list rep"><p class="hint"><b>${escapeHtml(x.planTitle)}</b> · ${money2(x.amount)}. Mientras lo revisamos, no se paga al anfitrión.</p>
      <div class="rep-list" role="radiogroup">${CLAIM_REASONS.map(([v, l]) => `<button class="rep-opt ${c.reason === v ? 'on' : ''}" role="radio" aria-checked="${c.reason === v}" onclick="state.claim.reason='${v}';renderClaim()"><span class="rep-dot"></span>${l}</button>`).join('')}</div>
      <div class="field"><label for="f-claim">Cuéntanos qué pasó ${counter('f-claim','message','')}</label><textarea ${lim('f-claim','message')} rows="3"></textarea></div>
      <button class="btn-primary" ${c.reason ? '' : 'disabled'} onclick="submitClaim()">Enviar</button></div></div>`);
}
function submitClaim(){
  const c = state.claim, x = c && PAYMENTS.find(y => y.id === c.payId); if (!x || !c.reason) return;
  const p = getPlan(x.planId) || {}, hostId = p.hostId || (USERS.find(u => u.name === x.hostName) || {}).id || null;
  const text = clip(val('f-claim'), 'message');
  x.prevStatus = x.status; x.status = 'en_revision';
  REPORTS.push({ id: newId('rp'), reporterId:'me', targetUserId: hostId, objectType:'plan', planId: x.planId, reason: c.reason === 'cobro' ? 'otro' : 'estafa',
    evidence: `${CLAIM_REASONS.find(r => r[0] === c.reason)[1]}. ${text}`.trim(), source:'usuario', status:'en_cola', at: Date.now(), paymentId: x.id });
  state.claim = null; saveState(); closeOverlay();
  toast('Reclamación enviada: pausamos el pago al anfitrión mientras la revisamos');
  if (location.hash === '#/pagos') renderPayments();
}
// Lo usa el panel de moderación (confianza.js) al resolver una reclamación.
function resolveClaim(paymentId, refund){
  const x = PAYMENTS.find(y => y.id === paymentId); if (!x || x.status !== 'en_revision') return;
  if (refund){ x.refunded = x.amount; x.status = 'reembolsado'; x.refundedAt = Date.now(); x.refundReason = 'Reclamación aceptada: reembolso completo';
    if (x.userId === 'me') notify('pago', `Reclamación aceptada: te devolvemos ${money2(x.amount)} de ${x.planTitle}.`, { route:'pagos' }); }
  else { x.status = x.prevStatus || 'retenido'; if (x.userId === 'me') notify('pago', `Hemos revisado tu reclamación sobre ${x.planTitle} y no procede el reembolso.`, { route:'pagos' }); }
  delete x.prevStatus;
}

/* ---------- Ajustes ▸ Pagos y reembolsos ---------- */
function renderPayments(){
  const view = document.getElementById('view-page');
  const mine = PAYMENTS.filter(x => x.userId === 'me').sort((a, b) => b.at - a.at);
  view.innerHTML = pageHead('Pagos y reembolsos') + `<div class="page-body">
    <div class="set-group"><div class="set-title">Formas de pago</div>
      ${PAYMENT_METHODS.map(m => `<div class="set-row static"><span class="sr-ic">${ico('card')}</span><span class="sr-l">${escapeHtml(m.brand)} ···· ${escapeHtml(m.last4)}<span class="or-s">Caduca ${escapeHtml(m.exp)}${m.isDefault ? ' · principal' : ''}</span></span>
        ${m.isDefault ? '' : `<button class="ph-btn sm" onclick="setDefaultMethod('${m.id}')">Principal</button>`}<button class="ph-btn sm" onclick="removeMethod('${m.id}')">Quitar</button></div>`).join('')
        || '<p class="hint">No tienes tarjetas guardadas. Se guardan al pagar, si quieres.</p>'}
      <p class="hint">Apple Pay y Google Pay se eligen al pagar. Los datos de las tarjetas los guarda Stripe, no planes.</p></div>
    <div class="set-group"><div class="set-title">Tus pagos</div>
      ${mine.map(x => `<div class="mod-card pay-card"><div class="mod-top"><b>${escapeHtml(x.planTitle)}</b><span class="st st-pay-${x.status}">${PAY_STATUS[x.status]}</span></div>
        <div class="mod-meta">${money2(x.amount)}${x.refunded ? ` · reembolsado ${money2(x.refunded)}` : ''} · ${escapeHtml(x.method || '')} · ${dayLabel(x.at)}</div>
        ${x.refundReason ? `<p class="hint">${escapeHtml(x.refundReason)}${x.refunded && x.status !== 'retenido' ? '. Llega en 5-10 días hábiles.' : ''}</p>` : ''}
        ${x.status === 'pendiente' ? `<p class="hint">${ico('clock')} Te han aceptado: paga antes de ${fmtWhen(new Date(x.dueAt))} o la plaza pasa a otra persona.</p>` : ''}
        <div class="mod-acts">${x.status === 'pendiente' ? `<button class="ph-btn primary" onclick="openCheckout('${x.planId}')">Pagar ${money(x.amount)}</button>`
          : `<button class="ph-btn" onclick="openReceipt('${x.id}')">Recibo</button>`}${canClaim(x) ? `<button class="ph-btn" onclick="openClaim('${x.id}')">Tengo un problema</button>` : ''}</div></div>`).join('')
        || `<div class="empty-tab"><span class="empty-ic">${ico('card')}</span><p>Aún no has pagado ningún plan.</p></div>`}
      <p class="hint">El dinero queda retenido hasta el plan y al anfitrión le llega 48 h después de celebrarse. Si se cancela o no se celebra, te lo devolvemos entero.</p></div>
  </div>`;
}
function setDefaultMethod(id){ PAYMENT_METHODS.forEach(m => { m.isDefault = m.id === id; }); saveState(); renderPayments(); }
function removeMethod(id){
  const i = PAYMENT_METHODS.findIndex(m => m.id === id); if (i < 0) return;
  const wasDefault = PAYMENT_METHODS[i].isDefault; PAYMENT_METHODS.splice(i, 1);
  if (wasDefault && PAYMENT_METHODS[0]) PAYMENT_METHODS[0].isDefault = true;
  saveState(); toast('Tarjeta quitada'); renderPayments();
}

/* ---------- recibos y facturas ---------- */
const PLATFORM = { name:'planes (razón social pendiente)', nif:'B00000000', address:'Madrid, España' };   // provisional
function receiptHtml(x){
  const host = USERS.find(u => u.name === x.hostName) || {};
  const biz = host.type === 'profesional';
  const rows = [['Plan', x.planTitle], ['Organiza', x.hostName + (biz ? ' (empresa)' : '')], ['Fecha del pago', new Date(x.at).toLocaleDateString('es-ES')],
    ['Forma de pago', x.method || ''], ['Importe', money2(x.amount)]].concat(x.refunded ? [['Reembolsado', '− ' + money2(x.refunded)], ['Total', money2(x.amount - x.refunded)]] : []);
  return `<div class="rcpt"><div class="rcpt-h"><b>planes</b><span>Recibo ${escapeHtml(x.receiptNo)}</span></div>
    <table>${rows.map(([k, v]) => `<tr><th>${escapeHtml(k)}</th><td>${escapeHtml(v)}</td></tr>`).join('')}</table>
    <p>Cobrado por ${escapeHtml(PLATFORM.name)} (NIF ${PLATFORM.nif}) en nombre de ${escapeHtml(x.hostName)}, a través de Stripe. ${biz ? 'La factura de la entrada la emite el organizador; pídesela desde aquí.' : 'IVA incluido si corresponde.'}</p></div>`;
}
function openReceipt(id){
  const x = PAYMENTS.find(y => y.id === id); if (!x) return;
  showOverlay('ov-sheet', `<div class="sheet-bg" onclick="closeOverlay()"></div><div class="sheet" role="dialog" aria-label="Recibo">
    <div class="sheet-h"><span>Recibo</span><button class="sv-x" onclick="closeOverlay()" aria-label="Cerrar">${ico('close')}</button></div>
    <div class="sheet-list">${receiptHtml(x)}
      <button class="btn-primary" onclick="downloadDoc('${x.receiptNo}', 'receipt', '${x.id}')">${ico('download')} Descargar</button>
      <button class="btn-ghost" onclick="toast('En la app real te pediríamos el NIF y la dirección para emitir la factura completa')">Pedir factura con mis datos</button></div></div>`);
}
// Factura mensual de la comisión que planes emite al anfitrión.
function commissionInvoice(month){
  const sales = PAYMENTS.filter(x => isHostOf(x) && ['liberado','pagado'].includes(x.status) && new Date(x.paidOutAt || x.releaseAt || x.at).toISOString().slice(0, 7) === month);
  const gross = sales.reduce((s, x) => s + (x.amount - x.refunded), 0), sp = splitFor(gross);
  return { no: `PLC-${month.replace('-', '')}-${String((ME.payouts || {}).accountNo || 1).padStart(4, '0')}`, month, sales, ...sp };
}
function invoiceHtml(inv){
  const p = ME.payouts || {};
  return `<div class="rcpt"><div class="rcpt-h"><b>planes</b><span>Factura ${escapeHtml(inv.no)}</span></div>
    <p>Emisor: ${escapeHtml(PLATFORM.name)} · NIF ${PLATFORM.nif} · ${escapeHtml(PLATFORM.address)}<br>Cliente: ${escapeHtml(p.legalName || ME.name)} · ${escapeHtml(p.taxId || '')}</p>
    <table><tr><th>Concepto</th><td>Comisión por intermediación (15 %) · ${escapeHtml(inv.month)} · ${inv.sales.length} reservas</td></tr>
      <tr><th>Ventas del mes</th><td>${money2(inv.gross)}</td></tr><tr><th>Base imponible</th><td>${money2(inv.feeBase)}</td></tr>
      <tr><th>IVA 21 %</th><td>${money2(inv.feeVat)}</td></tr><tr><th>Total comisión</th><td>${money2(inv.fee)}</td></tr>
      <tr><th>Pagado a tu cuenta</th><td>${money2(inv.net)}</td></tr></table>
    <p>La comisión ya se ha descontado de lo que te hemos pagado. No tienes que pagar nada más.</p></div>`;
}
function openInvoice(month){
  const inv = commissionInvoice(month);
  showOverlay('ov-sheet', `<div class="sheet-bg" onclick="closeOverlay()"></div><div class="sheet" role="dialog" aria-label="Factura de la comisión">
    <div class="sheet-h"><span>Factura de la comisión</span><button class="sv-x" onclick="closeOverlay()" aria-label="Cerrar">${ico('close')}</button></div>
    <div class="sheet-list">${invoiceHtml(inv)}<button class="btn-primary" onclick="downloadDoc('${inv.no}', 'invoice', '${month}')">${ico('download')} Descargar</button></div></div>`);
}
// Descarga el recibo o la factura como página HTML imprimible (en la app real, PDF).
function downloadDoc(no, kind, ref){
  const body = kind === 'receipt' ? receiptHtml(PAYMENTS.find(y => y.id === ref)) : invoiceHtml(commissionInvoice(ref));
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${escapeHtml(no)}</title><style>body{font-family:system-ui,sans-serif;max-width:640px;margin:40px auto;padding:0 16px;color:#111}
    .rcpt-h{display:flex;justify-content:space-between;border-bottom:2px solid #111;padding-bottom:8px;margin-bottom:12px}table{width:100%;border-collapse:collapse;margin:12px 0}
    th,td{text-align:left;padding:6px 0;border-bottom:1px solid #ddd;font-size:14px}th{color:#555;font-weight:500;width:40%}p{font-size:13px;color:#333;line-height:1.5}</style></head><body>${body}`;   // sin etiquetas de cierre: son opcionales en HTML
  if (typeof Blob === 'undefined'){ toast('Este navegador no puede generar el archivo'); return; }
  saveFile(new Blob([html], { type:'text/html' }), `${no}.html`).then(r => { if (r === 'saved') toast('Descargado'); else if (r !== 'declined') toast('No se ha podido guardar'); });
}

/* ---------- cobros del anfitrión (Stripe Connect) ---------- */
const payoutsReady = () => !!(ME.payouts && ME.payouts.status === 'activa');
const isHostOf = (x) => { const p = getPlan(x.planId); return !!p && p.hostId === 'me' && x.userId !== 'me'; };
const hostSales = (planId) => PAYMENTS.filter(x => isHostOf(x) && (!planId || x.planId === planId));
function maskIban(iban){ const s = String(iban || '').replace(/\s/g, ''); return s ? s.slice(0, 4) + ' ···· ' + s.slice(-4) : ''; }
// NIF/NIE español: letra de control.
function validTaxId(id){
  const s = String(id || '').toUpperCase().replace(/[\s-]/g, '');
  const L = 'TRWAGMYFPDXBNJZSQVHLCKE';
  if (/^\d{8}[A-Z]$/.test(s)) return L[+s.slice(0, 8) % 23] === s[8];
  if (/^[XYZ]\d{7}[A-Z]$/.test(s)) return L[+(('XYZ'.indexOf(s[0])) + s.slice(1, 8)) % 23] === s[8];
  return /^[ABCDEFGHJNPQRSUVW]\d{7}[0-9A-J]$/.test(s);   // CIF de empresa: formato
}
// IBAN: dígitos de control (módulo 97).
function validIban(iban){
  const s = String(iban || '').toUpperCase().replace(/\s/g, '');
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(s) || (s.startsWith('ES') && s.length !== 24)) return false;
  const r = (s.slice(4) + s.slice(0, 4)).replace(/[A-Z]/g, c => String(c.charCodeAt(0) - 55));
  let m = 0; for (const ch of r) m = (m * 10 + +ch) % 97;
  return m === 1;
}
function renderPayouts(){
  const view = document.getElementById('view-page'), a = ME.payouts;
  if (!a || a.status === 'borrador') return renderPayoutSetup();
  const sales = hostSales(), sum = (st) => sales.filter(x => st.includes(x.status)).reduce((s, x) => s + splitFor(x.amount - x.refunded).net, 0);
  const plans = PLANS.filter(p => p.hostId === 'me' && p.paid);
  const months = Array.from(new Set(sales.filter(x => ['liberado','pagado'].includes(x.status)).map(x => new Date(x.paidOutAt || x.releaseAt || x.at).toISOString().slice(0, 7)))).sort().reverse();
  view.innerHTML = pageHead('Cobros') + `<div class="page-body">
    ${a.status !== 'activa' ? `<div class="acct-ok warn">${ico('clock')}<div><b>Estamos verificando tus datos</b><p>Stripe comprueba tu identidad y tu cuenta bancaria. Suele tardar unos minutos.</p></div></div>` : ''}
    <div class="pay-kpis"><div><b>${money(sum(['retenido','reembolso_parcial']))}</b><span>Retenido hasta el plan</span></div><div><b>${money(sum(['liberado']))}</b><span>En camino</span></div><div><b>${money(sum(['pagado']))}</b><span>Pagado</span></div></div>
    <div class="set-group"><div class="set-title">Tus planes de pago</div>
      ${plans.map(p => { const s = hostSales(p.id), live = s.filter(x => x.status !== 'reembolsado'), gross = live.reduce((t, x) => t + x.amount - x.refunded, 0), sp = splitFor(gross);
        const st = s.some(x => x.status === 'liberado') ? 'liberado' : (s.some(x => x.status === 'pagado') ? 'pagado' : (isCancelled(p) ? 'reembolsado' : 'retenido'));
        return `<div class="mod-card pay-card"><div class="mod-top"><b>${escapeHtml(p.title)}</b><span class="st st-pay-${st}">${isCancelled(p) ? 'Cancelado · reembolsado' : PAY_STATUS[st]}</span></div>
          <div class="mod-meta">${live.length} ${live.length === 1 ? 'reserva' : 'reservas'} · ventas ${money2(sp.gross)} · comisión ${money2(sp.fee)} · <b>para ti ${money2(sp.net)}</b></div>
          ${isCancelled(p) ? '' : `<div class="mod-acts">${st === 'retenido' ? `<button class="ph-btn" onclick="demoSales('${p.id}', 3)">Demo: llegan 3 reservas</button><button class="ph-btn" onclick="demoHostPlanDone('${p.id}')">Demo: se ha celebrado</button>` : ''}
            ${st === 'liberado' ? `<button class="ph-btn" onclick="demoPayout('${p.id}')">Demo: pasan 48 h</button>` : ''}</div>`}</div>`; }).join('')
        || `<p class="hint">Aún no has publicado planes de pago. Al crear un plan, elige "De pago".</p>`}</div>
    <div class="set-group"><div class="set-title">Facturas de la comisión</div>
      ${months.map(m => `<button class="set-row" onclick="openInvoice('${m}')"><span class="sr-ic">${ico('doc')}</span><span class="sr-l">${new Date(m + '-15').toLocaleDateString('es-ES', { month:'long', year:'numeric' })}</span><span class="pl-arrow">${ico('chevR')}</span></button>`).join('')
        || '<p class="hint">Cada mes te enviamos la factura de la comisión de los planes celebrados.</p>'}</div>
    <div class="set-group"><div class="set-title">Cuenta de cobro</div>
      <div class="set-row static"><span class="sr-ic">${ico('card')}</span><span class="sr-l">${escapeHtml(maskIban(a.iban))}<span class="or-s">${escapeHtml(a.legalName)} · ${a.kind === 'empresa' ? 'Autónomo o empresa' : 'Particular'} · ${escapeHtml(a.taxId)}</span></span></div>
      <p class="hint">Te pagamos el 85 % de cada reserva 48 h después del plan (la comisión del 15 % lleva el IVA incluido). Por ley (DAC7), cada año informamos a Hacienda de lo que cobras con planes.</p></div>
  </div>`;
}
// Alta de cobros: tipo, datos fiscales, cuenta bancaria y verificación (Stripe Connect Express).
function renderPayoutSetup(){
  const view = document.getElementById('view-page'), d = state.payoutForm || (state.payoutForm = { kind:'particular' });
  if (!isVerified()){ view.innerHTML = pageHead('Cobros') + `<div class="empty-tab"><span class="empty-ic">${ico('shield')}</span><h3>Primero, verifica tu identidad</h3><p>Para cobrar planes hace falta tener la identidad verificada.</p>
    <button class="btn-primary" style="margin-top:14px" onclick="requireVerified('Verifica tu identidad para cobrar', () => renderPayouts())">Verificar ahora</button></div>`; return; }
  view.innerHTML = pageHead('Configura tus cobros') + `<div class="page-body form">
    <div class="pay-note">${ico('euro')}<p>Para cobrar planes de pago. Las personas pagan al reservar; lo retenemos hasta el plan y te llega el <b>85 %</b> a tu cuenta 48 h después de celebrarse. Los pagos los gestiona Stripe.</p></div>
    <div class="field"><label>Cobras como</label><div class="iseg">${[['particular','Particular','user'],['empresa','Autónomo o empresa','briefcase']].map(([v, l, n]) => `<button class="${d.kind === v ? 'active' : ''}" onclick="capturePayout();state.payoutForm.kind='${v}';renderPayoutSetup()">${ico(n)}<span>${l}</span></button>`).join('')}</div>
      <p class="hint">${d.kind === 'particular' ? 'Para planes ocasionales. Si organizas de forma habitual, tienes que darte de alta como autónomo.' : 'Emitirás la factura de cada entrada; nosotros te facturamos la comisión.'}</p></div>
    <div class="field"><label for="f-legal">${d.kind === 'empresa' ? 'Nombre o razón social' : 'Nombre y apellidos (como en tu DNI)'}</label><input id="f-legal" autocomplete="name" value="${escapeHtml(d.legalName || '')}"></div>
    <div class="field"><label for="f-taxid">${d.kind === 'empresa' ? 'NIF o CIF' : 'DNI o NIE'}</label><input id="f-taxid" autocapitalize="characters" value="${escapeHtml(d.taxId || '')}"></div>
    <div class="field"><label for="f-addr">Dirección fiscal</label><input id="f-addr" autocomplete="street-address" value="${escapeHtml(d.address || '')}"></div>
    <div class="field"><label for="f-iban">Cuenta bancaria (IBAN)</label><input id="f-iban" autocapitalize="characters" placeholder="ES00 0000 0000 0000 0000 0000" value="${escapeHtml(d.iban || '')}"></div>
    ${d.err ? `<p class="pay-err" role="alert">${ico('alert')} ${escapeHtml(d.err)}</p>` : ''}
    <button class="btn-primary" onclick="submitPayoutSetup()">Enviar a verificar</button>
    <p class="hint">Stripe comprobará tu identidad (ya verificada en planes) y que la cuenta es tuya. Al seguir aceptas el Acuerdo de cuentas conectadas de Stripe.</p>
  </div>`;
}
function capturePayout(){ const d = state.payoutForm; if (!d) return; d.legalName = val('f-legal'); d.taxId = val('f-taxid'); d.address = val('f-addr'); d.iban = val('f-iban'); }
function submitPayoutSetup(){
  capturePayout(); const d = state.payoutForm;
  d.err = !d.legalName.trim() ? 'Escribe tu nombre o razón social.' : (!validTaxId(d.taxId) ? 'El DNI, NIE o NIF no es válido.' : (!d.address.trim() ? 'Escribe la dirección fiscal.' : (!validIban(d.iban) ? 'El IBAN no es válido.' : '')));
  if (d.err) return renderPayoutSetup();
  ME.payouts = { kind: d.kind, legalName: d.legalName.trim(), taxId: d.taxId.toUpperCase().replace(/[\s-]/g, ''), address: d.address.trim(),
    iban: d.iban.toUpperCase().replace(/\s/g, ''), status: 'en_revision', accountNo: 1, at: Date.now(), stripeId: 'acct_' + Math.random().toString(36).slice(2, 12) };
  state.payoutForm = null; saveState(); renderPayouts();
  setTimeout(() => { if (ME.payouts && ME.payouts.status === 'en_revision'){ ME.payouts.status = 'activa'; saveState();
    notify('pago', 'Tus cobros están activos: ya puedes publicar planes de pago.', { route:'cobros' }); if (location.hash === '#/cobros') renderPayouts(); } }, 3000);   // demo: Stripe lo verifica
}
