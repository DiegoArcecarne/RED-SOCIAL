/* =========================================================================
   Planes por videollamada: una actividad, un debate o lo que sea, sin lugar.
   - Quién la ve: pública (cualquiera puede verla en directo) o privada (solo quien
     está en la llamada; no sale en Descubrir ni en la búsqueda, se entra con el enlace).
   - Comentarios de quien mira (solo en públicas): sí o no.
   - Quién se une a la llamada (cámara y micro): cualquiera hasta el límite, o con la
     aprobación del anfitrión. Usa la inscripción de siempre: plazas = groupMax.
   La sala está simulada (sin vídeo real salvo tu cámara, si el navegador lo permite).
   En la app real: docs/videollamadas.md (proveedor de vídeo, roles, moderación).
   ========================================================================= */
const CALL_OPEN_MIN = 10;          // la sala se abre 10 min antes
const CALL_ATTEND_MIN = 10;        // 10 min en la llamada cuentan como asistencia
const CALL_DEFAULT_MIN = 60;
const isOnline = (p) => !!(p && p.online);
const isPrivateCall = (p) => isOnline(p) && p.online.visibility === 'privada';
const callStart = (p) => new Date(p.when).getTime();
const callEnd = (p) => callStart(p) + (p.durationMin || CALL_DEFAULT_MIN) * 60000;
function callLive(p){ const now = Date.now(); return isOnline(p) && !isCancelled(p) && !p.callEnded && now >= callStart(p) - CALL_OPEN_MIN * 60000 && now <= callEnd(p); }
const inCall = (p) => state.joined.has(p.id) || isHost(p);   // participa (cámara y micro)
// ¿Puede verlo alguien que no participa? Las privadas solo existen para quien está dentro (o tiene el enlace).
function canSeeOnline(p){ return !isPrivateCall(p) || inCall(p) || state.requested.has(p.id) || (p.waitlist || []).includes('me'); }
function onlineSummary(p){
  const o = p.online;
  return o.visibility === 'privada' ? 'Privada' : (o.comments ? 'Pública con comentarios' : 'Pública sin comentarios');
}
function onlineJoinLabel(p){ return p.online.join === 'aprobacion' ? `Con aprobación del anfitrión, hasta ${p.groupMax} personas` : `Cualquiera, hasta ${p.groupMax} personas`; }
// Quién mira (simulado): una cifra estable por plan que se mueve un poco en directo.
function callViewers(p){ if (isPrivateCall(p)) return 0; const base = 12 + (p.id.charCodeAt(p.id.length - 1) % 9) * 4; return base + ((state.call && state.call.tick) || 0) % 5; }

/* ---------- en la ficha del plan ---------- */
function callBlock(p){
  if (!isOnline(p)) return '';
  const o = p.online, live = callLive(p);
  return `<div class="block"><h4>La videollamada</h4>
    ${live ? `<div class="call-live">${ico('live')}<span><b>En directo ahora</b>${o.visibility === 'publica' ? ` · ${callViewers(p)} viendo` : ''}</span>
      ${inCall(p) ? `<button class="ph-btn primary sm" onclick="enterCall('${p.id}')">Entrar</button>` : (o.visibility === 'publica' ? `<button class="ph-btn sm" onclick="enterCall('${p.id}', true)">Ver</button>` : '')}</div>` : ''}
    <div class="call-facts">
      <div>${ico(o.visibility === 'privada' ? 'lock' : 'globe')}<span><b>${o.visibility === 'privada' ? 'Privada' : 'Pública'}</b>${o.visibility === 'privada' ? 'Solo la ve quien está en la llamada. No sale en Descubrir: se entra con el enlace.' : 'Cualquiera puede verla en directo, aunque no participe.'}</span></div>
      ${o.visibility === 'publica' ? `<div>${ico('chat')}<span><b>${o.comments ? 'Con comentarios' : 'Sin comentarios'}</b>${o.comments ? 'Quien mira puede comentar; los comentarios pasan por los filtros.' : 'Quien mira no puede escribir.'}</span></div>` : ''}
      <div>${ico('users')}<span><b>Quién se une a la llamada</b>${onlineJoinLabel(p)} con cámara y micro. Ahora: ${p.joined || 0} de ${p.groupMax}.</span></div>
      <div>${ico('clock')}<span><b>${p.durationMin || CALL_DEFAULT_MIN} minutos</b>La sala se abre ${CALL_OPEN_MIN} min antes. No se graba.</span></div>
    </div></div>`;
}
// Botón principal de la ficha para un plan por videollamada (null: sigue el flujo normal de apuntarse).
function callCta(p){
  if (!isOnline(p) || isCancelled(p)) return null;
  if (p.callEnded || Date.now() > callEnd(p)) return `<button class="btn-join done" disabled>${ico('video')} La videollamada ha terminado</button>`;
  if (inCall(p)) return `<button class="btn-join" onclick="enterCall('${p.id}')">${ico('video')} ${callLive(p) ? 'Entrar a la videollamada' : 'Entrar (se abre ' + CALL_OPEN_MIN + ' min antes)'}</button>`;
  if (callLive(p) && p.online.visibility === 'publica') return `<button class="btn-join" onclick="enterCall('${p.id}', true)">${ico('live')} Ver en directo</button>`;
  return null;
}

/* ---------- la sala ---------- */
// Participantes simulados: el anfitrión y los apuntados (hasta el límite), más tú si participas.
function callPeople(p){
  const c = state.call || {}, pool = ['lucia','marco','david','irene','alexv','ana','sara','nora'].filter(id => id !== p.hostId);
  const host = p.hostId && p.hostId !== 'me' ? [p.hostId] : [];
  const n = Math.max(0, Math.min((p.joined || 0) - (state.joined.has(p.id) ? 1 : 0), p.groupMax - 1, 7)) - (c.kicked || []).length;
  const others = host.concat(pool.filter(id => !(c.kicked || []).includes(id)).slice(0, Math.max(0, n)));
  const list = others.map((id, i) => ({ id, u: getUser(id) || { name: id, initials: id.slice(0, 2).toUpperCase() }, mic: !(c.muted || []).includes(id) && i % 3 !== 2, cam: i % 4 !== 3, host: id === p.hostId }));
  (c.admitted || []).forEach(id => { if (!list.some(x => x.id === id)) list.push({ id, u: getUser(id), mic: true, cam: true }); });
  if (c.role === 'participante') list.unshift({ id: 'me', u: ME, mic: c.mic, cam: c.cam, host: isHost(p), me: true });
  return list;
}
function enterCall(id, watch){
  const p = getPlan(id); if (!p) return;
  if (!callLive(p)){ toast(`La sala se abre ${CALL_OPEN_MIN} min antes de empezar`); return; }
  const role = !watch && inCall(p) ? 'participante' : 'espectador';
  if (role === 'participante' && !requireVerified('Verifica tu identidad para entrar con cámara y micro', () => enterCall(id))) return;
  if (role === 'espectador' && isPrivateCall(p)){ toast('Es una videollamada privada: solo entra quien está apuntado'); return; }
  state.call = { planId: id, role, mic: true, cam: true, hand: false, asked: false, tick: 0, joinedAt: Date.now(), muted: [], kicked: [], admitted: [], lobby: [] };
  go('sala/' + id);
}
function renderCall(id){
  const p = getPlan(id), view = document.getElementById('view-page');
  if (!p || !isOnline(p)){ renderGone('Esta videollamada ya no está disponible'); return; }
  if (!state.call || state.call.planId !== id){ if (!callLive(p)){ view.innerHTML = pageHead('Videollamada') + `<div class="empty-tab"><p>La sala se abre ${CALL_OPEN_MIN} min antes de empezar.</p></div>`; return; }
    state.call = { planId: id, role: inCall(p) ? 'participante' : 'espectador', mic: true, cam: true, hand: false, asked: false, tick: 0, joinedAt: Date.now(), muted: [], kicked: [], admitted: [], lobby: [] }; }
  const c = state.call, o = p.online, part = c.role === 'participante', people = callPeople(p);
  const showComments = o.visibility === 'publica' && o.comments;
  const tile = (x, i) => `<div class="tile ${x.me ? 'me' : ''} ${x.cam ? '' : 'nocam'}" data-id="${x.id}" style="--h:${(i * 47) % 360}">
      ${x.me && x.cam ? '<video id="my-video" autoplay muted playsinline></video>' : ''}
      <span class="tile-av">${escapeHtml(x.u.initials || initials(x.u.name || '?'))}</span>
      <span class="tile-n">${x.mic ? '' : ico('micOff')}${escapeHtml(x.me ? 'Tú' : (x.u.name || '').split(' ')[0])}${x.host ? ' · anfitrión' : ''}</span>
      ${x.me && c.hand ? `<span class="tile-hand">${ico('hand')}</span>` : ''}</div>`;
  const comments = showComments ? `<div class="call-cm" id="call-cm">${(p.callComments || []).slice(-30).map(m => { const u = getUser(m.userId) || { name: 'Alguien' };
      return `<p><b>${escapeHtml(m.userId === 'me' ? 'Tú' : u.name.split(' ')[0])}</b> ${escapeHtml(m.text)}</p>`; }).join('')}</div>
    <div class="chat-in call-in"><input id="call-msg" maxlength="200" placeholder="Comenta…" onkeydown="if(event.key==='Enter')sendCallComment('${id}')"><button class="ph-btn primary sm" onclick="sendCallComment('${id}')">Enviar</button></div>`
    : (o.visibility === 'publica' ? '<p class="call-nocm">Comentarios desactivados</p>' : '');
  const full = (p.joined || 0) >= p.groupMax;
  const viewerAct = c.role === 'espectador' ? (c.asked ? `<button class="ph-btn" disabled>${ico('clock')} Esperando al anfitrión</button>`
    : (full ? `<button class="ph-btn" disabled>Llamada completa (${p.groupMax})</button>`
    : `<button class="ph-btn primary" onclick="askJoinCall('${id}')">${ico('video')} ${o.join === 'aprobacion' ? 'Pedir unirme' : 'Unirme a la llamada'}</button>`)) : '';
  view.innerHTML = `<div class="room">
    <div class="room-top"><button class="pb-back" onclick="leaveCall()" aria-label="Salir">${ico('chevL')}</button>
      <div class="room-t"><b>${escapeHtml(p.title)}</b><span>${o.visibility === 'publica' ? `${ico('live')} En directo · ${callViewers(p)} viendo` : `${ico('lock')} Privada`} · ${people.length} en la llamada</span></div>
      <button class="pb-back" onclick="openCallMenu('${id}')" aria-label="Más opciones">${ico('dots')}</button></div>
    <div class="room-stage n${Math.min(people.length, 9)}">${people.map(tile).join('')}</div>
    ${c.role === 'espectador' ? `<p class="call-role">${ico('eye')} Estás mirando. ${o.join === 'aprobacion' ? 'Para hablar, pide unirte: decide el anfitrión.' : `Para hablar, únete (quedan ${Math.max(0, p.groupMax - (p.joined || 0))} plazas).`}</p>` : ''}
    ${comments}
    <div class="room-bar">${part ? `
      <button class="rb ${c.mic ? '' : 'off'}" onclick="toggleCall('mic')" aria-pressed="${!c.mic}" aria-label="${c.mic ? 'Silenciar micro' : 'Activar micro'}">${ico(c.mic ? 'mic' : 'micOff')}<span>Micro</span></button>
      <button class="rb ${c.cam ? '' : 'off'}" onclick="toggleCall('cam')" aria-pressed="${!c.cam}" aria-label="${c.cam ? 'Apagar cámara' : 'Encender cámara'}">${ico(c.cam ? 'video' : 'videoOff')}<span>Cámara</span></button>
      <button class="rb ${c.hand ? 'on' : ''}" onclick="toggleCall('hand')" aria-pressed="${c.hand}" aria-label="Levantar la mano">${ico('hand')}<span>Mano</span></button>
      ${isHost(p) ? `<button class="rb" onclick="openCallManage('${id}')" aria-label="Gestionar">${ico('users')}<span>Gestionar${c.lobby.length ? ` (${c.lobby.length})` : ''}</span></button>` : ''}` : viewerAct}
      <button class="rb end" onclick="leaveCall()" aria-label="Salir de la llamada">${ico('close')}<span>Salir</span></button></div>
  </div>`;
  if (part && c.cam) startMyCamera();
  const cm = document.getElementById('call-cm'); if (cm) cm.scrollTop = 1e6;
  startCallTimer(id);
}
// Tu cámara, si el navegador da permiso (si no, se ve tu inicial).
function startMyCamera(){
  const v = document.getElementById('my-video'), c = state.call; if (!v || !c) return;
  const show = (s) => { const el = document.getElementById('my-video'); if (!el) return; el.srcObject = s; if (el.parentNode && el.parentNode.classList) el.parentNode.classList.add('has-video'); };   // con imagen, se oculta la inicial
  if (c.stream){ show(c.stream); return; }
  try {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || c.camDenied) return;
    navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then(s => { if (!state.call){ s.getTracks().forEach(t => t.stop()); return; } state.call.stream = s; show(s); },
      () => { if (state.call) state.call.camDenied = true; });
  } catch (e) {}
}
function stopMyCamera(){ const c = state.call; if (c && c.stream){ c.stream.getTracks().forEach(t => t.stop()); c.stream = null; } }
let callTimer = null;
// En directo: quién habla, comentarios de otros y, si organizas, alguien que pide unirse.
function startCallTimer(id){
  clearInterval(callTimer);
  callTimer = setInterval(() => {
    const c = state.call, p = getPlan(id);
    if (!c || c.planId !== id || location.hash !== '#/sala/' + id){ clearInterval(callTimer); return; }
    c.tick++;
    const tiles = [...document.querySelectorAll('.tile')]; tiles.forEach(t => t.classList.remove('talk'));
    if (tiles.length) tiles[c.tick % tiles.length].classList.add('talk');
    if (p.online.visibility === 'publica' && p.online.comments && c.tick % 3 === 0){
      const lines = ['Qué buen tema', 'Me ha encantado eso último', 'Saludos desde Lavapiés', '¿Repetís la semana que viene?', 'Muy de acuerdo'];
      (p.callComments = p.callComments || []).push({ userId: ['david','irene','alexv','ana'][c.tick % 4], text: lines[c.tick % lines.length], min: 0 });
      const cm = document.getElementById('call-cm'); if (cm){ const u = getUser(['david','irene','alexv','ana'][c.tick % 4]); cm.insertAdjacentHTML('beforeend', `<p><b>${escapeHtml(u.name.split(' ')[0])}</b> ${escapeHtml(lines[c.tick % lines.length])}</p>`); cm.scrollTop = 1e6; }
    }
    if (isHost(p) && c.tick === 2 && !c.lobby.length){ c.lobby.push('nora'); toast('Nora quiere unirse a la llamada'); renderCall(id); }
  }, 2500);
  if (callTimer && callTimer.unref) callTimer.unref();   // fuera del navegador, no retiene el proceso
}
function toggleCall(k){
  const c = state.call; if (!c) return;
  c[k] = !c[k];
  if (k === 'cam' && !c.cam) stopMyCamera();
  renderCall(c.planId);
}
// Quien mira pide unirse (o se une, si es libre y hay sitio). En la demo, el anfitrión acepta a los pocos segundos.
function askJoinCall(id){
  const p = getPlan(id), c = state.call; if (!p || !c) return;
  if (!requireVerified('Verifica tu identidad para entrar con cámara y micro', () => askJoinCall(id))) return;
  if ((p.joined || 0) >= p.groupMax){ toast('La llamada está completa'); return; }
  if (p.online.join === 'libre'){ admitMe(p); toast('Ya estás en la llamada'); return; }
  c.asked = true; renderCall(id); toast('Le hemos pedido al anfitrión que te deje entrar');
  setTimeout(() => { const cc = state.call; if (cc && cc.planId === id && cc.asked){ admitMe(p); toast('El anfitrión te ha dejado entrar'); } }, 3000);
}
function admitMe(p){
  const c = state.call;
  if (!state.joined.has(p.id)){ state.joined.add(p.id); p.joined = (p.joined || 0) + 1; ensurePlanChat(p.id); }
  c.role = 'participante'; c.asked = false; c.joinedAt = Date.now(); saveState();
  if (location.hash === '#/sala/' + p.id) renderCall(p.id);
}
function sendCallComment(id){
  const p = getPlan(id), text = val('call-msg').trim().slice(0, 200); if (!p || !text) return;
  if (!(p.online.visibility === 'publica' && p.online.comments)){ toast('Los comentarios están desactivados'); return; }
  guardText(text, { kind: 'comentario' }, (flag) => {
    if (flag){ toast('No se ha publicado: parece ' + flag.label); return null; }
    (p.callComments = p.callComments || []).push({ userId: 'me', text, min: 0 }); saveState(); renderCall(id); return null;
  });
}
// 10 minutos dentro cuentan como asistencia verificada (como el QR en los presenciales).
function markCallAttendance(p){
  if (!p || state.attended.has(p.id) || !state.joined.has(p.id)) return false;
  state.attended.add(p.id); p.attended = (p.attended || 0) + 1;
  ME.attendedPlanIds = [...new Set([...(ME.attendedPlanIds || []), p.id])]; saveState(); return true;
}
function leaveCall(){
  const c = state.call; stopMyCamera(); clearInterval(callTimer);
  if (c){ const p = getPlan(c.planId);
    if (c.role === 'participante' && p && Date.now() - c.joinedAt >= CALL_ATTEND_MIN * 60000 && markCallAttendance(p)) toast('Asistencia registrada'); }
  state.call = null;
  if (c) go('plan/' + c.planId); else history.back();
}
function openCallMenu(id){
  const p = getPlan(id), c = state.call; if (!p) return;
  showOverlay('ov-sheet', `<div class="sheet-bg" onclick="closeOverlay()"></div><div class="sheet" role="dialog" aria-label="Opciones de la llamada">
    <div class="sheet-h"><span>${escapeHtml(p.title)}</span><button class="sv-x" onclick="closeOverlay()" aria-label="Cerrar">${ico('close')}</button></div>
    <div class="sheet-list">
      <p class="hint">${escapeHtml(onlineSummary(p))} · ${escapeHtml(onlineJoinLabel(p))}. No se graba. No compartas datos personales en directo.</p>
      <button class="sh-row" onclick="closeOverlay();openShare('plan:${id}')">${ico('send')}<span>Compartir el enlace</span>${ico('chevR')}</button>
      ${c && c.role === 'participante' && !state.attended.has(id) ? `<button class="sh-row" onclick="demoCallTime('${id}')">${ico('clock')}<span>Demo: pasan ${CALL_ATTEND_MIN} minutos</span>${ico('chevR')}</button>` : ''}
      ${isHost(p) ? '' : `<button class="sh-row danger" onclick="closeOverlay();reportPlan('${id}')">${ico('alert')}<span>Reportar la videollamada</span>${ico('chevR')}</button>`}
    </div></div>`);
}
function demoCallTime(id){ const c = state.call; if (c) c.joinedAt = Date.now() - CALL_ATTEND_MIN * 60000; closeOverlay(); toast(`Llevas ${CALL_ATTEND_MIN} minutos: al salir cuenta como asistencia`); }

/* ---------- el anfitrión gestiona la sala ---------- */
function openCallManage(id){
  const p = getPlan(id), c = state.call; if (!p || !c) return;
  const people = callPeople(p).filter(x => !x.me);
  showOverlay('ov-sheet', `<div class="sheet-bg" onclick="closeOverlay()"></div><div class="sheet" role="dialog" aria-label="Gestionar la llamada">
    <div class="sheet-h"><span>Gestionar la llamada</span><button class="sv-x" onclick="closeOverlay()" aria-label="Cerrar">${ico('close')}</button></div>
    <div class="sheet-list">
      ${c.lobby.length ? `<div class="set-title">Quieren unirse</div>${c.lobby.map(uid => { const u = getUser(uid) || { name: uid };
        return `<div class="req-row"><span class="avatar sm">${escapeHtml(u.initials || '')}</span><span class="req-n">${escapeHtml(u.name)}</span>
          <button class="ico-btn" onclick="callLobby('${id}','${uid}',false)" aria-label="Rechazar">${ico('close')}</button><button class="ico-btn ok" onclick="callLobby('${id}','${uid}',true)" aria-label="Dejar entrar">${ico('check')}</button></div>`; }).join('')}` : ''}
      <div class="set-title">En la llamada (${people.length + 1} de ${p.groupMax})</div>
      ${people.map(x => `<div class="req-row"><span class="avatar sm">${escapeHtml(x.u.initials || '')}</span><span class="req-n">${escapeHtml(x.u.name)}${x.mic ? '' : ' · silenciado'}</span>
        ${x.mic ? `<button class="link-btn" onclick="callMod('${id}','${x.id}','silenciar')">Silenciar</button>` : ''}<button class="link-btn danger" onclick="callMod('${id}','${x.id}','expulsar')">Sacar</button></div>`).join('')}
      ${p.online.visibility === 'publica' ? `<div class="opt-row" onclick="toggleCallComments('${id}')"><span class="or-ic">${ico('chat')}</span><span class="or-l">Comentarios de quien mira<span class="or-s">Puedes cerrarlos en cualquier momento</span></span><span class="switch ${p.online.comments ? 'on' : ''}"><span class="knob"></span></span></div>` : ''}
      <button class="btn-primary danger-btn" onclick="endCall('${id}')">Finalizar para todos</button>
    </div></div>`);
}
function callLobby(id, uid, ok){
  const c = state.call, p = getPlan(id); if (!c || !p) return;
  c.lobby = c.lobby.filter(x => x !== uid);
  if (ok){ if ((p.joined || 0) >= p.groupMax){ toast('La llamada está completa'); } else { c.admitted.push(uid); p.joined = (p.joined || 0) + 1; toast('Ha entrado'); } }
  saveState(); closeOverlay(); renderCall(id);
}
function callMod(id, uid, action){
  const c = state.call, p = getPlan(id); if (!c || !p) return;
  if (action === 'silenciar') c.muted.push(uid);
  if (action === 'expulsar'){ c.kicked.push(uid); c.admitted = c.admitted.filter(x => x !== uid); p.joined = Math.max(0, (p.joined || 0) - 1); }
  saveState(); closeOverlay(); toast(action === 'silenciar' ? 'Silenciado' : 'Ha salido de la llamada'); renderCall(id);
}
function toggleCallComments(id){ const p = getPlan(id); if (!p) return; p.online.comments = !p.online.comments; saveState(); openCallManage(id); renderCall(id); }
function endCall(id){
  const p = getPlan(id); if (!p) return;
  p.callEnded = true; planChatSystem(id, 'La videollamada ha terminado.');
  stopMyCamera(); clearInterval(callTimer); state.call = null; saveState(); closeOverlay(); toast('Videollamada finalizada'); go('plan/' + id);
}

/* ---------- al crear el plan ---------- */
const CALL_DURATIONS = [30, 45, 60, 90, 120];
function onlineFormFields(d){
  const seg = (key, opts) => `<div class="iseg" id="d-${key}">${opts.map(([v, l, n]) => `<button data-v="${v}" class="${d[key] === v ? 'active' : ''}" onclick="setDraft('${key}','${v}')">${n ? ico(n) : ''}<span>${l}</span></button>`).join('')}</div>`;
  return `<div id="online-opts" ${d.mode === 'online' ? '' : 'hidden'}>
    <div class="field"><label>Quién la ve</label>${seg('ovis', [['publica','Pública','globe'],['privada','Privada','lock']])}
      <p class="hint" id="ovis-hint">${d.ovis === 'privada' ? 'Solo quien está en la llamada. No sale en Descubrir: invita con el enlace.' : 'Cualquiera puede verla en directo, aunque no participe.'}</p></div>
    <div class="field" id="ocom-field" ${d.ovis === 'privada' ? 'hidden' : ''}><label>Comentarios de quien mira</label>${seg('ocom', [['si','Con comentarios','chat'],['no','Sin comentarios','close']])}</div>
    <div class="field"><label>Quién se une a la llamada</label>${seg('ojoin', [['libre','Cualquiera','users'],['aprobacion','Con mi aprobación','check']])}
      <p class="hint">Unirse es entrar con cámara y micro. ${d.ojoin === 'aprobacion' ? 'Recibirás solicitudes y decides tú.' : 'Entra quien se apunte, hasta el límite.'}</p></div>
    <div class="field"><label for="f-olimit">Límite de personas en la llamada</label><input id="f-olimit" type="number" min="2" max="50" value="${escapeHtml(String(d.olimit || 10))}" />
      <p class="hint">Contándote a ti. Quien solo mira no cuenta.</p></div>
    <div class="field"><label for="f-odur">Duración</label><select id="f-odur">${CALL_DURATIONS.map(m => `<option value="${m}" ${(d.odur || 60) === m ? 'selected' : ''}>${m} minutos</option>`).join('')}</select></div>
  </div>`;
}
// Lo que cambia en el plan al publicarlo por videollamada.
function onlinePlanFields(d){
  const limit = Math.max(2, Math.min(50, parseInt(val('f-olimit'), 10) || 10));
  return { placeId: null, online: { visibility: d.ovis || 'publica', comments: (d.ovis || 'publica') === 'publica' && d.ocom !== 'no', join: d.ojoin || 'libre' },
    durationMin: parseInt(val('f-odur'), 10) || CALL_DEFAULT_MIN, groupMin: 2, groupMax: limit,
    joinType: 'apuntado', approval: d.ojoin === 'aprobacion' ? 'manual' : 'automatica' };
}
