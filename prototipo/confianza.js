/* =========================================================================
   Confianza y seguridad (simulado en el navegador). En la app real todo esto lo
   decide y lo guarda el servidor: ver docs/confianza-y-seguridad.md.
   - Filtros automáticos de contenido: avisan antes de publicar o retienen.
   - Reportes y bloqueos, "Tus reportes", "Estado de tu cuenta" y apelaciones.
   - Panel interno de moderación: cola, SOS, apelaciones e historial.
   - Contactos de confianza y botón SOS.
   - Tus datos (RGPD): descargar una copia, consentimientos y borrar la cuenta.
   ========================================================================= */

// Id único aunque se creen varios en el mismo milisegundo.
function newId(prefix){ return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

/* ---------- filtros automáticos de contenido ----------
   Normaliza el texto (minúsculas, sin tildes, números por letras, sin letras repetidas,
   letras sueltas unidas) para que "1d10t4", "idiotaaa" o "i d i o t a" también cuenten.
   En la app real: clasificadores en el servidor (texto e imagen) + listas mantenidas por
   el equipo; esto es solo una muestra de las reglas. */
const FILTER_CATS = {
  amenaza: { level:'retener', label:'una amenaza', reason:'peligro' },
  odio:    { level:'retener', label:'discurso de odio', reason:'acoso' },
  spam:    { level:'retener', label:'spam o un intento de estafa', reason:'spam' },
  insulto: { level:'aviso',   label:'un insulto', reason:'acoso' },
  contacto:{ level:'aviso',   label:'tus datos de contacto', reason:null },
};
const FILTER_RULES = {
  amenaza: [/\bte voy a (matar|reventar|partir la cara|encontrar|buscar)\b/, /\b(te|os) mato\b/, /\bse donde vives\b/, /\bojala te mueras\b/, /\bmatate\b/, /\bvas a pagarlo\b/, /\bte vas a enterar\b/],
  odio:    [/\bsudacas?\b/, /\bmaricon(es)?\b/, /\bpanchit[oa]s?\b/, /\bnegrat[ao]s?\b/],
  insulto: [/\bidiot[ao]s?\b/, /\bimbecil(es)?\b/, /\bgilipol(a)?s\b/, /\bsubnormal(es)?\b/, /\bestupid[ao]s?\b/, /\bpringa(d[ao]|o)s?\b/, /\bcapul[oa]s?\b/, /\bcabron(a|es|as)?\b/, /\bput[ao]s?\b/, /\bzoras?\b/, /\bretrasad[ao]s?\b/, /\basco de gente\b/],
};
const SPAM_BAIT = /(gana(r)?\s+\d+|dinero (facil|rapido)|€\s*(a|al|por)\s*(la\s+)?(semana|dia|mes)|euros?\s*(a|al|por)\s*(la\s+)?(semana|dia|mes)|cripto|bitcoin|apuestas|inversion|trabaja desde casa|desde casa)/;
const LINK_RE = /(https?:\/\/|www\.|bit\.ly|\b[a-z0-9-]+\.(com|net|io|xyz|link|ly|top|click)\b)/i;
const PHONE_RE = /(\+?\d[\d\s.-]{7,}\d)/;
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.]+/;

function normText(s){
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[0134578@$]/g, c => ({ '0':'o', '1':'i', '3':'e', '4':'a', '5':'s', '7':'t', '8':'b', '@':'a', '$':'s' }[c]))
    .replace(/\b(?:[a-z][\s.\-_*]){2,}[a-z]\b/g, m => m.replace(/[\s.\-_*]/g, ''))   // "i d i o t a" → "idiota"
    .replace(/([a-z])\1+/g, '$1')                                                     // "idiotaaa" → "idiota"
    .replace(/\s+/g, ' ');
}
// ctx.kind: comentario | publicacion | mensaje | plan | bio. ctx.known: en mensajes, si conoces a la persona.
function moderateText(text, ctx){
  ctx = ctx || {};
  const raw = String(text || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const t = normText(text);
  const hit = (cat) => ({ cat, ...FILTER_CATS[cat] });
  if (FILTER_RULES.amenaza.some(re => re.test(t))) return hit('amenaza');
  if (FILTER_RULES.odio.some(re => re.test(t))) return hit('odio');
  if ((LINK_RE.test(raw) && SPAM_BAIT.test(raw)) || (raw.match(new RegExp(SPAM_BAIT.source, 'g')) || []).length >= 2) return hit('spam');
  if (FILTER_RULES.insulto.some(re => re.test(t))) return hit('insulto');
  const digits = ((raw.match(PHONE_RE) || [''])[0].match(/\d/g) || []).length;
  if (ctx.kind !== 'bio' && !ctx.known && (digits >= 9 || EMAIL_RE.test(raw))) return hit('contacto');
  return { level:'ok' };
}

// Pasa el texto por el filtro antes de publicarlo. commit(flag) crea el contenido (retenido
// si flag.level === 'retener') y devuelve su referencia para la cola de moderación.
function guardText(text, ctx, commit){
  const r = moderateText(text, ctx);
  if (r.level === 'aviso'){ state.guard = { r, ctx, commit, text }; return openNudge(); }
  if (r.level === 'retener' && ctx.kind === 'bio'){ toast('La descripción no se ha guardado: parece ' + r.label); return; }
  const ref = commit(r.level === 'retener' ? r : null);
  if (r.level === 'retener' && ref) holdForReview(r, ref, text);
}
function openNudge(){
  const g = state.guard; if (!g) return;
  const contact = g.r.cat === 'contacto';
  showOverlay('ov-sheet', `<div class="sheet-bg" onclick="nudgeEdit()"></div><div class="sheet" role="dialog" aria-label="Antes de publicar">
    <div class="sheet-h"><span>${contact ? 'Cuidado con tus datos' : '¿Seguro que quieres publicarlo?'}</span><button class="sv-x" onclick="nudgeEdit()" aria-label="Cerrar">${ico('close')}</button></div>
    <div class="sheet-list form"><div class="nudge">${ico(contact ? 'lock' : 'alert')}<p>${contact
      ? 'Estás compartiendo un teléfono o un email. Hasta que conozcas a la persona en un plan, es más seguro hablar por el chat de la app.'
      : 'Parece que incluye ' + escapeHtml(g.r.label) + '. En planes pedimos respeto: si lo publicas, se mostrará a menos gente y cualquiera podrá reportarlo.'}</p></div>
      <blockquote class="nudge-q">${escapeHtml(g.text)}</blockquote>
      <button class="btn-primary" onclick="nudgeEdit()">Editar</button>
      <button class="btn-ghost" onclick="nudgeGo()">${contact ? 'Enviar igualmente' : 'Publicar igualmente'}</button></div></div>`);
}
function nudgeEdit(){ const g = state.guard; state.guard = null; closeOverlay(); if (g && g.ctx.onEdit) g.ctx.onEdit(g.text); }
function nudgeGo(){
  const g = state.guard; if (!g) return; state.guard = null; closeOverlay();
  const ref = g.commit(null);
  // Un insulto publicado tras el aviso va a la cola con prioridad baja y se muestra a menos gente.
  if (ref && g.r.cat === 'insulto'){
    const c = contentOf(ref); if (c) c.flagged = 'insulto';
    REPORTS.push(Object.assign({ id:newId('rp'), reporterId:null, targetUserId:'me', reason:'acoso', autoCategory:'insulto', evidence:g.text, source:'automatico', status:'en_cola', at:Date.now() }, ref));
    saveState();
  }
}
// Retenido: no lo ve nadie más hasta que lo revisa una persona del equipo. Se puede apelar.
function holdForReview(r, ref, text){
  const a = Object.assign({ id:newId('ma'), targetUserId:'me', action:'retener', reason:r.reason, autoCategory:r.cat, evidence:text, automated:true, status:'en_revision', at:Date.now(), appeal:null }, ref);
  MOD_ACTIONS.unshift(a);
  REPORTS.push(Object.assign({ id:newId('rp'), reporterId:null, targetUserId:'me', reason:r.reason, autoCategory:r.cat, evidence:text, source:'automatico', status:'en_cola', at:Date.now(), modActionId:a.id }, ref));
  saveState();
  showOverlay('ov-sheet', `<div class="sheet-bg" onclick="closeOverlay()"></div><div class="sheet" role="dialog" aria-label="En revisión">
    <div class="sheet-h"><span>En revisión</span><button class="sv-x" onclick="closeOverlay()" aria-label="Cerrar">${ico('close')}</button></div>
    <div class="sheet-list form"><div class="nudge">${ico('shield')}<p>Nuestro filtro automático cree que puede ser ${escapeHtml(r.label)}, así que de momento solo lo ves tú. Lo revisará una persona del equipo, normalmente en menos de 24 horas.</p></div>
      <p class="hint">Si crees que es un error, puedes apelar desde Ajustes ▸ Estado de tu cuenta.</p>
      <button class="btn-primary" onclick="closeOverlay();go('estado-cuenta')">Ver el estado de mi cuenta</button>
      <button class="btn-ghost" onclick="closeOverlay()">Entendido</button></div></div>`);
}

/* ---------- contenido referenciado por reportes y decisiones ---------- */
function contentOf(x){
  if (!x) return null;
  if (x.objectType === 'publicacion') return POSTS.find(p => p.id === x.postId) || null;
  if (x.objectType === 'comentario'){ const po = POSTS.find(p => p.id === x.postId); return (po && (po.comments || []).find(c => c.id === x.commentId)) || null; }
  if (x.objectType === 'mensaje'){ const c = getConversation(x.convId); return (c && c.messages.find(m => m.id === x.msgId)) || null; }
  if (x.objectType === 'plan') return getPlan(x.planId) || null;
  if (x.objectType === 'chispa') return IDEAS.find(i => i.id === x.ideaId) || null;
  return null;
}
const OBJECT_LABEL = { usuario:'Perfil', conversacion:'Mensajes', publicacion:'Publicación', comentario:'Comentario', mensaje:'Mensaje', plan:'Plan', chispa:'Chispa' };
function ensureCommentIds(po){ (po.comments || []).forEach((c, i) => { if (!c.id) c.id = po.id + '-c' + i; }); }
// Comentarios que ves: sin los retirados, los retenidos de otros, los de cuentas bloqueadas o suspendidas.
function commentVisible(c){
  if (c.removed) return false;
  if (c.userId === 'me') return true;
  if (c.held || (ME.blocked || []).includes(c.userId) || isSanctioned(c.userId)) return false;
  return true;
}
function visibleComments(po){ return (po.comments || []).filter(commentVisible); }

/* ---------- estado de moderación de cada cuenta ---------- */
function userMod(uid){ return Object.assign({ strikes:0, status:'activa', until:null, reach:'normal', canHost:true }, USER_MOD[uid] || {}); }
function setUserMod(uid, patch){ USER_MOD[uid] = Object.assign(userMod(uid), patch); }
function isSanctioned(uid){ const m = userMod(uid); return m.status === 'expulsada' || (m.status === 'suspendida' && (!m.until || m.until > Date.now())); }
function sanctionNote(u){
  const m = userMod(u.id);
  if (m.status === 'expulsada') return 'Esta cuenta ya no está disponible.';
  if (isSanctioned(u.id)) return 'Cuenta suspendida temporalmente por incumplir las normas.';
  return '';
}

/* ---------- reportes ---------- */
const SEVERITY = { peligro:'critica', menor:'critica', acoso:'alta', sexual:'alta', estafa:'media', suplantacion:'media', spam:'baja', otro:'baja' };
const SEVERITY_INFO = { critica:['Crítica', '1 h', 0], alta:['Alta', '24 h', 1], media:['Media', '48 h', 2], baja:['Baja', '72 h', 3] };
const REASON_RULE = {
  spam:'Spam, publicidad no pedida y ventas fuera de la app', acoso:'Respeto: sin acoso, insultos ni odio', sexual:'Contenido sexual solo con consentimiento',
  suplantacion:'Identidad real: no hacerse pasar por otra persona', estafa:'Pagos y estafas', menor:'Solo mayores de 18 años',
  peligro:'Seguridad: sin amenazas ni violencia', otro:'Normas de la comunidad',
};
const reasonLabel = (r) => ((REPORT_REASONS.find(([v]) => v === r) || [null, 'Otro motivo'])[1]);
function severityOf(rp){ return rp.autoCategory === 'amenaza' ? 'critica' : (SEVERITY[rp.reason] || 'baja'); }
function myReports(){ return REPORTS.filter(r => (r.reporterId === undefined || r.reporterId === 'me') && r.source !== 'automatico'); }
// Pruebas que se guardan con el reporte: el texto del contenido o los últimos mensajes.
function reportEvidence(r){
  const obj = r.obj || {};
  const c = contentOf(obj);
  if (c) return c.text || c.caption || [c.title, c.summary].filter(Boolean).join(' · ') || '';
  if (r.convId){ const conv = getConversation(r.convId); return conv ? conv.messages.filter(m => m.from === r.uid && m.text).slice(-3).map(m => m.text).join(' / ') : ''; }
  return '';
}
function reportComment(postId, commentId){
  const po = POSTS.find(p => p.id === postId); const c = po && (po.comments || []).find(x => x.id === commentId); if (!c) return;
  openReport(c.userId, null, { objectType:'comentario', postId, commentId });
}
function reportPlan(planId){
  const p = getPlan(planId); if (!p) return;
  openReport(p.hostId || (p.host.business ? 'azotea' : null), null, { objectType:'plan', planId });
}
function openUserMenu(uid){
  const u = getUser(uid); if (!u) return;
  showOverlay('ov-sheet', `<div class="sheet-bg" onclick="closeOverlay()"></div><div class="sheet" role="dialog" aria-label="Opciones">
    <div class="sheet-h"><span>${escapeHtml(u.name)}</span><button class="sv-x" onclick="closeOverlay()" aria-label="Cerrar">${ico('close')}</button></div>
    <div class="sheet-list">
      <button class="sh-row" onclick="openShare('u:${u.id}')">${ico('send')}<span>Compartir el perfil</span>${ico('chevR')}</button>
      <button class="sh-row" onclick="openReport('${u.id}', null, { objectType:'usuario' })">${ico('alert')}<span>Reportar</span>${ico('chevR')}</button>
      ${(ME.blocked || []).includes(u.id) ? `<button class="sh-row" onclick="closeOverlay();unblockUser('${u.id}')">${ico('lock')}<span>Desbloquear</span>${ico('chevR')}</button>`
        : `<button class="sh-row danger" onclick="blockUser('${u.id}')">${ico('lock')}<span>Bloquear</span>${ico('chevR')}</button>`}
    </div></div>`);
}
const REPORT_STATUS = { en_cola:'En revisión', resuelto:'Resuelto', desestimado:'Sin infracción' };
function renderMyReports(){
  const view = document.getElementById('view-page');
  const list = myReports().slice().sort((a, b) => (b.at || 0) - (a.at || 0));
  view.innerHTML = pageHead('Tus reportes') + `<div class="page-body">
    <p class="hint">Quien es reportado nunca sabe quién le ha reportado. Te avisamos cuando revisamos cada reporte.</p>
    ${list.map(r => { const u = getUser(r.targetUserId) || { name:'Cuenta eliminada' };
      return `<div class="mod-card mine"><div class="mod-top"><b>${escapeHtml(u.name)}</b><span class="st st-${r.status}">${REPORT_STATUS[r.status] || r.status}</span></div>
        <div class="mod-meta">${OBJECT_LABEL[r.objectType] || 'Perfil'} · ${escapeHtml(reasonLabel(r.reason))}${r.at ? ' · ' + dayLabel(r.at) : ''}</div>
        ${r.resolution ? `<p class="hint">${escapeHtml(resolutionText(r))}</p>` : ''}
        ${r.status === 'desestimado' && !r.appeal ? `<button class="link-btn" onclick="openAppeal('report:${r.id}')">No estoy de acuerdo: pedir otra revisión</button>` : ''}
        ${r.appeal ? `<p class="hint">${ico('clock')} Revisión pedida · ${APPEAL_STATUS[r.appeal.status]}</p>` : ''}</div>`; }).join('')
      || `<div class="empty-tab"><span class="empty-ic">${ico('shield')}</span><p>No has reportado nada.</p></div>`}
  </div>`;
}
function resolutionText(r){ return r.status === 'desestimado' ? 'Lo hemos revisado y no incumple las normas.' : 'Lo hemos revisado y hemos actuado: ' + (MOD_ACTION_TYPES[r.resolution] || ['', ''])[1].toLowerCase() + '.'; }
function dayLabel(at){ const m = Math.max(0, Math.floor((Date.now() - at) / 60000)); return m < 1440 ? minLabel(m) : `hace ${Math.round(m / 1440)} d`; }

/* ---------- cuentas bloqueadas ---------- */
function renderBlocked(){
  const view = document.getElementById('view-page');
  const list = (ME.blocked || []).map(getUser).filter(Boolean);
  view.innerHTML = pageHead('Cuentas bloqueadas') + `<div class="page-body">
    <p class="hint">No ven tu perfil ni tus publicaciones, no pueden escribirte ni unirse a tus planes. No se les avisa.</p>
    ${list.map(u => `<div class="conv"><span class="avatar conv-av">${escapeHtml(u.initials || initials(u.name))}</span>
      <span class="conv-main"><b>${escapeHtml(u.name)}</b><span>${escapeHtml(u.handle)}</span></span>
      <button class="ph-btn sm" onclick="unblockUser('${u.id}')">Desbloquear</button></div>`).join('')
      || `<div class="empty-tab"><span class="empty-ic">${ico('lock')}</span><p>No has bloqueado a nadie.</p></div>`}
  </div>`;
}

/* ---------- decisiones de moderación ---------- */
const MOD_ACTION_TYPES = {
  desestimar: ['close', 'Desestimar: no incumple las normas'],
  publicar:   ['check', 'Publicar: el filtro se equivocó'],
  retirar:    ['close', 'Retirar el contenido'],
  aviso:      ['alert', 'Retirar y dar un aviso a la cuenta'],
  alcance:    ['eye', 'Reducir el alcance de la cuenta'],
  organizar:  ['ticket', 'Quitarle la opción de organizar planes'],
  suspender7: ['clock', 'Suspender la cuenta 7 días'],
  suspender30:['clock', 'Suspender la cuenta 30 días'],
  expulsar:   ['lock', 'Cerrar la cuenta para siempre'],
  autoridades:['shield', 'Escalar a las autoridades'],
  reembolsar: ['euro', 'Reembolsar al asistente (no se paga al anfitrión)'],
  retener:    ['clock', 'Retenido por el filtro automático'],
};
// Exposición de motivos (art. 17 de la Ley de Servicios Digitales): qué, por qué, con qué
// norma, si fue automático y cómo recurrir.
function statementFor(a){
  return `${MOD_ACTION_TYPES[a.action][1]}. Motivo: ${reasonLabel(a.reason)}. Norma: ${REASON_RULE[a.reason] || REASON_RULE.otro}. `
    + (a.automated ? 'Decisión tomada por un sistema automático.' : 'Decisión tomada por una persona del equipo.')
    + ' Puedes apelar en los próximos 6 meses.';
}
function applyModAction(reportId, action){
  const rp = REPORTS.find(r => r.id === reportId); if (!rp) return;
  const uid = rp.targetUserId, c = contentOf(rp), days = { suspender7:7, suspender30:30 }[action];
  if (action === 'publicar' || (action === 'desestimar' && c && c.held)) { if (c) c.held = false; }
  if (['retirar','aviso','suspender7','suspender30','expulsar'].includes(action) && c){ c.removed = true; c.held = false; }
  if (action === 'aviso') setUserMod(uid, { strikes: userMod(uid).strikes + 1 });
  if (action === 'alcance') setUserMod(uid, { reach:'reducido' });
  if (action === 'organizar') setUserMod(uid, { canHost:false });
  if (days) setUserMod(uid, { status:'suspendida', until: Date.now() + days * 86400000, strikes: userMod(uid).strikes + 1 });
  if (action === 'expulsar') setUserMod(uid, { status:'expulsada', until:null });
  if (action === 'autoridades') rp.escalated = true;
  const dismissed = action === 'desestimar' || action === 'publicar';
  // Reclamación de un pago (pagos.js): si se le da la razón, se reembolsa; si no, sigue el pago al anfitrión.
  if (rp.paymentId) resolveClaim(rp.paymentId, !dismissed);
  rp.status = dismissed ? 'desestimado' : 'resuelto'; rp.resolution = action; rp.resolvedAt = Date.now();
  // Lo retenido por el filtro: la decisión del equipo sustituye a la automática.
  const held = rp.modActionId && MOD_ACTIONS.find(a => a.id === rp.modActionId);
  if (held){ held.status = dismissed ? 'revocada' : 'vigente'; held.action = dismissed ? 'retener' : action; held.automated = false; held.decidedAt = Date.now(); }
  else if (!dismissed) MOD_ACTIONS.unshift({ id:newId('ma'), reportId, targetUserId:uid, action, objectType:rp.objectType, postId:rp.postId, commentId:rp.commentId, convId:rp.convId, msgId:rp.msgId, planId:rp.planId,
    reason:rp.reason, evidence:rp.evidence, automated:false, status:'vigente', at:Date.now(), appeal:null });
  const who = (getUser(uid) || { name:'' }).name;
  if (rp.reporterId === 'me' || rp.reporterId === undefined) notify('seguridad', `Hemos revisado tu reporte sobre ${who}. ${resolutionText(rp)}`, { route:'mis-reportes' });
  if (uid === 'me') notify('seguridad', dismissed ? 'Lo que estaba en revisión ya está publicado: no incumple las normas.' : 'Hemos retirado contenido tuyo por incumplir las normas. Puedes apelar.', { route:'estado-cuenta' });
  saveState(); closeOverlay(); toast('Decisión aplicada: ' + MOD_ACTION_TYPES[action][1].toLowerCase());
  renderModeration(state.modTab);
}

/* ---------- apelaciones ---------- */
const APPEAL_STATUS = { pendiente:'en revisión', estimada:'te damos la razón', desestimada:'se mantiene la decisión' };
// key: "action:<id>" (una decisión sobre ti) o "report:<id>" (un reporte tuyo desestimado).
function openAppeal(key){
  state.appealKey = key;
  showOverlay('ov-sheet', `<div class="sheet-bg" onclick="closeOverlay()"></div><div class="sheet" role="dialog" aria-label="Apelar">
    <div class="sheet-h"><span>Apelar</span><button class="sv-x" onclick="closeOverlay()" aria-label="Cerrar">${ico('close')}</button></div>
    <div class="sheet-list form"><p class="hint">Lo revisará una persona distinta de la que decidió. Te contestamos en unos días.</p>
      <div class="field"><label for="f-appeal">Cuéntanos por qué no estás de acuerdo ${counter('f-appeal','message','')}</label>
        <textarea ${lim('f-appeal','message')} rows="4"></textarea></div>
      <button class="btn-primary" onclick="submitAppeal()">Enviar apelación</button></div></div>`);
}
function submitAppeal(){
  const key = state.appealKey || '', text = clip(val('f-appeal'), 'message');
  if (!text){ toast('Escribe por qué no estás de acuerdo'); return; }
  const [kind, id] = key.split(':');
  const target = kind === 'report' ? REPORTS.find(r => r.id === id) : MOD_ACTIONS.find(a => a.id === id);
  if (!target || target.appeal) return;
  target.appeal = { text, status:'pendiente', at:Date.now() };
  saveState(); closeOverlay(); toast('Apelación enviada');
  if (kind === 'report') renderMyReports(); else renderAccountStatus();
}
function resolveAppeal(key, accept){
  const [kind, id] = key.split(':');
  if (kind === 'report'){
    const rp = REPORTS.find(r => r.id === id); if (!rp || !rp.appeal) return;
    rp.appeal.status = accept ? 'estimada' : 'desestimada';
    if (accept){ rp.status = 'en_cola'; rp.resolution = null; }   // vuelve a la cola
    notify('seguridad', accept ? 'Vamos a revisar de nuevo tu reporte.' : 'Hemos revisado tu petición: el reporte no incumple las normas.', { route:'mis-reportes' });
  } else {
    const a = MOD_ACTIONS.find(x => x.id === id); if (!a || !a.appeal) return;
    a.appeal.status = accept ? 'estimada' : 'desestimada';
    if (accept){
      const c = contentOf(a); if (c){ c.removed = false; c.held = false; }
      if (['suspender7','suspender30','expulsar'].includes(a.action)) setUserMod(a.targetUserId, { status:'activa', until:null });
      if (a.action === 'organizar') setUserMod(a.targetUserId, { canHost:true });
      if (a.action === 'alcance') setUserMod(a.targetUserId, { reach:'normal' });
      a.status = 'revocada';
      REPORTS.filter(r => r.modActionId === a.id && r.status === 'en_cola').forEach(r => { r.status = 'desestimado'; r.resolution = 'publicar'; });
    }
    if (a.targetUserId === 'me') notify('seguridad', accept ? 'Te damos la razón: hemos anulado la decisión y tu contenido vuelve a estar visible.'
      : 'Hemos revisado tu apelación y mantenemos la decisión. Si no estás de acuerdo, puedes acudir a un órgano de resolución extrajudicial.', { route:'estado-cuenta' });
  }
  saveState(); toast(accept ? 'Apelación estimada' : 'Decisión mantenida'); renderModeration('apelaciones');
}

/* ---------- estado de tu cuenta ---------- */
function renderAccountStatus(){
  const view = document.getElementById('view-page');
  const mine = MOD_ACTIONS.filter(a => a.targetUserId === 'me').sort((a, b) => (b.at || 0) - (a.at || 0));
  const live = mine.filter(a => a.status !== 'revocada'), m = userMod('me');
  view.innerHTML = pageHead('Estado de tu cuenta') + `<div class="page-body">
    <div class="acct-ok ${live.length ? 'warn' : ''}">${ico(live.length ? 'alert' : 'shield')}<div><b>${live.length ? `${live.length} ${live.length === 1 ? 'decisión' : 'decisiones'} sobre tu contenido` : 'Tu cuenta está en regla'}</b>
      <p>${m.canHost ? 'Puedes organizar planes.' : 'Ahora mismo no puedes organizar planes.'} ${m.strikes ? `Avisos: ${m.strikes}.` : 'Sin avisos.'} Con avisos repetidos la cuenta se puede suspender.</p></div></div>
    ${mine.map(a => `<div class="mod-card mine"><div class="mod-top"><b>${escapeHtml(MOD_ACTION_TYPES[a.action][1])}</b><span class="st st-${a.status}">${{ vigente:'Vigente', en_revision:'En revisión', revocada:'Anulada' }[a.status]}</span></div>
      <div class="mod-meta">${OBJECT_LABEL[a.objectType] || 'Cuenta'} · ${dayLabel(a.at)}</div>
      ${a.evidence ? `<blockquote class="nudge-q">${escapeHtml(a.evidence)}</blockquote>` : ''}
      <p class="hint">${escapeHtml(a.status === 'en_revision' ? 'Solo lo ves tú hasta que lo revise una persona del equipo. ' + statementFor(a) : statementFor(a))}</p>
      ${a.appeal ? `<p class="hint">${ico('clock')} Apelación: ${APPEAL_STATUS[a.appeal.status]}</p>` : (a.status !== 'revocada' ? `<button class="ph-btn" onclick="openAppeal('action:${a.id}')">Apelar</button>` : '')}</div>`).join('')}
    <p class="hint">Normas de la comunidad: respeto, identidad real, sin spam ni ventas fuera de la app, sin amenazas. Las decisiones automáticas siempre las puede revisar una persona.</p>
  </div>`;
}

/* ---------- panel interno de moderación (equipo de planes) ----------
   En la app real es una web aparte, con acceso por roles y registro de quién hace qué. */
function renderModeration(tab){
  state.modTab = tab || state.modTab || 'cola';
  const t = state.modTab, view = document.getElementById('view-page');
  const queue = REPORTS.filter(r => r.status === 'en_cola').sort((a, b) => (SEVERITY_INFO[severityOf(a)][2] - SEVERITY_INFO[severityOf(b)][2]) || ((a.at || 0) - (b.at || 0)));
  const sos = SAFETY_EVENTS.filter(e => e.type === 'sos').sort((a, b) => (a.status === 'activa' ? 0 : 1) - (b.status === 'activa' ? 0 : 1) || b.at - a.at);
  const appeals = [...MOD_ACTIONS.filter(a => a.appeal && a.appeal.status === 'pendiente').map(a => ({ key:'action:' + a.id, a })),
                   ...REPORTS.filter(r => r.appeal && r.appeal.status === 'pendiente').map(r => ({ key:'report:' + r.id, r }))];
  const history = MOD_ACTIONS.slice().sort((a, b) => (b.decidedAt || b.at || 0) - (a.decidedAt || a.at || 0));
  const tabs = [['cola', 'Cola', 'layers', queue.length], ['sos', 'SOS', 'alert', sos.filter(e => e.status === 'activa').length], ['apelaciones', 'Apelaciones', 'repeat', appeals.length], ['historial', 'Historial', 'clock', 0]];
  const body = {
    cola: () => queue.map(modCard).join('') || `<div class="empty-tab"><span class="empty-ic">${ico('check')}</span><p>No hay reportes pendientes.</p></div>`,
    sos: () => sos.map(sosCard).join('') || `<div class="empty-tab"><span class="empty-ic">${ico('alert')}</span><p>No hay alertas SOS. Pulsa SOS en la ficha de un plan para probarlo.</p></div>`,
    apelaciones: () => appeals.map(appealCard).join('') || `<div class="empty-tab"><span class="empty-ic">${ico('repeat')}</span><p>No hay apelaciones. Apela una decisión desde Ajustes ▸ Estado de tu cuenta.</p></div>`,
    historial: () => history.map(a => { const u = getUser(a.targetUserId) || { name:'' };
      return `<div class="mod-card"><div class="mod-top"><b>${escapeHtml(u.name)}</b><span class="st st-${a.status}">${{ vigente:'Vigente', en_revision:'En revisión', revocada:'Anulada' }[a.status]}</span></div>
        <div class="mod-meta">${escapeHtml(MOD_ACTION_TYPES[a.action][1])} · ${dayLabel(a.decidedAt || a.at)}</div><p class="hint">${escapeHtml(statementFor(a))}</p></div>`; }).join(''),
  }[t];
  view.innerHTML = pageHead('Moderación') + `<div class="page-body inbox">
    <p class="hint mod-note">${ico('lock')} Herramienta interna del equipo de planes. En la app real es una web aparte con acceso por roles; aquí se simula para probar el circuito completo.</p>
    <div class="iseg origin-seg mod-tabs">${tabs.map(([v, l, n, c]) => `<button class="${t === v ? 'active' : ''}" onclick="renderModeration('${v}')">${ico(n)}<span>${l}</span>${c ? `<em>${c}</em>` : ''}</button>`).join('')}</div>
    ${body()}</div>`;
}
function modCard(rp){
  const u = getUser(rp.targetUserId) || { name:'Cuenta eliminada', handle:'' }, sev = severityOf(rp), [sl, sla] = SEVERITY_INFO[sev];
  const reps = REPORTS.filter(r => r.targetUserId === rp.targetUserId).length, prior = MOD_ACTIONS.filter(a => a.targetUserId === rp.targetUserId && a.status === 'vigente').length;
  const reporter = rp.source === 'automatico' ? `Filtro automático${rp.autoCategory ? ' · ' + escapeHtml((FILTER_CATS[rp.autoCategory] || {}).label || rp.autoCategory) : ''}` : `Reportado por ${escapeHtml((getUser(rp.reporterId || 'me') || { name:'' }).name)} (nunca se le dice a la otra persona)`;
  const c = contentOf(rp), held = c && c.held;
  return `<div class="mod-card sev-${sev}">
    <div class="mod-top"><span class="sev">${sl} · responder en ${sla}</span><span class="mod-age">${dayLabel(rp.at || Date.now())}</span></div>
    <div class="mod-meta"><b>${escapeHtml(reasonLabel(rp.reason))}</b> · ${OBJECT_LABEL[rp.objectType] || 'Perfil'}${held ? ' · retenido, sin publicar' : ''}</div>
    ${rp.evidence ? `<blockquote class="nudge-q">${escapeHtml(rp.evidence)}</blockquote>` : ''}
    <div class="mod-meta">${escapeHtml(u.name)} ${escapeHtml(u.handle || '')} · ${reps} ${reps === 1 ? 'reporte' : 'reportes'} · ${prior} ${prior === 1 ? 'sanción vigente' : 'sanciones vigentes'}${userMod(rp.targetUserId).strikes ? ' · ' + userMod(rp.targetUserId).strikes + (userMod(rp.targetUserId).strikes === 1 ? ' aviso' : ' avisos') : ''}</div>
    <div class="mod-meta dim">${reporter}</div>
    ${rp.paymentId ? (() => { const x = PAYMENTS.find(y => y.id === rp.paymentId); return x ? `<div class="mod-meta">${ico('euro')} Reclamación de un pago de ${money2(x.amount)} · ${escapeHtml(PAY_STATUS[x.status])}. El pago al anfitrión está en pausa.</div>` : ''; })() : ''}
    <div class="mod-acts">${rp.paymentId ? `<button class="ph-btn" onclick="applyModAction('${rp.id}','desestimar')">No procede</button><button class="ph-btn primary" onclick="applyModAction('${rp.id}','reembolsar')">Reembolsar</button>` : `${held ? `<button class="ph-btn" onclick="applyModAction('${rp.id}','publicar')">Publicar</button>` : `<button class="ph-btn" onclick="applyModAction('${rp.id}','desestimar')">Desestimar</button>`}
      ${c ? `<button class="ph-btn" onclick="applyModAction('${rp.id}','retirar')">Retirar</button>` : ''}
      <button class="ph-btn primary" onclick="openModActions('${rp.id}')">Más acciones</button>`}</div></div>`;
}
function openModActions(reportId){
  const rp = REPORTS.find(r => r.id === reportId); if (!rp) return;
  const c = contentOf(rp);
  const opts = ['desestimar', rp.paymentId ? 'reembolsar' : null, c && c.held ? 'publicar' : null, c ? 'retirar' : null, 'aviso', 'alcance', 'organizar', 'suspender7', 'suspender30', 'expulsar', 'autoridades'].filter(Boolean);
  showOverlay('ov-sheet', `<div class="sheet-bg" onclick="closeOverlay()"></div><div class="sheet" role="dialog" aria-label="Decidir">
    <div class="sheet-h"><span>Decidir</span><button class="sv-x" onclick="closeOverlay()" aria-label="Cerrar">${ico('close')}</button></div>
    <div class="sheet-list">${opts.map(k => `<button class="sh-row ${['expulsar','suspender30'].includes(k) ? 'danger' : ''}" onclick="applyModAction('${reportId}','${k}')">${ico(MOD_ACTION_TYPES[k][0])}<span>${MOD_ACTION_TYPES[k][1]}</span>${ico('chevR')}</button>`).join('')}
      <p class="hint">Cada decisión se comunica a la persona afectada con sus motivos y se puede apelar. Quien reportó recibe el resultado.</p></div></div>`);
}
function appealCard({ key, a, r }){
  if (r){ const u = getUser(r.targetUserId) || { name:'' };
    return `<div class="mod-card"><div class="mod-top"><b>Reporte desestimado</b><span class="mod-age">${dayLabel(r.appeal.at)}</span></div>
      <div class="mod-meta">Quien reportó a ${escapeHtml(u.name)} (${escapeHtml(reasonLabel(r.reason))}) pide otra revisión</div>
      <blockquote class="nudge-q">${escapeHtml(r.appeal.text)}</blockquote>
      <div class="mod-acts"><button class="ph-btn" onclick="resolveAppeal('${key}', false)">Mantener</button><button class="ph-btn primary" onclick="resolveAppeal('${key}', true)">Volver a revisar</button></div></div>`; }
  const u = getUser(a.targetUserId) || { name:'' };
  return `<div class="mod-card"><div class="mod-top"><b>${escapeHtml(u.name)} apela</b><span class="mod-age">${dayLabel(a.appeal.at)}</span></div>
    <div class="mod-meta">${escapeHtml(MOD_ACTION_TYPES[a.action][1])} · ${OBJECT_LABEL[a.objectType] || 'Cuenta'} · ${a.automated ? 'decisión automática' : 'decisión del equipo'}</div>
    ${a.evidence ? `<blockquote class="nudge-q">${escapeHtml(a.evidence)}</blockquote>` : ''}
    <p class="hint">Su motivo: ${escapeHtml(a.appeal.text)}</p>
    <div class="mod-acts"><button class="ph-btn" onclick="resolveAppeal('${key}', false)">Mantener la decisión</button><button class="ph-btn primary" onclick="resolveAppeal('${key}', true)">Anular la decisión</button></div></div>`;
}
function sosCard(e){
  const p = getPlan(e.planId), place = p && getPlace(p.placeId), active = e.status === 'activa';
  const loc = e.location ? `${e.location.lat.toFixed(4)}, ${e.location.lng.toFixed(4)} (±${Math.round(e.location.accuracy || 0)} m)` : (place ? place.name + ' · ' + place.city + ' (lugar del plan)' : 'Sin ubicación');
  return `<div class="mod-card ${active ? 'sev-critica' : ''}"><div class="mod-top"><span class="sev">${active ? 'SOS activo' : 'Cerrada'}</span><span class="mod-age">${dayLabel(e.at)}</span></div>
    <div class="mod-meta"><b>${escapeHtml(ME.name || 'Tú')}</b> · ${escapeHtml(p ? p.title : 'Sin plan')}</div>
    <div class="mod-meta">${ico('pin')} ${escapeHtml(loc)}</div>
    <div class="mod-meta dim">Contactos avisados: ${e.contacts && e.contacts.length ? escapeHtml(e.contacts.join(', ')) : 'ninguno'}${e.escalated ? ' · avisado el 112' : ''}${e.closedBy ? ' · cerrada por ' + (e.closedBy === 'usuario' ? 'la persona' : 'el equipo') : ''}</div>
    ${active ? `<div class="mod-acts"><button class="ph-btn" onclick="toast('Llamaría a ${escapeHtml(ME.name || '')} desde la centralita de seguridad')">Llamar</button>
      <button class="ph-btn" onclick="escalateSos('${e.id}')">Avisar al 112</button><button class="ph-btn primary" onclick="closeSos('${e.id}','equipo')">Cerrar</button></div>` : ''}</div>`;
}

/* ---------- contactos de confianza y SOS ---------- */
const MAX_TRUSTED = 3;
function trustedContacts(){ return ME.trustedContacts || []; }
function renderTrusted(){
  const view = document.getElementById('view-page'), list = trustedContacts();
  view.innerHTML = pageHead('Contactos de confianza') + `<div class="page-body form">
    <p class="hint">Hasta ${MAX_TRUSTED} personas, aunque no usen planes. Les llega un SMS con el plan, el sitio y la hora cuando lo compartes, y tu ubicación si pulsas SOS.</p>
    ${list.map(c => `<div class="conv"><span class="avatar conv-av">${escapeHtml(initials(c.name))}</span>
      <span class="conv-main"><b>${escapeHtml(c.name)}</b><span>${escapeHtml(c.phone)} · ${c.status === 'aceptado' ? 'Ha aceptado' : 'Invitación enviada'}</span></span>
      <button class="ph-btn sm" onclick="removeTrusted('${c.id}')">Quitar</button></div>`).join('')}
    ${list.length < MAX_TRUSTED ? `<div class="field"><label for="f-tname">Nombre ${counter('f-tname','name','')}</label><input ${lim('f-tname','name')} autocomplete="name" /></div>
      <div class="field"><label for="f-tphone">Teléfono</label><input id="f-tphone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+34 600 000 000" /></div>
      <button class="btn-primary" onclick="addTrusted()">${ico('plus')} Añadir contacto</button>` : `<p class="hint">Ya tienes ${MAX_TRUSTED} contactos.</p>`}
    <div class="opt-list" style="margin-top:16px">
      <div class="opt-row" onclick="toggleTrustPref('shareTrips')"><span class="or-ic">${ico('send')}</span><span class="or-l">Compartir cada plan al que vaya<span class="or-s">qué plan, dónde y a qué hora</span></span><span class="switch ${ME.shareTrips ? 'on' : ''}"><span class="knob"></span></span></div>
      <div class="opt-row" onclick="toggleTrustPref('safeCheck')"><span class="or-ic">${ico('clock')}</span><span class="or-l">Preguntarme si estoy bien al acabar<span class="or-s">si no respondes en 1 hora, avisamos a tus contactos</span></span><span class="switch ${ME.safeCheck ? 'on' : ''}"><span class="knob"></span></span></div>
    </div>
    <p class="hint">El botón SOS está en la ficha y en el chat de cada plan. Si estás en peligro, llama siempre al 112.</p>
  </div>`;
}
function addTrusted(){
  const name = clip(val('f-tname'), 'name'), phone = val('f-tphone').trim();
  if (!name){ toast('Escribe un nombre'); return; }
  if ((phone.match(/\d/g) || []).length < 9 || !/^\+?[\d\s.-]+$/.test(phone)){ toast('Escribe un teléfono válido'); return; }
  if (trustedContacts().length >= MAX_TRUSTED) return;
  const c = { id:newId('tc'), name, phone, status:'pendiente' };
  ME.trustedContacts = [...trustedContacts(), c]; saveState();
  toast(`Le hemos enviado un SMS a ${name.split(' ')[0]} para que acepte`); renderTrusted();
  setTimeout(() => { const x = trustedContacts().find(t => t.id === c.id); if (x){ x.status = 'aceptado'; saveState(); if (location.hash === '#/contactos-confianza') renderTrusted(); } }, 3000);   // demo: acepta
}
function removeTrusted(id){ ME.trustedContacts = trustedContacts().filter(c => c.id !== id); saveState(); renderTrusted(); }
function toggleTrustPref(k){ ME[k] = !ME[k]; saveState(); renderTrusted(); }
const contactNames = () => trustedContacts().map(c => c.name.split(' ')[0]);
function planShared(planId){ return (ME.shareTrips && state.joined.has(planId)) || SAFETY_EVENTS.some(e => e.type === 'compartir' && e.planId === planId); }
function activeSos(planId){ return SAFETY_EVENTS.find(e => e.type === 'sos' && e.status === 'activa' && (!planId || e.planId === planId)); }
function shareWithContacts(planId){
  if (!trustedContacts().length){ go('contactos-confianza'); return; }
  SAFETY_EVENTS.unshift({ id:newId('se'), type:'compartir', planId, at:Date.now(), contacts:contactNames() }); saveState();
  toast('Compartido con ' + contactNames().join(' y ') + ' por SMS'); rerenderSafety(planId);
}
function arrivedSafe(planId){
  SAFETY_EVENTS.unshift({ id:newId('se'), type:'llegada', planId, at:Date.now(), contacts:contactNames() }); saveState();
  toast(trustedContacts().length ? 'Avisado: ' + contactNames().join(' y ') + ' saben que estás bien' : 'Anotado');
}
// Bloque "Seguridad" de la ficha del plan.
function safetyBlock(p){
  const sos = activeSos(p.id), list = trustedContacts();
  return `<div class="block" id="safety-${p.id}"><h4>Seguridad</h4>
    ${sos ? `<div class="pl-banner bad">${ico('alert')}<div><b>Alerta SOS enviada</b><p>El equipo de seguridad la está atendiendo${sos.contacts.length ? (sos.contacts.length === 1 ? ' y lo sabe ' : ' y lo saben ') + escapeHtml(sos.contacts.join(' y ')) : ''}. Si estás en peligro, llama al 112.</p>
      <div class="pl-banner-b"><a class="ph-btn primary" href="tel:112">Llamar al 112</a><button class="ph-btn" onclick="closeSos('${sos.id}','usuario')">Estoy bien</button></div></div></div>` : ''}
    <div class="sos-row"><button class="sos-btn" onclick="openSos('${p.id}')" aria-label="SOS: pedir ayuda">SOS</button>
      <p>Si te sientes en peligro: llama al 112 y avisa a tus contactos y al equipo de seguridad con tu ubicación.</p></div>
    ${list.length ? (planShared(p.id) ? `<div class="safe-row">${ico('check')}<span>Compartido con ${escapeHtml(contactNames().join(' y '))}</span><button class="link-btn" onclick="arrivedSafe('${p.id}')">He llegado bien</button></div>`
        : `<button class="sh-row" onclick="shareWithContacts('${p.id}')">${ico('send')}<span>Compartir el plan con mis contactos de confianza</span>${ico('chevR')}</button>`)
      : `<button class="sh-row" onclick="go('contactos-confianza')">${ico('user')}<span>Añade un contacto de confianza</span>${ico('chevR')}</button>`}
    <div class="trust-row"><span class="trust">${ico('pin')} Punto de encuentro en la app</span><span class="trust">${ico('chat')} Sin dar tu teléfono</span></div>
    <button class="link-btn dim" onclick="reportPlan('${p.id}')">${ico('alert')} Reportar este plan</button>
  </div>`;
}
function rerenderSafety(planId){ if (location.hash === '#/plan/' + planId) renderDetail(planId); }
function openSos(planId){
  const list = trustedContacts();
  showOverlay('ov-sheet', `<div class="sheet-bg" onclick="closeOverlay()"></div><div class="sheet" role="dialog" aria-label="SOS">
    <div class="sheet-h"><span>SOS</span><button class="sv-x" onclick="closeOverlay()" aria-label="Cerrar">${ico('close')}</button></div>
    <div class="sheet-list form">
      <a class="btn-primary danger-btn sos-call" href="tel:112">Llamar al 112</a>
      <button class="btn-ghost" onclick="sendSos('${planId}')">${ico('alert')} Enviar alerta con mi ubicación</button>
      <p class="hint">Avisamos al equipo de seguridad de planes (atiende las 24 horas y puede llamarte)${list.length ? ' y a ' + escapeHtml(contactNames().join(' y ')) + ' por SMS' : ''}, con el plan y tu ubicación.${list.length ? '' : ' Añade contactos de confianza para avisarles también.'}</p>
    </div></div>`);
}
function sendSos(planId){
  const ev = { id:newId('se'), type:'sos', planId, at:Date.now(), status:'activa', contacts:contactNames(), location:null };
  SAFETY_EVENTS.unshift(ev); saveState(); closeOverlay();
  notify('seguridad', 'Alerta SOS enviada. El equipo de seguridad la está atendiendo.', { planId });
  toast('Alerta enviada' + (ev.contacts.length ? ' a ' + ev.contacts.join(' y ') + ' y' : '') + ' al equipo de seguridad');
  // Ubicación precisa si el navegador la da; si no, la del plan.
  try {
    if (typeof navigator !== 'undefined' && navigator.geolocation) navigator.geolocation.getCurrentPosition(
      pos => { ev.location = { lat:pos.coords.latitude, lng:pos.coords.longitude, accuracy:pos.coords.accuracy }; saveState(); }, () => {}, { enableHighAccuracy:true, timeout:8000 });
  } catch (e) {}
  rerenderSafety(planId);
}
function closeSos(id, by){
  const e = SAFETY_EVENTS.find(x => x.id === id); if (!e) return;
  e.status = 'cerrada'; e.closedBy = by; e.closedAt = Date.now(); saveState();
  toast(by === 'usuario' ? 'Alerta cerrada. Avisamos de que estás bien' : 'Alerta cerrada');
  if (location.hash.startsWith('#/moderacion')) renderModeration('sos'); else rerenderSafety(e.planId);
}
function escalateSos(id){ const e = SAFETY_EVENTS.find(x => x.id === id); if (!e) return; e.escalated = true; saveState(); toast('Datos enviados al 112: persona, plan y ubicación'); renderModeration('sos'); }

/* ---------- tus datos (RGPD) ---------- */
const CONSENTS = [
  ['marketing', 'Novedades y planes destacados por email', 'Consentimiento. Opcional.'],
  ['ubicacion', 'Ubicación para planes cerca de ti', 'Permiso del móvil. Sin él, eliges la ciudad a mano.'],
  ['analitica', 'Estadísticas de uso para mejorar la app', 'Consentimiento. Opcional.'],
  ['personalizacion', 'Recomendaciones según tu actividad', 'Interés legítimo: puedes oponerte.'],
];
function consentValue(k){
  if (k === 'marketing'){ const a = currentAccount(); return !!(a && a.consents && a.consents.marketing); }
  if (k === 'ubicacion') return !!ME.locationAllowed;
  const c = ME.consents || {}; return k === 'personalizacion' ? c[k] !== false : !!c[k];
}
function toggleConsent(k){
  const v = !consentValue(k);
  if (k === 'marketing'){ const a = currentAccount(); if (a) updateAccount(a.id, { consents: Object.assign({}, a.consents, { marketing:v }) }); }
  else if (k === 'ubicacion') ME.locationAllowed = v;
  else ME.consents = Object.assign({}, ME.consents, { [k]: v });
  ME.consentLog = [...(ME.consentLog || []), { key:k, value:v, at:new Date().toISOString() }].slice(-50);   // registro de cambios
  saveState(); renderMyData();
}
function renderMyData(){
  const view = document.getElementById('view-page'), a = currentAccount() || {};
  const n = exportCounts();
  view.innerHTML = pageHead('Tus datos') + `<div class="page-body">
    <div class="set-group"><div class="set-title">Descargar una copia</div>
      <div class="set-box"><p class="hint">Un archivo con tu cuenta, tu perfil, ${n.posts} publicaciones, ${n.comments} comentarios, ${n.ratings} valoraciones, ${n.messages} mensajes, a quién sigues, tus planes, notificaciones, reportes, decisiones de moderación y consentimientos. En la app real las fotos y los vídeos van en el mismo ZIP.</p>
        <button class="btn-primary" onclick="exportMyData()">${ico('download')} Descargar mis datos</button></div></div>
    <div class="set-group"><div class="set-title">Consentimientos</div>
      ${CONSENTS.map(([k, l, s]) => `<div class="toggle-row set" onclick="toggleConsent('${k}')"><span class="tg-info"><span class="tg-n">${l}</span><span class="tg-s">${s}</span></span><span class="switch ${consentValue(k) ? 'on' : ''}"><span class="knob"></span></span></div>`).join('')}
      <div class="set-row static"><span class="sr-ic">${ico('doc')}</span><span class="sr-l">Términos y privacidad<span class="or-s">Versión ${escapeHtml((a.consents && a.consents.version) || LEGAL_VERSION)}${a.consents && a.consents.at ? ' · aceptados el ' + new Date(a.consents.at).toLocaleDateString('es-ES') : ''}</span></span></div>
      <div class="set-row static"><span class="sr-ic">${ico('check')}</span><span class="sr-l">Mayor de 18 años<span class="or-s">Confirmado al registrarte</span></span></div></div>
    <div class="set-group"><div class="set-title">Tus derechos</div>
      <button class="set-row" onclick="go('editar-perfil')"><span class="sr-ic">${ico('user')}</span><span class="sr-l">Corregir tus datos</span><span class="pl-arrow">${ico('chevR')}</span></button>
      <div class="set-row static"><span class="sr-ic">${ico('doc')}</span><span class="sr-l">Oposición, limitación y otras peticiones<span class="or-s">privacidad@planes.app · te respondemos en menos de un mes</span></span></div>
      <button class="set-row danger" onclick="openDeleteAccount()"><span class="sr-ic">${ico('alert')}</span><span class="sr-l">Eliminar cuenta</span></button></div>
  </div>`;
}
function exportCounts(){
  const mine = POSTS.filter(p => p.authorId === 'me');
  return { posts: mine.length, comments: POSTS.reduce((s, p) => s + (p.comments || []).filter(c => c.userId === 'me').length, 0),
    ratings: RATINGS.filter(r => r.userId === 'me').length, messages: CONVERSATIONS.reduce((s, c) => s + c.messages.filter(m => m.from === 'me').length, 0) };
}
// Copia de tus datos (art. 15 y 20 del RGPD) en JSON legible por máquina.
function buildExport(){
  const a = currentAccount() || {};
  const strip = ({ hash, salt, ...rest }) => rest;   // la contraseña (cifrada) no se exporta
  return {
    generado: new Date().toISOString(), formato: 'planes-export-v1',
    cuenta: strip(a),
    perfil: { nombre:ME.name, usuario:ME.handle, descripcion:ME.bio, ciudad:ME.city, idiomas:ME.languages, intereses:ME.interests, perfilPublico:ME.profilePublic, presenciaPublica:ME.presencePublic, verificado:!!ME.verified, negocio:ME.business || null },
    perfilesProfesionales: USERS.filter(u => u.managedBy === 'me'),
    publicaciones: POSTS.filter(p => p.authorId === 'me'),
    comentarios: POSTS.flatMap(p => (p.comments || []).filter(c => c.userId === 'me').map(c => ({ publicacion:p.id, ...c }))),
    meGusta: POSTS.filter(p => p.likedByMe).map(p => p.id), guardados: POSTS.filter(p => p.savedByMe).map(p => p.id),
    valoraciones: RATINGS.filter(r => r.userId === 'me'),
    sigues: FOLLOWS.filter(f => f[0] === 'me').map(f => f[1]), teSiguen: FOLLOWS.filter(f => f[1] === 'me').map(f => f[0]),
    planes: { apuntado:[...state.joined], asistidos:ME.attendedPlanIds || [], organizados:PLANS.filter(p => p.hostId === 'me').map(p => ({ ...p, when: p.when instanceof Date ? p.when.toISOString() : p.when })) },
    mensajes: CONVERSATIONS.map(c => ({ id:c.id, tipo:c.type, con:c.with || null, plan:c.planId || null, mios:c.messages.filter(m => m.from === 'me') })),
    notificaciones: NOTIFICATIONS, bloqueados: ME.blocked || [],
    reportesEnviados: myReports().map(({ reporterId, ...r }) => r),
    decisionesSobreTi: MOD_ACTIONS.filter(x => x.targetUserId === 'me'),
    seguridad: { contactosDeConfianza: trustedContacts(), eventos: SAFETY_EVENTS },
    presenciaEnPlanes: ME.planPresence || {}, saludosEnviados: Object.keys(ME.pinged || {}),
    chispas: IDEAS.filter(x => x.authorId === 'me'), respuestasAChispas: IDEAS.filter(x => x.people.some(p => p.userId === 'me')).map(x => ({ chispa: x.id, estado: myIdeaStatus(x) })),
    pagos: PAYMENTS.filter(x => x.userId === 'me'), formasDePago: PAYMENT_METHODS.map(({ brand, last4, exp }) => ({ brand, last4, exp })),
    cobros: ME.payouts ? { ...ME.payouts, iban: maskIban(ME.payouts.iban), ventas: hostSales() } : null,
    consentimientos: { marketing: consentValue('marketing'), ubicacion: consentValue('ubicacion'), analitica: consentValue('analitica'), personalizacion: consentValue('personalizacion'), registro: ME.consentLog || [] },
  };
}
function exportMyData(){
  const json = JSON.stringify(buildExport(), null, 2);
  if (typeof Blob === 'undefined'){ toast('Este navegador no puede generar el archivo'); return; }
  saveFile(new Blob([json], { type:'application/json' }), `planes-mis-datos-${new Date().toISOString().slice(0, 10)}.json`).then(r => {
    if (r === 'saved') toast('Copia de tus datos descargada'); else if (r !== 'declined') toast('No se ha podido guardar el archivo');
  });
}
