/* =========================================================================
   Cuentas (simuladas en el navegador): bienvenida, registro e inicio de sesión
   con email o teléfono y código, recuperar contraseña, verificación en dos pasos,
   18+ y consentimientos, onboarding (perfil, intereses, ubicación, a quién seguir),
   seguridad de la cuenta y verificación de identidad paso a paso.

   Todo vive en este navegador (localStorage). En la app real lo hace el servidor:
   códigos, contraseñas, sesiones, proveedor de verificación y el bloqueo de las
   acciones que la requieren. Especificación: docs/cuentas-y-acceso.md.
   ========================================================================= */
const ACCOUNTS_KEY = 'planes-cuentas-v1';
const SESSION_KEY  = 'planes-sesion';
const DEMO_LOGIN = { email:'marina@planes.app', pass:'planes123' };
const OTP_TTL_MS = 10 * 60 * 1000, OTP_RESEND_MS = 30 * 1000, OTP_MAX_TRIES = 5;
const LOGIN_MAX_FAILS = 5, LOCK_MS = 15 * 60 * 1000;
const LEGAL_VERSION = '2026-10';
const CITIES = ['Madrid','Barcelona','Valencia','Sevilla','Bilbao','Burgos','Málaga','Zaragoza','Otra'];
const LANGS = [['es','Español'],['en','Inglés'],['fr','Francés'],['it','Italiano'],['de','Alemán'],['pt','Portugués']];

/* ---------- almacenamiento ---------- */
function lsGet(k){ try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v){ try { localStorage.setItem(k, v); } catch (e) {} }
function lsDel(k){ try { localStorage.removeItem(k); } catch (e) {} }
// Hash de demostración (no criptográfico). En la app real: Argon2id en el servidor.
function demoHash(pass, salt){
  let h1 = 0xdeadbeef ^ 7, h2 = 0x41c6ce57 ^ 7; const s = salt + ':' + pass;
  for (let i = 0; i < s.length; i++){ const c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16) + (h1 >>> 0).toString(16);
}
function accounts(){
  let list = [];
  try { list = JSON.parse(lsGet(ACCOUNTS_KEY) || '[]'); } catch (e) { list = []; }
  if (!Array.isArray(list)) list = [];
  if (!list.some(a => a.id === 'demo')){
    // Cuenta de demostración: Marina, con todo el contenido de ejemplo.
    list.unshift({ id:'demo', method:'email', email:DEMO_LOGIN.email, phone:'', salt:'demo', hash:demoHash(DEMO_LOGIN.pass, 'demo'),
      twoFA:null, birthdate:'1995-04-12', consents:{ legal:true, marketing:false, version:LEGAL_VERSION }, onboarded:true, createdAt:'2026-01-10' });
    lsSet(ACCOUNTS_KEY, JSON.stringify(list));
  }
  return list;
}
function saveAccounts(list){ lsSet(ACCOUNTS_KEY, JSON.stringify(list)); }
function getAccount(id){ return accounts().find(a => a.id === id) || null; }
function updateAccount(id, patch){ const list = accounts(); const a = list.find(x => x.id === id); if (a){ Object.assign(a, patch); saveAccounts(list); } return a; }
function sessionId(){ return lsGet(SESSION_KEY); }
function currentAccount(){ const id = sessionId(); return id ? getAccount(id) : null; }

/* ---------- validaciones ---------- */
const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
// Teléfono: los españoles de 9 cifras se completan con +34; el resto, con prefijo internacional.
function normPhone(s){
  const t = String(s || '').replace(/[\s().-]/g, '');
  if (/^[6789]\d{8}$/.test(t)) return '+34' + t;
  if (/^\+\d{8,15}$/.test(t)) return t;
  if (/^00\d{8,15}$/.test(t)) return '+' + t.slice(2);
  return '';
}
function passwordIssue(p, id){
  if ((p || '').length < 8) return 'Mínimo 8 caracteres.';
  if (!/[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(p) || !/\d/.test(p)) return 'Combina letras y números.';
  if (id && p.toLowerCase().includes(String(id).split('@')[0].toLowerCase())) return 'No uses tu email o teléfono en la contraseña.';
  return '';
}
function ageFrom(birth){
  const b = new Date(birth); if (isNaN(b)) return -1;
  const n = new Date(); let a = n.getFullYear() - b.getFullYear();
  if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a--;
  return a;
}
function findByIdentifier(idf){
  const v = String(idf || '').trim().toLowerCase(), ph = normPhone(v);
  return accounts().find(a => (a.email && a.email.toLowerCase() === v) || (ph && a.phone === ph)) || null;
}
function maskTo(to){ return to.includes('@') ? to.replace(/^(.).*(@.*)$/, '$1•••$2') : to.slice(0, 4) + ' ••• ' + to.slice(-3); }

/* ---------- códigos de un solo uso (simulados) ----------
   El "envío" se muestra como una notificación del sistema dentro del prototipo. */
function deliverCode(to, purpose, via){
  const code = String(Math.floor(100000 + Math.random() * 900000));
  state.otp = { code, purpose, to, via: via || (to.includes('@') ? 'email' : 'sms'), exp: Date.now() + OTP_TTL_MS, tries: 0, resendAt: Date.now() + OTP_RESEND_MS };
  const from = state.otp.via === 'app' ? 'Autenticador' : (state.otp.via === 'email' ? 'Correo · planes' : 'SMS · planes');
  showSimNotice(from, state.otp.via === 'app' ? `Código actual: ${code}` : `Tu código de planes es ${code}. Caduca en 10 minutos. No lo compartas con nadie.`, code);
  return code;
}
function showSimNotice(from, text, code){
  const n = document.getElementById('sim-note'); if (!n) return;
  n.innerHTML = `<button class="sim-in" onclick="fillCode('${code || ''}')"><span class="sim-app">${ico('chat')} ${escapeHtml(from)} · ahora</span><span>${escapeHtml(text)}</span>${code ? '<span class="sim-tap">Toca para rellenar</span>' : ''}</button>`;
  n.hidden = false; clearTimeout(n._t); n._t = setTimeout(() => { n.hidden = true; }, 12000);
}
function fillCode(code){ const i = document.getElementById('f-otp'); if (i && code){ i.value = code; } const n = document.getElementById('sim-note'); if (n) n.hidden = true; }
// Comprueba el código: caduca a los 10 min y admite 5 intentos.
function checkOtp(input){
  const o = state.otp;
  if (!o) return 'Pide un código nuevo.';
  if (Date.now() > o.exp) return 'El código ha caducado. Pide uno nuevo.';
  if (o.tries >= OTP_MAX_TRIES) return 'Demasiados intentos. Pide un código nuevo.';
  if (String(input || '').trim() !== o.code){ o.tries++; return `Código incorrecto. Te quedan ${OTP_MAX_TRIES - o.tries} intentos.`; }
  return '';
}
function resendCode(){
  const o = state.otp; if (!o) return;
  const wait = Math.ceil((o.resendAt - Date.now()) / 1000);
  if (wait > 0){ toast(`Puedes pedir otro código en ${wait} s`); return; }
  deliverCode(o.to, o.purpose, o.via); renderAuth();
}

/* ---------- contenedor de acceso ---------- */
function authEl(){ return document.getElementById('auth'); }
function showAuth(step, data){
  state.auth = Object.assign({ step, err:'' }, data ? { data } : { data: (state.auth && state.auth.data) || {} });
  state.auth.step = step;
  const el = authEl(); if (el) el.hidden = false;
  renderAuth();
}
function hideAuth(){ const el = authEl(); if (el){ el.hidden = true; el.innerHTML = ''; } state.auth = null; }
function authErr(msg){ state.auth.err = msg; renderAuth(); }
const ONBOARDING = ['perfil','intereses','ubicacion','seguir'];
function authHead(title, back, sub){
  const i = ONBOARDING.indexOf(state.auth.step);
  return `<div class="au-top">${back ? `<button class="pb-back" onclick="${back}" aria-label="Atrás">${ico('chevL')}</button>` : '<span></span>'}
    ${i >= 0 ? `<div class="au-steps" aria-label="Paso ${i+1} de ${ONBOARDING.length}">${ONBOARDING.map((_, k) => `<i class="${k <= i ? 'on' : ''}"></i>`).join('')}</div>` : '<span class="au-brand">planes</span>'}
    <span style="width:34px"></span></div>
    <h2 class="au-h">${title}</h2>${sub ? `<p class="au-sub">${sub}</p>` : ''}
    ${state.auth.err ? `<p class="au-err" role="alert">${ico('alert')} ${escapeHtml(state.auth.err)}</p>` : ''}`;
}
function renderAuth(){
  const el = authEl(); if (!el || !state.auth) return;
  const s = state.auth.step, d = state.auth.data;
  const R = { bienvenida: auWelcome, registro: auRegister, codigo: auCode, '2fa': auTwoFA, edad: auAge, menor: auMinor,
    entrar: auLogin, recuperar: auRecover, 'nueva-clave': auNewPass, perfil: auProfile, intereses: auInterests,
    ubicacion: auLocation, seguir: auFollow }[s];
  el.innerHTML = `<div class="au">${R ? R(d) : ''}</div>`;
}

/* ---------- pantallas ---------- */
function auWelcome(){
  const pics = PLANS.slice(0, 6).map(p => `<span class="au-pic ${p.gradient}">${coverImg(p.photo, 300)}</span>`).join('');
  return `<div class="au-hero">${pics}<span class="au-shade"></span></div>
    <div class="au-body">
      <span class="au-logo">planes</span>
      <h2 class="au-h big">Planes y gente con quien vivirlos</h2>
      ${destinoLabel() ? `<p class="au-shared">${ico('send')}<span>Te han compartido ${escapeHtml(destinoLabel())}. Entra o crea tu cuenta y te llevamos ahí.</span></p>` : ''}
      <ul class="au-vals">
        <li>${ico('compass')}<span>Descubre qué hacer hoy cerca de ti: atardeceres, cenas, rutas, conciertos.</span></li>
        <li>${ico('users')}<span>Ve con gente nueva o con tu grupo. No es una app de ligar.</span></li>
        <li>${ico('shield')}<span>Quien va a un plan ha verificado su identidad.</span></li>
      </ul>
      <button class="btn-primary" onclick="showAuth('registro', {})">Crear cuenta</button>
      <button class="btn-ghost" onclick="showAuth('entrar', {})">Ya tengo cuenta</button>
      <button class="link-btn au-demo" onclick="loginDemo()">Entrar con la cuenta de demostración</button>
      <button class="link-btn au-demo" onclick="openInstallHelp()">${ico('phone')} Instalar en el móvil</button>
    </div>`;
}
function auRegister(d){
  const m = d.method || 'email';
  return `${authHead('Crea tu cuenta', "showAuth('bienvenida', {})", 'Te enviaremos un código para confirmar que es tuyo.')}
    <div class="au-form">
      <div class="iseg">${[['email','Email','doc'],['telefono','Teléfono','phone']].map(([v,l,n]) => `<button class="${m===v?'active':''}" onclick="state.auth.data.method='${v}';state.auth.err='';renderAuth()">${ico(n)}<span>${l}</span></button>`).join('')}</div>
      <div class="field"><label for="f-id">${m==='email'?'Email':'Teléfono'}</label>
        <input id="f-id" ${m==='email' ? 'type="email" autocomplete="email" placeholder="tu@email.com"' : 'type="tel" autocomplete="tel" placeholder="612 345 678"'} value="${escapeHtml(d.identifier||'')}" /></div>
      <div class="field"><label for="f-pass">Contraseña</label>
        <input id="f-pass" type="password" autocomplete="new-password" placeholder="Mínimo 8, con letras y números" /></div>
      <button class="btn-primary" onclick="submitRegister()">Continuar</button>
      <p class="au-fine">¿Ya tienes cuenta? <button class="link-btn" onclick="showAuth('entrar', {})">Entra</button></p>
    </div>`;
}
function submitRegister(){
  const d = state.auth.data, m = d.method || 'email';
  const raw = val('f-id').trim(), pass = val('f-pass');
  d.identifier = raw;
  const id = m === 'email' ? raw.toLowerCase() : normPhone(raw);
  if (m === 'email' && !isEmail(id)) return authErr('Escribe un email válido.');
  if (m === 'telefono' && !id) return authErr('Escribe un teléfono válido (por ejemplo, 612 345 678 o +33 6 12 34 56 78).');
  if (findByIdentifier(id)) return authErr(`Ya hay una cuenta con ese ${m==='email'?'email':'teléfono'}. Entra o recupera la contraseña.`);
  const issue = passwordIssue(pass, id); if (issue) return authErr(issue);
  const salt = Math.random().toString(36).slice(2, 10);
  state.auth.data = { method:m, identifier:raw, pending:{ method:m, email: m==='email'?id:'', phone: m==='telefono'?id:'', salt, hash: demoHash(pass, salt) } };
  deliverCode(id, 'registro');
  showAuth('codigo');
}
function auCode(){
  const o = state.otp || { to:'', purpose:'' };
  const back = { registro:"showAuth('registro')", login2fa:"showAuth('entrar')", recuperar:"showAuth('recuperar')", '2fa-alta':"showAuth('2fa')" }[o.purpose] || "showAuth('bienvenida', {})";
  const title = o.purpose === 'login2fa' ? 'Verificación en dos pasos' : 'Escribe el código';
  const where = o.via === 'app' ? 'el código de tu app autenticadora' : `el código que hemos enviado a <b>${escapeHtml(maskTo(o.to))}</b>`;
  return `${authHead(title, back, `Introduce ${where}.`)}
    <div class="au-form">
      <input id="f-otp" class="otp" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="••••••" aria-label="Código de 6 cifras" onkeydown="if(event.key==='Enter')submitCode()" />
      <button class="btn-primary" onclick="submitCode()">Confirmar</button>
      ${o.via === 'app' ? '' : `<p class="au-fine">¿No te llega? <button class="link-btn" onclick="resendCode()">Enviar otro código</button></p>`}
      <p class="au-fine dim">Caduca en 10 minutos. Nunca te pediremos este código por teléfono.</p>
    </div>`;
}
function submitCode(){
  const err = checkOtp(val('f-otp')); if (err) return authErr(err);
  const o = state.otp; state.otp = null; state.auth.err = '';
  if (o.purpose === 'registro') return showAuth('2fa');
  if (o.purpose === '2fa-alta'){ state.auth.data.pending.twoFA = state.auth.data.twoMethod; toast('Verificación en dos pasos activada'); return showAuth('edad'); }
  if (o.purpose === 'login2fa') return finishLogin(state.auth.data.accountId);
  if (o.purpose === 'recuperar') return showAuth('nueva-clave');
}
// Paso 2 del onboarding: la verificación en dos pasos se ofrece, no se obliga.
function auTwoFA(d){
  const opts = [['app','App autenticadora','phone','La más segura: un código que cambia cada 30 s.'],['sms','SMS','chat','Te enviamos un código al móvil al entrar.'],['email','Email','doc','Te enviamos un código al correo al entrar.']];
  return `${authHead('Protege tu cuenta', '', 'Opcional. Además de la contraseña, te pediremos un código al entrar desde un dispositivo nuevo. Puedes activarla luego en Ajustes ▸ Seguridad.')}
    <div class="au-form">
      ${opts.map(([v,l,n,s]) => `<button class="au-opt ${d.twoMethod===v?'on':''}" onclick="state.auth.data.twoMethod='${v}';renderAuth()">${ico(n)}<span><b>${l}</b><span>${s}</span></span></button>`).join('')}
      <button class="btn-primary" ${d.twoMethod ? '' : 'disabled'} onclick="startTwoFA()">Activar</button>
      <button class="btn-ghost" onclick="showAuth('edad')">Ahora no</button>
    </div>`;
}
function startTwoFA(){
  const d = state.auth.data, p = d.pending, m = d.twoMethod;
  const to = m === 'sms' ? (p.phone || '') : (m === 'email' ? (p.email || '') : 'app');
  if (m === 'sms' && !to) return authErr('Tu cuenta es con email: para recibir SMS añade un teléfono en Ajustes ▸ Seguridad.');
  if (m === 'email' && !to) return authErr('Tu cuenta es con teléfono: elige SMS o app autenticadora.');
  if (m === 'app') showSimNotice('planes', 'Clave para tu app autenticadora: JBSW Y3DP EHPK 3PXP (simulada).');
  deliverCode(to, '2fa-alta', m === 'app' ? 'app' : m);
  showAuth('codigo');
}
function auAge(d){
  return `${authHead('Antes de empezar', '', 'planes es solo para mayores de 18 años.')}
    <div class="au-form">
      <div class="field"><label for="f-birth">Fecha de nacimiento</label><input id="f-birth" type="date" value="${escapeHtml(d.birth||'')}" max="${new Date().toISOString().slice(0,10)}" /></div>
      <label class="au-check"><input id="f-legal" type="checkbox" ${d.legal?'checked':''} />
        <span>He leído y acepto los <button class="link-btn" onclick="event.preventDefault();openLegal('terminos')">Términos</button>, la <button class="link-btn" onclick="event.preventDefault();openLegal('privacidad')">Política de privacidad</button> y el <button class="link-btn" onclick="event.preventDefault();openLegal('conducta')">Código de conducta</button>.</span></label>
      <label class="au-check"><input id="f-mkt" type="checkbox" ${d.marketing?'checked':''} /><span>Quiero recibir novedades y planes destacados por email (opcional).</span></label>
      <p class="au-fine dim">La ubicación, la verificación de identidad y los pagos te los pediremos aparte, solo cuando hagan falta.</p>
      <button class="btn-primary" onclick="submitAge()">Crear cuenta</button>
    </div>`;
}
function submitAge(){
  const d = state.auth.data; d.birth = val('f-birth'); d.legal = !!(document.getElementById('f-legal') || {}).checked; d.marketing = !!(document.getElementById('f-mkt') || {}).checked;
  const age = ageFrom(d.birth);
  if (age < 0) return authErr('Escribe tu fecha de nacimiento.');
  if (age < 18){ state.auth.data = {}; return showAuth('menor'); }   // no se crea la cuenta ni se guardan sus datos
  if (age > 110) return authErr('Revisa la fecha de nacimiento.');
  if (!d.legal) return authErr('Para crear la cuenta tienes que aceptar los Términos, la Política de privacidad y el Código de conducta.');
  createAccount(d);
}
function auMinor(){
  return `${authHead('Todavía no puedes usar planes', "showAuth('bienvenida', {})")}
    <div class="au-form"><p class="au-sub">planes es solo para mayores de 18 años, porque se queda en persona con gente que no conoces. No hemos guardado tus datos.</p>
    <button class="btn-ghost" onclick="showAuth('bienvenida', {})">Volver al inicio</button></div>`;
}
function openLegal(kind){
  const T = {
    terminos: ['Términos de uso', ['planes conecta a personas para hacer planes en persona; cada uno es responsable de su conducta.', 'Los planes de pago se cobran por adelantado y el dinero queda retenido hasta el plan; las cancelaciones siguen la política de cada plan.', 'Podemos retirar contenido o suspender cuentas que incumplan el Código de conducta.']],
    privacidad: ['Política de privacidad', ['Usamos tus datos para que la app funcione: cuenta, perfil, planes y mensajes.', 'La ubicación y la verificación de identidad se piden aparte y puedes retirarlas en Ajustes.', 'Puedes descargar o borrar tus datos cuando quieras (RGPD).']],
    conducta: ['Código de conducta', ['Respeto: nada de acoso, odio ni insistencia.', 'Consentimiento: pide permiso antes de fotografiar o grabar a alguien.', 'Seguridad: si algo va mal, usa el botón SOS o reporta.']],
  }[kind];
  showOverlay('ov-sheet', `<div class="sheet-bg" onclick="closeOverlay()"></div><div class="sheet" role="dialog" aria-label="${T[0]}">
    <div class="sheet-h"><span>${T[0]}</span><button class="sv-x" onclick="closeOverlay()" aria-label="Cerrar">${ico('close')}</button></div>
    <div class="sheet-list"><p class="hint">Resumen de la demo (versión ${LEGAL_VERSION}). El texto legal definitivo está pendiente de revisión.</p>
      <ul class="vg-list">${T[1].map(t => `<li>${ico('check')}<span>${t}</span></li>`).join('')}</ul></div></div>`);
}
// Crea la cuenta, inicia sesión y prepara un "mundo" nuevo (sin el contenido de Marina).
function createAccount(d){
  const p = d.pending, id = 'acc' + Date.now();
  const acc = { id, method:p.method, email:p.email, phone:p.phone, salt:p.salt, hash:p.hash, twoFA: p.twoFA ? { method:p.twoFA } : null,
    birthdate:d.birth, consents:{ legal:true, marketing:!!d.marketing, version:LEGAL_VERSION, at:new Date().toISOString() },
    onboarded:false, step:'perfil', failed:0, createdAt:new Date().toISOString() };
  const list = accounts(); list.push(acc); saveAccounts(list);
  lsSet(SESSION_KEY, id);
  freshWorld(); saveState();
  state.auth.data = {};
  showAuth('perfil');
}
// Una cuenta nueva empieza vacía: fuera todo lo que era de la persona de demostración.
function freshWorld(){
  Object.assign(ME, { name:'', handle:'', initials:'', bio:'', verified:false, type:'usuario', attendedPlanIds:[], followers:0, following:0,
    profilePublic:true, presencePublic:true, ratings:undefined, dmMode:'solicitud', blocked:[], rejectedFrom:[], business:undefined, profiles:undefined, city:'', languages:['es'], interests:[] });
  const drop = (arr, fn) => { for (let i = arr.length - 1; i >= 0; i--) if (fn(arr[i])) arr.splice(i, 1); };
  drop(POSTS, p => p.authorId === 'me');
  POSTS.forEach(p => { p.comments = (p.comments || []).filter(c => c.userId !== 'me'); p.likedByMe = false; p.savedByMe = false; });
  drop(STORIES, s => s.userId === 'me'); drop(LIVES, l => l.userId === 'me');
  drop(RATINGS, r => r.userId === 'me'); drop(FOLLOWS, f => f[0] === 'me' || f[1] === 'me');
  drop(CONVERSATIONS, () => true); drop(REQUESTS, r => r.userId === 'me'); drop(REPORTS, r => r.reporterId === 'me' || r.reporterId === undefined || r.targetUserId === 'me');
  drop(USERS, u => u.managedBy === 'me');
  GROUPS.forEach(g => { g.members = g.members.filter(m => m.userId !== 'me'); });
  state.joined = new Set(); state.attended = new Set(); state.requested = new Set(); state.reconfirmed = new Set(); state.presencePublic = true;
  drop(NOTIFICATIONS, () => true); drop(FOLLOW_REQUESTS, () => true);
  ME.mentions = {}; ME.mentionPolicy = 'todos'; ME.recentSearches = []; ME.stats = { noShows:0, lateCancels:0 }; ME.joinedPlanIds = []; ME.notifPrefs = undefined;
  ME.trustedContacts = []; ME.shareTrips = false; ME.safeCheck = false; ME.consents = undefined; ME.consentLog = [];
  drop(MOD_ACTIONS, a => a.targetUserId === 'me'); drop(SAFETY_EVENTS, () => true); delete USER_MOD.me;
  drop(PAYMENTS, x => x.userId === 'me'); drop(PAYMENT_METHODS, () => true); ME.payouts = undefined;
  ME.planPresence = {}; ME.pinged = {}; ME.calToken = null; AGENDA_HISTORY.length = 0;
  drop(IDEAS, x => x.authorId === 'me'); IDEAS.forEach(x => { x.people = x.people.filter(p => p.userId !== 'me'); });
  PLANS.forEach(p => { p.waitlist = (p.waitlist || []).filter(x => x !== 'me'); });
}

/* ---------- entrar, recuperar y salir ---------- */
function auLogin(d){
  return `${authHead('Entra en planes', "showAuth('bienvenida', {})")}
    <div class="au-form">
      <div class="field"><label for="f-id">Email o teléfono</label><input id="f-id" autocomplete="username" value="${escapeHtml(d.identifier||'')}" /></div>
      <div class="field"><label for="f-pass">Contraseña</label><input id="f-pass" type="password" autocomplete="current-password" onkeydown="if(event.key==='Enter')submitLogin()" /></div>
      <button class="btn-primary" onclick="submitLogin()">Entrar</button>
      <p class="au-fine"><button class="link-btn" onclick="showAuth('recuperar', { identifier: val('f-id') })">¿Has olvidado la contraseña?</button></p>
      <p class="au-fine dim">Demo: ${DEMO_LOGIN.email} · ${DEMO_LOGIN.pass}</p>
    </div>`;
}
function submitLogin(){
  const idf = val('f-id').trim(), pass = val('f-pass');
  state.auth.data.identifier = idf;
  const acc = findByIdentifier(idf);
  // Mismo mensaje exista o no la cuenta: no se desvela qué emails están registrados.
  const generic = 'Email, teléfono o contraseña incorrectos.';
  if (!acc) return authErr(generic);
  if (acc.lockedUntil && Date.now() < acc.lockedUntil) return authErr(`Demasiados intentos. Vuelve a probar en ${Math.ceil((acc.lockedUntil - Date.now()) / 60000)} min o recupera la contraseña.`);
  if (demoHash(pass, acc.salt) !== acc.hash){
    const failed = (acc.failed || 0) + 1;
    updateAccount(acc.id, failed >= LOGIN_MAX_FAILS ? { failed:0, lockedUntil: Date.now() + LOCK_MS } : { failed });
    return authErr(failed >= LOGIN_MAX_FAILS ? 'Demasiados intentos. Hemos bloqueado el acceso 15 minutos.' : generic);
  }
  updateAccount(acc.id, { failed:0, lockedUntil:null });
  if (acc.twoFA){
    state.auth.data.accountId = acc.id;
    const m = acc.twoFA.method, to = m === 'sms' ? acc.phone : (m === 'email' ? acc.email : 'app');
    deliverCode(to, 'login2fa', m === 'app' ? 'app' : m);
    return showAuth('codigo');
  }
  finishLogin(acc.id);
}
function finishLogin(id){
  lsSet(SESSION_KEY, id);
  updateAccount(id, { lastLogin: new Date().toISOString() });
  location.hash = takeDestino() || '#/feed'; location.reload();
}
/* Enlace compartido abierto sin sesión: se recuerda y, al entrar o terminar el registro,
   se va directamente a él (en la app nativa, el "deferred deep link" tras instalar). */
const DESTINO_KEY = 'planes-destino';
const SHARED_ROUTE = /^#\/(plan|p|u|tema)\/[\w.%-]+$/;
function rememberDestino(){ if (SHARED_ROUTE.test(location.hash || '')) lsSet(DESTINO_KEY, location.hash); }
function takeDestino(){ const d = lsGet(DESTINO_KEY); lsDel(DESTINO_KEY); return d && SHARED_ROUTE.test(d) ? d : null; }
function destinoLabel(){
  const d = lsGet(DESTINO_KEY); if (!d || !SHARED_ROUTE.test(d)) return '';
  const [, kind, id] = d.match(/^#\/(\w+)\/(.+)$/);
  if (kind === 'plan'){ const p = getPlan(id); return p ? 'el plan «' + p.title + '»' : 'un plan'; }
  if (kind === 'u'){ const u = getUser(id); return u ? 'el perfil de ' + u.name : 'un perfil'; }
  if (kind === 'p'){ const po = POSTS.find(x => x.id === id), u = po && getUser(po.authorId); return u ? 'una publicación de ' + u.name : 'una publicación'; }
  return 'el tema #' + decodeURIComponent(id);
}
function loginDemo(){ finishLogin('demo'); }
function auRecover(d){
  return `${authHead('Recupera tu contraseña', "showAuth('entrar')", 'Te enviaremos un código para crear una nueva.')}
    <div class="au-form">
      <div class="field"><label for="f-id">Email o teléfono de tu cuenta</label><input id="f-id" value="${escapeHtml(d.identifier||'')}" /></div>
      <button class="btn-primary" onclick="submitRecover()">Enviar código</button>
    </div>`;
}
function submitRecover(){
  const idf = val('f-id').trim(); const acc = findByIdentifier(idf);
  state.auth.data = { identifier: idf, accountId: acc ? acc.id : null };
  if (!acc){ toast('Si existe una cuenta con ese dato, te hemos enviado un código'); return; }   // sin desvelar si existe
  deliverCode(acc.email && idf.includes('@') ? acc.email : (acc.phone || acc.email), 'recuperar');
  showAuth('codigo');
}
function auNewPass(){
  return `${authHead('Nueva contraseña', '', 'Al cambiarla, cerraremos la sesión en tus otros dispositivos.')}
    <div class="au-form">
      <div class="field"><label for="f-pass">Contraseña nueva</label><input id="f-pass" type="password" autocomplete="new-password" placeholder="Mínimo 8, con letras y números" /></div>
      <div class="field"><label for="f-pass2">Repítela</label><input id="f-pass2" type="password" autocomplete="new-password" /></div>
      <button class="btn-primary" onclick="submitNewPass()">Guardar y entrar</button>
    </div>`;
}
function submitNewPass(){
  const id = state.auth.data.accountId, acc = getAccount(id); if (!acc) return showAuth('entrar', {});
  const p = val('f-pass'); const issue = passwordIssue(p, acc.email || acc.phone); if (issue) return authErr(issue);
  if (p !== val('f-pass2')) return authErr('Las contraseñas no coinciden.');
  updateAccount(id, { hash: demoHash(p, acc.salt), failed:0, lockedUntil:null });
  toast('Contraseña cambiada'); finishLogin(id);
}
function logout(){ lsDel(SESSION_KEY); location.hash = '#/feed'; location.reload(); }

/* ---------- onboarding ---------- */
function auProfile(){
  const langs = ME.languages || ['es'];
  return `${authHead('Tu perfil', '', 'Es tu perfil personal: el que verás en los planes y en el muro.')}
    <div class="au-form">
      <div class="ep-photo"><span class="avatar lg">${escapeHtml(ME.initials || '+')}</span><button class="pb-action" onclick="toast('Elegir foto estará disponible en la app')">Añadir foto</button></div>
      <div class="field"><label for="f-pname">Nombre ${counter('f-pname','name',ME.name)}</label><input ${lim('f-pname','name')} autocomplete="name" value="${escapeHtml(ME.name||'')}" placeholder="Cómo quieres que te llamen" /></div>
      <div class="field"><label for="f-puser">Nombre de usuario ${counter('f-puser','username',(ME.handle||'').replace(/^@/,''))}</label>
        <div class="at-input"><span>@</span><input id="f-puser" maxlength="${LIMITS.username}" autocapitalize="none" spellcheck="false" value="${escapeHtml((ME.handle||'').replace(/^@/,''))}" oninput="this.value=this.value.toLowerCase();countChars(this,'username')" /></div></div>
      <div class="field"><label for="f-pbio">Descripción (opcional) ${counter('f-pbio','bio',ME.bio)}</label><textarea ${lim('f-pbio','bio')} rows="2" placeholder="Qué planes te gustan">${escapeHtml(ME.bio||'')}</textarea></div>
      <div class="field"><label for="f-pcity">Ciudad (opcional)</label><select id="f-pcity"><option value="">Prefiero no decirlo</option>${CITIES.map(c => `<option ${ME.city===c?'selected':''}>${c}</option>`).join('')}</select></div>
      <div class="field"><label>Idiomas que hablas</label><div class="tag-chips">${LANGS.map(([v,l]) => `<button class="tag-chip ${langs.includes(v)?'active':''}" onclick="toggleLang('${v}')">${l}</button>`).join('')}</div></div>
      <div class="vg-note">${ico('shield')}<p>${VERIFY_WHY}</p></div>
      <button class="btn-primary" onclick="submitProfile()">Continuar</button>
    </div>`;
}
function captureProfile(){ ME.name = val('f-pname'); ME.handle = '@' + val('f-puser').trim().toLowerCase(); ME.bio = val('f-pbio'); ME.city = val('f-pcity'); }
function toggleLang(v){ captureProfile(); const l = ME.languages = ME.languages || ['es']; const i = l.indexOf(v); if (i >= 0){ if (l.length > 1) l.splice(i, 1); } else l.push(v); renderAuth(); }
function submitProfile(){
  const name = clip(val('f-pname'), 'name'); if (!name) return authErr('Escribe tu nombre.');
  const user = val('f-puser').trim().toLowerCase(); const err = usernameError(user, 'me'); if (err) return authErr(err);
  Object.assign(ME, { name, handle:'@' + user, initials: initials(name), bio: clip(val('f-pbio'), 'bio'), city: val('f-pcity') });
  stepDone('intereses');
}
function stepDone(next){ const a = currentAccount(); if (a) updateAccount(a.id, { step: next }); saveState(); state.auth.err = ''; showAuth(next); }
function auInterests(){
  const sel = ME.interests || [];
  return `${authHead('¿Qué planes te gustan?', "showAuth('perfil')", 'Elige al menos 3. Con esto ordenamos lo que ves desde el primer día.')}
    <div class="au-form">
      <div class="au-cats">${CATEGORIES.map(c => `<button class="au-cat ${sel.includes(c.id)?'on':''}" onclick="toggleInterest('${c.id}')" aria-pressed="${sel.includes(c.id)}">${ico(ICON_FOR_CAT[c.id]||'hash')}<span>${escapeHtml(c.label)}</span></button>`).join('')}</div>
      <div class="field"><label>Distancia de los planes</label><div class="iseg">${[5,10,25,50].map(k => `<button class="${(ME.radiusKm||10)===k?'active':''}" onclick="ME.radiusKm=${k};renderAuth()"><span>${k} km</span></button>`).join('')}</div></div>
      <button class="btn-primary" ${sel.length >= 3 ? '' : 'disabled'} onclick="stepDone('ubicacion')">Continuar${sel.length < 3 ? ` (${sel.length}/3)` : ''}</button>
    </div>`;
}
function toggleInterest(id){ const l = ME.interests = ME.interests || []; const i = l.indexOf(id); if (i >= 0) l.splice(i, 1); else l.push(id); renderAuth(); }
function auLocation(){
  return `${authHead('Planes cerca de ti', "showAuth('intereses')")}
    <div class="au-form">
      <span class="vg-ic au-big">${ico('pin')}</span>
      <p class="au-sub">Usamos tu ubicación para enseñarte planes cerca y lo que está pasando ahora mismo a tu alrededor. No la compartimos con nadie y puedes quitar el permiso en Ajustes.</p>
      <button class="btn-primary" onclick="askLocation()">Permitir ubicación</button>
      <button class="btn-ghost" onclick="ME.locationAllowed=false;stepDone('seguir')">Ahora no</button>
      <p class="au-fine dim">Sin ubicación la app funciona igual; solo pierdes "cerca de mí".</p>
    </div>`;
}
function askLocation(){
  const done = (ok) => { ME.locationAllowed = ok; toast(ok ? 'Ubicación permitida' : 'Sin ubicación: puedes activarla luego'); stepDone('seguir'); };
  if (typeof navigator !== 'undefined' && navigator.geolocation && /^https?:/.test(location.protocol || '')){
    try { navigator.geolocation.getCurrentPosition(() => done(true), () => done(false), { timeout: 8000 }); return; } catch (e) {}
  }
  done(true);   // en la demo sin geolocalización, se simula el permiso
}
// Sugerencias: locales y anfitriones verificados, y gente que encaja con tus intereses.
function followSuggestions(){
  const cats = new Set(ME.interests || []);
  return USERS.filter(u => u.id !== 'me' && !u.managedBy).map(u => {
    const hosted = PLANS.filter(p => p.host && p.host.name === u.name);
    const posts = POSTS.filter(p => p.authorId === u.id && p.planId && cats.has((getPlan(p.planId) || {}).category));
    const why = u.type === 'profesional' ? `Local verificado${u.business ? ' · ' + u.business.category : ''}${hosted.length ? ' · ' + hosted.length + ' planes' : ''}`
      : (posts.length ? `Comparte planes de ${escapeHtml((getCategory((getPlan(posts[0].planId) || {}).category) || {}).label || 'tus intereses')}` : 'Perfil destacado en tu ciudad');
    return { u, why, score: (u.type === 'profesional' ? 100 : 0) + posts.length * 10 + (u.followers || 0) / 100 };
  }).sort((a, b) => b.score - a.score);
}
function auFollow(){
  const list = followSuggestions();
  return `${authHead('Sigue a gente y sitios', "showAuth('ubicacion')", 'Así tu muro empieza lleno. Seguir no necesita que te sigan de vuelta.')}
    <div class="au-form">
      <button class="link-btn au-all" onclick="followAllSuggested()">Seguir a todos</button>
      ${list.map(({ u, why }) => { const on = follows('me', u.id);
        return `<div class="au-person"><span class="avatar conv-av">${escapeHtml(u.initials||initials(u.name))}</span>
          <span class="conv-main"><b>${escapeHtml(u.name)} ${u.verified?`<span class="vchk">${ico('check')}</span>`:''}${typeBadge(u)}</b><span>${why}</span></span>
          <button class="ph-btn ${on?'':'primary'} au-fbtn" onclick="toggleSuggested('${u.id}')">${on?'Siguiendo':'Seguir'}</button></div>`; }).join('')}
      <button class="btn-primary" onclick="finishOnboarding()">Empezar</button>
    </div>`;
}
function toggleSuggested(uid){ const i = FOLLOWS.findIndex(f => f[0] === 'me' && f[1] === uid); if (i >= 0) FOLLOWS.splice(i, 1); else FOLLOWS.push(['me', uid]); renderAuth(); }
function followAllSuggested(){ followSuggestions().forEach(({ u }) => { if (!follows('me', u.id)) FOLLOWS.push(['me', u.id]); }); renderAuth(); }
function finishOnboarding(){
  const a = currentAccount(); if (a) updateAccount(a.id, { onboarded:true, step:null });
  saveState(); hideAuth();
  state.contentTab = 'vividas'; location.hash = takeDestino() || '#/feed'; router();
  toast(`Te damos la bienvenida, ${(ME.name || '').split(' ')[0]}`);
}

/* ---------- seguridad de la cuenta (Ajustes ▸ Seguridad) ---------- */
function renderSecurity(){
  const view = document.getElementById('view-page'), a = currentAccount() || {};
  const two = a.twoFA ? { app:'App autenticadora', sms:'SMS', email:'Email' }[a.twoFA.method] : '';
  view.innerHTML = pageHead('Seguridad') + `<div class="page-body">
    <div class="set-group"><div class="set-title">Acceso</div>
      <div class="set-row static"><span class="sr-ic">${ico('doc')}</span><span class="sr-l">Email</span><span class="soon">${escapeHtml(a.email || 'Sin email')}</span></div>
      <div class="set-row static"><span class="sr-ic">${ico('phone')}</span><span class="sr-l">Teléfono</span><span class="soon">${escapeHtml(a.phone || 'Sin teléfono')}</span></div>
      <button class="set-row" onclick="openChangePass()"><span class="sr-ic">${ico('lock')}</span><span class="sr-l">Cambiar contraseña</span><span class="pl-arrow">${ico('chevR')}</span></button>
      <button class="set-row" onclick="${a.twoFA ? 'disableTwoFA()' : 'openEnableTwoFA()'}"><span class="sr-ic">${ico('shield')}</span><span class="sr-l">Verificación en dos pasos</span><span class="soon">${two ? 'Activada · ' + two : 'Desactivada'}</span><span class="pl-arrow">${ico('chevR')}</span></button>
    </div>
    <div class="set-group"><div class="set-title">Identidad</div>
      <button class="set-row" onclick="${isVerified() ? "toast('Identidad verificada')" : "requireVerified('Verifica tu identidad')"}"><span class="sr-ic">${ico('check')}</span><span class="sr-l">Verificación de identidad</span><span class="soon">${isVerified() ? 'Verificada' : 'Sin verificar'}</span><span class="pl-arrow">${ico('chevR')}</span></button>
    </div>
    <div class="set-group"><div class="set-title">Dónde has iniciado sesión</div>
      <div class="set-row static"><span class="sr-ic">${ico('phone')}</span><span class="sr-l">Este dispositivo<span class="or-s">Ahora mismo</span></span></div>
      ${a.id === 'demo' ? `<div class="set-row static"><span class="sr-ic">${ico('phone')}</span><span class="sr-l">iPhone · Madrid<span class="or-s">Hace 2 días</span></span><button class="ph-btn" onclick="this.closest('.set-row').remove();toast('Sesión cerrada en ese dispositivo')">Cerrar</button></div>` : ''}
    </div>
    <div class="set-group">
      <button class="set-row" onclick="logout()"><span class="sr-ic">${ico('logout')}</span><span class="sr-l">Cerrar sesión</span></button>
      <button class="set-row danger" onclick="openDeleteAccount()"><span class="sr-ic">${ico('alert')}</span><span class="sr-l">Eliminar cuenta</span></button>
    </div></div>`;
}
function openChangePass(){
  showOverlay('ov-sheet', `<div class="sheet-bg" onclick="closeOverlay()"></div><div class="sheet" role="dialog" aria-label="Cambiar contraseña">
    <div class="sheet-h"><span>Cambiar contraseña</span><button class="sv-x" onclick="closeOverlay()" aria-label="Cerrar">${ico('close')}</button></div>
    <div class="sheet-list form">
      <div class="field"><label for="f-cur">Contraseña actual</label><input id="f-cur" type="password" autocomplete="current-password" /></div>
      <div class="field"><label for="f-new">Contraseña nueva</label><input id="f-new" type="password" autocomplete="new-password" placeholder="Mínimo 8, con letras y números" /></div>
      <p class="hint" id="cp-err"></p>
      <button class="btn-primary" onclick="changePass()">Guardar</button></div></div>`);
}
function changePass(){
  const a = currentAccount(); if (!a) return;
  const errEl = document.getElementById('cp-err'); const fail = (m) => { if (errEl) errEl.textContent = m; toast(m); };
  if (demoHash(val('f-cur'), a.salt) !== a.hash) return fail('La contraseña actual no es correcta.');
  const issue = passwordIssue(val('f-new'), a.email || a.phone); if (issue) return fail(issue);
  updateAccount(a.id, { hash: demoHash(val('f-new'), a.salt) }); closeOverlay(); toast('Contraseña cambiada');
}
function openEnableTwoFA(){
  const a = currentAccount() || {};
  showOverlay('ov-sheet', `<div class="sheet-bg" onclick="closeOverlay()"></div><div class="sheet" role="dialog" aria-label="Verificación en dos pasos">
    <div class="sheet-h"><span>Verificación en dos pasos</span><button class="sv-x" onclick="closeOverlay()" aria-label="Cerrar">${ico('close')}</button></div>
    <div class="sheet-list">
      <p class="hint">Te pediremos un código además de la contraseña al entrar desde un dispositivo nuevo.</p>
      <button class="sh-row" onclick="enableTwoFA('app')">${ico('phone')}<span>App autenticadora (recomendada)</span>${ico('chevR')}</button>
      ${a.phone ? `<button class="sh-row" onclick="enableTwoFA('sms')">${ico('chat')}<span>SMS a ${escapeHtml(maskTo(a.phone))}</span>${ico('chevR')}</button>` : ''}
      ${a.email ? `<button class="sh-row" onclick="enableTwoFA('email')">${ico('doc')}<span>Email a ${escapeHtml(maskTo(a.email))}</span>${ico('chevR')}</button>` : ''}
    </div></div>`);
}
function enableTwoFA(method){
  const a = currentAccount(); if (!a) return;
  const to = method === 'sms' ? a.phone : (method === 'email' ? a.email : 'app');
  deliverCode(to, '2fa-ajustes', method === 'app' ? 'app' : method);
  showOverlay('ov-sheet', `<div class="sheet-bg" onclick="closeOverlay()"></div><div class="sheet" role="dialog" aria-label="Confirmar código">
    <div class="sheet-h"><span>Escribe el código</span><button class="sv-x" onclick="closeOverlay()" aria-label="Cerrar">${ico('close')}</button></div>
    <div class="sheet-list form">${method === 'app' ? '<p class="hint">Añade la clave JBSW Y3DP EHPK 3PXP en tu app autenticadora (simulada) y escribe el código que muestra.</p>' : ''}
      <input id="f-otp" class="otp" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="••••••" aria-label="Código" />
      <button class="btn-primary" onclick="confirmTwoFA('${method}')">Activar</button></div></div>`);
}
function confirmTwoFA(method){
  const err = checkOtp(val('f-otp')); if (err){ toast(err); return; }
  state.otp = null; const a = currentAccount(); updateAccount(a.id, { twoFA:{ method } });
  closeOverlay(); toast('Verificación en dos pasos activada'); renderSecurity();
}
function disableTwoFA(){ const a = currentAccount(); if (!a) return; updateAccount(a.id, { twoFA:null }); toast('Verificación en dos pasos desactivada'); renderSecurity(); }
// Eliminar la cuenta desde la app (obligatorio en las tiendas y por RGPD).
function openDeleteAccount(){
  showOverlay('ov-sheet', `<div class="sheet-bg" onclick="closeOverlay()"></div><div class="sheet" role="dialog" aria-label="Eliminar cuenta">
    <div class="sheet-h"><span>Eliminar cuenta</span><button class="sv-x" onclick="closeOverlay()" aria-label="Cerrar">${ico('close')}</button></div>
    <div class="sheet-list form"><p class="hint">Se borrarán tu perfil, tus publicaciones, mensajes y perfiles profesionales. Las reseñas que hayas recibido se anonimizan. Si tienes planes de pago pendientes, se cancelan con su política. Esta acción no se puede deshacer.</p>
      <button class="link-btn" onclick="closeOverlay();exportMyData()">${ico('download')} Antes, descarga una copia de tus datos</button>
      <div class="field"><label for="f-del">Escribe ELIMINAR para confirmar</label><input id="f-del" autocapitalize="characters" /></div>
      <button class="btn-primary danger-btn" onclick="deleteAccount()">Eliminar mi cuenta</button></div></div>`);
}
function deleteAccount(){
  if (val('f-del').trim().toUpperCase() !== 'ELIMINAR'){ toast('Escribe ELIMINAR para confirmar'); return; }
  const a = currentAccount(); if (!a) return;
  saveAccounts(accounts().filter(x => x.id !== a.id || x.id === 'demo'));   // la de demostración se restablece
  lsDel(storeKey()); lsDel(SESSION_KEY);
  closeOverlay(); location.hash = '#/feed'; location.reload();
}

/* ---------- verificación de identidad paso a paso (simulada) ----------
   En la app real: el servidor crea una sesión en el proveedor (Veriff, Onfido, Didit…),
   la app abre su SDK, y el resultado llega al servidor por un webhook firmado. */
function startVerifyFlow(){ state.vflow = { step:'doc', doc:'dni' }; renderVerifyFlow(); }
function renderVerifyFlow(){
  const f = state.vflow, docs = [['dni','DNI'],['nie','NIE'],['pasaporte','Pasaporte']];
  const steps = ['doc','frente','dorso','selfie','check'].filter(s => !(f.doc === 'pasaporte' && s === 'dorso'));
  const n = steps.indexOf(f.step);
  const frame = (round, txt) => `<div class="vf-frame ${round ? 'round' : ''}"><span>${txt}</span></div>`;
  const body = {
    doc: `<h3>¿Con qué documento?</h3><div class="iseg">${docs.map(([v,l]) => `<button class="${f.doc===v?'active':''}" onclick="state.vflow.doc='${v}';renderVerifyFlow()"><span>${l}</span></button>`).join('')}</div>
      <p class="hint">Original y en vigor. Lo comprueba nuestro proveedor de verificación; no se guarda en tu perfil ni lo ve nadie.</p>
      <button class="btn-primary" onclick="verifyNext()">Continuar</button>`,
    frente: `<h3>Parte delantera</h3>${frame(false, 'Coloca el documento dentro del marco, sin reflejos')}<button class="btn-primary" onclick="verifyNext()">${ico('image')} Hacer foto</button>`,
    dorso: `<h3>Parte de atrás</h3>${frame(false, 'Ahora dale la vuelta')}<button class="btn-primary" onclick="verifyNext()">${ico('image')} Hacer foto</button>`,
    selfie: `<h3>Un selfie</h3>${frame(true, 'Mira a la cámara y gira despacio la cabeza')}<p class="hint">Comprobamos que eres la persona del documento y que estás presente.</p><button class="btn-primary" onclick="verifyNext()">${ico('user')} Hacer selfie</button>`,
    check: `<h3>Comprobando…</h3><div class="vf-spin" role="status" aria-label="Comprobando"></div><p class="hint">Suele tardar unos segundos. Si hace falta una revisión manual, te avisaremos (normalmente en menos de 24 h).</p>`,
  }[f.step];
  showOverlay('ov-sheet', `<div class="sheet-bg"></div><div class="sheet" role="dialog" aria-label="Verificación de identidad">
    <div class="sheet-h"><span>Verificación · ${n + 1} de ${steps.length}</span><button class="sv-x" onclick="closeOverlay()" aria-label="Cerrar">${ico('close')}</button></div>
    <div class="sheet-list vg vf">${body}</div></div>`);
  if (f.step === 'check'){ clearTimeout(state.vflowT); state.vflowT = setTimeout(() => { if (state.vflow && state.vflow.step === 'check'){ state.vflow = null; doVerify(); } }, 1600); }
}
function verifyNext(){
  const f = state.vflow; if (!f) return;
  const order = ['doc','frente','dorso','selfie','check'].filter(s => !(f.doc === 'pasaporte' && s === 'dorso'));
  f.step = order[Math.min(order.indexOf(f.step) + 1, order.length - 1)];
  renderVerifyFlow();
}

/* ---------- web instalable (PWA) ---------- */
let installPrompt = null;
if (typeof window !== 'undefined' && window.addEventListener) window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installPrompt = e; });
function openInstallHelp(){
  if (installPrompt){ installPrompt.prompt(); installPrompt = null; return; }
  showOverlay('ov-sheet', `<div class="sheet-bg" onclick="closeOverlay()"></div><div class="sheet" role="dialog" aria-label="Instalar en el móvil">
    <div class="sheet-h"><span>Instalar en el móvil</span><button class="sv-x" onclick="closeOverlay()" aria-label="Cerrar">${ico('close')}</button></div>
    <div class="sheet-list"><p class="hint">Se abre a pantalla completa, como una app, sin pasar por las tiendas.</p>
      <ul class="vg-list">
        <li>${ico('phone')}<span><b>iPhone (Safari):</b> botón Compartir ▸ "Añadir a pantalla de inicio".</span></li>
        <li>${ico('phone')}<span><b>Android (Chrome):</b> menú ⋮ ▸ "Instalar aplicación" o "Añadir a pantalla de inicio".</span></li>
      </ul><p class="hint">Hace falta abrirla desde su dirección web (https), no desde un archivo descargado.</p></div></div>`);
}
function registerServiceWorker(){
  try {
    if (typeof navigator !== 'undefined' && navigator.serviceWorker && /^https?:$/.test(location.protocol) && !/\/artifact/.test(location.pathname || ''))
      navigator.serviceWorker.register('sw.js').catch(() => {});
  } catch (e) {}
}
