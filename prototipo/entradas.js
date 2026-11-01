/* =========================================================================
   Entradas: además de su acceso (gratis o de pago), un plan puede tener entradas
   especiales con su precio, sus plazas y lo que incluyen. Por ejemplo, un plan gratis
   con una zona VIP de pago (freemium) o un plan de pago con general y VIP.
   - Se compran desde la app con el pago protegido de siempre (pagos.js): el dinero
     queda retenido hasta el plan, con la misma comisión y la misma política de cancelación.
   - Quien ya va con la entrada general puede pasar a VIP pagando solo la diferencia.
   - Cada entrada especial lleva un código personal para el acceso a su zona.
   En la app real: docs/pagos.md (Tipos de entrada).
   ========================================================================= */
const TICKET_MAX_PERKS = 4;
const ticketsOf = (p) => (p && p.tickets) || [];
const getTicket = (p, id) => ticketsOf(p).find(t => t.id === id) || null;
const ticketLeft = (t) => t.cap ? Math.max(0, t.cap - (t.sold || 0)) : Infinity;
// Tu entrada especial en este plan (si la tienes y no la has cancelado).
function myTicket(p){
  const x = myPayment(p.id);
  return x && x.ticketId && !x.cancelled && !['reembolsado'].includes(x.status) ? getTicket(p, x.ticketId) : null;
}
// Lo que pagas por una entrada: si ya pagaste la general, solo la diferencia.
function ticketCost(p, t){
  const x = myPayment(p.id), paid = x && x.status === 'retenido' && !x.ticketId ? x.amount : 0;
  return round2(Math.max(0, t.price - paid));
}
// Código personal para entrar a la zona (en la app real, un QR firmado por el servidor).
function ticketCode(p, t){
  let h = 7; String(p.id + ':' + t.id + ':' + (ME.handle || 'me')).split('').forEach(c => { h = (h * 31 + c.charCodeAt(0)) % 9000; });
  return `${t.id.toUpperCase()}-${1000 + h}`;
}
// "Gratis · Zona VIP 12 €" para la barra de abajo y las listas.
function ticketsLine(p){ return ticketsOf(p).map(t => `${t.name} ${money(t.price)}`).join(' · '); }

/* ---------- en la ficha del plan ---------- */
function ticketsBlock(p){
  const list = ticketsOf(p); if (!list.length) return '';
  const joined = state.joined.has(p.id), mine = myTicket(p), off = isCancelled(p) || new Date(p.when) < Date.now();
  const base = `<div class="tk"><div class="tk-h"><b>${p.paid ? 'Entrada general' : 'Acceso libre'}</b><span>${p.paid ? money(p.price) : 'Gratis'}</span></div>
    <p class="tk-s">${p.paid ? 'El plan, sin extras.' : (p.joinType === 'libre' ? 'El plan, sin apuntarte ni pagar.' : 'El plan, sin pagar nada.')}${joined && !mine ? ' <em class="tk-mine">Tu entrada</em>' : ''}</p></div>`;
  const rows = list.map(t => {
    const left = ticketLeft(t), have = mine && mine.id === t.id, cost = ticketCost(p, t);
    const act = have ? `<em class="tk-mine">Tu entrada · ${escapeHtml(ticketCode(p, t))}</em>`
      : (off ? '' : (left <= 0 ? '<span class="tk-out">Agotada</span>'
      : `<button class="ph-btn sm primary" onclick="buyTicket('${p.id}','${t.id}')">${joined ? `Pasar a ${escapeHtml(t.name)} · ${money(cost)}` : `Comprar · ${money(t.price)}`}</button>`));
    return `<div class="tk vip"><div class="tk-h"><b>${ico('star')} ${escapeHtml(t.name)}</b><span>${money(t.price)}</span></div>
      ${(t.perks || []).length ? `<ul class="tk-perks">${t.perks.map(x => `<li>${ico('check')}<span>${escapeHtml(x)}</span></li>`).join('')}</ul>` : ''}
      <div class="tk-f"><span class="tk-s">${t.cap ? (left > 0 ? `Quedan ${left} de ${t.cap}` : `${t.cap} vendidas`) : 'Sin límite'}</span>${act}</div></div>`;
  }).join('');
  return `<div class="block" id="entradas"><h4>Entradas</h4>${base}${rows}
    <p class="hint">Pago protegido: lo retenemos hasta el plan. ${p.paid ? 'Si ya tienes la general, pagas solo la diferencia.' : 'El plan sigue siendo gratis; la entrada especial es opcional.'}</p></div>`;
}
function buyTicket(planId, ticketId){
  const p = getPlan(planId), t = getTicket(p, ticketId); if (!p || !t) return;
  if (!requireVerified('Verifica tu identidad para comprar entradas', () => buyTicket(planId, ticketId))) return;
  if (isCancelled(p)){ toast('El plan está cancelado'); return; }
  if (!canBuyNow(p)){ toast('La venta aún no está abierta'); return; }
  if (ticketLeft(t) <= 0){ toast(`${t.name}: agotada`); return; }
  if (myTicket(p)){ toast('Ya tienes una entrada especial para este plan'); return; }
  if (!state.joined.has(planId) && p.paid && isFull(p)){ toast('El plan está completo'); return; }
  openCheckout(planId, ticketId);
}
// El anfitrión: ventas de cada entrada especial.
function ticketsHostLine(p){
  const list = ticketsOf(p); if (!list.length) return '';
  return `<div class="pay-line">${ico('star')}<span>${list.map(t => `${escapeHtml(t.name)}: ${t.sold || 0}${t.cap ? ' de ' + t.cap : ''} vendidas · ${money((t.sold || 0) * t.price)}`).join(' · ')}</span></div>`;
}

/* ---------- al crear el plan ---------- */
function ticketFormFields(d){
  const on = !!d.vip;
  return `<div id="d-tickets"><div class="opt-row" onclick="toggleVipDraft()"><span class="or-ic">${ico('star')}</span><span class="or-l">Entrada especial (zona VIP)<span class="or-s">${d.price === 'pago' ? 'Además de la general' : 'El plan sigue gratis; quien quiera, paga la zona VIP'}</span></span><span class="switch ${on ? 'on' : ''}"><span class="knob"></span></span></div></div>
    <div id="vip-opts" ${on ? '' : 'hidden'}>
      <div class="field"><label for="f-vipname">Nombre</label><input id="f-vipname" maxlength="30" value="${escapeHtml(d.vipName || 'Zona VIP')}"></div>
      <div class="ck-two"><div class="field"><label for="f-vipprice">Precio (€)</label><input id="f-vipprice" type="number" min="1" max="500" step="0.5" value="${escapeHtml(String(d.vipPrice || ''))}" placeholder="25"></div>
        <div class="field"><label for="f-vipcap">Plazas</label><input id="f-vipcap" type="number" min="1" max="500" value="${escapeHtml(String(d.vipCap || ''))}" placeholder="20"></div></div>
      <div class="field"><label for="f-vipperks">Qué incluye (una cosa por línea, hasta ${TICKET_MAX_PERKS})</label><textarea id="f-vipperks" rows="3" maxlength="240" placeholder="Zona reservada junto al escenario&#10;Una consumición&#10;Entrada sin cola">${escapeHtml(d.vipPerks || '')}</textarea></div>
    </div>`;
}
function captureVipDraft(){ const d = state.draft; if (!document.getElementById('f-vipname')) return; d.vipName = val('f-vipname'); d.vipPrice = val('f-vipprice'); d.vipCap = val('f-vipcap'); d.vipPerks = val('f-vipperks'); }
function toggleVipDraft(){
  captureVipDraft(); state.draft.vip = !state.draft.vip;
  const o = document.getElementById('vip-opts'); if (o) o.hidden = !state.draft.vip;
  const sw = document.querySelector && document.querySelector('#d-tickets .switch'); if (sw) sw.classList.toggle('on', !!state.draft.vip);
}
// Valida la entrada especial del borrador: devuelve el error o null.
function vipDraftError(){
  const d = state.draft; if (!d.vip) return null;
  captureVipDraft();
  const price = parseFloat(String(d.vipPrice).replace(',', '.')), cap = parseInt(d.vipCap, 10);
  if (!(price >= 1 && price <= 500)) return 'Pon un precio para la entrada especial entre 1 y 500 €';
  if (d.price === 'pago'){ const base = parseFloat(String(val('f-price') || d.priceValue).replace(',', '.')); if (base && price <= base) return 'La entrada especial tiene que costar más que la general'; }
  if (!(cap >= 1 && cap <= 500)) return 'Indica cuántas plazas tiene la entrada especial';
  return null;
}
function vipFromDraft(){
  const d = state.draft; if (!d.vip) return null;
  const perks = String(d.vipPerks || '').split('\n').map(s => s.trim()).filter(Boolean).slice(0, TICKET_MAX_PERKS).map(s => s.slice(0, 60));
  return [{ id: 'vip', name: (String(d.vipName || '').trim() || 'Zona VIP').slice(0, 30), price: round2(parseFloat(String(d.vipPrice).replace(',', '.'))), cap: parseInt(d.vipCap, 10), sold: 0, perks }];
}
