/* =========================================================================
   Social (simulado en el navegador): fotos, carruseles y vídeos de verdad desde la
   cámara o la galería; menú de cada publicación (editar el pie, eliminar, reportar);
   guardados y etiquetadas en el perfil; seguidores y seguidos; perfiles privados con
   solicitudes de seguimiento; búsqueda de personas, planes y #temas; página de cada
   tema; y la pestaña de Menciones con aceptar o quitar.
   Lo que hará el servidor de verdad: docs/social.md.
   ========================================================================= */
const MAX_ITEMS = 10;                 // fotos por carrusel
const MAX_VIDEO_S = 60, MAX_VIDEO_MB = 50;
const PHOTO_MAX_PX = 1350;

/* ---------- almacén de fotos y vídeos (IndexedDB) ----------
   Las publicaciones guardan "m:<id>"; el archivo vive en IndexedDB (admite vídeos,
   que no caben en localStorage) y se sirve con una URL de objeto. */
const MEDIA = {};
function idbOpen(){
  return new Promise((res, rej) => {
    if (typeof indexedDB === 'undefined') return rej(new Error('sin IndexedDB'));
    const r = indexedDB.open('planes-media', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('m');
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
}
function objUrl(blob){ try { return URL.createObjectURL(blob); } catch (e) { return ''; } }
function putMedia(id, blob){
  MEDIA[id] = objUrl(blob);
  return idbOpen().then(db => new Promise(res => { const tx = db.transaction('m', 'readwrite'); tx.objectStore('m').put(blob, id); tx.oncomplete = res; tx.onerror = res; }), () => {});
}
function deleteMedia(id){
  delete MEDIA[id];
  return idbOpen().then(db => new Promise(res => { const tx = db.transaction('m', 'readwrite'); tx.objectStore('m').delete(id); tx.oncomplete = res; tx.onerror = res; }), () => {});
}
function loadAllMedia(){
  return idbOpen().then(db => new Promise(res => {
    const req = db.transaction('m').objectStore('m').openCursor();
    req.onsuccess = () => { const c = req.result; if (c){ if (!MEDIA[c.key]) MEDIA[c.key] = objUrl(c.value); c.continue(); } else res(Object.keys(MEDIA).length); };
    req.onerror = () => res(0);
  }), () => 0);
}
const mediaUrl = (ref) => (ref && ref.startsWith('m:')) ? (MEDIA[ref.slice(2)] || '') : '';

/* ---------- subir fotos y vídeos al crear una publicación ---------- */
function canvasBlob(canvas, quality){ return new Promise(res => canvas.toBlob(b => res(b), 'image/jpeg', quality)); }
// Reduce la foto y la vuelve a codificar: así también se quita la ubicación GPS (EXIF).
function photoToBlob(file){
  return new Promise((resolve, reject) => {
    const url = objUrl(file), img = new Image();
    img.onerror = reject;
    img.onload = () => {
      const k = Math.min(1, PHOTO_MAX_PX / Math.max(img.width, img.height));
      const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      canvasBlob(c, 0.85).then(resolve, reject);
    };
    img.src = url;
  });
}
// Duración y miniatura (primer fotograma) de un vídeo.
function videoInfo(file){
  return new Promise((resolve, reject) => {
    const v = document.createElement('video'); v.preload = 'metadata'; v.muted = true; v.playsInline = true;
    v.onerror = () => reject(new Error('vídeo no válido'));
    v.onloadedmetadata = () => { v.currentTime = Math.min(0.5, (v.duration || 1) / 2); };
    v.onseeked = () => {
      const k = Math.min(1, 720 / Math.max(v.videoWidth || 720, v.videoHeight || 720));
      const c = document.createElement('canvas'); c.width = Math.round((v.videoWidth || 720) * k); c.height = Math.round((v.videoHeight || 720) * k);
      try { c.getContext('2d').drawImage(v, 0, 0, c.width, c.height); } catch (e) {}
      canvasBlob(c, 0.8).then(poster => resolve({ duration: Math.round(v.duration || 0), poster }), reject);
    };
    v.src = objUrl(file);
  });
}
function draftItems(){ return state.draftPost.items || (state.draftPost.items = []); }
// Añade un elemento al borrador (también lo usan las pruebas).
function addDraftItem(item){ const items = draftItems(); items.push(Object.assign({ id: 'd' + Date.now() + items.length }, item)); syncDraftKind(); }
function syncDraftKind(){
  const items = draftItems();
  if (!items.length) return;
  state.draftPost.kind = items.some(i => i.type === 'video') ? 'video' : (items.length > 1 ? 'carrusel' : 'foto');
}
function removeDraftItem(id){ capturePostInputs(); state.draftPost.items = draftItems().filter(i => i.id !== id); syncDraftKind(); if (!draftItems().length) state.draftPost.kind = 'foto'; renderCreatePost(); }
function pickPostMedia(input){
  const files = Array.from((input && input.files) || []); if (!files.length) return;
  capturePostInputs();
  const videos = files.filter(f => /^video\//.test(f.type)), photos = files.filter(f => /^image\//.test(f.type));
  const items = draftItems();
  if (videos.length){
    if (videos.length > 1 || photos.length || items.length){ toast('Un vídeo va solo: sube un vídeo, o hasta 10 fotos'); return; }
    const f = videos[0];
    if (f.size > MAX_VIDEO_MB * 1024 * 1024){ toast(`El vídeo pesa demasiado (máximo ${MAX_VIDEO_MB} MB en la demo)`); return; }
    toast('Preparando el vídeo…');
    videoInfo(f).then(info => {
      if (info.duration > MAX_VIDEO_S){ toast(`El vídeo dura ${info.duration} s: el máximo es ${MAX_VIDEO_S} s`); return; }
      addDraftItem({ type:'video', blob:f, url:objUrl(f), poster:info.poster, posterUrl:objUrl(info.poster), duration:info.duration });
      renderCreatePost();
    }, () => toast('No se ha podido leer el vídeo'));
    return;
  }
  if (items.some(i => i.type === 'video')){ toast('Ya hay un vídeo: quítalo para subir fotos'); return; }
  const room = MAX_ITEMS - items.length;
  if (room <= 0){ toast(`Máximo ${MAX_ITEMS} fotos por carrusel`); return; }
  if (photos.length > room) toast(`Solo caben ${room} fotos más (máximo ${MAX_ITEMS})`);
  Promise.all(photos.slice(0, room).map(photoToBlob)).then(blobs => {
    blobs.forEach(b => addDraftItem({ type:'image', blob:b, url:objUrl(b) }));
    renderCreatePost();
  }, () => toast('No se ha podido leer alguna foto'));
}
// Vista previa de lo subido, con botón para quitar cada elemento.
function draftPreviewHtml(sticker){
  const items = draftItems();
  if (!items.length) return '';
  if (items[0].type === 'video') return `<div class="post-prev"><span class="pp g-dark"><video class="pp-video" src="${items[0].url || ''}" poster="${items[0].posterUrl || ''}" playsinline muted loop controls></video>
    <button class="sv-x pv-x" onclick="removeDraftItem('${items[0].id}')" aria-label="Quitar el vídeo">${ico('close')}</button>${sticker}</span></div>
    <p class="hint">${items[0].duration || 0} s · máximo ${MAX_VIDEO_S} s.</p>`;
  return `<div class="post-prev ${items.length > 1 ? 'carrusel' : ''}">${items.map((it, i) => `<span class="pp g-dark"><img class="cover-img" src="${it.url}" alt="">
      ${items.length > 1 ? `<span class="pp-n">${i + 1}</span>` : ''}<button class="sv-x pv-x" onclick="removeDraftItem('${it.id}')" aria-label="Quitar la foto ${i + 1}">${ico('close')}</button></span>`).join('')}${sticker}</div>
    <p class="hint">${items.length} de ${MAX_ITEMS} fotos. Quitamos la ubicación GPS que guardan las fotos.</p>`;
}
// Al publicar: guarda los archivos y devuelve las referencias para la publicación.
function commitDraftMedia(){
  const items = draftItems(); if (!items.length) return null;
  const stamp = Date.now();
  if (items[0].type === 'video'){
    const vid = 'v' + stamp, pid = 'p' + stamp;
    if (items[0].blob) putMedia(vid, items[0].blob); else if (items[0].url) MEDIA[vid] = items[0].url;
    if (items[0].poster) putMedia(pid, items[0].poster); else if (items[0].posterUrl) MEDIA[pid] = items[0].posterUrl;
    return { kind:'video', video:'m:' + vid, imgs:['m:' + pid], duration: items[0].duration || 15 };
  }
  const imgs = items.map((it, i) => { const id = 'i' + stamp + '_' + i; if (it.blob) putMedia(id, it.blob); else if (it.url) MEDIA[id] = it.url; return 'm:' + id; });
  return { kind: imgs.length > 1 ? 'carrusel' : 'foto', imgs };
}
function toggleRealVideo(el){ const v = el.querySelector('video'); if (!v) return; if (v.paused){ v.play(); el.classList.add('playing'); } else { v.pause(); el.classList.remove('playing'); } }
function toggleVideoSound(ev, el){ if (ev && ev.stopPropagation) ev.stopPropagation(); const v = el.closest('.pm').querySelector('video'); if (!v) return; v.muted = !v.muted; el.classList.toggle('on', !v.muted); }

/* ---------- menú de cada publicación ---------- */
function openPostMenu(id){
  const po = POSTS.find(p => p.id === id); if (!po) return;
  const mine = po.authorId === 'me', u = getUser(po.authorId) || { name:'' };
  showOverlay('ov-sheet', `<div class="sheet-bg" onclick="closeOverlay()"></div><div class="sheet" role="dialog" aria-label="Opciones de la publicación">
    <div class="sheet-h"><span>Publicación</span><button class="sv-x" onclick="closeOverlay()" aria-label="Cerrar">${ico('close')}</button></div>
    <div class="sheet-list">
      ${mine ? `<button class="sh-row" onclick="openEditCaption('${id}')">${ico('doc')}<span>Editar el pie</span>${ico('chevR')}</button>
        <button class="sh-row danger" onclick="openDeletePost('${id}')">${ico('close')}<span>Eliminar publicación</span>${ico('chevR')}</button>`
      : `<button class="sh-row" onclick="closeOverlay();toggleFollowQuiet('${u.id}')">${ico('user')}<span>${follows('me', u.id) ? 'Dejar de seguir' : 'Seguir'} a ${escapeHtml(u.name)}</span>${ico('chevR')}</button>
        <button class="sh-row danger" onclick="openReport('${u.id}', null)">${ico('alert')}<span>Reportar</span>${ico('chevR')}</button>`}
      <button class="sh-row" onclick="closeOverlay();copyShareLink('${id}')">${ico('link')}<span>Copiar enlace</span>${ico('chevR')}</button>
    </div></div>`);
}
function toggleFollowQuiet(uid){ toggleFollow(uid, true); if (state.contentTab === 'vividas' && location.hash.startsWith('#/feed')) renderContent(); }
function openEditCaption(id){
  const po = POSTS.find(p => p.id === id); if (!po) return;
  showOverlay('ov-sheet', `<div class="sheet-bg" onclick="closeOverlay()"></div><div class="sheet" role="dialog" aria-label="Editar el pie">
    <div class="sheet-h"><span>Editar el pie</span><button class="sv-x" onclick="closeOverlay()" aria-label="Cerrar">${ico('close')}</button></div>
    <div class="sheet-list form"><div class="field"><label for="f-ecap">Pie ${counter('f-ecap','caption',po.caption)}</label>
      <textarea ${lim('f-ecap','caption')} rows="4">${escapeHtml(po.caption || '')}</textarea></div>
      <button class="btn-primary" onclick="saveCaption('${id}')">${ico('check')} Guardar</button></div></div>`);
}
function saveCaption(id){
  const po = POSTS.find(p => p.id === id); if (!po) return;
  po.caption = clip(val('f-ecap'), 'caption') || po.caption;
  po.mentions = po.caption.match(MENTION_RE) || []; po.hashtags = po.caption.match(/#[\wáéíóúñ]+/gi) || []; po.edited = true;
  saveState(); closeOverlay(); rerenderPost(id); toast('Pie actualizado');
}
function openDeletePost(id){
  showOverlay('ov-sheet', `<div class="sheet-bg" onclick="closeOverlay()"></div><div class="sheet" role="dialog" aria-label="Eliminar publicación">
    <div class="sheet-h"><span>¿Eliminar la publicación?</span><button class="sv-x" onclick="closeOverlay()" aria-label="Cerrar">${ico('close')}</button></div>
    <div class="sheet-list"><p class="hint">Se borran también sus me gusta y comentarios. No se puede deshacer.</p>
      <button class="btn-primary danger-btn" onclick="deletePost('${id}')">Eliminar</button>
      <button class="btn-ghost" onclick="closeOverlay()">Cancelar</button></div></div>`);
}
function deletePost(id){
  const i = POSTS.findIndex(p => p.id === id); if (i < 0) return;
  const po = POSTS[i];
  [].concat(po.imgs || [], po.video ? [po.video] : []).filter(r => String(r).startsWith('m:')).forEach(r => deleteMedia(r.slice(2)));
  POSTS.splice(i, 1);
  for (let k = STORIES.length - 1; k >= 0; k--) if (STORIES[k].sharedPostId === id || STORIES[k].id === 's' + id) STORIES.splice(k, 1);
  saveState(); closeOverlay(); toast('Publicación eliminada');
  router();
}
function deleteComment(postId, idx){
  const po = POSTS.find(p => p.id === postId); if (!po || !po.comments[idx] || po.comments[idx].userId !== 'me') return;
  po.comments.splice(idx, 1); saveState(); openComments(postId); rerenderPost(postId);
}

/* ---------- quién ve qué: perfiles privados y audiencia ---------- */
const isPrivate = (u) => !!u && u.id !== 'me' && u.profilePublic === false;
function canSeeProfile(u){ return !!u && (u.id === 'me' || !isPrivate(u) || follows('me', u.id)); }
function canSeePost(po){
  if (po.authorId === 'me') return true;
  const u = getUser(po.authorId);
  if (!canSeeProfile(u)) return false;
  if ((ME.blocked || []).includes(po.authorId)) return false;
  const aud = po.audience || 'publico';
  if (aud === 'seguidores') return follows('me', po.authorId);
  if (aud === 'amigos') return areFriends('me', po.authorId);
  return true;
}
const hasRequested = (uid) => FOLLOW_REQUESTS.some(([a, b]) => a === 'me' && b === uid);
// Pedir seguir a un perfil privado. En la demo, la persona acepta a los 4 segundos.
function requestFollow(uid){
  const u = getUser(uid) || { name:'' };
  if (hasRequested(uid)){ FOLLOW_REQUESTS.splice(FOLLOW_REQUESTS.findIndex(([a, b]) => a === 'me' && b === uid), 1); toast('Solicitud retirada'); }
  else { FOLLOW_REQUESTS.push(['me', uid]); toast(`Solicitud enviada a ${u.name}`); setTimeout(() => simulateFollowAccepted(uid), 4000); }
  saveState();
}
function simulateFollowAccepted(uid){
  const i = FOLLOW_REQUESTS.findIndex(([a, b]) => a === 'me' && b === uid); if (i < 0) return;
  FOLLOW_REQUESTS.splice(i, 1); FOLLOWS.push(['me', uid]);
  const u = getUser(uid) || { name:'' };
  notify('seguidor', `${u.name} ha aceptado tu solicitud. Ya ves sus publicaciones.`, { route:'u/' + uid });
  saveState();
  if (location.hash === '#/u/' + uid) renderProfile(uid);
}
// Te piden seguirte (si tu perfil es privado).
const incomingRequests = () => FOLLOW_REQUESTS.filter(([, b]) => b === 'me').map(([a]) => a);
function simulateIncomingFollow(){
  if (ME.profilePublic !== false) return;
  const who = USERS.find(u => u.id !== 'me' && !u.managedBy && !follows(u.id, 'me') && !FOLLOW_REQUESTS.some(([a, b]) => a === u.id && b === 'me'));
  if (!who) return;
  FOLLOW_REQUESTS.push([who.id, 'me']);
  notify('seguidor', `${who.name} quiere seguirte.`, { route:'notificaciones' });
  saveState();
}
function answerFollowRequest(uid, accept){
  const i = FOLLOW_REQUESTS.findIndex(([a, b]) => a === uid && b === 'me'); if (i < 0) return;
  FOLLOW_REQUESTS.splice(i, 1);
  if (accept && !follows(uid, 'me')) FOLLOWS.push([uid, 'me']);
  saveState(); toast(accept ? 'Solicitud aceptada' : 'Solicitud eliminada');
  if (location.hash === '#/notificaciones') renderNotifications();
}
// Al pasar el perfil a público, las solicitudes pendientes se aceptan.
function acceptAllIncoming(){ incomingRequests().forEach(uid => { if (!follows(uid, 'me')) FOLLOWS.push([uid, 'me']); }); for (let i = FOLLOW_REQUESTS.length - 1; i >= 0; i--) if (FOLLOW_REQUESTS[i][1] === 'me') FOLLOW_REQUESTS.splice(i, 1); }
function followRequestsHtml(){
  const reqs = incomingRequests(); if (!reqs.length) return '';
  return `<div class="notif-h"><span>Solicitudes para seguirte</span></div>${reqs.map(uid => { const u = getUser(uid) || { name:'', handle:'' };
    return `<div class="au-person"><span class="avatar conv-av">${escapeHtml(u.initials || initials(u.name))}</span><span class="conv-main"><b>${escapeHtml(u.name)}</b><span>${escapeHtml(u.handle)}</span></span>
      <button class="ph-btn primary au-fbtn" onclick="answerFollowRequest('${uid}', true)">Confirmar</button><button class="ph-btn au-fbtn" onclick="answerFollowRequest('${uid}', false)">Eliminar</button></div>`; }).join('')}`;
}

/* ---------- seguidores y seguidos ---------- */
const followersOf = (uid) => FOLLOWS.filter(([, b]) => b === uid).map(([a]) => a);
const followingOf = (uid) => FOLLOWS.filter(([a]) => a === uid).map(([, b]) => b);
function followerCount(u){ const n = followersOf(u.id).length; return u.id === 'me' ? n : Math.max(n, u.followers || 0); }
function followingCount(u){ const n = followingOf(u.id).length; return u.id === 'me' ? n : Math.max(n, u.following || 0); }
function renderFollowList(kind, uid){
  const u = uid === 'me' ? ME : getUser(uid), view = document.getElementById('view-page');
  if (!u){ view.innerHTML = pageHead('Seguidores') + '<div class="empty-tab"><p>Perfil no encontrado.</p></div>'; return; }
  const ids = (kind === 'seguidores' ? followersOf(u.id) : followingOf(u.id)).filter(id => !(ME.blocked || []).includes(id));
  const total = kind === 'seguidores' ? followerCount(u) : followingCount(u);
  const rows = ids.map(id => { const x = id === 'me' ? ME : getUser(id); if (!x) return '';
    const btn = id === 'me' ? '' : (uid === 'me' && kind === 'seguidores' ? `<button class="ph-btn au-fbtn" onclick="removeFollower('${id}')">Eliminar</button>` : smallFollowBtn(x));
    return `<div class="au-person"><button class="avatar conv-av" onclick="go('${id === 'me' ? 'perfil' : 'u/' + id}')">${escapeHtml(x.initials || initials(x.name))}</button>
      <button class="conv-main lnk" onclick="go('${id === 'me' ? 'perfil' : 'u/' + id}')"><b>${escapeHtml(x.name)}</b><span>${escapeHtml(x.handle || '')}${id !== 'me' && areFriends('me', id) ? ' · Amigos' : ''}</span></button>${btn}</div>`; }).join('');
  view.innerHTML = pageHead(`${kind === 'seguidores' ? 'Seguidores' : 'Seguidos'} · ${u.name}`) + `<div class="page-body inbox">
    <div class="iseg origin-seg">${['seguidores','seguidos'].map(k => `<button class="${k === kind ? 'active' : ''}" onclick="go('${k}/${uid}')"><span>${k === 'seguidores' ? 'Seguidores' : 'Seguidos'}</span><em>${k === 'seguidores' ? followerCount(u) : followingCount(u)}</em></button>`).join('')}</div>
    ${!canSeeProfile(u) ? `<div class="empty-tab"><span class="empty-ic">${ico('lock')}</span><p>Cuenta privada: sigue a ${escapeHtml(u.name)} para ver su lista.</p></div>`
      : (rows || `<div class="empty-tab"><p>Nadie todavía.</p></div>`) + (total > ids.length ? `<p class="hint">Y ${total - ids.length} personas más que no conoces.</p>` : '')}
  </div>`;
}
function smallFollowBtn(x){
  const on = follows('me', x.id), req = hasRequested(x.id);
  return `<button class="ph-btn ${on || req ? '' : 'primary'} au-fbtn" onclick="toggleFollow('${x.id}', true);router()">${on ? 'Siguiendo' : (req ? 'Solicitado' : (isPrivate(x) ? 'Solicitar' : 'Seguir'))}</button>`;
}
function removeFollower(uid){ const i = FOLLOWS.findIndex(([a, b]) => a === uid && b === 'me'); if (i >= 0) FOLLOWS.splice(i, 1); saveState(); toast('Ya no te sigue (no se le avisa)'); router(); }

/* ---------- etiquetadas y guardados en el perfil ---------- */
function taggedPosts(uid){ return POSTS.filter(p => (p.taggedUserIds || []).includes(uid) && canSeePost(p) && (uid !== 'me' || mentionStatus(mentionKey('tag', p.id)) === 'aceptada')); }
function postGrid(list, empty){
  if (!list.length) return `<div class="empty-tab"><span class="empty-ic">${ico('image')}</span><p>${empty}</p></div>`;
  return `<div class="grid">${list.map(po => `<button class="cell ${(po.media || [])[0] || 'g-dark'}" onclick="openPost('${po.id}')" aria-label="${escapeHtml(po.caption || '')}">
    ${coverImg((po.imgs || [])[0], 500)}<span class="cell-scrim"></span><span class="cell-corner">${ico(POST_ICON[po.kind] || 'image')}</span>
    <span class="cell-info"><span class="cell-meta">${ico('heart')} ${po.likes || 0}</span></span></button>`).join('')}</div>`;
}

/* ---------- búsqueda de personas, planes y #temas ---------- */
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
function allHashtags(){
  const count = {};
  POSTS.filter(canSeePost).forEach(p => (String(p.caption || '').match(/#[\wáéíóúñ]+/gi) || []).forEach(t => { const k = t.slice(1).toLowerCase(); count[k] = (count[k] || 0) + 1; }));
  PLACES.forEach(pl => { if (pl.hashtag){ const k = pl.hashtag.replace(/^#/, '').toLowerCase(); count[k] = count[k] || 0; } });
  return Object.entries(count).map(([tag, n]) => ({ tag, n })).sort((a, b) => b.n - a.n);
}
function searchAll(q){
  const n = norm(q).replace(/^[#@]/, '').trim();
  if (!n) return { people: [], plans: [], tags: [] };
  const people = USERS.filter(u => u.id !== 'me' && !(ME.blocked || []).includes(u.id) && [u.name, u.handle, u.bio, u.business && u.business.category].some(f => norm(f).includes(n)));
  const plans = PLANS.filter(p => !isCancelled(p) && [p.title, p.summary, (getPlace(p.placeId) || {}).name, (getCategory(p.category) || {}).label, (p.host || {}).name].some(f => norm(f).includes(n)));
  const tags = allHashtags().filter(t => norm(t.tag).includes(n));
  return { people, plans, tags };
}
function renderSearch(q){
  state.search = { q: q != null ? q : ((state.search || {}).q || ''), tab: (state.search || {}).tab || 'todo' };
  const view = document.getElementById('view-page');
  view.innerHTML = `<div class="page-bar"><button class="pb-back" onclick="history.back()" aria-label="Atrás">${ico('chevL')}</button>
      <div class="mp-search sr-in">${ico('search')}<input id="sr-q" type="search" placeholder="Busca planes, personas o #temas" value="${escapeHtml(state.search.q)}" oninput="state.search.q=this.value;renderSearchResults()" onkeydown="if(event.key==='Enter')saveRecentSearch(this.value)" autocomplete="off"></div></div>
    <div class="page-body inbox">
      <div class="iseg origin-seg" id="sr-tabs"></div>
      <div id="sr-res"></div>
    </div>`;
  renderSearchResults();
}
function setSearchTab(t){ state.search.tab = t; renderSearchResults(); }
function renderSearchResults(){
  const box = document.getElementById('sr-res'), tabsEl = document.getElementById('sr-tabs'); if (!box) return;
  const q = state.search.q, t = state.search.tab, r = searchAll(q);
  if (tabsEl) tabsEl.innerHTML = [['todo','Todo'],['personas','Personas'],['planes','Planes'],['temas','Temas']].map(([v, l]) =>
    `<button class="${t === v ? 'active' : ''}" onclick="setSearchTab('${v}')"><span>${l}</span>${q.trim() ? `<em>${v === 'todo' ? r.people.length + r.plans.length + r.tags.length : (v === 'personas' ? r.people.length : v === 'planes' ? r.plans.length : r.tags.length)}</em>` : ''}</button>`).join('');
  if (!q.trim()){
    const recent = ME.recentSearches || [];
    box.innerHTML = `${recent.length ? `<div class="notif-h"><span>Recientes</span><button class="link-btn" onclick="clearRecentSearches()">Borrar</button></div>
        <div class="tag-chips">${recent.map(s => `<button class="tag-chip" onclick="state.search.q=${escapeHtml(JSON.stringify(s))};renderSearch()">${ico('clock')} ${escapeHtml(s)}</button>`).join('')}</div>` : ''}
      <div class="notif-h"><span>Temas populares</span></div>
      <div class="tag-chips">${allHashtags().slice(0, 8).map(x => `<button class="tag-chip" onclick="go('tema/${encodeURIComponent(x.tag)}')">#${escapeHtml(x.tag)}</button>`).join('')}</div>`;
    return;
  }
  const person = (u) => `<button class="conv" onclick="saveRecentSearch(state.search.q);go('u/${u.id}')"><span class="avatar conv-av">${escapeHtml(u.initials || initials(u.name))}</span>
    <span class="conv-main"><b>${escapeHtml(u.name)} ${u.verified ? `<span class="vchk">${ico('check')}</span>` : ''}${typeBadge(u)}</b><span>${escapeHtml(u.handle)}${isPrivate(u) ? ' · Cuenta privada' : ''}${follows('me', u.id) ? ' · Le sigues' : ''}</span></span></button>`;
  const plan = (p) => { const pl = getPlace(p.placeId);
    return `<button class="conv" onclick="saveRecentSearch(state.search.q);go('plan/${p.id}')"><span class="conv-av plan ${p.gradient}">${coverImg(p.photo, 120)}</span>
      <span class="conv-main"><b>${escapeHtml(p.title)}</b><span>${fmtWhen(new Date(p.when))} · ${escapeHtml(p.secret ? 'Zona aproximada' : (pl ? pl.name : 'Madrid'))}${p.paid ? ' · ' + p.price + ' €' : ' · Gratis'}</span></span></button>`; };
  const tag = (x) => `<button class="conv" onclick="saveRecentSearch(state.search.q);go('tema/${encodeURIComponent(x.tag)}')"><span class="conv-av tag-av">${ico('hash')}</span>
    <span class="conv-main"><b>#${escapeHtml(x.tag)}</b><span>${x.n} ${x.n === 1 ? 'publicación' : 'publicaciones'}</span></span></button>`;
  const sec = (title, list, fn, k) => list.length ? `${t === 'todo' ? `<div class="notif-h"><span>${title}</span>${list.length > 3 ? `<button class="link-btn" onclick="setSearchTab('${k}')">Ver todo</button>` : ''}</div>` : ''}${(t === 'todo' ? list.slice(0, 3) : list).map(fn).join('')}` : '';
  const html = (t === 'todo' || t === 'personas' ? sec('Personas', r.people, person, 'personas') : '')
    + (t === 'todo' || t === 'planes' ? sec('Planes', r.plans, plan, 'planes') : '')
    + (t === 'todo' || t === 'temas' ? sec('Temas', r.tags, tag, 'temas') : '');
  box.innerHTML = html || `<div class="empty-tab"><span class="empty-ic">${ico('search')}</span><p>Sin resultados para «${escapeHtml(q)}».</p></div>`;
}
function saveRecentSearch(q){ q = String(q || '').trim(); if (!q) return; ME.recentSearches = [q].concat((ME.recentSearches || []).filter(x => x !== q)).slice(0, 8); saveState(); }
function clearRecentSearches(){ ME.recentSearches = []; saveState(); renderSearchResults(); }
// Página de un tema: publicaciones con ese hashtag y planes en su lugar.
function renderTag(tag){
  tag = decodeURIComponent(String(tag || '')).replace(/^#/, '').toLowerCase();
  const posts = POSTS.filter(p => canSeePost(p) && (String(p.caption || '').match(/#[\wáéíóúñ]+/gi) || []).some(t => t.slice(1).toLowerCase() === tag));
  const places = PLACES.filter(pl => (pl.hashtag || '').replace(/^#/, '').toLowerCase() === tag);
  const plans = PLANS.filter(p => !isCancelled(p) && places.some(pl => pl.id === p.placeId));
  document.getElementById('view-page').innerHTML = pageHead('#' + tag) + `<div class="page-body"><p class="hint">${posts.length} ${posts.length === 1 ? 'publicación' : 'publicaciones'}${places.length ? ` · tema de ${escapeHtml(places[0].name)}` : ''}</p></div>
    ${plans.length ? `<div class="page-body"><div class="notif-h"><span>Planes aquí</span></div>${plans.map(p => `<button class="conv" onclick="go('plan/${p.id}')"><span class="conv-av plan ${p.gradient}">${coverImg(p.photo, 120)}</span><span class="conv-main"><b>${escapeHtml(p.title)}</b><span>${fmtWhen(new Date(p.when))}</span></span></button>`).join('')}</div>` : ''}
    ${postGrid(posts, 'Aún no hay publicaciones con este tema.')}`;
}
// Menciones y temas en los textos: tocables.
const MENTION_RE = /@[\wáéíóúñ](?:[\w.áéíóúñ]*[\wáéíóúñ])?/gi;
function openHandle(h){
  const t = String(h || '').toLowerCase();
  if (ME.handle && ME.handle.toLowerCase() === t) return go('perfil');
  const u = USERS.find(x => (x.handle || '').toLowerCase() === t);
  if (u) go('u/' + u.id); else toast('No hay nadie con ese usuario');
}

/* ---------- menciones y etiquetas ----------
   Una mención o etiqueta no se asocia a tu perfil hasta que la aceptas. */
const mentionKey = (kind, postId, idx) => `${kind}:${postId}${idx != null ? ':' + idx : ''}`;
function mentionStatus(key){ return ((ME.mentions || {})[key]) || 'pendiente'; }
function mentionAllowed(authorId){
  const pol = ME.mentionPolicy || 'todos';
  if ((ME.blocked || []).includes(authorId)) return false;
  return pol === 'todos' || (pol === 'seguidos' && follows('me', authorId));
}
function myMentions(){
  const h = (ME.handle || '').toLowerCase(); const out = [];
  if (!h) return out;
  const hasMe = (text) => (String(text || '').match(MENTION_RE) || []).some(m => m.toLowerCase() === h);
  POSTS.forEach(p => {
    if (p.authorId === 'me' || !canSeePost(p)) return;
    if ((p.taggedUserIds || []).includes('me') && mentionAllowed(p.authorId)) out.push({ key: mentionKey('tag', p.id), kind:'tag', post:p, by:p.authorId });
    if (hasMe(p.caption) && mentionAllowed(p.authorId)) out.push({ key: mentionKey('post', p.id), kind:'post', post:p, by:p.authorId });
    (p.comments || []).forEach((c, i) => { if (c.userId !== 'me' && hasMe(c.text) && mentionAllowed(c.userId)) out.push({ key: mentionKey('com', p.id, i), kind:'com', post:p, by:c.userId, text:c.text }); });
  });
  return out.filter(m => mentionStatus(m.key) !== 'rechazada');
}
// Recorta sin partir palabras (ni #temas).
function snippet(t, n){ t = String(t || ''); return t.length > n ? t.slice(0, n).replace(/\s+\S*$/, '') + '…' : t; }
const pendingMentions = () => myMentions().filter(m => mentionStatus(m.key) === 'pendiente');
function answerMention(key, ok){
  ME.mentions = Object.assign({}, ME.mentions || {}, { [key]: ok ? 'aceptada' : 'rechazada' });
  if (!ok && key.startsWith('tag:')){ const po = POSTS.find(p => p.id === key.split(':')[1]); if (po) po.taggedUserIds = (po.taggedUserIds || []).filter(x => x !== 'me'); }
  saveState(); toast(ok ? 'Aceptada: aparece en tu perfil' : 'Quitada: no se asocia a tu perfil'); updateMentionsDot(); renderContent();
}
function updateMentionsDot(){
  const b = document.querySelector && document.querySelector('.content-tabs button[data-tab="menciones"]');
  if (b && b.classList) b.classList.toggle('has-dot', pendingMentions().length > 0);
}
function renderMentionsTab(){
  const all = myMentions(), pend = all.filter(m => mentionStatus(m.key) === 'pendiente'), done = all.filter(m => mentionStatus(m.key) === 'aceptada');
  const what = { tag:'te ha etiquetado en una publicación', post:'te ha mencionado en una publicación', com:'te ha mencionado en un comentario' };
  const item = (m, pending) => { const u = getUser(m.by) || { name:'' };
    return `<div class="mention-it"><button class="mention-th ${(m.post.media || [])[0] || 'g-dark'}" onclick="openPost('${m.post.id}')" aria-label="Ver la publicación">${coverImg((m.post.imgs || [])[0], 200)}</button>
      <div class="mention-tx"><p><b>${escapeHtml(u.name)}</b> ${what[m.kind]}</p><p class="hint">${highlightCaption(snippet(m.kind === 'com' ? m.text : m.post.caption, 90))}</p>
      ${pending ? `<div class="pl-banner-b"><button class="ph-btn primary" onclick="answerMention('${m.key}', true)">Aceptar</button><button class="ph-btn" onclick="answerMention('${m.key}', false)">Quitar</button></div>`
        : `<button class="link-btn dim" onclick="answerMention('${m.key}', false)">Quitar de mi perfil</button>`}</div></div>`; };
  return `<div class="page-body inbox mentions">
    <p class="hint">Cuando alguien te menciona o te etiqueta, no se asocia a tu perfil hasta que lo aceptas. <button class="link-btn" onclick="go('ajustes')">Quién puede mencionarte</button></p>
    ${pend.length ? `<div class="notif-h"><span>Pendientes</span></div>${pend.map(m => item(m, true)).join('')}` : ''}
    ${done.length ? `<div class="notif-h"><span>Aceptadas</span></div>${done.map(m => item(m, false)).join('')}` : ''}
    ${all.length ? '' : `<div class="empty-tab"><span class="empty-ic">${ico('at')}</span><p>Aún nadie te ha mencionado.</p></div>`}
  </div>`;
}
function setMentionPolicy(v){ ME.mentionPolicy = v; saveState(); renderSettings(); }
