/* =========================================================================
   Chispas: posibles planes (simulado en el navegador).
   "Estoy pensando ir a pescar, ¿alguien se anima?". Quien la lanza elige plazas (sin
   límite o un máximo), el mínimo para hacerlo, cuándo, dónde, quién puede apuntarse y
   los gastos; cada tema propone su configuración. La gente responde "Me apunto" o
   "Quizás". Al llegar al mínimo, se convierte en plan con un toque; si no, caduca.
   Lo que hará el servidor: docs/bucle-de-planes.md (Chispas).
   ========================================================================= */
const IDEA_WHEN = [['hoy','Hoy'],['finde','Este finde'],['semana','Esta semana'],['fecha','Un día concreto'],['sin_fecha','Cuando nos cuadre']];
const IDEA_COST = [['gratis','Gratis'],['a_escote','A escote'],['cada_uno','Cada uno lo suyo']];
const IDEA_WHO = [['todos','Cualquiera','globe'],['seguidores','Seguidores','users'],['amigos','Amigos','heartO']];
const IDEA_DAYS = 7;   // sin fecha, una chispa dura 7 días
// Cada tipo de plan propone su configuración (se puede cambiar).
const IDEA_PRESETS = {
  outdoor:  { limit:true,  max:8,  min:2, cost:'a_escote', why:'Rutas y salidas: grupo pequeño y gastos de transporte a escote.' },
  deporte:  { limit:true,  max:10, min:4, cost:'gratis',   why:'Un partido necesita un mínimo para jugar.' },
  gastro:   { limit:true,  max:6,  min:2, cost:'cada_uno', why:'Para reservar mesa conviene saber cuántos sois.' },
  cultura:  { limit:true,  max:4,  min:2, cost:'cada_uno', why:'Entradas y visitas: mejor en grupo pequeño.' },
  fiesta:   { limit:false,         min:3, cost:'cada_uno', why:'Cuantos más, mejor: sin límite de plazas.' },
  bienestar:{ limit:true,  max:8,  min:2, cost:'gratis',   why:'Grupo pequeño para que todos estén cómodos.' },
  social:   { limit:false,         min:2, cost:'cada_uno', why:'Abierto a quien quiera sumarse.' },
  viajeros: { limit:true,  max:6,  min:2, cost:'a_escote', why:'Para moverse juntos y repartir gastos.' },
};
const ideaLabel = (list, v) => (list.find(x => x[0] === v) || [, ''])[1];
const getIdea = (id) => IDEAS.find(x => x.id === id);
const ideaYes = (x) => x.people.filter(p => p.status === 'si');
const myIdeaStatus = (x) => (x.people.find(p => p.userId === 'me') || {}).status || null;
function ideaExpires(x){ return x.when === 'fecha' && x.date ? new Date(x.date).getTime() : (x.at || Date.now()) + IDEA_DAYS * 86400000; }
function ideaState(x){ if (x.status !== 'abierta') return x.status; return ideaExpires(x) < Date.now() ? 'caducada' : 'abierta'; }
const ideaFull = (x) => x.limit && ideaYes(x).length + 1 >= x.max;   // quien la lanza cuenta como una plaza
// Quién la ve: según "quién puede apuntarse", bloqueos y cuentas suspendidas.
function canSeeIdea(x){
  if (x.authorId === 'me') return true;
  if ((ME.blocked || []).includes(x.authorId) || isSanctioned(x.authorId) || x.removed || x.held) return false;
  if (x.who === 'seguidores') return follows('me', x.authorId) || follows(x.authorId, 'me');
  if (x.who === 'amigos') return areFriends('me', x.authorId);
  return true;
}
function visibleIdeas(){ return IDEAS.filter(x => canSeeIdea(x) && ideaState(x) === 'abierta').sort((a, b) => (b.at || 0) - (a.at || 0)); }
function whenText(x){ return x.when === 'fecha' && x.date ? fmtWhen(new Date(x.date)) : ideaLabel(IDEA_WHEN, x.when); }
function seatsText(x){ const n = ideaYes(x).length + 1; return x.limit ? `${n} de ${x.max}` : `${n} ${n === 1 ? 'persona' : 'personas'} · sin límite`; }

/* ---------- tarjetas y listas ---------- */
function ideaCard(x){
  const u = x.authorId === 'me' ? ME : (getUser(x.authorId) || { name:'' });
  const n = ideaYes(x).length + 1, reached = n >= (x.min || 1);
  return `<button class="idea-card" onclick="go('chispa/${x.id}')">
    <span class="idea-who"><span class="avatar sm">${escapeHtml(u.initials || initials(u.name))}</span><span>${x.authorId === 'me' ? 'Tú estás pensando' : escapeHtml(u.name.split(' ')[0]) + ' está pensando'}</span></span>
    <b class="idea-t">${escapeHtml(x.title)}</b>
    <span class="idea-m">${ico('clock')} ${escapeHtml(whenText(x))}</span>
    <span class="idea-m">${ico('users')} ${seatsText(x)}${reached ? '' : ` · faltan ${x.min - n}`}</span>
    <span class="idea-q">${ico('spark')} ¿Quién se anima?</span></button>`;
}
// Tira de chispas arriba de Disponibles.
function ideasStrip(){
  const list = visibleIdeas();
  return `<div class="ideas"><div class="ideas-h"><span>${ico('spark')} Chispas · ¿quién se anima?</span>
      <button class="link-btn" onclick="go('chispas')">Ver todas</button></div>
    <div class="ideas-row">${list.slice(0, 8).map(ideaCard).join('')}
      <button class="idea-card idea-new" onclick="go('crear-chispa')">${ico('plus')}<b class="idea-t">Lanza una chispa</b><span class="idea-m">"Estoy pensando… ¿alguien se anima?"</span></button></div></div>`;
}
function renderIdeas(){
  const view = document.getElementById('view-page');
  const list = visibleIdeas(), mine = IDEAS.filter(x => x.authorId === 'me' && ideaState(x) !== 'abierta');
  view.innerHTML = pageHead('Chispas') + `<div class="page-body">
    <p class="hint">Planes que alguien está pensando hacer. Si se anima suficiente gente, se convierten en plan.</p>
    <button class="btn-primary" onclick="go('crear-chispa')">${ico('spark')} Lanzar una chispa</button>
    <div class="ideas-list">${list.map(ideaCard).join('') || `<div class="empty-tab"><span class="empty-ic">${ico('spark')}</span><p>No hay chispas ahora mismo. Lanza la primera.</p></div>`}</div>
    ${mine.length ? `<div class="set-title" style="margin-top:16px">Tus chispas anteriores</div><div class="ideas-list">${mine.map(ideaCard).join('')}</div>` : ''}
  </div>`;
}

/* ---------- ficha de una chispa ---------- */
function renderIdea(id){
  const view = document.getElementById('view-page'), x = getIdea(id);
  if (!x || !canSeeIdea(x)){ view.innerHTML = pageHead('Chispa') + '<div class="empty-tab"><p>Esta chispa ya no está disponible.</p></div>'; return; }
  const mine = x.authorId === 'me', u = mine ? ME : (getUser(x.authorId) || { name:'' }), st = ideaState(x), my = myIdeaStatus(x);
  const yes = ideaYes(x), maybe = x.people.filter(p => p.status === 'quizas'), pend = x.people.filter(p => p.status === 'pendiente');
  const n = yes.length + 1, reached = n >= (x.min || 1), place = x.placeId && getPlace(x.placeId);
  const person = (p, extra) => { const v = getUser(p.userId) || { name:'' };
    return `<div class="here-row"><button class="avatar conv-av" onclick="go('u/${v.id}')" aria-label="Perfil de ${escapeHtml(v.name)}">${escapeHtml(v.initials || initials(v.name))}</button>
      <button class="conv-main lnk" onclick="go('u/${v.id}')"><b>${escapeHtml(v.name)}</b><span>${{ si:'Se apunta', quizas:'Quizás', pendiente:'Quiere ir' }[p.status]}</span></button>${extra || ''}</div>`; };
  const banner = st === 'convertida' ? `<div class="pl-banner">${ico('check')}<div><b>¡Ya es un plan!</b><p>Se animó suficiente gente.</p><div class="pl-banner-b"><button class="ph-btn primary" onclick="go('plan/${x.planId}')">Ver el plan</button></div></div></div>`
    : st === 'caducada' ? `<div class="pl-banner bad">${ico('clock')}<div><b>Esta chispa ha caducado</b><p>No llegó a convertirse en plan.</p></div></div>`
    : st === 'descartada' ? `<div class="pl-banner bad">${ico('close')}<div><b>${mine ? 'La has descartado' : 'Ya no sigue en pie'}</b></div></div>` : '';
  let actions = '';
  if (st === 'abierta' && mine) actions = `<div class="idea-acts">${reached ? `<p class="hint">${ico('check')} Ya sois ${n}: llegáis al mínimo.</p>` : `<p class="hint">Faltan ${x.min - n} para el mínimo (${x.min}).</p>`}
      <button class="btn-primary" onclick="convertIdea('${x.id}')">${ico('ticket')} Convertir en plan</button>
      <button class="btn-ghost" onclick="discardIdea('${x.id}')">Descartar la chispa</button></div>`;
  else if (st === 'abierta'){
    const full = ideaFull(x) && my !== 'si';
    actions = `<div class="idea-acts">
      <div class="idea-btns"><button class="btn-join ${my === 'si' || my === 'pendiente' ? 'done' : ''}" onclick="answerIdea('${x.id}','si')" ${full ? 'disabled' : ''}>${my === 'si' ? `${ico('check')} Te apuntas` : (my === 'pendiente' ? `${ico('clock')} Pendiente de ${escapeHtml(u.name.split(' ')[0])}` : (full ? 'Completa' : `${ico('spark')} Me apunto`))}</button>
        <button class="ph-btn ${my === 'quizas' ? 'primary' : ''}" onclick="answerIdea('${x.id}','quizas')">Quizás</button></div>
      ${my ? `<button class="link-btn dim" onclick="answerIdea('${x.id}', null)">Ya no me interesa</button>` : ''}
      <button class="btn-ghost" onclick="openDm('${x.authorId}')">${ico('chat')} Escribir a ${escapeHtml(u.name.split(' ')[0])}</button>
      ${x.approval ? `<p class="hint">${escapeHtml(u.name.split(' ')[0])} decide quién va.</p>` : ''}</div>`;
  }
  view.innerHTML = `<div class="page-bar"><button class="pb-back" onclick="history.back()" aria-label="Atrás">${ico('chevL')}</button><span class="pb-title">Chispa</span>
      ${mine ? '<span style="width:34px"></span>' : `<button class="pb-back" onclick="openReport('${x.authorId}', null, { objectType:'chispa', ideaId:'${x.id}' })" aria-label="Reportar la chispa">${ico('alert')}</button>`}</div>
    <div class="page-body idea-page">
      ${banner}
      <div class="idea-who big"><button class="avatar" onclick="go('${mine ? 'perfil' : 'u/' + x.authorId}')">${escapeHtml(u.initials || initials(u.name))}</button>
        <span><b>${mine ? 'Tú' : escapeHtml(u.name)}</b> ${mine ? 'estás pensando…' : 'está pensando…'}</span></div>
      <h2 class="idea-title">${escapeHtml(x.title)}</h2>
      <p class="idea-text">${escapeHtml(x.text)}</p>
      <div class="trust-row">
        <span class="trust">${ico('clock')} ${escapeHtml(whenText(x))}</span>
        ${x.zone || place ? `<span class="trust">${ico('pin')} ${escapeHtml(x.zone || place.name)}</span>` : ''}
        <span class="trust">${ico(ICON_FOR_CAT[x.category] || 'hash')} ${escapeHtml((getCategory(x.category) || {}).label || '')}</span>
        <span class="trust">${ico('users')} ${seatsText(x)}</span>
        <span class="trust">${ico('check')} Mínimo ${x.min || 1}</span>
        <span class="trust">${ico('euro')} ${escapeHtml(ideaLabel(IDEA_COST, x.cost))}${x.costNote ? ' · ' + escapeHtml(x.costNote) : ''}</span>
        ${x.who !== 'todos' ? `<span class="trust">${ico('lock')} Solo ${x.who === 'amigos' ? 'amigos' : 'seguidores'}</span>` : ''}
      </div>
      ${actions}
      <div class="block"><h4>Se animan · ${yes.length}</h4>${yes.map(p => person(p)).join('') || '<p class="hint">Aún nadie. Sé la primera persona.</p>'}
        ${maybe.length ? `<h4 style="margin-top:12px">Quizás · ${maybe.length}</h4>${maybe.map(p => person(p)).join('')}` : ''}
        ${mine && pend.length ? `<h4 style="margin-top:12px">Quieren ir · ${pend.length}</h4>${pend.map(p => person(p, `<span class="req-q"><button class="ico-btn no" onclick="decideIdea('${x.id}','${p.userId}',false)" aria-label="Rechazar">${ico('close')}</button><button class="ico-btn ok" onclick="decideIdea('${x.id}','${p.userId}',true)" aria-label="Aceptar">${ico('check')}</button></span>`)).join('')}` : ''}
      </div>
      <p class="hint">Una chispa no es todavía un plan: no hay pago ni dirección exacta. Cuando se convierte en plan, los que se apuntaron entran en él y en su chat.${st === 'abierta' ? ` Caduca ${x.when === 'fecha' ? 'en la fecha' : `a los ${IDEA_DAYS} días`} si no se convierte.` : ''}</p>
    </div>`;
}

/* ---------- responder ---------- */
function answerIdea(id, status){
  const x = getIdea(id); if (!x || ideaState(x) !== 'abierta' || x.authorId === 'me') return;
  if (status === 'si' && !requireVerified('Verifica tu identidad para apuntarte', () => answerIdea(id, status))) return;
  if (status === 'si' && ideaFull(x) && myIdeaStatus(x) !== 'si'){ toast('Ya no quedan plazas'); return; }
  x.people = x.people.filter(p => p.userId !== 'me');
  if (status) x.people.push({ userId:'me', status: status === 'si' && x.approval ? 'pendiente' : status });
  saveState();
  const u = getUser(x.authorId) || { name:'' };
  toast(status === 'si' ? (x.approval ? `Le avisamos a ${u.name.split(' ')[0]}: decide quién va` : `Te apuntas. ${u.name.split(' ')[0]} te avisará si se hace`) : (status === 'quizas' ? 'Marcado como quizás' : 'Ya no te interesa'));
  if (status === 'si' && x.approval) setTimeout(() => simulateIdeaAccept(id), 3000);   // demo: te acepta
  renderIdea(id);
}
function simulateIdeaAccept(id){
  const x = getIdea(id), p = x && x.people.find(q => q.userId === 'me' && q.status === 'pendiente'); if (!p) return;
  p.status = 'si'; saveState();
  notify('chispa', `${(getUser(x.authorId) || { name:'' }).name} te ha aceptado en su chispa "${x.title}".`, { route:'chispa/' + id });
  if (location.hash === '#/chispa/' + id) renderIdea(id);
}
// Quien la lanza: decide (si es con aprobación), convierte en plan o descarta.
function decideIdea(id, uid, ok){
  const x = getIdea(id); if (!x || x.authorId !== 'me') return;
  const p = x.people.find(q => q.userId === uid); if (!p) return;
  if (ok && ideaFull(x)){ toast('Ya no quedan plazas'); return; }
  if (ok) p.status = 'si'; else x.people = x.people.filter(q => q.userId !== uid);
  saveState(); renderIdea(id);
}
function discardIdea(id){ const x = getIdea(id); if (!x || x.authorId !== 'me') return; x.status = 'descartada'; saveState(); toast('Chispa descartada'); renderIdea(id); }
// Convertir en plan: el formulario de plan sale relleno; al publicar, entran los que se animaron.
function convertIdea(id){
  const x = getIdea(id); if (!x || x.authorId !== 'me') return;
  const max = x.limit ? x.max : 60;
  Object.assign(state.draft, { cat: x.category, size: max <= 8 ? 'intimo' : (max <= 20 ? 'mediano' : 'grande'), access: x.approval ? 'aprobacion' : 'libre', price:'gratis',
    fromIdea: id, prefill: { title: x.title, desc: x.text, placeId: x.placeId || '', date: x.when === 'fecha' && x.date ? x.date : '' } });
  go('crear-plan');
}
// Lo llama commitPlan (app.js) al publicar un plan que viene de una chispa.
function linkIdeaToPlan(plan){
  const x = getIdea(state.draft.fromIdea); state.draft.fromIdea = null; state.draft.prefill = null;
  if (!x) return;
  x.status = 'convertida'; x.planId = plan.id;
  plan.joinType = 'apuntado'; if (plan.approval === 'libre') plan.approval = 'automatica';
  const yes = ideaYes(x).map(p => p.userId);
  plan.joined = (plan.joined || 0) + yes.length;
  const chat = ensurePlanChat(plan.id); if (chat) yes.forEach(uid => { if (!chat.members.includes(uid)) chat.members.push(uid); });
  planChatSystem(plan.id, `Esta chispa ya es plan. Entran ${yes.length} ${yes.length === 1 ? 'persona que se animó' : 'personas que se animaron'}.`);
}

/* ---------- lanzar una chispa ---------- */
function freshIdeaDraft(cat){ const pr = IDEA_PRESETS[cat || 'outdoor']; return { category: cat || 'outdoor', when:'finde', date:'', zone:'', placeId:'', limit: pr.limit, max: pr.max || 8, min: pr.min, who:'todos', approval:false, cost: pr.cost, costNote:'', title:'', text:'' }; }
function renderCreateIdea(){
  const view = document.getElementById('view-page'), d = state.ideaDraft || (state.ideaDraft = freshIdeaDraft());
  const seg = (k, opts, icons) => `<div class="iseg">${opts.map(([v, l, n]) => `<button class="${String(d[k]) === v ? 'active' : ''}" onclick="setIdeaField('${k}','${v}')">${icons && n ? ico(n) : ''}<span>${l}</span></button>`).join('')}</div>`;
  view.innerHTML = pageHead('Lanzar una chispa') + `<div class="page-body form">
    <p class="hint">${ico('spark')} Cuenta qué estás pensando hacer y mira quién se anima. Si llegáis al mínimo, lo conviertes en plan con un toque.</p>
    <div class="field"><label for="f-ititle">¿Qué te apetece? ${counter('f-ititle','planTitle',d.title)}</label><input ${lim('f-ititle','planTitle')} placeholder="Ir a pescar al pantano" value="${escapeHtml(d.title)}"></div>
    <div class="field"><label for="f-itext">Cuéntalo ${counter('f-itext','groupAbout',d.text)}</label><textarea ${lim('f-itext','groupAbout')} rows="3" placeholder="Estoy pensando ir a pescar el sábado temprano. Llevo cañas de sobra. ¿Alguien se anima?">${escapeHtml(d.text)}</textarea></div>
    <div class="field"><label>Tema</label><div class="chips">${CATEGORIES.map(c => `<button class="${d.category === c.id ? 'active' : ''}" onclick="setIdeaCategory('${c.id}')">${ico(ICON_FOR_CAT[c.id] || 'hash')}<span>${c.label}</span></button>`).join('')}</div>
      <p class="hint">${escapeHtml(IDEA_PRESETS[d.category].why)} Te proponemos esta configuración; cámbiala si quieres.</p></div>
    <div class="field"><label>Cuándo</label><div class="chips">${IDEA_WHEN.map(([v, l]) => `<button class="${d.when === v ? 'active' : ''}" onclick="setIdeaField('when','${v}')"><span>${l}</span></button>`).join('')}</div>
      ${d.when === 'fecha' ? `<input id="f-idate" type="datetime-local" style="margin-top:8px" value="${escapeHtml(d.date)}">` : ''}</div>
    <div class="field"><label for="f-izone">Dónde (aproximado)</label><input id="f-izone" maxlength="${LIMITS.address}" placeholder="Pantano de San Juan" value="${escapeHtml(d.zone)}">
      <p class="hint">Basta con la zona. La dirección exacta, cuando sea plan.</p></div>
    <div class="field"><label>Plazas</label>${seg('limit', [['false','Sin límite'],['true','Con límite']])}
      ${d.limit ? `<div class="ck-two" style="margin-top:8px"><div class="field"><label for="f-imax">Máximo (contigo)</label><input id="f-imax" type="number" min="2" max="100" value="${d.max}"></div>
        <div class="field"><label for="f-imin">Mínimo para hacerlo</label><input id="f-imin" type="number" min="1" max="100" value="${d.min}"></div></div>`
        : `<div class="field" style="margin-top:8px"><label for="f-imin">Mínimo para hacerlo (contigo)</label><input id="f-imin" type="number" min="1" max="100" value="${d.min}"></div>`}</div>
    <div class="field"><label>Quién puede apuntarse</label>${seg('who', IDEA_WHO, true)}
      <div class="opt-row" onclick="setIdeaField('approval', ${!d.approval})" style="margin-top:8px"><span class="or-ic">${ico('check')}</span><span class="or-l">Decido yo quién va<span class="or-s">las respuestas te llegan como solicitudes</span></span><span class="switch ${d.approval ? 'on' : ''}"><span class="knob"></span></span></div></div>
    <div class="field"><label>Gastos</label>${seg('cost', IDEA_COST)}
      <input id="f-icost" maxlength="60" style="margin-top:8px" placeholder="Opcional: gasolina a escote, unos 10 € por persona…" value="${escapeHtml(d.costNote)}">
      <p class="hint">En una chispa no se paga nada. Si el plan es de pago, se cobra al convertirla en plan.</p></div>
    <div class="form-actions"><button class="btn-primary" onclick="publishIdea()">${ico('spark')} Lanzar la chispa</button></div>
  </div>`;
}
function captureIdea(){
  const d = state.ideaDraft; if (!d) return;
  d.title = val('f-ititle'); d.text = val('f-itext'); d.zone = val('f-izone'); d.costNote = val('f-icost');
  const dt = document.getElementById('f-idate'); if (dt) d.date = dt.value;
  const mx = parseInt(val('f-imax'), 10), mn = parseInt(val('f-imin'), 10);
  if (mx) d.max = mx; if (mn) d.min = mn;
}
function setIdeaField(k, v){ captureIdea(); state.ideaDraft[k] = v === 'true' ? true : (v === 'false' ? false : v); renderCreateIdea(); }
function setIdeaCategory(cat){
  captureIdea(); const pr = IDEA_PRESETS[cat], d = state.ideaDraft;
  Object.assign(d, { category: cat, limit: pr.limit, max: pr.max || d.max, min: pr.min, cost: pr.cost });
  renderCreateIdea();
}
function publishIdea(){
  captureIdea(); const d = state.ideaDraft;
  const title = clip(d.title, 'planTitle'), text = clip(d.text, 'groupAbout') || '¿Alguien se anima?';
  if (!title){ toast('Cuenta qué te apetece hacer'); return; }
  if (d.when === 'fecha' && !d.date){ toast('Elige el día'); return; }
  if (d.limit && !(d.max >= 2 && d.max <= 100)){ toast('El máximo va de 2 a 100 personas'); return; }
  if (!(d.min >= 1) || (d.limit && d.min > d.max)){ toast('El mínimo no puede ser mayor que el máximo'); return; }
  guardText(title + '\n' + text, { kind:'publicacion' }, flag => {
    const x = { id: newId('ch'), authorId:'me', title, text, category: d.category, when: d.when, date: d.date || null, zone: clip(d.zone, 'address'), placeId: '',
      limit: !!d.limit, max: d.limit ? d.max : null, min: d.min, who: d.who, approval: !!d.approval, cost: d.cost, costNote: (d.costNote || '').trim().slice(0, 60),
      people: [], status:'abierta', at: Date.now() };
    if (flag) x.held = true;
    IDEAS.unshift(x); state.ideaDraft = null; saveState();
    if (!flag){ toast('Chispa lanzada: te avisamos cuando alguien se anime'); simulateIdeaInterest(x.id); }
    go('chispa/' + x.id);
    return { objectType:'chispa', ideaId: x.id };
  });
}
// Demo: dos personas se animan a los pocos segundos.
function simulateIdeaInterest(id){
  const fans = ['nora', 'marco', 'lucia'];
  fans.slice(0, 2).forEach((uid, i) => setTimeout(() => {
    const x = getIdea(id); if (!x || ideaState(x) !== 'abierta' || x.people.some(p => p.userId === uid) || ideaFull(x)) return;
    x.people.push({ userId: uid, status: x.approval ? 'pendiente' : 'si' });
    const u = getUser(uid) || { name:'' }, n = ideaYes(x).length + 1;
    notify('chispa', x.approval ? `${u.name} quiere ir a tu chispa "${x.title}". Decide tú.` : `${u.name} se apunta a tu chispa "${x.title}".${n >= x.min ? ` Ya sois ${n}: ¿lo convertís en plan?` : ''}`, { route:'chispa/' + id });
    saveState(); if (location.hash === '#/chispa/' + id) renderIdea(id);
  }, 3000 + i * 3000));
}
