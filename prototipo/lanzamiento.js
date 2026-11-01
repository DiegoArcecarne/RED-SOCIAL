/* =========================================================================
   Planes exclusivos de la app (lanzamiento y promoción): las entradas solo se venden
   aquí, con cuenta verificada. El plan sirve de anuncio y cada entrada trae un registro.
   - La venta abre a una hora anunciada; antes, "Avísame" apunta a la lista de aviso.
   - Quien está en la lista y verificado tiene acceso anticipado (horas antes que el resto).
   - Entradas a tu nombre e intransferibles (una por persona): en la puerta, QR y DNI.
     Si no puedes ir, se devuelve y pasa a la lista de espera (sin reventa).
   - Se mide: personas avisadas, registros que llegan por el enlace del plan y vendidas.
   En la app real: docs/lanzamiento.md.
   ========================================================================= */
const isExclusive = (p) => !!(p && p.exclusive);
const salesAt = (p) => new Date(p.exclusive.salesAt).getTime();
const earlyAt = (p) => salesAt(p) - (p.exclusive.earlyHours || 0) * 3600000;
const onNotifyList = (p) => !!(ME.salesAlerts || {})[p.id];
// ¿Puedo comprar ya? Abierta para todos, o acceso anticipado si estoy en la lista y verificado.
function canBuyNow(p){
  if (!isExclusive(p)) return true;
  const now = Date.now();
  return now >= salesAt(p) || (now >= earlyAt(p) && onNotifyList(p) && isVerified());
}
function untilLabel(ms){ const m = Math.max(1, Math.round(ms / 60000)), d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60);
  return d ? `${d} d ${h} h` : (h ? `${h} h ${m % 60} min` : `${m} min`); }
const whenOpen = (t) => { const d = new Date(t); return `${DIAS_LARGOS[d.getDay()]} ${d.getDate()} a las ${hhmm(d)}`; };

/* ---------- en la ficha ---------- */
function exclusiveBlock(p){
  if (!isExclusive(p) || isCancelled(p)) return '';
  const x = p.exclusive, now = Date.now(), open = now >= salesAt(p), early = !open && canBuyNow(p);
  const waiting = (x.waiting || 0) + (onNotifyList(p) ? 1 : 0);
  return `<div class="block excl" id="exclusivo"><h4>${ico('lock')} Exclusivo de la app</h4>
    ${open ? `<p class="excl-st"><b>Venta abierta</b> · ${x.sold || 0} vendidas${p.groupMax ? ` de ${p.groupMax}` : ''}</p>`
      : (early ? `<p class="excl-st"><b>Tienes acceso anticipado</b> · para el resto abre el ${whenOpen(salesAt(p))}</p>`
      : `<p class="excl-st"><b>La venta abre el ${whenOpen(salesAt(p))}</b> · quedan ${untilLabel(salesAt(p) - now)}</p>
         <p class="hint">${waiting.toLocaleString('es-ES')} personas esperando.${x.earlyHours ? ` Quien se apunte al aviso y esté verificado compra ${x.earlyHours} h antes.` : ''}</p>`)}
    <ul class="excl-list">
      <li>${ico('phone')}<span>Las entradas solo se venden aquí: ni taquilla ni otras webs.</span></li>
      <li>${ico('shield')}<span>Hace falta una cuenta verificada. La entrada va a tu nombre: en la puerta, tu QR y tu DNI.</span></li>
      <li>${ico('user')}<span>Una por persona e intransferible. Si no puedes ir, devuélvela y pasa a la lista de espera.</span></li>
    </ul>
    ${!open && !early ? `<div class="pl-actions"><button class="link-btn dim" onclick="demoOpenSales('${p.id}')">Demo: abre la venta</button></div>` : ''}
  </div>`;
}
// Botón principal mientras la venta no está abierta para ti (null: el flujo normal de apuntarse).
function exclusiveCta(p){
  if (!isExclusive(p) || isCancelled(p) || state.joined.has(p.id) || canBuyNow(p)) return null;
  if (onNotifyList(p)) return `<button class="btn-join done" disabled>${ico('check')} Te avisaremos${isVerified() ? ' · acceso anticipado' : ''}</button>`;
  return `<button class="btn-join" onclick="joinSalesAlert('${p.id}')">${ico('bell')} Avísame cuando abra</button>`;
}
function joinSalesAlert(id){
  const p = getPlan(id); if (!p) return;
  ME.salesAlerts = Object.assign({}, ME.salesAlerts, { [id]: Date.now() }); saveState();
  toast(isVerified() ? `Te avisamos: podrás comprar ${p.exclusive.earlyHours || 0} h antes que el resto` : 'Te avisamos. Verifícate para tener acceso anticipado');
  renderDetail(id);
}
// Avisos: acceso anticipado y apertura de la venta (una vez cada uno). Se comprueba al navegar.
function checkSalesAlerts(){
  if (typeof ME === 'undefined' || !ME.name) return;
  const now = Date.now(), sent = ME.salesSent || (ME.salesSent = {});
  PLANS.filter(p => isExclusive(p) && onNotifyList(p) && !isCancelled(p) && !state.joined.has(p.id)).forEach(p => {
    const k = sent[p.id] || {};
    if (now >= salesAt(p) && !k.open){ k.open = true; notify('recordatorio', `Ya está abierta la venta de ${p.title}. Solo en la app.`, { planId: p.id }); }
    else if (now >= earlyAt(p) && now < salesAt(p) && isVerified() && !k.early){ k.early = true; notify('recordatorio', `Tu acceso anticipado a ${p.title} ya está abierto: compra antes que nadie.`, { planId: p.id }); }
    sent[p.id] = k;
  });
}
function demoOpenSales(id){
  const p = getPlan(id); if (!p) return;
  p.exclusive.salesAt = Date.now() - 60000; checkSalesAlerts(); saveState();
  toast('Venta abierta'); renderDetail(id);
}
// Lo que ve el anfitrión: lista de aviso, registros que trajo el enlace y vendidas.
function exclusiveHostLine(p){
  if (!isExclusive(p)) return '';
  const x = p.exclusive, mine = accounts().filter(a => a.origin === 'plan/' + p.id).length;
  return `<div class="pay-line">${ico('users')}<span>${(x.waiting || 0).toLocaleString('es-ES')} esperando · ${((x.signups || 0) + mine).toLocaleString('es-ES')} registros desde el enlace · ${x.sold || 0} vendidas</span></div>`;
}
// Al comprar: una por persona, y se cuenta en las vendidas del lanzamiento.
function exclusiveSold(p){ if (isExclusive(p)) p.exclusive.sold = (p.exclusive.sold || 0) + 1; }
