/* =========================================================================
   Herramientas internas (simulado en el navegador). En la app real es una web aparte
   para el equipo, con acceso por roles y registro de cada acción: docs/herramientas-internas.md.
   - Resumen: métricas del piloto (hipótesis H1-H6 con su semáforo) y datos vivos de la demo.
   - Usuarios: buscar, revisar verificación, suspender o reactivar, notas internas.
   - Planes: filtrar, destacar, retirar, aprobar lo retenido, cancelar con reembolso.
   - Negocios: verificación (documentos, reclamar un lugar del mapa).
   - Categorías: crear, renombrar, fusionar y jubilar.
   - Moderación (panel de confianza.js) y registro de todo lo que hace el equipo.
   ========================================================================= */
const ADMIN_LOG = [];      // quién hizo qué y cuándo (en la demo, siempre "Tú (admin)")
const USER_ADMIN = {};     // por usuario: verificación revisada o revocada, notas internas
const CAT_META = {};       // por categoría: estado (activa | fusionada | jubilada) y en cuál se fusionó
const PLACE_ADMIN = {};    // lugares del mapa reclamados por un negocio verificado
const ADMIN_TABS = [['resumen','Resumen','layers'],['usuarios','Usuarios','users'],['planes','Planes','ticket'],['negocios','Negocios','briefcase'],['categorias','Categorías','hash'],['moderacion','Moderación','shield'],['registro','Registro','doc']];
function adminLog(action, target){ ADMIN_LOG.unshift({ id: newId('al'), who: 'Tú (admin)', action, target, at: Date.now() }); if (ADMIN_LOG.length > 200) ADMIN_LOG.length = 200; }
// Aplica lo que el equipo ha cambiado en usuarios que no son tú (al cargar).
function applyUserAdmin(){ Object.entries(USER_ADMIN).forEach(([uid, a]) => { const u = getUser(uid); if (u && typeof a.verified === 'boolean') u.verified = a.verified; }); }

/* ---------- persistencia: lo del equipo es común a todas las cuentas del navegador ---------- */
const ADMIN_KEY = 'planes-admin';
function saveAdmin(){
  try { localStorage.setItem(ADMIN_KEY, JSON.stringify({ log: ADMIN_LOG, userAdmin: USER_ADMIN, catMeta: CAT_META, cats: CATEGORIES, biz: BIZ_VERIFICATIONS, places: PLACE_ADMIN })); } catch (e) {}
}
function loadAdmin(){
  let a = null;
  try { a = JSON.parse(localStorage.getItem(ADMIN_KEY) || 'null'); } catch (e) { return; }
  if (!a) return;
  if (Array.isArray(a.log)) ADMIN_LOG.splice(0, ADMIN_LOG.length, ...a.log);
  if (Array.isArray(a.biz)) BIZ_VERIFICATIONS.splice(0, BIZ_VERIFICATIONS.length, ...a.biz);
  (a.cats || []).forEach(c => { const cur = getCategory(c.id); if (cur) cur.label = c.label; else CATEGORIES.push({ id: c.id, label: c.label }); });
  Object.assign(USER_ADMIN, a.userAdmin || {}); Object.assign(CAT_META, a.catMeta || {}); Object.assign(PLACE_ADMIN, a.places || {});
  Object.entries(PLACE_ADMIN).forEach(([id, o]) => { const pl = getPlace(id); if (pl) Object.assign(pl, o); });
  applyUserAdmin();
}

/* ---------- categorías: solo las activas se usan al crear y al filtrar ---------- */
const catState = (id) => (CAT_META[id] || {}).estado || 'activa';
function activeCategories(){ return CATEGORIES.filter(c => catState(c.id) === 'activa'); }
function ideaPreset(cat){ return IDEA_PRESETS[cat] || { limit:true, max:8, min:2, cost:'cada_uno', why:'Configuración general: cámbiala si quieres.' }; }

/* ---------- métricas del piloto ---------- */
// Criterios de docs/plan-validacion-madrid.md (verde = seguir, ámbar = ajustar, rojo = parar o pivotar).
const STATUS_INFO = { verde:['Seguir','check','st-good'], ambar:['Ajustar','clock','st-warn'], rojo:['Parar o pivotar','alert','st-bad'] };
function pilotHypotheses(){
  const s = PILOT_STATS;
  const band = (v, green, amber) => v >= green ? 'verde' : (v >= amber ? 'ambar' : 'rojo');
  const h1 = s.registros >= 300 && s.activacion >= 40 ? 'verde' : (s.registros < 150 || s.activacion < 25 ? 'rojo' : 'ambar');
  return [
    { id:'H1', name:'Hay demanda de planes con desconocidos', value:`${s.registros} registros · ${s.activacion} % activación`, target:'≥ 300 y ≥ 40 %', status:h1 },
    { id:'H2', name:'Quien se apunta, aparece', value:`Gratis ${s.asistenciaGratis} % · pago ${s.asistenciaPago} %`, target:'Gratis ≥ 60 %; pago ≥ 85 %',
      status: s.asistenciaGratis >= 60 && s.asistenciaPago >= 85 ? 'verde' : band(s.asistenciaGratis, 999, 45) },
    { id:'H3', name:'La experiencia engancha', value:`${s.repeticion} % repite en 30 días`, target:'≥ 30 %', status: band(s.repeticion, 30, 15) },
    { id:'H4', name:'Existe disposición a pagar', value:`${s.aforoPago} % del aforo vendido`, target:'≥ 70 %', status: band(s.aforoPago, 70, 40) },
    { id:'H5', name:'El contenido se genera solo', value:`${s.planesConFotos} % de planes con fotos`, target:'≥ 50 %', status: band(s.planesConFotos, 50, 25) },
    { id:'H6', name:'La experiencia es segura y buena', value:`${String(s.valoracion).replace('.', ',')}/5 · ${s.incidentesGraves} incidentes graves`, target:'≥ 4,3/5 y 0 graves',
      status: s.incidentesGraves > 0 ? 'rojo' : band(s.valoracion, 4.3, 4.0) },
  ];
}
// Datos vivos de esta demo (lo que hay en el navegador).
function demoMetrics(){
  const people = USERS.filter(u => !u.managedBy);
  const verified = people.filter(u => u.verified).length;
  const live = PLANS.filter(p => !isCancelled(p) && !p.removed);
  const pay = PAYMENTS.filter(x => !x.past), gross = pay.reduce((t, x) => t + x.amount - x.refunded, 0);
  const ideas = IDEAS.length, conv = IDEAS.filter(x => x.status === 'convertida').length;
  return [
    ['Personas', String(people.length), `${verified} verificadas (${Math.round(verified / people.length * 100)} %)`],
    ['Planes activos', String(live.length), `${live.filter(p => p.paid).length} de pago`],
    ['Chispas', String(ideas), `${conv} ya son plan`],
    ['Cobrado en reservas', money(gross), `comisión ${money(gross * COMMISSION)}`],
    ['Reportes abiertos', String(REPORTS.filter(r => r.status === 'en_cola').length), `${SAFETY_EVENTS.filter(e => e.type === 'sos' && e.status === 'activa').length} SOS activos`],
    ['Negocios por verificar', String(BIZ_VERIFICATIONS.filter(b => ['pendiente','faltan_documentos'].includes(b.status)).length), (n => `${n} ${n === 1 ? 'verificado' : 'verificados'}`)(BIZ_VERIFICATIONS.filter(b => b.status === 'verificado').length)],
  ];
}
// Columnas de la métrica principal: asistencias verificadas por semana (una serie: sin leyenda).
function weeklyChart(){
  const W = 320, H = 150, pad = { l: 30, r: 8, t: 16, b: 24 }, bw = 24;
  const max = Math.max(...PILOT_WEEKS.map(w => w.asistencias)), top = Math.ceil(max / 25) * 25;
  const band = (W - pad.l - pad.r) / PILOT_WEEKS.length, y = (v) => pad.t + (H - pad.t - pad.b) * (1 - v / top);
  const ticks = [0, top / 2, top];
  const bars = PILOT_WEEKS.map((w, i) => {
    const x = pad.l + band * i + (band - bw) / 2, y0 = y(0), y1 = y(w.asistencias), r = 4, last = i === PILOT_WEEKS.length - 1;
    // Extremo de datos redondeado (4 px) y recto en la línea base.
    const d = `M${x},${y0} V${y1 + r} Q${x},${y1} ${x + r},${y1} H${x + bw - r} Q${x + bw},${y1} ${x + bw},${y1 + r} V${y0} Z`;
    return `<g class="wk-bar"><title>${w.w}: ${w.asistencias} asistencias verificadas de ${w.apuntados} apuntados</title>
      <rect x="${pad.l + band * i}" y="${pad.t}" width="${band}" height="${H - pad.t - pad.b}" fill="transparent"/>
      <path d="${d}" class="wk-col"/>${last ? `<text x="${x + bw / 2}" y="${y1 - 5}" text-anchor="middle" class="wk-val">${w.asistencias}</text>` : ''}
      <text x="${x + bw / 2}" y="${H - 8}" text-anchor="middle" class="wk-axis">S${i + 1}</text></g>`;
  }).join('');
  const grid = ticks.map(t => `<line x1="${pad.l}" x2="${W - pad.r}" y1="${y(t)}" y2="${y(t)}" class="wk-grid"/><text x="${pad.l - 6}" y="${y(t) + 3}" text-anchor="end" class="wk-axis">${t}</text>`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" class="wk-chart" role="img" aria-label="Asistencias verificadas por semana: ${PILOT_WEEKS.map(w => w.asistencias).join(', ')}">${grid}${bars}</svg>`;
}
function renderAdminSummary(){
  const last = PILOT_WEEKS[PILOT_WEEKS.length - 1], prev = PILOT_WEEKS[PILOT_WEEKS.length - 2];
  const delta = Math.round((last.asistencias - prev.asistencias) / prev.asistencias * 100);
  return `<div class="adm-sec"><div class="set-title">Piloto · semana ${PILOT_STATS.semana} de ${PILOT_STATS.semanas} <span class="adm-sim">datos simulados</span></div>
    <div class="adm-hero"><span>Asistencias verificadas esta semana</span><b>${last.asistencias}</b><em>${delta >= 0 ? '+' : ''}${delta} % frente a la semana anterior</em></div>
    ${weeklyChart()}
    <details class="adm-table"><summary>Ver como tabla</summary><table><tr><th>Semana</th><th>Registros</th><th>Activos</th><th>Planes</th><th>Apuntados</th><th>Asistencias</th></tr>
      ${PILOT_WEEKS.map(w => `<tr><td>${w.w}</td><td>${w.registros}</td><td>${w.activos}</td><td>${w.planes}</td><td>${w.apuntados}</td><td>${w.asistencias}</td></tr>`).join('')}</table></details>
    <div class="set-title" style="margin-top:14px">Hipótesis del piloto</div>
    ${pilotHypotheses().map(h => { const [l, icon, cls] = STATUS_INFO[h.status];
      return `<div class="adm-hyp"><span class="adm-st ${cls}">${ico(icon)}<span>${l}</span></span><div><b>${h.id} · ${escapeHtml(h.name)}</b><p>${escapeHtml(h.value)} · objetivo ${escapeHtml(h.target)}</p></div></div>`; }).join('')}
    <p class="hint">Criterios de docs/plan-validacion-madrid.md. Verde: seguir; ámbar: ajustar; rojo: parar o pivotar.</p></div>
  <div class="adm-sec"><div class="set-title">Esta demo, ahora</div>
    <div class="adm-kpis">${demoMetrics().map(([l, v, s]) => `<div><span>${escapeHtml(l)}</span><b>${escapeHtml(v)}</b><em>${escapeHtml(s)}</em></div>`).join('')}</div></div>`;
}

/* ---------- usuarios ---------- */
function userStatusLabel(uid){ const m = userMod(uid); return m.status === 'expulsada' ? 'Cerrada' : (isSanctioned(uid) ? 'Suspendida' : 'Activa'); }
function renderAdminUsers(){
  const q = norm(state.adminQ || '');
  const list = USERS.filter(u => !q || [u.name, u.handle, u.bio].some(f => norm(f).includes(q)));
  return `<div class="mp-search">${ico('search')}<input id="adm-q" placeholder="Buscar por nombre o usuario" value="${escapeHtml(state.adminQ || '')}" oninput="state.adminQ=this.value;renderAdminList()"></div>
    <div id="adm-list">${adminUserRows(list)}</div>`;
}
function adminUserRows(list){
  return list.map(u => { const reps = REPORTS.filter(r => r.targetUserId === u.id).length;
    return `<button class="adm-row" onclick="openAdminUser('${u.id}')"><span class="avatar conv-av">${escapeHtml(u.initials || initials(u.name))}</span>
      <span class="conv-main"><b>${escapeHtml(u.name)}${u.id === 'me' ? ' (tú)' : ''}</b><span>${escapeHtml(u.handle)} · ${u.verified ? 'Verificada' : 'Sin verificar'}${u.type === 'profesional' ? ' · profesional' : ''}${reps ? ` · ${reps} ${reps === 1 ? 'reporte' : 'reportes'}` : ''}</span></span>
      <span class="st ${userStatusLabel(u.id) === 'Activa' ? '' : 'st-bad'}">${userStatusLabel(u.id)}</span></button>`; }).join('') || '<p class="hint">Sin resultados.</p>';
}
function renderAdminList(){ const el = document.getElementById('adm-list'); if (!el) return; const q = norm(state.adminQ || ''); el.innerHTML = adminUserRows(USERS.filter(u => !q || [u.name, u.handle, u.bio].some(f => norm(f).includes(q)))); }
function openAdminUser(uid){
  const u = getUser(uid); if (!u) return;
  const a = USER_ADMIN[uid] || {}, m = userMod(uid), reps = REPORTS.filter(r => r.targetUserId === uid), acts = MOD_ACTIONS.filter(x => x.targetUserId === uid && x.status === 'vigente');
  showOverlay('ov-sheet', `<div class="sheet-bg" onclick="closeOverlay()"></div><div class="sheet" role="dialog" aria-label="Usuario">
    <div class="sheet-h"><span>${escapeHtml(u.name)}</span><button class="sv-x" onclick="closeOverlay()" aria-label="Cerrar">${ico('close')}</button></div>
    <div class="sheet-list form">
      <div class="adm-facts"><span>${escapeHtml(u.handle)}</span><span>${u.type === 'profesional' ? 'Cuenta profesional' + (u.managedBy ? ' de ' + escapeHtml(getUser(u.managedBy) ? getUser(u.managedBy).name : 'Marina') : '') : 'Persona'}</span>
        <span>${u.verified ? 'Identidad verificada' : 'Sin verificar'}${a.reviewedAt ? ' · revisada a mano' : ''}</span><span>Estado: ${userStatusLabel(uid)}${m.strikes ? ` · ${m.strikes} avisos` : ''}</span>
        <span>${reps.length} reportes · ${acts.length} sanciones vigentes</span><span>${(u.attendedPlanIds || []).length} planes asistidos · ${followerCount(u)} seguidores</span></div>
      <div class="field"><label for="f-anote">Nota interna (solo la ve el equipo)</label><textarea id="f-anote" rows="2" maxlength="500">${escapeHtml(a.note || '')}</textarea></div>
      <button class="ph-btn" onclick="saveAdminNote('${uid}')">Guardar nota</button>
      <div class="adm-acts">
        <button class="sh-row" onclick="closeOverlay();go('u/${uid}')">${ico('user')}<span>Ver perfil</span>${ico('chevR')}</button>
        ${uid === 'me' ? '' : (u.verified ? `<button class="sh-row danger" onclick="adminSetVerified('${uid}', false)">${ico('shield')}<span>Revocar la verificación</span>${ico('chevR')}</button>`
          : `<button class="sh-row" onclick="adminSetVerified('${uid}', true)">${ico('shield')}<span>Dar por verificada (revisión manual)</span>${ico('chevR')}</button>`)}
        ${uid === 'me' ? '' : (userStatusLabel(uid) === 'Activa' ? `<button class="sh-row danger" onclick="adminSuspend('${uid}', true)">${ico('clock')}<span>Suspender 7 días</span>${ico('chevR')}</button>`
          : `<button class="sh-row" onclick="adminSuspend('${uid}', false)">${ico('check')}<span>Reactivar la cuenta</span>${ico('chevR')}</button>`)}
        <button class="sh-row" onclick="adminLog('Envía enlace para restablecer la contraseña', '${escapeHtml(u.handle)}');saveState();toast('Enlace enviado (simulado)')">${ico('lock')}<span>Enviar enlace para restablecer la contraseña</span>${ico('chevR')}</button>
      </div>
      <p class="hint">Cada acción queda en el registro. Las sanciones por contenido se deciden en Moderación, con sus motivos y apelación.</p>
    </div></div>`);
}
function saveAdminNote(uid){ USER_ADMIN[uid] = Object.assign({}, USER_ADMIN[uid], { note: val('f-anote').trim().slice(0, 500) }); adminLog('Nota interna', (getUser(uid) || {}).handle); saveState(); toast('Nota guardada'); }
function adminSetVerified(uid, v){
  const u = getUser(uid); if (!u) return;
  u.verified = v; USER_ADMIN[uid] = Object.assign({}, USER_ADMIN[uid], { verified: v, reviewedAt: Date.now() });
  adminLog(v ? 'Verificación dada por buena (manual)' : 'Verificación revocada', u.handle); saveState();
  toast(v ? 'Verificación marcada como revisada' : 'Verificación revocada: no podrá ir a planes hasta verificarse de nuevo'); openAdminUser(uid);
}
function adminSuspend(uid, on){
  const u = getUser(uid); if (!u) return;
  setUserMod(uid, on ? { status:'suspendida', until: Date.now() + 7 * 86400000 } : { status:'activa', until:null });
  adminLog(on ? 'Suspende la cuenta 7 días' : 'Reactiva la cuenta', u.handle); saveState();
  toast(on ? 'Cuenta suspendida 7 días' : 'Cuenta reactivada'); openAdminUser(uid);
}

/* ---------- planes ---------- */
const PLAN_FILTERS = [['todos','Todos'],['reportes','Con reportes'],['revision','En revisión'],['pago','De pago'],['destacados','Destacados']];
function planAdminState(p){ return isCancelled(p) ? 'Cancelado' : (p.removed ? 'Retirado' : (p.held ? 'En revisión' : (p.when < Date.now() ? 'Pasado' : 'Activo'))); }
function renderAdminPlans(){
  const f = state.adminPlanFilter || 'todos';
  const reps = (p) => REPORTS.filter(r => r.planId === p.id).length;
  const list = PLANS.filter(p => f === 'todos' || (f === 'reportes' && reps(p)) || (f === 'revision' && (p.held || p.removed)) || (f === 'pago' && p.paid) || (f === 'destacados' && p.featured));
  return `<div class="adm-tabs adm-filt">${PLAN_FILTERS.map(([v, l]) => `<button class="${f === v ? 'active' : ''}" onclick="state.adminPlanFilter='${v}';renderAdmin('planes')"><span>${l}</span></button>`).join('')}</div>
    ${list.map(p => `<button class="adm-row" onclick="openAdminPlan('${p.id}')"><span class="mini-thumb ${p.gradient}">${coverImg(p.photo, 120)}</span>
      <span class="conv-main"><b>${escapeHtml(p.title)}${p.featured ? ' · destacado' : ''}</b><span>${escapeHtml((p.host || {}).name || '')} · ${fmtWhen(new Date(p.when))} · ${p.joined || 0} apuntados · ${p.attended || 0} asistencias${reps(p) ? ` · ${reps(p)} reportes` : ''}${p.paid ? ' · ' + money(p.price) : ''}</span></span>
      <span class="st ${planAdminState(p) === 'Activo' || planAdminState(p) === 'Pasado' ? '' : 'st-bad'}">${planAdminState(p)}</span></button>`).join('') || '<p class="hint">Ningún plan con este filtro.</p>'}`;
}
function openAdminPlan(id){
  const p = getPlan(id); if (!p) return;
  const st = planAdminState(p);
  showOverlay('ov-sheet', `<div class="sheet-bg" onclick="closeOverlay()"></div><div class="sheet" role="dialog" aria-label="Plan">
    <div class="sheet-h"><span>${escapeHtml(p.title)}</span><button class="sv-x" onclick="closeOverlay()" aria-label="Cerrar">${ico('close')}</button></div>
    <div class="sheet-list">
      <div class="adm-facts"><span>${st}</span><span>Organiza ${escapeHtml((p.host || {}).name || '')}</span><span>${p.joined || 0} apuntados · ${p.attended || 0} asistencias verificadas</span><span>${p.paid ? `De pago (${money(p.price)})` : 'Gratis'}${p.fromIdea ? ' · viene de una chispa' : ''}</span></div>
      <button class="sh-row" onclick="closeOverlay();go('plan/${id}')">${ico('ticket')}<span>Ver el plan</span>${ico('chevR')}</button>
      ${st === 'Cancelado' ? '' : `<button class="sh-row" onclick="adminPlan('${id}','destacar')">${ico('star')}<span>${p.featured ? 'Quitar de destacados' : 'Destacar en Descubrir'}</span>${ico('chevR')}</button>`}
      ${p.held ? `<button class="sh-row" onclick="adminPlan('${id}','aprobar')">${ico('check')}<span>Aprobar (lo retuvo el filtro)</span>${ico('chevR')}</button>` : ''}
      ${st === 'Cancelado' ? '' : (p.removed ? `<button class="sh-row" onclick="adminPlan('${id}','restaurar')">${ico('repeat')}<span>Restaurar</span>${ico('chevR')}</button>`
        : `<button class="sh-row danger" onclick="adminPlan('${id}','retirar')">${ico('eye')}<span>Retirar de Descubrir</span>${ico('chevR')}</button>`)}
      ${st === 'Cancelado' ? '' : `<button class="sh-row danger" onclick="adminPlan('${id}','cancelar')">${ico('close')}<span>Cancelar el plan${p.paid ? ' y reembolsar' : ''}</span>${ico('chevR')}</button>`}
      <p class="hint">Retirar o cancelar por incumplir las normas se hace desde Moderación, para que quede la exposición de motivos y se pueda apelar.</p>
    </div></div>`);
}
function adminPlan(id, action){
  const p = getPlan(id); if (!p) return;
  if (action === 'destacar') p.featured = !p.featured;
  if (action === 'aprobar') p.held = false;
  if (action === 'retirar') p.removed = true;
  if (action === 'restaurar') p.removed = false;
  if (action === 'cancelar'){ p.status = 'cancelado'; addPlanUpdate(p, 'cancelado', `El equipo de planes ha cancelado este plan.${p.paid ? ' Os devolvemos el 100 % de lo pagado.' : ''}`, { by:'equipo' }); if (p.paid) refundAllForPlan(p, 'Cancelado por planes: reembolso completo'); }
  adminLog({ destacar: p.featured ? 'Destaca el plan' : 'Quita el plan de destacados', aprobar:'Aprueba el plan retenido', retirar:'Retira el plan de Descubrir', restaurar:'Restaura el plan', cancelar:'Cancela el plan' }[action], p.title);
  saveState(); closeOverlay(); toast('Hecho'); renderAdmin('planes');
}

/* ---------- verificación de negocios ---------- */
const BIZ_STATUS = { pendiente:'Pendiente', faltan_documentos:'Faltan documentos', verificado:'Verificado', rechazado:'Rechazado' };
const BIZ_DOCS = ['CIF','Licencia de actividad','Titularidad del local','Seguro de responsabilidad civil'];
function renderAdminBiz(){
  const order = { pendiente:0, faltan_documentos:1, verificado:2, rechazado:3 };
  const list = BIZ_VERIFICATIONS.slice().sort((a, b) => order[a.status] - order[b.status] || a.at - b.at);
  return `<p class="hint">Los negocios verificados llevan la marca en su perfil y sus planes; si reclaman un lugar del mapa, pasa a ser suyo.</p>
    ${list.map(b => { const pl = b.placeId && getPlace(b.placeId);
      return `<div class="mod-card ${b.status === 'pendiente' ? 'sev-alta' : ''}"><div class="mod-top"><b>${escapeHtml(b.name)}</b><span class="st ${b.status === 'verificado' ? '' : (b.status === 'rechazado' ? 'st-bad' : 'st-en_cola')}">${BIZ_STATUS[b.status]}</span></div>
        <div class="mod-meta">${escapeHtml(b.category)} · NIF ${escapeHtml(b.taxId)} · ${escapeHtml(b.address)}${b.contact ? ' · contacto: ' + escapeHtml(b.contact) : ''}</div>
        ${pl ? `<div class="mod-meta">${ico('pin')} ${b.claim ? 'Reclama el lugar' : 'Lugar'}: ${escapeHtml(pl.name)}</div>` : ''}
        <div class="adm-docs">${BIZ_DOCS.map(d => `<span class="${(b.docs || []).includes(d) ? 'ok' : ''}">${ico((b.docs || []).includes(d) ? 'check' : 'close')} ${d}</span>`).join('')}</div>
        ${b.note ? `<p class="hint">${escapeHtml(b.note)}</p>` : ''}
        ${['pendiente','faltan_documentos'].includes(b.status) ? `<div class="mod-acts"><button class="ph-btn" onclick="decideBiz('${b.id}','rechazar')">Rechazar</button><button class="ph-btn" onclick="decideBiz('${b.id}','documentos')">Pedir documentos</button><button class="ph-btn primary" onclick="decideBiz('${b.id}','aprobar')">Verificar</button></div>` : ''}</div>`; }).join('')}`;
}
function decideBiz(id, action){
  const b = BIZ_VERIFICATIONS.find(x => x.id === id); if (!b) return;
  if (action === 'aprobar'){
    b.status = 'verificado'; b.decidedAt = Date.now(); b.note = '';
    const u = b.userId && getUser(b.userId); if (u){ u.verified = true; USER_ADMIN[u.id] = Object.assign({}, USER_ADMIN[u.id], { verified: true }); }
    if (b.claim && b.placeId){ const pl = getPlace(b.placeId); if (pl){ PLACE_ADMIN[pl.id] = { verified: true, kind: 'negocio' }; Object.assign(pl, PLACE_ADMIN[pl.id]); } }
    if (u && u.managedBy === 'me') notify('seguridad', `Hemos verificado tu negocio ${b.name}.`, { route:'u/' + u.id });
  }
  if (action === 'documentos'){ const miss = BIZ_DOCS.filter(d => !(b.docs || []).includes(d)).slice(0, 2); b.status = 'faltan_documentos'; b.note = `Pedido: ${miss.join(' y ') || 'documentación adicional'}.`; }
  if (action === 'rechazar'){ b.status = 'rechazado'; b.decidedAt = Date.now(); b.note = 'Los datos no coinciden con el registro mercantil.'; }
  adminLog({ aprobar:'Verifica el negocio', documentos:'Pide documentos al negocio', rechazar:'Rechaza la verificación del negocio' }[action], b.name);
  saveState(); toast({ aprobar:'Negocio verificado', documentos:'Le pedimos los documentos que faltan', rechazar:'Verificación rechazada' }[action]); renderAdmin('negocios');
}
// Al crear un perfil profesional, su verificación entra en la cola (lo llama createProfile en app.js).
function requestBizVerification(u){
  BIZ_VERIFICATIONS.push({ id: newId('bv'), userId: u.id, name: u.name, taxId: '—', category: (u.business || {}).category || 'Otro', address: (u.business || {}).address || 'Sin dirección',
    contact: ME.name, docs: [], status: 'pendiente', at: Date.now() });
}

/* ---------- categorías ---------- */
function renderAdminCats(){
  const count = (id) => PLANS.filter(p => p.category === id).length;
  return `<p class="hint">Las categorías no van fijas en el código: se crean, renombran, fusionan o jubilan desde aquí. Fusionar mueve sus planes y chispas a la otra.</p>
    ${CATEGORIES.map(c => { const st = catState(c.id), meta = CAT_META[c.id] || {};
      return `<div class="adm-row static"><span class="tag-av sm">${ico(ICON_FOR_CAT[c.id] || 'hash')}</span>
        <span class="conv-main"><b>${escapeHtml(c.label)}</b><span>${count(c.id)} ${count(c.id) === 1 ? 'plan' : 'planes'} · ${st === 'activa' ? 'Activa' : (st === 'fusionada' ? 'Fusionada en ' + escapeHtml((getCategory(meta.into) || {}).label || '') : 'Jubilada')}</span></span>
        ${st === 'activa' ? `<button class="ph-btn sm" onclick="openCatEdit('${c.id}')">Editar</button>` : `<button class="ph-btn sm" onclick="catAction('${c.id}','reactivar')">Reactivar</button>`}</div>`; }).join('')}
    <div class="field" style="margin-top:12px"><label for="f-newcat">Nueva categoría</label><div class="chat-in"><input id="f-newcat" maxlength="24" placeholder="Ej. Juegos de mesa"><button class="ph-btn primary sm" onclick="addCategory()">Añadir</button></div></div>`;
}
function openCatEdit(id){
  const c = getCategory(id); if (!c) return;
  showOverlay('ov-sheet', `<div class="sheet-bg" onclick="closeOverlay()"></div><div class="sheet" role="dialog" aria-label="Editar categoría">
    <div class="sheet-h"><span>${escapeHtml(c.label)}</span><button class="sv-x" onclick="closeOverlay()" aria-label="Cerrar">${ico('close')}</button></div>
    <div class="sheet-list form">
      <div class="field"><label for="f-catname">Nombre</label><input id="f-catname" maxlength="24" value="${escapeHtml(c.label)}"></div>
      <button class="btn-primary" onclick="catAction('${id}','renombrar')">Guardar el nombre</button>
      <div class="field"><label for="f-catinto">Fusionar en</label><select id="f-catinto">${activeCategories().filter(x => x.id !== id).map(x => `<option value="${x.id}">${escapeHtml(x.label)}</option>`).join('')}</select></div>
      <button class="btn-ghost" onclick="catAction('${id}','fusionar')">Fusionar (mueve sus planes y chispas)</button>
      <button class="btn-ghost" onclick="catAction('${id}','jubilar')">Jubilar (deja de salir al crear y al filtrar)</button>
    </div></div>`);
}
function catAction(id, action){
  const c = getCategory(id); if (!c) return;
  if (action === 'renombrar'){ const n = val('f-catname').trim().slice(0, 24); if (!n){ toast('Escribe un nombre'); return; } adminLog('Renombra la categoría', `${c.label} → ${n}`); c.label = n; }
  if (action === 'fusionar'){
    const into = val('f-catinto'); if (!into || into === id) return;
    PLANS.forEach(p => { if (p.category === id) p.category = into; }); IDEAS.forEach(x => { if (x.category === id) x.category = into; });
    CAT_META[id] = { estado:'fusionada', into }; adminLog('Fusiona la categoría', `${c.label} → ${(getCategory(into) || {}).label}`);
  }
  if (action === 'jubilar'){ CAT_META[id] = { estado:'jubilada' }; adminLog('Jubila la categoría', c.label); }
  if (action === 'reactivar'){ delete CAT_META[id]; adminLog('Reactiva la categoría', c.label); }
  if (state.category === id && catState(id) !== 'activa') state.category = 'todas';
  saveState(); closeOverlay(); buildFilters(); toast('Hecho'); renderAdmin('categorias');
}
function addCategory(){
  const n = val('f-newcat').trim().slice(0, 24); if (!n){ toast('Escribe el nombre'); return; }
  const id = norm(n).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || newId('cat');
  if (getCategory(id)){ toast('Ya existe'); return; }
  CATEGORIES.push({ id, label: n }); adminLog('Crea la categoría', n);
  saveState(); buildFilters(); toast('Categoría creada'); renderAdmin('categorias');
}

/* ---------- moderación y registro ---------- */
function renderAdminModeration(){
  const q = REPORTS.filter(r => r.status === 'en_cola'), crit = q.filter(r => severityOf(r) === 'critica').length;
  const appeals = MOD_ACTIONS.filter(a => a.appeal && a.appeal.status === 'pendiente').length + REPORTS.filter(r => r.appeal && r.appeal.status === 'pendiente').length;
  return `<div class="adm-kpis"><div><span>En cola</span><b>${q.length}</b><em>${crit} críticos</em></div><div><span>Apelaciones</span><b>${appeals}</b><em>pendientes</em></div>
    <div><span>SOS activos</span><b>${SAFETY_EVENTS.filter(e => e.type === 'sos' && e.status === 'activa').length}</b><em>atender ya</em></div></div>
    <button class="btn-primary" onclick="go('moderacion')">${ico('shield')} Abrir el panel de moderación</button>`;
}
function renderAdminLog(){
  return ADMIN_LOG.map(e => `<div class="adm-row static"><span class="conv-main"><b>${escapeHtml(e.action)}</b><span>${escapeHtml(e.target || '')} · ${escapeHtml(e.who)} · ${dayLabel(e.at)}</span></span></div>`).join('')
    || '<p class="hint">Aún no hay acciones. Todo lo que haga el equipo queda aquí, con quién y cuándo.</p>';
}

/* ---------- la pantalla ---------- */
function renderAdmin(tab){
  state.adminTab = tab || state.adminTab || 'resumen';
  const t = state.adminTab, view = document.getElementById('view-page');
  const body = { resumen: renderAdminSummary, usuarios: renderAdminUsers, planes: renderAdminPlans, negocios: renderAdminBiz, categorias: renderAdminCats, moderacion: renderAdminModeration, registro: renderAdminLog }[t] || renderAdminSummary;
  const badge = { negocios: BIZ_VERIFICATIONS.filter(b => b.status === 'pendiente').length, moderacion: REPORTS.filter(r => r.status === 'en_cola').length };
  view.innerHTML = pageHead('Administración') + `<div class="page-body inbox">
    <p class="hint mod-note">${ico('lock')} Herramienta interna del equipo. En la app real es una web aparte, con acceso por roles (administración, moderación, soporte y análisis) y registro de cada acción.</p>
    <div class="adm-tabs" role="tablist">${ADMIN_TABS.map(([v, l, n]) => `<button class="${t === v ? 'active' : ''}" role="tab" aria-selected="${t === v}" onclick="renderAdmin('${v}')">${ico(n)}<span>${l}</span>${badge[v] ? `<em>${badge[v]}</em>` : ''}</button>`).join('')}</div>
    ${body()}</div>`;
}
