/* =========================================================================
   Bucle central de planes (simulado en el navegador): filtro por fecha, foto real
   al crear, lista de espera, reconfirmación del día, cancelaciones con su política,
   llegada con el QR del anfitrión, índice de fiabilidad, edición y cancelación por el
   anfitrión, chat del plan y notificaciones.
   Lo que hará el servidor de verdad: docs/bucle-de-planes.md.
   ========================================================================= */
const RECONFIRM_HOURS = 24;            // la reconfirmación se pide en las 24 h previas
const RECONFIRM_DEADLINE_HOURS = 2;    // sin reconfirmar 2 h antes, la plaza pasa a la lista de espera
const LATE_CANCEL_HOURS = 24;          // cancelar con menos de 24 h es una cancelación tardía
const CHECKIN_BEFORE_MIN = 60, CHECKIN_AFTER_MIN = 240;
const CHECKIN_WINDOW_MS = 10 * 60 * 1000;   // el código de llegada cambia cada 10 minutos
const DEMO_CHECKIN_ANYTIME = true;     // en la demo se puede registrar la llegada a cualquier hora
// Las de PRODUCTO.md (Modelo económico). Las elige el anfitrión al publicar un plan de pago.
const CANCEL_POLICIES = {
  flexible: { label:'Flexible', text:'reembolso completo hasta 24 h antes; después, sin reembolso.' },
  moderada: { label:'Moderada', text:'reembolso completo hasta 48 h antes, el 50 % entre 48 y 24 h, y sin reembolso en las últimas 24 h.' },
  estricta: { label:'Estricta', text:'reembolso completo hasta 7 días antes; después, sin reembolso.' },
};
const QR_LIB = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';

const hoursTo = (p) => (p.when - Date.now()) / 3600000;
function fmtHour(d){ return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; }
function dayWord(p){ const h = hoursTo(p); const d = new Date(p.when), n = new Date(); const t = new Date(n); t.setDate(n.getDate() + 1);
  if (d.toDateString() === n.toDateString()) return 'Hoy'; if (d.toDateString() === t.toDateString()) return 'Mañana'; return h < 0 ? 'Ya' : fmtWhen(d); }
function isHost(p){ return p.hostId === 'me'; }
function canRunPlan(p){ return isHost(p) || canManage(p); }   // anfitrión, o admin del grupo organizador
function isFull(p){ return p.joinType !== 'libre' && (p.joined || 0) >= p.groupMax; }
function waitPos(p){ return (p.waitlist || []).indexOf('me') + 1; }
function isCancelled(p){ return p.status === 'cancelado'; }

/* ---------- filtro por fecha en Descubrir ---------- */
const WHEN_OPTS = [['todo','Cuándo'],['hoy','Hoy'],['manana','Mañana'],['finde','Finde'],['semana','7 días']];
function matchesWhen(p, w){
  if (!w || w === 'todo') return true;
  const d = new Date(p.when), now = new Date();
  if (d < now) return false;
  const day = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((day(d) - day(now)) / 86400000);
  if (w === 'hoy') return diff === 0;
  if (w === 'manana') return diff === 1;
  if (w === 'semana') return diff <= 7;
  if (w === 'finde'){   // el próximo sábado y domingo (o este, si ya es fin de semana)
    const dow = now.getDay(), toSat = dow === 0 ? -1 : 6 - dow;
    return diff >= Math.max(0, toSat) && diff <= toSat + 1 && [0, 6].includes(d.getDay());
  }
  return true;
}

/* ---------- foto real al crear un plan ---------- */
// Reduce la foto (lado mayor 1200 px, JPEG) para que quepa en el navegador.
function resizeImage(file, max, quality){
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = reject;
    r.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', quality));
      };
      img.src = r.result;
    };
    r.readAsDataURL(file);
  });
}
function pickPlanPhoto(input){
  const f = input && input.files && input.files[0]; if (!f) return;
  if (!/^image\//.test(f.type)){ toast('Elige una imagen'); return; }
  resizeImage(f, 1200, 0.8).then(url => {
    state.draft.photo = url;
    const pv = document.getElementById('photo-prev');
    if (pv) pv.innerHTML = `<img src="${url}" alt="Portada del plan"><button class="sv-x pv-x" onclick="clearPlanPhoto()" aria-label="Quitar foto">${ico('close')}</button>`;
  }, () => toast('No se ha podido leer la foto'));
}
function clearPlanPhoto(){ state.draft.photo = null; const pv = document.getElementById('photo-prev'); if (pv) pv.innerHTML = ''; }

/* ---------- apuntarse, lista de espera y cancelar ---------- */
function joinPlan(id){
  const p = getPlan(id); if (!p || isCancelled(p)) return;
  if (!requireVerified('Verifica tu identidad para apuntarte', () => joinPlan(id))) return;
  const pay = p.paid && myPayment(id);
  if (isFull(p) && !(pay && pay.status === 'pendiente')) return joinWaitlist(id);
  if (p.paid && !(pay && pay.status === 'retenido')) return openCheckout(id);   // de pago: primero se paga (pagos.js)
  completeJoin(id, 'Apuntado · te esperamos');
}
function completeJoin(id, msg){
  const p = getPlan(id); if (!p) return;
  if (!state.joined.has(id)){ state.joined.add(id); p.joined = (p.joined || 0) + 1; }
  ensurePlanChat(id);
  checkReminders();   // si es en las próximas 24 h, el recordatorio llega ya
  saveState();
  toast(msg);
  renderDetail(id);
}
/* ---------- recordatorios de tus planes ----------
   Para los planes a los que vas y los que organizas: el día antes (con la reconfirmación),
   2 h antes (lugar y QR de llegada) y 15 min antes. Cada uno se envía una vez y, si te
   apuntas tarde, solo el más cercano. Si cambian la fecha o la hora, se vuelven a programar.
   En la app real los programa el servidor (docs/bucle-de-planes.md, Recordatorios); aquí se
   comprueban al abrir la app, al navegar y cada minuto. */
const REMINDERS = [['dia', 24 * 60, 'El día antes', 'Con la reconfirmación'], ['horas', 120, '2 horas antes', 'Lugar y QR de llegada'], ['empieza', 15, 'Al empezar', '15 minutos antes']];
function reminderPrefs(){ return Object.assign({ dia:true, horas:true, empieza:true }, ME.reminderPrefs || {}); }
function toggleReminderPref(k){ ME.reminderPrefs = Object.assign(reminderPrefs(), { [k]: !reminderPrefs()[k] }); saveState(); openNotifPrefs(); }
const inLabel = (ms) => { const m = Math.max(1, Math.round(ms / 60000)); return m < 60 ? `${m} min` : `${Math.round(m / 60)} h`; };
function reminderText(p, slot, msLeft){
  const host = isHost(p), hour = fmtHour(new Date(p.when)), left = inLabel(msLeft || new Date(p.when) - Date.now());
  if (slot === 'dia') return host ? `Tu plan es ${dayWord(p).toLowerCase()} a las ${hour}: ${p.title}. Hay ${p.joined || 0} personas apuntadas.`
    : `${dayWord(p)} a las ${hour}: ${p.title}. ${state.reconfirmed.has(p.id) ? 'Ya has reconfirmado: te esperan.' : 'Reconfirma que vas para no perder tu plaza.'}`;
  if (slot === 'horas') return host ? `En ${left} empieza ${p.title}. Ten a mano el QR de llegada.`
    : `En ${left}: ${p.title} · ${p.secret ? 'el lugar ya está desvelado en la ficha' : agWhere(p)}. Al llegar, registra tu llegada con el QR del anfitrión.`;
  return host ? `Empieza en ${left}: ${p.title}. Abre el QR de llegada.` : `Empieza en ${left}: ${p.title}. Si al final no puedes ir, cancela y deja tu plaza a otra persona.`;
}
function sendReminder(p, slot, msLeft){
  ME.remindersSent = Object.assign({}, ME.remindersSent, { [p.id]: Object.assign({}, (ME.remindersSent || {})[p.id], { [slot]: true }) });
  return reminderPrefs()[slot] ? notify('recordatorio', reminderText(p, slot, msLeft), { planId: p.id }) : null;
}
function checkReminders(){
  if (typeof ME === 'undefined' || !ME.name) return;
  const now = Date.now();
  PLANS.forEach(p => {
    if (isCancelled(p) || state.attended.has(p.id) || !(state.joined.has(p.id) || isHost(p))) return;
    const start = new Date(p.when).getTime(), sent = (ME.remindersSent || {})[p.id] || {};
    if (start <= now) return;
    const due = REMINDERS.filter(([k, min]) => now >= start - min * 60000 && !sent[k]);
    if (!due.length) return;
    due.slice(0, -1).forEach(([k]) => { ME.remindersSent = Object.assign({}, ME.remindersSent, { [p.id]: Object.assign({}, (ME.remindersSent || {})[p.id], { [k]: true }) }); });
    sendReminder(p, due[due.length - 1][0]);   // solo el más cercano: los anteriores ya no tienen sentido
  });
}
// Demo: llega el recordatorio de 2 h antes sin esperar.
function demoReminder(id){ const p = getPlan(id); if (!p) return; sendReminder(p, 'horas', 2 * 3600000); toast('Te llega el recordatorio de 2 h antes'); }
function joinWaitlist(id){
  const p = getPlan(id); if (!p) return;
  if (!requireVerified('Verifica tu identidad para apuntarte a la lista de espera', () => joinWaitlist(id))) return;
  if (!p.waitlist.includes('me')) p.waitlist.push('me');
  saveState();
  toast(`Estás en la lista de espera (puesto ${waitPos(p)}). Te avisamos si queda una plaza.`);
  renderDetail(id);
}
function leaveWaitlist(id){ const p = getPlan(id); if (!p) return; p.waitlist = p.waitlist.filter(x => x !== 'me'); saveState(); toast('Has salido de la lista de espera'); renderDetail(id); }
// Alguien libera una plaza: la recibe la primera persona de la lista.
function releaseSpot(id){
  const p = getPlan(id); if (!p) return;
  const next = p.waitlist.shift();
  if (!next){ return; }
  if (next === 'me' && p.paid){   // de pago: la plaza se guarda 24 h para que pagues
    const x = newPayment(p, 'me', 'pendiente'); x.dueAt = Date.now() + PAY_WINDOW_HOURS * 3600000;
    notify('plaza', `¡Hay plaza para ti en ${p.title}! Paga en las próximas ${PAY_WINDOW_HOURS} h para confirmarla.`, { planId: id });
  } else if (next === 'me'){
    state.joined.add(id); ensurePlanChat(id);
    notify('plaza', `¡Tienes plaza en ${p.title}! Ya estás apuntado.`, { planId: id });
  } else p.joined = (p.joined || 0) + 1;
}
// Demo: simula que alguien cancela, para ver avanzar la lista de espera.
function demoSomeoneCancels(id){
  const p = getPlan(id); if (!p) return;
  p.joined = Math.max(0, (p.joined || 0) - 1);
  releaseSpot(id); saveState(); renderDetail(id);
  if (!state.joined.has(id)) toast(`Alguien ha cancelado. Ahora eres el puesto ${waitPos(p)}`);
}
function refundFor(p){
  if (!p.paid) return null;
  const h = hoursTo(p), pol = p.cancelPolicy || 'flexible';
  const pct = pol === 'flexible' ? (h >= 24 ? 100 : 0) : pol === 'moderada' ? (h >= 48 ? 100 : (h >= 24 ? 50 : 0)) : (h >= 168 ? 100 : 0);
  return { pct, amount: Math.round(p.price * pct) / 100, policy: CANCEL_POLICIES[pol] };
}
function openCancel(id){
  const p = getPlan(id); if (!p) return;
  const late = hoursTo(p) < LATE_CANCEL_HOURS, rf = refundFor(p);
  showOverlay('ov-sheet', `<div class="sheet-bg" onclick="closeOverlay()"></div><div class="sheet" role="dialog" aria-label="Cancelar asistencia">
    <div class="sheet-h"><span>Cancelar asistencia</span><button class="sv-x" onclick="closeOverlay()" aria-label="Cerrar">${ico('close')}</button></div>
    <div class="sheet-list">
      <p class="hint"><b>${escapeHtml(p.title)}</b> · ${fmtWhen(new Date(p.when))}</p>
      ${rf && (myPayment(id) || {}).status === 'retenido' ? `<div class="vg-note">${ico('euro')}<p>Política ${rf.policy.label.toLowerCase()}: ${rf.policy.text}<br><b>${rf.pct ? `Si cancelas ahora te devolvemos ${money(rf.amount)} (${rf.pct} %).` : 'Si cancelas ahora no hay reembolso.'}</b></p></div>` : ''}
      ${late ? `<div class="vg-note">${ico('clock')}<p>Falta menos de un día: cuenta como <b>cancelación tardía</b> en tu fiabilidad. No es lo mismo que no presentarse, pero se ve.</p></div>`
        : `<p class="hint">Avisar con tiempo no afecta a tu fiabilidad.</p>`}
      ${p.waitlist.length ? `<p class="hint">Tu plaza pasará a la primera persona de la lista de espera.</p>` : ''}
      <button class="btn-primary danger-btn" onclick="confirmCancel('${id}')">Cancelar mi asistencia</button>
      <button class="btn-ghost" onclick="closeOverlay()">Mantener la plaza</button>
    </div></div>`);
}
function confirmCancel(id){
  const p = getPlan(id); if (!p || !state.joined.has(id)) { closeOverlay(); return; }
  const late = hoursTo(p) < LATE_CANCEL_HOURS, rf = refundFor(p);
  state.joined.delete(id); state.reconfirmed.delete(id);
  p.joined = Math.max(0, (p.joined || 0) - 1);
  if (late){ ME.stats = ME.stats || {}; ME.stats.lateCancels = (ME.stats.lateCancels || 0) + 1; }
  leavePlanChat(id);
  const paid = rf && refundMyPayment(p, rf);
  releaseSpot(id);
  saveState(); closeOverlay();
  toast('Asistencia cancelada' + (paid && rf.pct ? ` · te devolvemos ${money(rf.amount)}` : '') + (late ? ' · cancelación tardía' : ''));
  renderDetail(id);
}

/* ---------- reconfirmación del día ---------- */
function needsReconfirm(p){
  const h = hoursTo(p);
  return state.joined.has(p.id) && !state.attended.has(p.id) && !state.reconfirmed.has(p.id) && h <= RECONFIRM_HOURS && h > -1 && !isCancelled(p);
}
function reconfirm(id){
  state.reconfirmed.add(id); saveState();
  toast('Reconfirmado: el grupo sabe que vas'); renderDetail(id);
}

/* ---------- llegada con el QR del anfitrión ----------
   El código es el mismo en cualquier móvil (depende del plan y de la franja de 10 min),
   así que se puede probar con dos móviles sin servidor. En la app real lo firma el
   servidor con una clave secreta y comprueba también la hora y, si se quiere, la ubicación. */
function checkinCode(planId, t){
  const w = Math.floor((t || Date.now()) / CHECKIN_WINDOW_MS), s = `${planId}:${w}:planes-llegada`;
  let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return String((h >>> 0) % 10000).padStart(4, '0');
}
function validCheckinCode(planId, code){ const now = Date.now(); return [now, now - CHECKIN_WINDOW_MS].some(t => checkinCode(planId, t) === String(code || '').trim()); }
function checkinOpen(p){ if (DEMO_CHECKIN_ANYTIME) return true; const m = (Date.now() - p.when) / 60000; return m >= -CHECKIN_BEFORE_MIN && m <= CHECKIN_AFTER_MIN; }
function canScan(){ return typeof window !== 'undefined' && 'BarcodeDetector' in window && typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia; }
function openCheckin(id){
  const p = getPlan(id); if (!p) return;
  if (!requireVerified('Verifica tu identidad para registrar tu llegada', () => openCheckin(id))) return;
  if (!checkinOpen(p)){ toast('La llegada se registra desde 1 h antes hasta 4 h después del inicio'); return; }
  showOverlay('ov-sheet', `<div class="sheet-bg" onclick="closeOverlay()"></div><div class="sheet" role="dialog" aria-label="Registrar mi llegada">
    <div class="sheet-h"><span>Registrar mi llegada</span><button class="sv-x" onclick="closeOverlay()" aria-label="Cerrar">${ico('close')}</button></div>
    <div class="sheet-list ck">
      <p class="hint">Pide al anfitrión que te enseñe el QR de llegada del plan y escanéalo, o escribe el código de 4 cifras que aparece debajo.</p>
      <div id="scan-box" class="scan-box">${canScan() ? `<button class="btn-primary" onclick="startScan('${id}')">${ico('image')} Escanear QR</button>` : `<p class="hint">Este navegador no puede escanear: escribe el código.</p>`}</div>
      <div class="chat-in"><input id="ck-code" inputmode="numeric" maxlength="4" placeholder="Código del anfitrión" aria-label="Código de llegada" onkeydown="if(event.key==='Enter')submitCheckin('${id}')"><button class="ph-btn primary" onclick="submitCheckin('${id}')">Confirmar</button></div>
      <p class="hint ck-err" id="ck-err"></p>
      <button class="link-btn ck-demo" onclick="document.getElementById('ck-demo').hidden=false">¿Pruebas con un solo móvil? Ver el código del anfitrión</button>
      <p class="hint" id="ck-demo" hidden>Demo: el código ahora es <b>${checkinCode(id)}</b>. Con dos móviles, abre en el otro el plan como anfitrión y escanea su QR.</p>
      <p class="hint">${{ todos:'Te verán los demás que estén en el plan, en el plan y en el mapa.', amigos:'Solo te verán tus amigos que estén en el plan.', nadie:'Contarás en el total, sin que nadie vea que estás.' }[myPresence(id).vis]} Lo puedes cambiar en la ficha.</p>
    </div></div>`);
}
function submitCheckin(id){
  const code = val('ck-code');
  if (!validCheckinCode(id, code)){ const e = document.getElementById('ck-err'); if (e) e.textContent = 'Ese código no es el de este plan o ha caducado. Pídeselo de nuevo al anfitrión.'; toast('Código no válido'); return; }
  stopScan(); closeOverlay(); registerArrival(id);
}
function startScan(id){
  if (!canScan()) return;
  const box = document.getElementById('scan-box'); if (!box) return;
  box.innerHTML = `<video id="scan-v" class="scan-v" playsinline muted></video><p class="hint">Apunta al QR del anfitrión.</p>`;
  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then(stream => {
    state.scanStream = stream;
    const v = document.getElementById('scan-v'); if (!v){ stopScan(); return; }
    v.srcObject = stream; v.play();
    const det = new window.BarcodeDetector({ formats: ['qr_code'] });
    const loop = () => {
      if (!state.scanStream) return;
      det.detect(v).then(codes => {
        const m = codes.map(c => /^planes:llegada:([^:]+):(\d{4})$/.exec(c.rawValue)).find(Boolean);
        if (m && m[1] === id){ const i = document.getElementById('ck-code'); if (i) i.value = m[2]; submitCheckin(id); }
        else requestAnimationFrame(loop);
      }, () => requestAnimationFrame(loop));
    };
    loop();
  }, () => { box.innerHTML = '<p class="hint">Sin permiso para la cámara: escribe el código.</p>'; });
}
function stopScan(){ if (state.scanStream){ try { state.scanStream.getTracks().forEach(t => t.stop()); } catch (e) {} state.scanStream = null; } }
function loadQrLib(){
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.QRCode) return resolve(window.QRCode);
    if (!document.createElement || !document.head) return reject(new Error('sin DOM'));
    const sc = document.createElement('script'); sc.src = QR_LIB; sc.async = true;
    sc.onload = () => window.QRCode ? resolve(window.QRCode) : reject(new Error('sin QRCode'));
    sc.onerror = reject; document.head.appendChild(sc);
  });
}
// Pantalla del anfitrión: QR de llegada que se renueva cada 10 minutos.
function openHostQr(id){
  const p = getPlan(id); if (!p) return;
  const draw = () => {
    const code = checkinCode(id), box = document.getElementById('qr-box'), num = document.getElementById('qr-code');
    if (num) num.textContent = code;
    if (!box) return;
    loadQrLib().then(Q => { box.innerHTML = ''; new Q(box, { text: `planes:llegada:${id}:${code}`, width: 220, height: 220, colorDark: '#000000', colorLight: '#ffffff' }); },
      () => { box.innerHTML = `<p class="hint">Sin conexión para dibujar el QR: enseña el código.</p>`; });
  };
  showOverlay('ov-sheet', `<div class="sheet-bg" onclick="closeOverlay()"></div><div class="sheet" role="dialog" aria-label="QR de llegada">
    <div class="sheet-h"><span>QR de llegada</span><button class="sv-x" onclick="closeOverlay()" aria-label="Cerrar">${ico('close')}</button></div>
    <div class="sheet-list qr">
      <p class="hint">${escapeHtml(p.title)} · enséñalo a quien llegue. Se renueva cada 10 minutos para que no se pueda compartir.</p>
      <div id="qr-box" class="qr-box" aria-label="Código QR"></div>
      <div class="qr-code"><span>Código</span><b id="qr-code">${checkinCode(id)}</b></div>
      <p class="hint">${ico('geo')} ${p.attended || 0} llegadas registradas · ${p.joined || 0} apuntados</p>
      <button class="btn-ghost" onclick="openManualArrivals('${id}')">${ico('users')} Marcar llegadas a mano</button>
    </div></div>`);
  draw();
  clearInterval(overlayTimer); overlayTimer = setInterval(draw, 30000);
}
// Alternativa al QR: el anfitrión marca a mano a quien ha llegado.
function openManualArrivals(id){
  const p = getPlan(id); if (!p) return;
  p.manualIn = p.manualIn || [];
  const people = USERS.filter(u => u.id !== 'me' && !u.managedBy).slice(0, Math.max(1, Math.min(6, p.joined || 0)));
  showOverlay('ov-sheet', `<div class="sheet-bg" onclick="closeOverlay()"></div><div class="sheet" role="dialog" aria-label="Llegadas">
    <div class="sheet-h"><span>Llegadas</span><button class="sv-x" onclick="openHostQr('${id}')" aria-label="Volver">${ico('chevL')}</button></div>
    <div class="sheet-list">
      <p class="hint">Para quien no pueda escanear. Queda registrado que lo has marcado tú.</p>
      ${people.map(u => { const on = p.manualIn.includes(u.id);
        return `<div class="au-person"><span class="avatar conv-av">${escapeHtml(u.initials || initials(u.name))}</span><span class="conv-main"><b>${escapeHtml(u.name)}</b><span>${on ? 'Ha llegado' : 'Apuntado'}</span></span>
          <button class="ph-btn ${on ? '' : 'primary'} au-fbtn" onclick="toggleManualArrival('${id}','${u.id}')">${on ? 'Deshacer' : 'Ha llegado'}</button></div>`; }).join('') || '<p class="hint">Aún no hay nadie apuntado.</p>'}
    </div></div>`);
}
function toggleManualArrival(id, uid){
  const p = getPlan(id); if (!p) return; p.manualIn = p.manualIn || [];
  const i = p.manualIn.indexOf(uid);
  if (i >= 0){ p.manualIn.splice(i, 1); p.attended = Math.max(0, (p.attended || 0) - 1); }
  else { p.manualIn.push(uid); p.attended = (p.attended || 0) + 1; }
  saveState(); openManualArrivals(id);
}

/* ---------- índice de fiabilidad ----------
   Se muestra agregado: cuántas veces no se presentó, nunca a qué planes. */
function reliability(){
  const st = ME.stats || {};
  const att = new Set([...(ME.attendedPlanIds || []), ...state.attended]).size, ns = st.noShows || 0;
  return { pct: att + ns ? Math.round(att / (att + ns) * 100) : 100, attended: att, noShows: ns, late: st.lateCancels || 0 };
}
// Demo: simula que el plan ya ha pasado. Sin llegada registrada, cuenta como no presentado.
function demoPlanEnded(id){
  const p = getPlan(id); if (!p) return;
  if (p.paid){ releasePlanPayments(id); saveState(); }   // celebrado: el dinero va camino del anfitrión
  if (state.attended.has(id)){ notify('fiabilidad', `¿Qué tal ${p.title}? Valóralo para ayudar a otros a decidir.`, { planId: id, action: `openRatingSheet('${id}')` }); toast('Asististe: suma a tu fiabilidad'); return; }
  if (!state.joined.has(id)) return;
  ME.stats = ME.stats || {}; ME.stats.noShows = (ME.stats.noShows || 0) + 1;
  state.joined.delete(id); state.reconfirmed.delete(id);
  notify('fiabilidad', `No registraste tu llegada a ${p.title}: cuenta como no presentado. Si fuiste, pide al anfitrión que lo corrija.`, { planId: id });
  saveState(); renderDetail(id);
}

/* ---------- el anfitrión edita o cancela su plan ---------- */
function renderEditPlan(id){
  const p = getPlan(id), view = document.getElementById('view-page');
  if (!p || !isHost(p)){ view.innerHTML = pageHead('Editar plan') + '<div class="empty-tab"><p>Solo el anfitrión puede editar el plan.</p></div>'; return; }
  const d = new Date(p.when), local = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  view.innerHTML = pageHead('Editar plan') + `<div class="page-body form">
    <div class="field"><label for="f-etitle">Título ${counter('f-etitle','planTitle',p.title)}</label><input ${lim('f-etitle','planTitle')} value="${escapeHtml(p.title)}" /></div>
    <div class="field"><label for="f-edesc">Descripción ${counter('f-edesc','planDesc',p.summary)}</label><textarea ${lim('f-edesc','planDesc')} rows="3">${escapeHtml(p.summary || '')}</textarea></div>
    <div class="field"><label for="f-edate">Fecha y hora</label><input id="f-edate" type="datetime-local" value="${local}" /></div>
    <div class="field"><label for="f-eplace">Lugar</label><select id="f-eplace">${PLACES.map(pl => `<option value="${pl.id}" ${pl.id === p.placeId ? 'selected' : ''}>${escapeHtml(pl.name)} · ${pl.city}</option>`).join('')}</select></div>
    <div class="field"><label for="f-enote">Explica el cambio (opcional) ${counter('f-enote','planUpdate','')}</label><textarea ${lim('f-enote','planUpdate')} rows="2" placeholder="Ej. Lo retrasamos media hora por la lluvia"></textarea></div>
    <p class="hint">Si cambias la fecha, la hora o el lugar, queda en las Novedades del plan y avisamos a todas las personas apuntadas.</p>
    <div class="form-actions"><button class="btn-primary" onclick="saveEditPlan('${id}')">${ico('check')} Guardar cambios</button></div>
  </div>`;
}
function saveEditPlan(id){
  const p = getPlan(id); if (!p) return;
  const title = clip(val('f-etitle'), 'planTitle') || p.title, summary = clip(val('f-edesc'), 'planDesc') || p.summary;
  const raw = val('f-edate'), when = raw ? new Date(raw) : p.when, placeId = val('f-eplace') || p.placeId;
  const note = clip(val('f-enote'), 'planUpdate'), why = note ? ' ' + note : '';
  const old = { when: new Date(p.when), placeId: p.placeId, title: p.title, summary: p.summary };
  Object.assign(p, { title, summary, when, placeId });
  // Cada cambio queda en las Novedades del plan; los de fecha, hora y lugar avisan a los apuntados.
  const changes = [];
  if (when.getTime() !== old.when.getTime()) changes.push(addPlanUpdate(p, 'fecha', `Nueva fecha: ${whenLong(when)} (antes: ${whenLong(old.when)}).${why}`));
  if (placeId !== old.placeId){ const a = getPlace(placeId), b = getPlace(old.placeId); changes.push(addPlanUpdate(p, 'lugar', `Nuevo lugar: ${a ? a.name : 'Madrid'} (antes: ${b ? b.name : 'Madrid'}).${changes.length ? '' : why}`)); }
  if (!changes.length && (title !== old.title || summary !== old.summary)) addPlanUpdate(p, 'info', `Ha actualizado ${title !== old.title ? 'el título' : 'la descripción'}.${why}`, { notify:false });
  else if (!changes.length && note) addPlanUpdate(p, 'aviso', note);
  if (changes.length) state.reconfirmed = new Set([...state.reconfirmed].filter(x => x !== id));   // con un cambio importante, se vuelve a reconfirmar
  saveState();
  toast(changes.length ? `Guardado · avisamos a ${p.joined || 0} personas del cambio` : 'Guardado');
  go('plan/' + id);
}
function openCancelPlan(id){
  const p = getPlan(id); if (!p) return;
  showOverlay('ov-sheet', `<div class="sheet-bg" onclick="closeOverlay()"></div><div class="sheet" role="dialog" aria-label="Cancelar el plan">
    <div class="sheet-h"><span>Cancelar el plan</span><button class="sv-x" onclick="closeOverlay()" aria-label="Cerrar">${ico('close')}</button></div>
    <div class="sheet-list">
      <p class="hint">Avisaremos a las ${p.joined || 0} personas apuntadas${p.paid ? ' y les devolveremos el 100 % de lo pagado' : ''}. Cancelar planes a menudo afecta a tu fiabilidad como anfitrión.</p>
      <button class="btn-primary danger-btn" onclick="confirmCancelPlan('${id}')">Cancelar el plan</button>
      <button class="btn-ghost" onclick="closeOverlay()">Volver</button>
    </div></div>`);
}
function confirmCancelPlan(id){
  const p = getPlan(id); if (!p) return;
  p.status = 'cancelado'; addPlanUpdate(p, 'cancelado', `El anfitrión ha cancelado el plan.${p.paid ? ' Te devolvemos el 100 % de lo pagado.' : ''}`);
  if (p.paid) refundAllForPlan(p, 'El anfitrión canceló el plan: reembolso completo');
  saveState(); closeOverlay(); toast(`Plan cancelado · avisamos a ${p.joined || 0} personas`); renderDetail(id);
}

/* ---------- novedades del plan ----------
   Cada plan lleva su registro de cambios y avisos (p.updates, de la más reciente a la más
   antigua). Todo lo que se publica avisa a quien va al plan y queda también en su chat.
   Los cambios de fecha, hora o lugar y la cancelación ("importantes") avisan siempre, aunque
   se hayan desactivado las novedades en Ajustes, y también a quien espera plaza o respuesta.
   En la app real: docs/novedades.md. */
const UPDATE_TYPES = {   // icono, título, importante
  fecha:['clock','Cambio de fecha u hora',true], lugar:['pin','Cambio de lugar',true], cancelado:['close','Plan cancelado',true], desvelo:['lock','Lugar desvelado',true],
  aviso:['bell','Aviso',false], plazas:['users','Plazas',false], info:['doc','Detalles actualizados',false],
};
const planUpdates = (p) => (p && p.updates) || [];
function whenLong(d){ d = new Date(d); return `${dayTitle(d)}, a las ${hhmm(d)}`; }
// ¿Me llega? Si voy; si es importante, también si estoy en lista de espera, con solicitud o con plaza por confirmar.
function updateReachesMe(p, important){
  if (state.joined.has(p.id)) return true;
  return important && ((p.waitlist || []).includes('me') || state.requested.has(p.id) || (p.ideaInvites || []).some(v => v.userId === 'me' && v.status === 'pendiente'));
}
function addPlanUpdate(p, type, text, opts){
  opts = opts || {};
  const u = { id: newId('up'), type, text, at: Date.now(), by: opts.by || (isHost(p) ? 'me' : 'host') };
  p.updates = [u].concat(planUpdates(p));
  if (type === 'fecha' && ME.remindersSent) delete ME.remindersSent[p.id];   // nueva hora: los recordatorios se vuelven a programar
  if (opts.notify === false) return u;
  const [, label, important] = UPDATE_TYPES[type] || [];
  if (state.joined.has(p.id) || isHost(p)) ensurePlanChat(p.id);   // si vas o lo organizas, el chat del plan existe
  planChatSystem(p.id, `${label}: ${text}`);
  if (u.by !== 'me' && updateReachesMe(p, important)) notify('cambio', `${p.title} · ${label.toLowerCase()}: ${text}`, { planId: p.id, force: important });
  return u;
}
const updateBy = (p, u) => u.by === 'me' ? 'Tú' : (u.by === 'equipo' ? 'Equipo de planes' : ((p.host || {}).name || 'El anfitrión'));
// Lo que no habías visto: se calcula al entrar en la ficha y se marca como visto.
function visitUpdates(p){
  if (state.updVisit === p.id) return;
  state.updVisit = p.id; state.updSince = (ME.seenUpdates || {})[p.id] || 0;
  ME.seenUpdates = Object.assign({}, ME.seenUpdates, { [p.id]: Date.now() }); saveState();
}
const unseenUpdates = (p) => planUpdates(p).filter(u => u.at > (state.updSince || 0) && u.by !== 'me');
function updatesBlock(p){
  const list = planUpdates(p), host = isHost(p) && !isCancelled(p), nNew = unseenUpdates(p).length;
  if (!list.length && !host) return '';
  const shown = state.updAll === p.id ? list : list.slice(0, 3);
  const row = (u) => { const [icon, label, imp] = UPDATE_TYPES[u.type] || ['bell','Novedad',false], isNew = u.at > (state.updSince || 0) && u.by !== 'me';
    return `<div class="upd ${imp ? 'imp' : ''}"><span class="upd-ic">${ico(icon)}</span><div class="upd-b"><b>${label}${isNew ? ' <em class="upd-new">Nuevo</em>' : ''}</b>
      <p>${escapeHtml(u.text)}</p><span>${escapeHtml(updateBy(p, u))} · ${dayLabel(u.at)}</span></div></div>`; };
  return `<div class="block" id="novedades"><h4>Novedades${nNew ? ` <span class="upd-n">${nNew} sin ver</span>` : ''}</h4>
    ${list.length ? `<div class="upd-list">${shown.map(row).join('')}</div>` : '<p class="hint">Aún no hay novedades. Lo que cambies o anuncies saldrá aquí y avisará a quien va.</p>'}
    ${list.length > shown.length ? `<button class="link-btn" onclick="state.updAll='${p.id}';renderDetail('${p.id}')">Ver todas (${list.length})</button>` : ''}
    ${host ? `<button class="btn-ghost" onclick="openPlanUpdate('${p.id}')">${ico('bell')} Publicar una novedad</button>` : ''}
    ${!host && state.joined.has(p.id) && !isCancelled(p) ? `<div class="pl-actions"><button class="link-btn dim" onclick="demoHostUpdate('${p.id}')">Demo: el anfitrión cambia la hora</button></div>` : ''}
  </div>`;
}
function openPlanUpdate(id){
  const p = getPlan(id); if (!p) return;
  showOverlay('ov-sheet', `<div class="sheet-bg" onclick="closeOverlay()"></div><div class="sheet" role="dialog" aria-label="Publicar una novedad">
    <div class="sheet-h"><span>Publicar una novedad</span><button class="sv-x" onclick="closeOverlay()" aria-label="Cerrar">${ico('close')}</button></div>
    <div class="sheet-list form">
      <div class="field"><label for="f-upd">Qué hay de nuevo ${counter('f-upd','planUpdate','')}</label><textarea ${lim('f-upd','planUpdate')} rows="3" placeholder="Ej. Traed linterna: la vuelta es de noche"></textarea></div>
      <p class="hint">Sale en Novedades y en el chat del plan${p.joinType === 'libre' ? '. Es un plan libre, sin apuntados: lo verá quien abra el plan' : `, y avisamos a las ${p.joined || 0} personas apuntadas`}. Para cambiar la fecha, la hora o el lugar, usa Editar el plan: así queda el antes y el después.</p>
      <button class="btn-primary" onclick="publishPlanUpdate('${id}')">${ico('send')} ${p.joinType === 'libre' ? 'Publicar' : 'Publicar y avisar'}</button>
    </div></div>`);
}
function publishPlanUpdate(id){
  const p = getPlan(id), text = clip(val('f-upd'), 'planUpdate'); if (!p) return;
  if (!text){ toast('Escribe la novedad'); return; }
  guardText(text, { kind:'novedad', onEdit: () => openPlanUpdate(id) }, (flag) => {
    if (flag){ closeOverlay(); toast('No se ha publicado: parece ' + flag.label); return null; }
    addPlanUpdate(p, 'aviso', text); saveState(); closeOverlay(); state.updAll = null;
    toast(p.joinType === 'libre' ? 'Publicado en Novedades' : `Publicado · avisamos a ${p.joined || 0} personas`); renderDetail(id); return null;
  });
}
// Demo: el anfitrión de un plan al que vas lo retrasa media hora (te llega la notificación).
function demoHostUpdate(id){
  const p = getPlan(id); if (!p) return;
  const old = new Date(p.when), when = new Date(old.getTime() + 30 * 60000); p.when = when;
  addPlanUpdate(p, 'fecha', `Nueva fecha: ${whenLong(when)} (antes: ${whenLong(old)}). Lo retrasamos media hora.`, { by:'host' });
  state.reconfirmed = new Set([...state.reconfirmed].filter(x => x !== id));
  saveState(); toast('Te llega la notificación del cambio'); renderDetail(id);
}

/* ---------- chat del plan ---------- */
function planChat(id){ return CONVERSATIONS.find(c => c.type === 'plan' && c.planId === id); }
function ensurePlanChat(id){
  const p = getPlan(id); if (!p) return null;
  let c = planChat(id);
  if (!c){
    const host = USERS.find(u => u.name === (p.host || {}).name && u.id !== 'me');
    c = { id:'cp' + id, type:'plan', planId:id, members: host ? [host.id] : [], unread:0, messages:[] };
    CONVERSATIONS.unshift(c);
  }
  if (!c.members.includes('me')){ c.members.push('me'); c.messages.push({ from:'system', text:'Te has unido al plan. Coordinaos aquí sin dar vuestro teléfono.', min:0 }); }
  return c;
}
function leavePlanChat(id){ const c = planChat(id); if (c && c.members.includes('me')){ c.members = c.members.filter(m => m !== 'me'); c.messages.push({ from:'system', text:`${ME.name || 'Alguien'} ha dejado el plan.`, min:0 }); } }
function planChatSystem(id, text){ const c = planChat(id); if (c) c.messages.push({ from:'system', text, min:0 }); }

/* ---------- notificaciones ---------- */
const NOTIF_TYPES = {
  recordatorio: ['clock','Recordatorios','Antes de tus planes y para reconfirmar'],
  solicitud:    ['users','Solicitudes','Si te aceptan, o si alguien quiere ir a tu plan'],
  mensaje:      ['chat','Mensajes','Chats y chats de tus planes'],
  cambio:       ['alert','Novedades de tus planes','Avisos del anfitrión (los cambios de fecha, hora o lugar y las cancelaciones llegan siempre)'],
  plaza:        ['ticket','Lista de espera','Cuando quede una plaza para ti'],
  fiabilidad:   ['check','Después del plan','Llegadas, no presentados y valoraciones'],
  seguidor:     ['user','Seguidores','Solicitudes para seguirte y respuestas a las tuyas'],
  mencion:      ['at','Menciones','Cuando te mencionan o te etiquetan'],
  pago:         ['card','Pagos','Pagos, reembolsos, recibos y cobros'],
  aqui:         ['pin','En el plan','Quién más está en tu plan y te saluda'],
  chispa:       ['spark','Chispas','Quién se anima a tus chispas y si se hacen'],
};
function notifPrefs(){ return Object.assign({ recordatorio:true, solicitud:true, mensaje:true, cambio:true, plaza:true, fiabilidad:true, seguidor:true, mencion:true, pago:true, aqui:true, chispa:true }, ME.notifPrefs || {}); }
// "seguridad" (SOS, decisiones de moderación, resultado de tus reportes) no se puede desactivar.
function notify(type, text, ref){
  if (type !== 'seguridad' && !(ref && ref.force) && !notifPrefs()[type]) return null;   // force: cambios de fecha, hora o lugar y cancelaciones
  const n = Object.assign({ id:'n' + Date.now() + Math.random().toString(36).slice(2, 5), type, text, at: Date.now(), read:false }, ref || {});
  NOTIFICATIONS.unshift(n);
  if (NOTIFICATIONS.length > 60) NOTIFICATIONS.length = 60;
  saveState(); updateNotifBadge(); systemNotify(text);
  return n;
}
function notifAge(n){ return n.at ? Math.max(0, Math.floor((Date.now() - n.at) / 60000)) : (n.min || 0); }
function updateNotifBadge(){
  const n = NOTIFICATIONS.filter(x => !x.read).length, b = document.getElementById('notif-badge'); if (!b) return;
  b.textContent = n > 9 ? '9+' : String(n); b.hidden = n === 0;
}
// Aviso del sistema (con la app abierta o instalada). Con la app cerrada hace falta push desde el servidor.
function systemNotify(body){
  try {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    const opts = { body, icon:'icon-192.png', badge:'icon-192.png' };
    if (navigator.serviceWorker && navigator.serviceWorker.ready) navigator.serviceWorker.ready.then(r => r.showNotification('planes', opts), () => new Notification('planes', opts));
    else new Notification('planes', opts);
  } catch (e) {}
}
function askNotifPermission(){
  if (typeof Notification === 'undefined'){ toast('Este navegador no permite avisos. Instala la app en el móvil.'); return; }
  Notification.requestPermission().then(r => { toast(r === 'granted' ? 'Avisos activados en este dispositivo' : 'Sin permiso para avisos'); renderNotifications(); });
}
function renderNotifications(){
  const view = document.getElementById('view-page');
  const perm = typeof Notification === 'undefined' ? 'no' : Notification.permission;
  const item = (n) => { const [icon] = NOTIF_TYPES[n.type] || [n.type === 'seguridad' ? 'shield' : 'bell'];
    return `<button class="notif ${n.read ? '' : 'unread'}" onclick="openNotif('${n.id}')"><span class="notif-ic">${ico(icon)}</span>
      <span class="notif-t">${escapeHtml(n.text)}<span>${minLabel(notifAge(n))}</span></span>${n.read ? '' : '<i class="conv-dot sm"></i>'}</button>`; };
  const fresh = NOTIFICATIONS.filter(n => !n.read), old = NOTIFICATIONS.filter(n => n.read);
  view.innerHTML = `<div class="page-bar"><button class="pb-back" onclick="history.back()" aria-label="Atrás">${ico('chevL')}</button>
      <span class="pb-title">Notificaciones</span><span class="pb-btns"><button class="pb-back" onclick="go('agenda')" aria-label="Agenda">${ico('calendar')}</button><button class="pb-back" onclick="openNotifPrefs()" aria-label="Preferencias">${ico('gear')}</button></span></div>
    <div class="page-body inbox">
      ${agendaEntry()}
      ${followRequestsHtml()}
      ${perm === 'default' ? `<button class="vg-inline" onclick="askNotifPermission()">${ico('bell')} Activa los avisos en este dispositivo para enterarte aunque no tengas la app abierta.</button>` : ''}
      ${fresh.length ? `<div class="notif-h"><span>Nuevas</span><button class="link-btn" onclick="markAllNotifs()">Marcar todo como leído</button></div>${fresh.map(item).join('')}` : ''}
      ${old.length ? `<div class="notif-h"><span>Anteriores</span></div>${old.map(item).join('')}` : ''}
      ${NOTIFICATIONS.length ? '' : `<div class="empty-tab"><span class="empty-ic">${ico('bell')}</span><p>No tienes notificaciones.</p></div>`}
    </div>`;
}
function openNotif(id){
  const n = NOTIFICATIONS.find(x => x.id === id); if (!n) return;
  n.read = true; saveState(); updateNotifBadge();
  if (n.action){ go(n.planId ? 'plan/' + n.planId : 'notificaciones'); setTimeout(() => { try { (new Function(n.action))(); } catch (e) {} }, 50); return; }
  if (n.route) return go(n.route);
  if (n.convId) return go('chat/' + n.convId);
  if (n.planId) return go('plan/' + n.planId);
  renderNotifications();
}
function markAllNotifs(){ NOTIFICATIONS.forEach(n => { n.read = true; }); saveState(); updateNotifBadge(); renderNotifications(); }
function openNotifPrefs(){
  const pr = notifPrefs();
  showOverlay('ov-sheet', `<div class="sheet-bg" onclick="closeOverlay()"></div><div class="sheet" role="dialog" aria-label="Preferencias de notificaciones">
    <div class="sheet-h"><span>Qué te avisamos</span><button class="sv-x" onclick="closeOverlay()" aria-label="Cerrar">${ico('close')}</button></div>
    <div class="sheet-list">${Object.entries(NOTIF_TYPES).map(([k, [icon, l, sub]]) => `<div class="opt-row" onclick="toggleNotifPref('${k}')"><span class="or-ic">${ico(icon)}</span><span class="or-l">${l}<span class="or-s">${sub}</span></span><span class="switch ${pr[k] ? 'on' : ''}"><span class="knob"></span></span></div>`).join('')}
      <div class="set-title" style="margin-top:12px">Recordatorios de tus planes</div>
      ${REMINDERS.map(([k, , l, sub]) => `<div class="opt-row ${pr.recordatorio ? '' : 'off'}" onclick="toggleReminderPref('${k}')"><span class="or-ic">${ico('clock')}</span><span class="or-l">${l}<span class="or-s">${sub}</span></span><span class="switch ${pr.recordatorio && reminderPrefs()[k] ? 'on' : ''}"><span class="knob"></span></span></div>`).join('')}
      <p class="hint">Los avisos de seguridad (SOS, decisiones de moderación y el resultado de tus reportes) y los cambios de fecha, hora o lugar de tus planes no se pueden desactivar.</p></div></div>`);
}
function toggleNotifPref(k){ ME.notifPrefs = Object.assign(notifPrefs(), { [k]: !notifPrefs()[k] }); saveState(); openNotifPrefs(); }

/* ---------- respuestas simuladas del "otro lado" ---------- */
// El anfitrión decide tu solicitud (en la demo, la acepta a los pocos segundos).
function simulateHostDecision(planId, decision){
  const p = getPlan(planId), r = REQUESTS.find(x => x.planId === planId && x.userId === 'me' && x.status === 'pendiente');
  if (!p || !r) return;
  r.status = decision || 'aceptada'; state.requested.delete(planId);
  if (r.status === 'aceptada' && p.paid){   // de pago: aceptado, falta pagar (24 h)
    const x = newPayment(p, 'me', 'pendiente'); x.dueAt = Date.now() + PAY_WINDOW_HOURS * 3600000;
    notify('solicitud', `Te han aceptado en ${p.title}. Paga ${money(p.price)} en las próximas ${PAY_WINDOW_HOURS} h para confirmar tu plaza.`, { planId });
  }
  else if (r.status === 'aceptada'){ state.joined.add(planId); p.joined = (p.joined || 0) + 1; ensurePlanChat(planId); notify('solicitud', `Te han aceptado en ${p.title}. Ya estás apuntado.`, { planId }); }
  else notify('solicitud', `No hay plaza para ti en ${p.title} esta vez.`, { planId });
  saveState();
  if (location.hash === '#/plan/' + planId) renderDetail(planId);
}
// Alguien pide ir a tu plan con aprobación.
function simulateIncomingRequest(planId){
  const p = getPlan(planId); if (!p || p.approval !== 'manual') return;
  const who = USERS.find(u => u.id === 'nora') || USERS[1];
  REQUESTS.push({ id:'r' + Date.now(), planId, userId: who.id, status:'pendiente', message:'¡Hola! Me encantaría ir. Es mi primera vez en un plan así.' });
  notify('solicitud', `${who.name} quiere ir a ${p.title}.`, { planId, route:'solicitudes/' + planId });
  saveState();
}

/* ---------- quién está en el plan: visibilidad, chinchetas y saludos ----------
   Al registrar tu llegada eliges quién te ve en el plan y en el mapa (todos los del plan,
   solo amigos o nadie) y si vas solo o en grupo. Los que estáis en el plan os veis como
   chinchetas en el punto del plan (nunca en la posición exacta de nadie), con enlace al
   perfil. Se puede enviar un mensaje o solo un saludo: una chincheta animada que dice
   "yo también estoy en este plan". Solo mientras dura el plan. Ver docs/bucle-de-planes.md. */
const PLAN_VIS = [['todos','Todos los del plan','globe'],['amigos','Amigos','heartO'],['nadie','Nadie','lock']];
const PLAN_MODE = [['solo','Voy solo','user'],['grupo','Voy en grupo','users'],['','No decirlo','close']];
const VIS_HINT = {
  todos: 'Te ven todos los que han registrado su llegada a este plan, en el plan y en el mapa, y pueden saludarte.',
  amigos: 'Solo te ven tus amigos (os seguís los dos) que estén en el plan.',
  nadie: 'No apareces. Cuentas en el total del plan, pero nadie ve que estás. Puedes ver a los demás y saludar: al saludar, esa persona sabrá que estás.',
};
function myPresence(planId){ return Object.assign({ vis: state.presencePublic ? 'todos' : 'nadie', mode: '' }, (ME.planPresence || {})[planId] || {}); }
function setPlanPresence(planId, k, v){
  ME.planPresence = Object.assign({}, ME.planPresence, { [planId]: Object.assign(myPresence(planId), { [k]: v }) });
  const p = getPlan(planId);
  // La lista pública de asistentes solo muestra a quien es visible para todos.
  if (p && state.attended.has(planId) && k === 'vis'){
    const listed = p.publicAttendees.includes(ME.initials);
    if (v === 'todos' && !listed){ p.publicAttendees.unshift(ME.initials); p.attendedPrivate = Math.max(0, (p.attendedPrivate || 0) - 1); }
    if (v !== 'todos' && listed){ p.publicAttendees = p.publicAttendees.filter(x => x !== ME.initials); p.attendedPrivate = (p.attendedPrivate || 0) + 1; }
  }
  saveState(); if (location.hash === '#/plan/' + planId) renderDetail(planId);
}
// El plan está en marcha (en la demo, siempre que hayas registrado tu llegada).
function planLive(p){ return !!p && !isCancelled(p) && (DEMO_CHECKIN_ANYTIME || (Date.now() >= p.when - CHECKIN_BEFORE_MIN * 60000 && Date.now() <= p.when.getTime() + CHECKIN_AFTER_MIN * 60000)); }
const amHere = (planId) => state.attended.has(planId) && planLive(getPlan(planId));
// Quién ves tú en el plan: solo si tú también estás, y según la visibilidad de cada uno.
function peopleHere(planId){
  if (!amHere(planId)) return [];
  return (PLAN_PRESENCE[planId] || []).filter(e => {
    const u = getUser(e.userId);
    if (!u || (ME.blocked || []).includes(u.id) || isSanctioned(u.id)) return false;
    return e.vis === 'todos' || (e.vis === 'amigos' && areFriends('me', u.id));
  }).map(e => Object.assign({ u: getUser(e.userId) }, e));
}
const pinged = (planId, uid) => !!((ME.pinged || {})[planId + ':' + uid]);
// Posición de cada chincheta alrededor del punto del plan (fija para cada persona).
function pinSpot(uid, i){
  let h = 0; for (const ch of String(uid)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const a = (h % 360) * Math.PI / 180, r = 18 + (h % 17) + i * 2;
  return { x: 50 + Math.cos(a) * r * 1.3, y: 52 + Math.sin(a) * r };
}
const modeLabel = (m) => m === 'solo' ? 'Va solo' : (m === 'grupo' ? 'Va en grupo' : '');
function pingIcon(cls){ return `<span class="ping-ic ${cls || ''}" aria-hidden="true"><i class="ping-ring"></i><i class="ping-ring r2"></i>${ico('pin')}</span>`; }
// Bloque "Tu presencia en el plan" de la ficha.
function presenceBlock(p){
  const me = myPresence(p.id);
  const seg = (k, opts) => `<div class="iseg">${opts.map(([v, l, n]) => `<button class="${me[k] === v ? 'active' : ''}" onclick="setPlanPresence('${p.id}','${k}','${v}')">${ico(n)}<span>${l}</span></button>`).join('')}</div>`;
  return `<div class="block"><h4>Tu presencia en el plan</h4>
    <span class="sb-l">Quién te ve en el plan y en el mapa</span>${seg('vis', PLAN_VIS)}
    <p class="hint">${VIS_HINT[me.vis]}</p>
    <span class="sb-l">Cómo vas</span>${seg('mode', PLAN_MODE)}
    <p class="hint">Da igual ir solo o en grupo. Si vas solo, decirlo ayuda a que otros se animen a saludarte.</p></div>`;
}
// Bloque "Aquí ahora": chinchetas en el punto del plan y la lista para saludar o escribir.
function hereNowBlock(p){
  const place = getPlace(p.placeId);
  if (!amHere(p.id)) return (state.joined.has(p.id) || p.joinType === 'libre') && planLive(p) && !isCancelled(p)
    ? `<div class="block"><h4>Aquí ahora</h4><p class="hint">${ico('geo')} Cuando registres tu llegada verás quién más está en el plan y podrás saludar.</p></div>` : '';
  const people = peopleHere(p.id), me = myPresence(p.id);
  const pins = people.map((e, i) => { const s = pinSpot(e.u.id, i);
    return `<button class="here-pin" style="left:${s.x.toFixed(1)}%;top:${s.y.toFixed(1)}%" onclick="go('u/${e.u.id}')" aria-label="Perfil de ${escapeHtml(e.u.name)}"><span class="avatar sm">${escapeHtml(e.u.initials || initials(e.u.name))}</span></button>`; }).join('');
  const mine = me.vis !== 'nadie' ? `<button class="here-pin me" style="left:50%;top:52%" onclick="go('perfil')" aria-label="Tú">${pingIcon('sm')}<span class="here-me">Tú</span></button>` : '';
  const solos = people.filter(e => e.mode === 'solo').length;
  return `<div class="block"><h4>Aquí ahora · ${people.length + 1} ${people.length ? 'personas' : 'persona'}</h4>
    <div class="here-map" aria-label="Quién está en el plan"><span class="here-venue">${ico('pin')} ${escapeHtml(p.secret ? 'Punto del plan' : (place ? place.name : 'Punto del plan'))}</span>${pins}${mine}</div>
    <p class="hint">Todos aparecéis en el punto del plan, nunca en vuestra ubicación exacta. Solo os veis quienes habéis registrado la llegada, y solo mientras dura.${solos ? ` ${solos} ${solos === 1 ? 'ha venido solo' : 'han venido solos'}: buen momento para saludar.` : ''}</p>
    ${me.vis === 'nadie' ? `<p class="hint">${ico('lock')} Ahora no te ven. Si saludas a alguien, sabrá que estás.</p>` : ''}
    ${people.map(e => `<div class="here-row"><button class="avatar conv-av" onclick="go('u/${e.u.id}')" aria-label="Perfil de ${escapeHtml(e.u.name)}">${escapeHtml(e.u.initials || initials(e.u.name))}</button>
      <button class="conv-main lnk" onclick="go('u/${e.u.id}')"><b>${escapeHtml(e.u.name)}</b><span>${escapeHtml([modeLabel(e.mode), areFriends('me', e.u.id) ? 'Amigos' : ''].filter(Boolean).join(' · ') || e.u.handle)}</span></button>
      <button class="ping-btn ${pinged(p.id, e.u.id) ? 'done' : ''}" onclick="sendPing('${e.u.id}','${p.id}')" ${pinged(p.id, e.u.id) ? 'disabled' : ''} aria-label="Decirle a ${escapeHtml(e.u.name)} que tú también estás aquí">${pingIcon()}<span>${pinged(p.id, e.u.id) ? 'Saludado' : 'Yo también'}</span></button>
      <button class="here-msg" onclick="openDm('${e.u.id}')" aria-label="Enviar un mensaje a ${escapeHtml(e.u.name)}">${ico('chat')}</button></div>`).join('')
      || '<p class="hint">Aún no hay nadie visible. Si alguien llega y se deja ver, aparecerá aquí.</p>'}
  </div>`;
}
// Saludo: un mensaje con la chincheta animada, "yo también estoy en este plan". Uno por persona y plan.
function sendPing(uid, planId){
  const p = getPlan(planId), u = getUser(uid);
  if (!p || !u || pinged(planId, uid) || !amHere(planId)) return;
  const c = dmWith(uid, true);
  if (c.status !== 'aceptada') c.status = 'aceptada';   // estar en el mismo plan cuenta como conoceros
  c.messages.push({ id: newId('m'), from:'me', ping: planId, min:0 });
  ME.pinged = Object.assign({}, ME.pinged, { [planId + ':' + uid]: Date.now() });
  saveState(); toast(`${u.name.split(' ')[0]} sabe que tú también estás aquí`);
  if (location.hash === '#/plan/' + planId) renderDetail(planId);
  setTimeout(() => pingBack(uid, planId), 2500);   // demo: te devuelve el saludo
}
function pingBack(uid, planId){
  const p = getPlan(planId), u = getUser(uid), c = dmWith(uid, false); if (!p || !u || !c) return;
  c.messages.push({ id: newId('m'), from: uid, ping: planId, min:0 });
  if (location.hash === '#/chat/' + c.id) renderChat(c.id);
  else { c.unread = (c.unread || 0) + 1; updateDmBadge(); notify('aqui', `${u.name} también está en ${p.title} y te ha saludado.`, { convId: c.id }); }
  saveState();
}
// En el chat del plan: avisar a todos de que ya estás.
function pingPlanChat(planId, convId){
  const c = getConversation(convId); if (!c || !amHere(planId) || c.messages.some(m => m.from === 'me' && m.ping === planId)) return;
  c.messages.push({ id: newId('m'), from:'me', ping: planId, min:0 }); saveState(); renderChat(convId);
}
function pingBubble(m){
  const p = getPlan(m.ping) || { title:'el plan' };
  return `<span class="bubble ping-msg">${pingIcon('anim')}<span>${m.from === 'me' ? 'Yo también' : 'También'} estoy en <b>${escapeHtml(p.title)}</b></span></span>`;
}
