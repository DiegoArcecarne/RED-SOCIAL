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
const CANCEL_POLICIES = {
  flexible: { label:'Flexible', text:'Reembolso completo hasta 24 h antes; después, sin reembolso.' },
  moderada: { label:'Moderada', text:'Reembolso completo hasta 5 días antes; después, el 50 %.' },
  estricta: { label:'Estricta', text:'El 50 % hasta 7 días antes; después, sin reembolso.' },
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
  if (isFull(p)) return joinWaitlist(id);
  state.joined.add(id); p.joined = (p.joined || 0) + 1;
  ensurePlanChat(id);
  remindJoined(p);
  saveState();
  toast(p.paid ? `Plaza reservada · ${p.price} € retenidos hasta el plan` : 'Apuntado · te esperamos');
  renderDetail(id);
}
// Recordatorio al apuntarse: si es en las próximas 24 h, ya; si no, se programaría para el día antes.
function remindJoined(p){
  if (hoursTo(p) <= RECONFIRM_HOURS) notify('recordatorio', `${dayWord(p)} a las ${fmtHour(new Date(p.when))}: ${p.title}. Reconfirma que vas.`, { planId: p.id });
}
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
  if (next === 'me'){
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
  const pct = pol === 'flexible' ? (h >= 24 ? 100 : 0) : pol === 'moderada' ? (h >= 120 ? 100 : 50) : (h >= 168 ? 50 : 0);
  return { pct, amount: Math.round(p.price * pct) / 100, policy: CANCEL_POLICIES[pol] };
}
function openCancel(id){
  const p = getPlan(id); if (!p) return;
  const late = hoursTo(p) < LATE_CANCEL_HOURS, rf = refundFor(p);
  showOverlay('ov-sheet', `<div class="sheet-bg" onclick="closeOverlay()"></div><div class="sheet" role="dialog" aria-label="Cancelar asistencia">
    <div class="sheet-h"><span>Cancelar asistencia</span><button class="sv-x" onclick="closeOverlay()" aria-label="Cerrar">${ico('close')}</button></div>
    <div class="sheet-list">
      <p class="hint"><b>${escapeHtml(p.title)}</b> · ${fmtWhen(new Date(p.when))}</p>
      ${rf ? `<div class="vg-note">${ico('euro')}<p>Política ${rf.policy.label.toLowerCase()}: ${rf.policy.text}<br><b>Si cancelas ahora te devolvemos ${rf.amount} € (${rf.pct} %).</b></p></div>` : ''}
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
  releaseSpot(id);
  saveState(); closeOverlay();
  toast('Asistencia cancelada' + (rf ? ` · te devolvemos ${rf.amount} €` : '') + (late ? ' · cancelación tardía' : ''));
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
      <p class="hint">${state.presencePublic ? 'Aparecerás entre los asistentes (presencia pública).' : 'Contarás en el total, sin aparecer en la lista (presencia privada).'}</p>
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
    <p class="hint">Si cambias la fecha, la hora o el lugar, avisamos a todas las personas apuntadas.</p>
    <div class="form-actions"><button class="btn-primary" onclick="saveEditPlan('${id}')">${ico('check')} Guardar cambios</button></div>
  </div>`;
}
function saveEditPlan(id){
  const p = getPlan(id); if (!p) return;
  const title = clip(val('f-etitle'), 'planTitle') || p.title, summary = clip(val('f-edesc'), 'planDesc') || p.summary;
  const raw = val('f-edate'), when = raw ? new Date(raw) : p.when, placeId = val('f-eplace') || p.placeId;
  const changes = [];
  if (when.getTime() !== new Date(p.when).getTime()) changes.push(`ahora es el ${fmtWhen(when)}`);
  if (placeId !== p.placeId){ const pl = getPlace(placeId); changes.push(`nuevo lugar: ${pl ? pl.name : ''}`); }
  Object.assign(p, { title, summary, when, placeId });
  if (changes.length){
    planChatSystem(id, 'Cambio en el plan: ' + changes.join(' · '));
    state.reconfirmed = new Set([...state.reconfirmed].filter(x => x !== id));   // con un cambio importante, se vuelve a reconfirmar
  }
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
  p.status = 'cancelado'; planChatSystem(id, 'El anfitrión ha cancelado el plan.');
  saveState(); closeOverlay(); toast(`Plan cancelado · avisamos a ${p.joined || 0} personas`); renderDetail(id);
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
  cambio:       ['alert','Cambios en planes','Hora, lugar o cancelaciones'],
  plaza:        ['ticket','Lista de espera','Cuando quede una plaza para ti'],
  fiabilidad:   ['check','Después del plan','Llegadas, no presentados y valoraciones'],
  seguidor:     ['user','Seguidores','Solicitudes para seguirte y respuestas a las tuyas'],
  mencion:      ['at','Menciones','Cuando te mencionan o te etiquetan'],
};
function notifPrefs(){ return Object.assign({ recordatorio:true, solicitud:true, mensaje:true, cambio:true, plaza:true, fiabilidad:true, seguidor:true, mencion:true }, ME.notifPrefs || {}); }
// "seguridad" (SOS, decisiones de moderación, resultado de tus reportes) no se puede desactivar.
function notify(type, text, ref){
  if (type !== 'seguridad' && !notifPrefs()[type]) return null;
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
      <span class="pb-title">Notificaciones</span><button class="pb-back" onclick="openNotifPrefs()" aria-label="Preferencias">${ico('gear')}</button></div>
    <div class="page-body inbox">
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
      <p class="hint">Los avisos de seguridad (SOS, decisiones de moderación y el resultado de tus reportes) no se pueden desactivar.</p></div></div>`);
}
function toggleNotifPref(k){ ME.notifPrefs = Object.assign(notifPrefs(), { [k]: !notifPrefs()[k] }); saveState(); openNotifPrefs(); }

/* ---------- respuestas simuladas del "otro lado" ---------- */
// El anfitrión decide tu solicitud (en la demo, la acepta a los pocos segundos).
function simulateHostDecision(planId, decision){
  const p = getPlan(planId), r = REQUESTS.find(x => x.planId === planId && x.userId === 'me' && x.status === 'pendiente');
  if (!p || !r) return;
  r.status = decision || 'aceptada'; state.requested.delete(planId);
  if (r.status === 'aceptada'){ state.joined.add(planId); p.joined = (p.joined || 0) + 1; ensurePlanChat(planId); notify('solicitud', `Te han aceptado en ${p.title}. Ya estás apuntado.`, { planId }); }
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
