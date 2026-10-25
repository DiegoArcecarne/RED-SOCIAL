/* =========================================================================
   Agenda: el calendario de tus planes, con vistas de día, semana, mes y año.
   Va aparte de las notificaciones y se llega desde ellas (y desde la ficha del plan).
   Entra: los planes a los que vas y los que organizas, lo que está a medias (solicitud
   enviada, plaza por pagar o por confirmar, lista de espera), las chispas con día a las
   que te has apuntado y tu historial. Se puede llevar al calendario del móvil (.ics) o
   suscribirse a él. En la app real: docs/agenda.md.
   ========================================================================= */
const AG_VIEWS = [['dia','Día'],['semana','Semana'],['mes','Mes'],['ano','Año']];
// Tipo de entrada: etiqueta y estilo (firme = confirmado, pendiente = a medias, pasado, cancelado).
const AG_KIND = {
  organizas: ['Organizas','firm'], vas: ['Vas','firm'],
  pagar: ['Falta pagar','pend'], solicitud: ['Solicitud enviada','pend'], confirmar: ['Por confirmar','pend'], espera: ['Lista de espera','pend'], chispa: ['Chispa','pend'],
  asististe: ['Fuiste','past'], cancelado: ['Cancelado','off'],
};
const AG_DEFAULT_MIN = 120;   // duración si el plan no la indica
const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const DIAS_LARGOS = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
const DIAS_INI = ['L','M','X','J','V','S','D'];

/* ---------- fechas ---------- */
const pad2 = (n) => String(n).padStart(2, '0');
function dayKey(d){ d = new Date(d); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }
function parseDay(k){ const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(k || ''); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; }
function startOfDay(d){ const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function addDays(d, n){ const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function startOfWeek(d){ const x = startOfDay(d); return addDays(x, -((x.getDay() + 6) % 7)); }   // la semana empieza en lunes
const hhmm = (d) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
const isToday = (d) => dayKey(d) === dayKey(Date.now());
function dayTitle(d){ const x = new Date(d); return `${DIAS_LARGOS[x.getDay()]}, ${x.getDate()} de ${MESES[x.getMonth()]}${x.getFullYear() !== new Date().getFullYear() ? ' de ' + x.getFullYear() : ''}`; }

/* ---------- qué hay en tu agenda ---------- */
function planAgendaKind(p){
  const joined = state.joined.has(p.id);
  if (isCancelled(p)) return (joined || isHost(p)) ? 'cancelado' : null;
  if (state.attended.has(p.id)) return 'asististe';
  if (isHost(p)) return 'organizas';
  if (joined) return 'vas';
  const pay = myPayment(p.id); if (pay && pay.status === 'pendiente') return 'pagar';
  if (state.requested.has(p.id)) return 'solicitud';
  if ((p.ideaInvites || []).some(v => v.userId === 'me' && v.status === 'pendiente')) return 'confirmar';
  if ((p.waitlist || []).includes('me')) return 'espera';
  return null;
}
function agWhere(p){ if (isOnline(p)) return 'Videollamada'; const pl = getPlace(p.placeId); return p.secret || (pl && pl.secret) ? 'Lugar por desvelar' : (p.meetPoint || (pl ? pl.name : 'Madrid')); }
function agendaItems(){
  const out = [], end = (s, min) => new Date(s.getTime() + (min || AG_DEFAULT_MIN) * 60000);
  PLANS.forEach(p => {
    const kind = planAgendaKind(p); if (!kind) return;
    const start = new Date(p.when);
    out.push({ id:'pl-' + p.id, planId:p.id, title:p.title, start, end:end(start, p.durationMin), kind, where:agWhere(p), route:'plan/' + p.id });
  });
  IDEAS.forEach(x => {
    if (x.status === 'convertida' || x.when !== 'fecha' || !x.date) return;
    if (x.authorId !== 'me' && !(x.people || []).some(v => v.userId === 'me' && v.status === 'si')) return;
    const start = new Date(x.date); if (isNaN(start)) return;
    out.push({ id:'ch-' + x.id, ideaId:x.id, title:x.title, start, end:end(start), kind:'chispa', where:x.zone || 'Zona por decidir', route:'chispa/' + x.id });
  });
  AGENDA_HISTORY.forEach(h => { const start = new Date(h.when), pl = getPlace(h.placeId);
    out.push({ id:'h-' + h.id, planId:h.planId, title:h.title, start, end:end(start), kind: h.status === 'cancelaste' ? 'cancelado' : 'asististe', where: pl ? pl.name : 'Madrid', route:'plan/' + h.planId }); });
  return out.sort((a, b) => a.start - b.start);
}
const itemsOn = (items, d) => { const k = dayKey(d); return items.filter(i => dayKey(i.start) === k); };
// Lo que viene: lo que aún no ha terminado y no está cancelado.
function upcomingItems(){ const now = Date.now(); return agendaItems().filter(i => i.end.getTime() > now && i.kind !== 'cancelado' && i.kind !== 'asististe'); }

/* ---------- la pantalla ---------- */
function renderAgenda(arg){
  const [v, k] = String(arg || '').split('/');
  if (AG_VIEWS.some(x => x[0] === v)) state.agView = v;
  const d = parseDay(k); if (d) state.agDate = d;
  if (!state.agView) state.agView = 'semana';
  if (!state.agDate) state.agDate = startOfDay(Date.now());
  drawAgenda();
}
function agSet(view, key){ if (view) state.agView = view; if (key) state.agDate = parseDay(key); drawAgenda(); scrollTop('page'); }
function agStep(n){
  const d = new Date(state.agDate);
  if (state.agView === 'dia') d.setDate(d.getDate() + n);
  if (state.agView === 'semana') d.setDate(d.getDate() + 7 * n);
  if (state.agView === 'mes'){ d.setDate(1); d.setMonth(d.getMonth() + n); }
  if (state.agView === 'ano'){ d.setDate(1); d.setFullYear(d.getFullYear() + n); }
  state.agDate = d; drawAgenda();
}
function agToday(){ state.agDate = startOfDay(Date.now()); drawAgenda(); }
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
// "hoy", "mañana" o el día de la semana, con la hora.
function whenShort(d){ const k = dayKey(d); return (k === dayKey(Date.now()) ? 'hoy' : (k === dayKey(addDays(Date.now(), 1)) ? 'mañana' : DIAS_LARGOS[d.getDay()])) + ' ' + hhmm(d); }
function agTitle(){ return cap(agTitleRaw()); }
function agTitleRaw(){
  const d = new Date(state.agDate);
  if (state.agView === 'dia') return dayTitle(d);
  if (state.agView === 'mes') return `${MESES[d.getMonth()]} ${d.getFullYear()}`;
  if (state.agView === 'ano') return String(d.getFullYear());
  const a = startOfWeek(d), b = addDays(a, 6), m = (x) => MESES[x.getMonth()].slice(0, 3);
  return a.getMonth() === b.getMonth() ? `${a.getDate()} – ${b.getDate()} ${m(b)}` : `${a.getDate()} ${m(a)} – ${b.getDate()} ${m(b)}`;
}
function drawAgenda(){
  const view = document.getElementById('view-page'), items = agendaItems(), v = state.agView;
  const body = { dia: agDayView, semana: agWeekView, mes: agMonthView, ano: agYearView }[v](items);
  view.innerHTML = `<div class="page-bar"><button class="pb-back" onclick="history.back()" aria-label="Atrás">${ico('chevL')}</button>
      <span class="pb-title">Agenda</span><button class="pb-back" onclick="openAgendaExport()" aria-label="Llevar a tu calendario">${ico('download')}</button></div>
    <div class="page-body ag">
      <div class="iseg ag-seg" role="tablist">${AG_VIEWS.map(([k, l]) => `<button class="${v === k ? 'active' : ''}" role="tab" aria-selected="${v === k}" onclick="agSet('${k}')"><span>${l}</span></button>`).join('')}</div>
      <div class="ag-nav"><button class="ag-arrow" onclick="agStep(-1)" aria-label="Anterior">${ico('chevL')}</button>
        <b>${escapeHtml(agTitle())}</b>
        <button class="ag-arrow" onclick="agStep(1)" aria-label="Siguiente">${ico('chevR')}</button>
        <button class="ph-btn sm" onclick="agToday()">Hoy</button></div>
      ${body}
      <div class="ag-legend"><span><i class="k-firm"></i>Confirmado</span><span><i class="k-pend"></i>A medias</span><span><i class="k-past"></i>Pasado</span><span><i class="k-off"></i>Cancelado</span></div>
    </div>`;
}
// Fila de una entrada (semana, mes, entrada desde notificaciones).
function agRow(i){
  const [label, style] = AG_KIND[i.kind];
  return `<button class="ag-row k-${style}" onclick="go('${i.route}')"><span class="ag-t">${hhmm(i.start)}</span>
    <span class="ag-main"><b>${escapeHtml(i.title)}</b><span>${escapeHtml(i.where)}</span></span><em class="ag-tag">${label}</em></button>`;
}
const agEmpty = (txt) => `<div class="ag-empty"><p>${txt}</p><button class="link-btn" onclick="go('feed')">Buscar planes</button></div>`;

/* Día: franja horaria con cada plan en su hora (si coinciden, en columnas). */
function agDayView(items){
  const d = state.agDate, list = itemsOn(items, d), HOUR = 52;
  const from = Math.min(8, ...list.map(i => i.start.getHours())), to = Math.min(24, Math.max(23, ...list.map(i => i.start.getHours() + Math.ceil((i.end - i.start) / 3600000))));
  // Columnas para los que se solapan
  const cols = []; list.forEach(i => { let c = cols.findIndex(col => col[col.length - 1].end <= i.start); if (c < 0){ cols.push([]); c = cols.length - 1; } cols[c].push(i); i.col = c; });
  const n = Math.max(1, cols.length), top = (t) => ((t.getHours() + t.getMinutes() / 60) - from) * HOUR;
  const hours = Array.from({ length: to - from + 1 }, (_, k) => from + k).map(h => `<div class="ag-hr" style="top:${(h - from) * HOUR}px"><span>${pad2(h % 24)}:00</span></div>`).join('');
  const evs = list.map(i => { const [label, style] = AG_KIND[i.kind];
    const dayEnd = new Date(startOfDay(d).getTime() + to * 3600000), e = i.end > dayEnd ? dayEnd : i.end, h = Math.max(30, top(e) - top(i.start) - 3);
    return `<button class="ag-ev k-${style}" style="top:${top(i.start)}px;height:${h}px;left:calc(48px + (100% - 48px) * ${i.col} / ${n});width:calc((100% - 48px) / ${n} - 4px)" onclick="go('${i.route}')">
      <b>${escapeHtml(i.title)}</b><span>${hhmm(i.start)}–${hhmm(i.end)} · ${escapeHtml(i.where)}</span><em>${label}</em></button>`; }).join('');
  const now = new Date(), nowLine = isToday(d) && now.getHours() >= from && now.getHours() < to ? `<div class="ag-now" style="top:${top(now)}px" aria-hidden="true"></div>` : '';
  return `${list.length ? '' : agEmpty('Nada en tu agenda este día.')}${adCard(pickAgendaAd([startOfDay(d)], items))}
    <div class="ag-day" style="height:${(to - from) * HOUR + 12}px">${hours}${nowLine}${evs}</div>`;
}
/* Semana: los siete días, cada uno con sus planes. */
function agWeekView(items){
  const a = startOfWeek(state.agDate), days = Array.from({ length: 7 }, (_, k) => addDays(a, k));
  const ad = pickAgendaAd(days, items);   // como mucho un anuncio por semana (publicidad.js)
  return `<div class="ag-week">${days.map(d => { const list = itemsOn(items, d), adHere = ad && dayKey(ad.day) === dayKey(d) ? adCard(ad) : '';
    return `<div class="ag-wd ${isToday(d) ? 'today' : ''}"><button class="ag-wd-h" onclick="agSet('dia','${dayKey(d)}')" aria-label="Ver el ${escapeHtml(dayTitle(d))}"><b>${d.getDate()}</b><span>${DIAS_LARGOS[d.getDay()].slice(0, 3)}</span></button>
      <div class="ag-wd-items">${list.map(agRow).join('') || (adHere ? '' : '<span class="ag-free">Libre</span>')}${adHere}</div></div>`; }).join('')}</div>`;
}
/* Mes: cuadrícula con un punto por plan; al tocar un día, sus planes debajo. */
function agMonthView(items){
  const d = state.agDate, first = new Date(d.getFullYear(), d.getMonth(), 1), start = startOfWeek(first);
  const weeks = Math.ceil(((first.getDay() + 6) % 7 + new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()) / 7);
  const cells = Array.from({ length: weeks * 7 }, (_, k) => addDays(start, k)).map(c => {
    const list = itemsOn(items, c), out = c.getMonth() !== d.getMonth(), sel = dayKey(c) === dayKey(d);
    return `<button class="ag-cell ${out ? 'out' : ''} ${isToday(c) ? 'today' : ''} ${sel ? 'sel' : ''}" onclick="agSet(null,'${dayKey(c)}')" aria-label="${escapeHtml(dayTitle(c))}${list.length ? ': ' + list.length + (list.length === 1 ? ' plan' : ' planes') : ''}">
      <span>${c.getDate()}</span><i class="ag-dots">${list.slice(0, 3).map(i => `<i class="k-${AG_KIND[i.kind][1]}"></i>`).join('')}</i></button>`; }).join('');
  const list = itemsOn(items, d);
  return `<div class="ag-month"><div class="ag-mh">${DIAS_INI.map(x => `<span>${x}</span>`).join('')}</div><div class="ag-grid">${cells}</div></div>
    <div class="ag-sel"><div class="notif-h"><span>${escapeHtml(dayTitle(d))}</span><button class="link-btn" onclick="agSet('dia')">Ver el día</button></div>
      ${list.map(agRow).join('') || '<p class="ag-free">Nada este día.</p>'}${adCard(pickAgendaAd([startOfDay(d)], items))}</div>`;
}
/* Año: los doce meses en pequeño; los días con plan, marcados. */
function agYearView(items){
  const y = new Date(state.agDate).getFullYear(), has = new Set(items.filter(i => i.kind !== 'cancelado').map(i => dayKey(i.start)));
  return `<div class="ag-year">${MESES.map((m, mi) => {
    const first = new Date(y, mi, 1), blanks = (first.getDay() + 6) % 7, n = new Date(y, mi + 1, 0).getDate();
    const count = items.filter(i => i.start.getFullYear() === y && i.start.getMonth() === mi && i.kind !== 'cancelado').length;
    const days = Array.from({ length: n }, (_, k) => { const dd = new Date(y, mi, k + 1), on = has.has(dayKey(dd)); return `<i class="${on ? 'on' : ''} ${isToday(dd) ? 'today' : ''}">${k + 1}</i>`; }).join('');
    return `<button class="ag-mini" onclick="agSet('mes','${y}-${pad2(mi + 1)}-01')" aria-label="${m} de ${y}: ${count} ${count === 1 ? 'plan' : 'planes'}"><span class="ag-mini-h"><b>${m}</b><em>${count || ''}</em></span>
      <span class="ag-mini-g">${'<i></i>'.repeat(blanks)}${days}</span></button>`; }).join('')}</div>`;
}

/* ---------- desde las notificaciones ---------- */
function agendaEntry(){
  const up = upcomingItems(), next = up[0], wk = up.filter(i => i.start.getTime() < Date.now() + 7 * 86400000).length;
  return `<button class="ag-entry" onclick="go('agenda')"><span class="notif-ic">${ico('calendar')}</span>
    <span class="notif-t"><b>Tu agenda</b>${next ? `Próximo: ${escapeHtml(next.title)} · ${whenShort(next.start)}` : 'Sin planes a la vista'}<span>${wk} ${wk === 1 ? 'plan' : 'planes'} en los próximos 7 días</span></span>${ico('chevR')}</button>`;
}
// En la ficha del plan: verlo en la agenda o llevarlo al calendario del móvil.
function agendaActions(p){
  return `<div class="pl-actions"><button class="link-btn" onclick="go('agenda/dia/${dayKey(p.when)}')">Ver en tu agenda</button><button class="link-btn" onclick="downloadIcs('${p.id}')">Añadir al calendario del móvil</button></div>`;
}

/* ---------- al calendario del móvil (.ics) ---------- */
// Texto iCalendar (RFC 5545): fechas en UTC, líneas plegadas a 75 caracteres y aviso 2 h antes.
function icsEscape(s){ return String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n'); }
const icsDate = (d) => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
function icsFold(line){ const out = []; while (line.length > 75){ out.push(line.slice(0, 75)); line = ' ' + line.slice(75); } out.push(line); return out.join('\r\n'); }
function icsText(items){
  const ev = items.map(i => [
    'BEGIN:VEVENT', `UID:${i.id}@planes.app`, `DTSTAMP:${icsDate(Date.now())}`, `DTSTART:${icsDate(i.start)}`, `DTEND:${icsDate(i.end)}`,
    `SUMMARY:${icsEscape(i.title)}`, `LOCATION:${icsEscape(i.where)}`,
    `DESCRIPTION:${icsEscape(AG_KIND[i.kind][0] + '. Detalles y chat del plan en la app.')}`, `URL:${PUBLIC_BASE}/${i.route}`,
    `STATUS:${i.kind === 'cancelado' ? 'CANCELLED' : (AG_KIND[i.kind][1] === 'pend' ? 'TENTATIVE' : 'CONFIRMED')}`,
    'BEGIN:VALARM', 'ACTION:DISPLAY', 'TRIGGER:-PT2H', `DESCRIPTION:${icsEscape(i.title)}`, 'END:VALARM', 'END:VEVENT'].join('\n'));
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//planes//agenda//ES', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:Mis planes', ...ev.join('\n').split('\n')].concat('END:VCALENDAR').map(icsFold).join('\r\n') + '\r\n';
}
function downloadIcs(planId){
  const items = planId ? agendaItems().filter(i => i.planId === planId && i.id === 'pl-' + planId) : upcomingItems().filter(i => ['vas','organizas'].includes(i.kind));
  if (!items.length){ toast('No hay planes confirmados que añadir'); return; }
  if (typeof Blob === 'undefined'){ toast('Este navegador no puede generar el archivo'); return; }
  saveFile(new Blob([icsText(items)], { type:'text/calendar' }), planId ? `plan-${planId}.ics` : 'mis-planes.ics')
    .then(r => { if (r === 'saved') toast('Ábrelo para añadirlo a tu calendario'); else if (r !== 'declined') toast('No se ha podido guardar'); });
}
// Suscripción: una dirección secreta que el calendario del móvil consulta solo (se puede revocar).
function calToken(){ if (!ME.calToken) ME.calToken = newId('cal').replace(/[^a-z0-9]/gi, '').toLowerCase(); return ME.calToken; }
function calFeedUrl(){ return `${PUBLIC_BASE.replace(/^https?:/, 'webcal:')}/agenda/${calToken()}.ics`; }
function openAgendaExport(){
  showOverlay('ov-sheet', `<div class="sheet-bg" onclick="closeOverlay()"></div><div class="sheet" role="dialog" aria-label="Llevar a tu calendario">
    <div class="sheet-h"><span>Llevar a tu calendario</span><button class="sv-x" onclick="closeOverlay()" aria-label="Cerrar">${ico('close')}</button></div>
    <div class="sheet-list">
      <button class="sh-row" onclick="downloadIcs()">${ico('download')}<span>Descargar mis próximos planes (.ics)</span>${ico('chevR')}</button>
      <div class="set-title" style="margin-top:8px">Suscribirse (se actualiza solo)</div>
      <p class="hint">Añade esta dirección en Calendario (iPhone) o Google Calendar. Si un plan cambia de hora o se cancela, cambia también allí. El lugar de los planes secretos no aparece hasta que se desvela.</p>
      <div class="ag-feed"><code>${escapeHtml(calFeedUrl())}</code></div>
      <button class="sh-row" onclick="copyCalFeed()">${ico('link')}<span>Copiar la dirección</span>${ico('chevR')}</button>
      <button class="sh-row danger" onclick="revokeCalFeed()">${ico('close')}<span>Revocar la dirección (deja de funcionar la anterior)</span>${ico('chevR')}</button>
      <p class="hint">Es personal: quien la tenga ve tus planes. En la demo no hay servidor que la sirva.</p>
    </div></div>`);
}
function copyCalFeed(){
  const url = calFeedUrl();
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(() => toast('Dirección copiada'), () => toast(url));
    else toast(url);
  } catch (e) { toast(url); }
}
function revokeCalFeed(){ ME.calToken = null; calToken(); saveState(); toast('Dirección nueva: la anterior ya no funciona'); openAgendaExport(); }
