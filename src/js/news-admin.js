// ── Panel Prensa: Administrador de Noticias ──────────────────────────────────

const REPO_OWNER    = 'ProfChristopherR';
const REPO_NAME     = 'premilitar';
const TARGET_BRANCH = 'qa';
const NEWS_FILE     = 'public/data/news.json';
const NEWS_FILE_2   = 'data/news.json';
const IMAGES_PATH   = 'public/data/news-images';

let newsData      = [];
let activeNewsId  = null;
let pendingImages = {};
let galleryItems  = [];
let currentTags   = [];

// ── Init ──────────────────────────────────────────────────────────────────────
async function init() {
  updateTokenDot();
  await loadNews();
  bindHeaderEvents();
  bindEditorEvents();
  bindModalEvents();
}

// ── Load news ─────────────────────────────────────────────────────────────────
async function loadNews() {
  try {
    const isLocal = ['localhost','127.0.0.1'].includes(window.location.hostname);
    const base = isLocal ? '/' : './';
    const res = await fetch(base + 'data/news.json?t=' + Date.now());
    if (!res.ok) throw new Error('No se pudo cargar news.json');
    newsData = await res.json();
    newsData.sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (err) {
    showToast('Error cargando noticias: ' + err.message, true);
    newsData = [];
  }
  renderSidebarList();
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function renderSidebarList() {
  const container = document.getElementById('news-list-sidebar');
  if (!newsData.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><div class="empty-state-text">No hay noticias aún.</div></div>';
    return;
  }
  container.innerHTML = newsData.map(n =>
    '<button class="news-item-sidebar' + (n.id === activeNewsId ? ' active' : '') + '" data-id="' + escH(n.id) + '">' +
      '<span class="news-item-sidebar__type-badge ' + (n.type === 'own-post' ? 'badge-own' : 'badge-ext') + '">' +
        (n.type === 'own-post' ? 'Propia' : 'Link') +
      '</span>' +
      '<span class="news-item-sidebar__info">' +
        '<span class="news-item-sidebar__title">' + escH(n.title) + '</span>' +
        '<span class="news-item-sidebar__date">' + fmtDate(n.date) + '</span>' +
      '</span>' +
    '</button>'
  ).join('');
  container.querySelectorAll('.news-item-sidebar').forEach(btn =>
    btn.addEventListener('click', () => openNews(btn.dataset.id))
  );
}

// ── Open / Create ─────────────────────────────────────────────────────────────
function openNews(id) {
  const news = newsData.find(n => n.id === id);
  if (!news) return;
  activeNewsId = id;
  pendingImages = {};
  loadIntoEditor(news);
  renderSidebarList();
  showEditorPanel();
}

function createNew() {
  const tempId = 'noticia-' + Date.now();
  const n = {
    id: tempId, type: 'own-post',
    title: '', date: todayISO(), category: '', badge: '',
    featured: false, summary: '', author: 'Prof. Christopher Ruiz',
    coverImage: '', body: '', gallery: [], tags: [],
    source: 'Sendero Pre-Militar', sourceUrl: '', image: ''
  };
  newsData.unshift(n);
  activeNewsId = tempId;
  pendingImages = {};
  loadIntoEditor(n);
  renderSidebarList();
  showEditorPanel();
  setStatus('Nueva noticia (sin guardar)');
}

function showEditorPanel() {
  document.getElementById('editor-empty-state').style.display = 'none';
  document.getElementById('pn-editor').style.display = 'block';
}

// ── Load into editor ──────────────────────────────────────────────────────────
function loadIntoEditor(n) {
  const type = n.type || 'own-post';
  const radio = document.querySelector('input[name="news-type"][value="' + type + '"]');
  if (radio) radio.checked = true;
  toggleSections(type);

  setVal('f-title', n.title);
  setVal('f-date', n.date || todayISO());
  setVal('f-category', n.category);
  setVal('f-badge', n.badge);
  setVal('f-author', n.author);
  setVal('f-summary', n.summary);
  document.getElementById('f-featured').checked = !!n.featured;

  renderTags(n.tags || []);
  document.getElementById('rte-content').innerHTML = n.body || '';

  const coverArea = document.getElementById('cover-upload-area');
  const coverPrev = document.getElementById('cover-preview');
  if (n.coverImage) {
    coverPrev.src = n.coverImage;
    coverPrev.onload  = () => coverArea.classList.add('has-image');
    coverPrev.onerror = () => coverArea.classList.remove('has-image');
  } else {
    coverArea.classList.remove('has-image');
    coverPrev.src = '';
  }

  galleryItems = n.gallery ? JSON.parse(JSON.stringify(n.gallery)) : [];
  renderGalleryUI();

  setVal('f-source', n.source);
  setVal('f-source-url', n.sourceUrl);
  setVal('f-ext-image', n.image);
  setStatus('');
}

// ── Collect form ──────────────────────────────────────────────────────────────
function collectFormData() {
  const type     = document.querySelector('input[name="news-type"]:checked')?.value || 'own-post';
  const titleVal = document.getElementById('f-title').value.trim();
  const existing = newsData.find(n => n.id === activeNewsId) || {};

  let id = activeNewsId;
  if (id && id.startsWith('noticia-') && titleVal) {
    id = slugify(titleVal) + '-' + new Date().getFullYear();
  }

  const base = {
    id, type,
    title:    titleVal,
    date:     document.getElementById('f-date').value || todayISO(),
    category: document.getElementById('f-category').value.trim(),
    badge:    document.getElementById('f-badge').value.trim(),
    featured: document.getElementById('f-featured').checked,
    summary:  document.getElementById('f-summary').value.trim(),
    author:   document.getElementById('f-author').value.trim(),
    tags:     [...currentTags],
  };

  if (type === 'own-post') {
    const newCover   = pendingImages['__cover__'];
    const coverImage = newCover ? 'data/news-images/' + newCover.filename : (existing.coverImage || '');
    const gallery    = galleryItems.map(item =>
      item.pending
        ? { type: 'image', src: 'data/news-images/' + item.filename, caption: item.caption || '' }
        : { type: item.type, src: item.src, caption: item.caption || '' }
    );
    return Object.assign({}, base, { coverImage, body: document.getElementById('rte-content').innerHTML, gallery });
  }

  return Object.assign({}, base, {
    source:    document.getElementById('f-source').value.trim(),
    sourceUrl: document.getElementById('f-source-url').value.trim(),
    image:     document.getElementById('f-ext-image').value.trim(),
  });
}

// ── Tags ──────────────────────────────────────────────────────────────────────
function renderTags(tags) {
  currentTags = tags ? [...tags] : [];
  refreshTagsUI();
}
function addTag(raw) {
  const t = raw.trim().replace(/,$/, '');
  if (!t || currentTags.includes(t)) return;
  currentTags.push(t);
  refreshTagsUI();
}
function refreshTagsUI() {
  const container = document.getElementById('tags-container');
  const inp = document.getElementById('tags-input');
  container.innerHTML = currentTags.map(t =>
    '<span class="tag-chip">' + escH(t) + '<button type="button" data-tag="' + escH(t) + '">&times;</button></span>'
  ).join('');
  container.appendChild(inp);
  container.querySelectorAll('.tag-chip button').forEach(b =>
    b.addEventListener('click', () => { currentTags = currentTags.filter(t => t !== b.dataset.tag); refreshTagsUI(); })
  );
}

// ── Gallery UI ────────────────────────────────────────────────────────────────
function renderGalleryUI() {
  const list = document.getElementById('gallery-list');
  if (!galleryItems.length) {
    list.innerHTML = '<p style="color:#64748b;font-size:0.8rem;padding:0.5rem 0;">Sin elementos en la galería aún.</p>';
    return;
  }
  list.innerHTML = galleryItems.map((item, idx) => {
    if (item.type === 'image') {
      const src = item.pending ? (pendingImages[item.filename] ? pendingImages[item.filename].dataUrl : '') : item.src;
      return '<div class="gallery-item-card" data-idx="' + idx + '">' +
        '<img class="gallery-item-card__preview" src="' + escH(src) + '" alt="img" loading="lazy" />' +
        '<div class="gallery-item-card__caption">' + escH(item.caption || 'Sin descripción') + '</div>' +
        '<button class="gallery-item-card__remove" data-idx="' + idx + '">&times;</button>' +
      '</div>';
    }
    const ytId = getYtId(item.src);
    const thumb = ytId
      ? '<img src="https://img.youtube.com/vi/' + ytId + '/mqdefault.jpg" style="width:100%;height:100%;object-fit:cover;" />'
      : '<span class="yt-icon">▶</span>';
    return '<div class="gallery-item-card" data-idx="' + idx + '">' +
      '<div class="gallery-item-card__video-preview">' + thumb + '</div>' +
      '<div class="gallery-item-card__caption">' + escH(item.caption || 'Video') + '</div>' +
      '<button class="gallery-item-card__remove" data-idx="' + idx + '">&times;</button>' +
    '</div>';
  }).join('');

  list.querySelectorAll('.gallery-item-card__remove').forEach(btn =>
    btn.addEventListener('click', () => { galleryItems.splice(parseInt(btn.dataset.idx), 1); renderGalleryUI(); })
  );
}

function handleGalleryFiles(files) {
  Array.from(files).forEach(file => {
    if (!file.name.toLowerCase().endsWith('.webp')) { showToast('"' + file.name + '" no es .webp', true); return; }
    const reader = new FileReader();
    reader.onload = e => {
      const fn = sanitize(file.name);
      pendingImages[fn] = { dataUrl: e.target.result, filename: fn };
      galleryItems.push({ type: 'image', src: '', pending: true, filename: fn, caption: file.name.replace(/\.webp$/i,'') });
      renderGalleryUI();
    };
    reader.readAsDataURL(file);
  });
}

// ── Cover ─────────────────────────────────────────────────────────────────────
function handleCoverFile(file) {
  if (!file) return;
  if (!file.name.toLowerCase().endsWith('.webp')) { showToast('Solo formato .webp para la portada', true); return; }
  const reader = new FileReader();
  reader.onload = e => {
    const fn = sanitize(file.name);
    pendingImages['__cover__'] = { dataUrl: e.target.result, filename: fn };
    const prev = document.getElementById('cover-preview');
    prev.src = e.target.result;
    prev.onload = () => document.getElementById('cover-upload-area').classList.add('has-image');
  };
  reader.readAsDataURL(file);
}

// ── Save ──────────────────────────────────────────────────────────────────────
async function saveNews() {
  const data = collectFormData();
  if (!data.title) { showToast('El título es obligatorio', true); return; }
  if (!data.date)  { showToast('La fecha es obligatoria', true); return; }

  const idx = newsData.findIndex(n => n.id === activeNewsId);
  if (idx === -1) return;
  newsData[idx] = Object.assign({}, newsData[idx], data);
  activeNewsId = data.id;
  newsData[idx].id = data.id;

  setStatus('Guardando...');
  const isLocal = ['localhost','127.0.0.1'].includes(window.location.hostname);
  try {
    if (isLocal) await saveLocal();
    if (getToken()) {
      showToast('Publicando a GitHub...');
      await publishGitHub();
      showToast('🚀 Publicado en GitHub!');
    } else {
      showToast('✅ Guardado localmente. Agrega un token para publicar.');
    }
    setStatus('Guardado ✓');
    renderSidebarList();
  } catch (err) {
    showToast('Error: ' + err.message, true);
    setStatus('Error');
  }
}

async function saveLocal() {
  const res = await fetch('/api/save-news', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newsData, null, 2)
  });
  if (!res.ok) throw new Error('Error guardando localmente');
}

// ── Delete ────────────────────────────────────────────────────────────────────
async function deleteNews() {
  if (!activeNewsId) return;
  const n = newsData.find(x => x.id === activeNewsId);
  if (!confirm('¿Eliminar la noticia "' + (n && n.title ? n.title : activeNewsId) + '"?')) return;
  newsData = newsData.filter(x => x.id !== activeNewsId);
  activeNewsId = null;
  document.getElementById('pn-editor').style.display = 'none';
  document.getElementById('editor-empty-state').style.display = '';
  try {
    if (['localhost','127.0.0.1'].includes(window.location.hostname)) await saveLocal();
    if (getToken()) await publishGitHub();
    showToast('Noticia eliminada');
  } catch (err) { showToast('Error: ' + err.message, true); }
  renderSidebarList();
}

// ── Publish (Worker or Direct Token) ──────────────────────────────────────────
async function publishGitHub() {
  const workerUrl = getWorkerUrl();
  const adminPass = getAdminPass();
  const token = getToken();

  if ((!workerUrl || !adminPass) && !token) {
    openTokenModal();
    throw new Error('Configura tu Contraseña de Administrador o Token de GitHub.');
  }

  // 1. Ruta preferida: Cloudflare Worker seguro con contraseña
  if (workerUrl && adminPass) {
    const payload = {
      branch: TARGET_BRANCH,
      password: adminPass,
      newsJson: newsData,
      images: Object.values(pendingImages).map(img => ({
        filename: img.filename,
        base64: img.dataUrl
      }))
    };

    const res = await fetch(workerUrl.replace(/\/+$/, '') + '/publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + adminPass
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Error en el microservicio (código ' + res.status + ')');
    }
    pendingImages = {};
    return;
  }

  // 2. Ruta alternativa: Token GitHub directo en cliente
  for (const img of Object.values(pendingImages)) {
    await ghCommit(token, IMAGES_PATH + '/' + img.filename, img.dataUrl.split(',')[1],
      'feat: imagen noticias ' + img.filename);
  }
  pendingImages = {};
  const b64 = utfB64(JSON.stringify(newsData, null, 2));
  for (const path of [NEWS_FILE, NEWS_FILE_2]) {
    await ghCommit(token, path, b64, 'docs: noticias actualizadas [' + TARGET_BRANCH + ']');
  }
}

async function ghCommit(token, path, b64, message) {
  const apiUrl = 'https://api.github.com/repos/' + REPO_OWNER + '/' + REPO_NAME + '/contents/' + path;
  let sha = '';
  try {
    const r = await fetch(apiUrl + '?ref=' + TARGET_BRANCH, {
      headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github.v3+json' }
    });
    if (r.ok) sha = (await r.json()).sha || '';
  } catch (_) {}
  const body = Object.assign({ message, content: b64, branch: TARGET_BRANCH }, sha ? { sha } : {});
  const put = await fetch(apiUrl, {
    method: 'PUT',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', Accept: 'application/vnd.github.v3+json' },
    body: JSON.stringify(body)
  });
  if (!put.ok) { const e = await put.json().catch(() => ({})); throw new Error(e.message || 'Error en ' + path); }
}

// ── Toggle sections ───────────────────────────────────────────────────────────
function toggleSections(type) {
  document.getElementById('section-own-post').classList.toggle('visible', type === 'own-post');
  document.getElementById('section-ext-link').classList.toggle('visible', type !== 'own-post');
}

// ── Bind events ───────────────────────────────────────────────────────────────
function bindHeaderEvents() {
  document.getElementById('btn-gh-token').addEventListener('click', openTokenModal);
  document.getElementById('btn-publish').addEventListener('click', async () => {
    if (!hasAuth()) { openTokenModal(); return; }
    const btn = document.getElementById('btn-publish');
    btn.disabled = true;
    try {
      showToast('⏳ Publicando noticias...');
      await publishGitHub();
      showToast('🚀 ¡Publicado en GitHub con éxito! Se desplegará en ~1 min.');
    } catch (err) {
      showToast('❌ ' + err.message, true);
    } finally {
      btn.disabled = false;
    }
  });
}

function bindEditorEvents() {
  document.getElementById('btn-new-news').addEventListener('click', createNew);
  document.getElementById('btn-save-news').addEventListener('click', saveNews);
  document.getElementById('btn-delete-news').addEventListener('click', deleteNews);

  document.querySelectorAll('input[name="news-type"]').forEach(r =>
    r.addEventListener('change', () => toggleSections(r.value))
  );

  const tagsInput = document.getElementById('tags-input');
  tagsInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagsInput.value); tagsInput.value = ''; }
  });

  document.querySelectorAll('.rte-btn[data-cmd]').forEach(btn =>
    btn.addEventListener('mousedown', e => {
      e.preventDefault();
      document.execCommand(btn.dataset.cmd, false, btn.dataset.val || null);
      document.getElementById('rte-content').focus();
    })
  );
  const rteClr = document.getElementById('rte-clear');
  if (rteClr) rteClr.addEventListener('mousedown', e => {
    e.preventDefault(); document.execCommand('removeFormat', false, null);
    document.getElementById('rte-content').focus();
  });

  const coverInput = document.getElementById('cover-file-input');
  const coverArea  = document.getElementById('cover-upload-area');
  coverInput.addEventListener('change', e => handleCoverFile(e.target.files[0]));
  document.getElementById('cover-change-btn').addEventListener('click', e => { e.stopPropagation(); coverInput.click(); });
  coverArea.addEventListener('dragover', e => { e.preventDefault(); coverArea.style.borderColor = 'var(--pn-gold)'; });
  coverArea.addEventListener('dragleave', () => { coverArea.style.borderColor = ''; });
  coverArea.addEventListener('drop', e => { e.preventDefault(); coverArea.style.borderColor = ''; handleCoverFile(e.dataTransfer.files[0]); });

  document.getElementById('btn-add-gallery-img').addEventListener('click', () =>
    document.getElementById('gallery-img-input').click()
  );
  document.getElementById('gallery-img-input').addEventListener('change', e => {
    handleGalleryFiles(e.target.files); e.target.value = '';
  });
  document.getElementById('btn-add-gallery-video').addEventListener('click', () => {
    document.getElementById('video-url-input').value = '';
    document.getElementById('video-caption-input').value = '';
    document.getElementById('modal-video').classList.add('open');
  });
}

function bindModalEvents() {
  document.getElementById('btn-cancel-video').addEventListener('click', () =>
    document.getElementById('modal-video').classList.remove('open')
  );
  document.getElementById('btn-confirm-video').addEventListener('click', () => {
    const url     = document.getElementById('video-url-input').value.trim();
    const caption = document.getElementById('video-caption-input').value.trim();
    if (!url) { showToast('Ingresa una URL de video', true); return; }
    galleryItems.push({ type: 'video', src: url, caption });
    renderGalleryUI();
    document.getElementById('modal-video').classList.remove('open');
  });

  document.getElementById('btn-cancel-token').addEventListener('click', closeTokenModal);
  document.getElementById('btn-remove-token').addEventListener('click', () => {
    localStorage.removeItem('premilitar_worker_url');
    localStorage.removeItem('premilitar_admin_pass');
    localStorage.removeItem('premilitar_gh_token');
    updateTokenDot();
    closeTokenModal();
    showToast('Credenciales eliminadas');
  });
  document.getElementById('btn-save-token').addEventListener('click', () => {
    const wUrl = (document.getElementById('input-worker-url')?.value || '').trim();
    const pass = (document.getElementById('input-admin-pass')?.value || '').trim();
    const tok  = (document.getElementById('input-gh-token')?.value || '').trim();

    if (wUrl) localStorage.setItem('premilitar_worker_url', wUrl);
    else localStorage.removeItem('premilitar_worker_url');

    if (pass) localStorage.setItem('premilitar_admin_pass', pass);
    else localStorage.removeItem('premilitar_admin_pass');

    if (tok)  localStorage.setItem('premilitar_gh_token', tok);
    else localStorage.removeItem('premilitar_gh_token');

    updateTokenDot();
    closeTokenModal();
    showToast('🔑 Credenciales guardadas');
  });

  document.querySelectorAll('.modal-overlay').forEach(o =>
    o.addEventListener('click', e => { if (e.target === o) o.classList.remove('open'); })
  );
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
  });
}

// ── Auth & Credentials ────────────────────────────────────────────────────────
function getWorkerUrl()   { return localStorage.getItem('premilitar_worker_url') || ''; }
function getAdminPass()   { return localStorage.getItem('premilitar_admin_pass') || ''; }
function getToken()       { return localStorage.getItem('premilitar_gh_token') || ''; }
function hasAuth()        { return (getWorkerUrl() && getAdminPass()) || !!getToken(); }

function openTokenModal() {
  setVal('input-worker-url', getWorkerUrl());
  setVal('input-admin-pass', getAdminPass());
  setVal('input-gh-token',   getToken());
  document.getElementById('modal-token').classList.add('open');
}
function closeTokenModal(){ document.getElementById('modal-token').classList.remove('open'); }
function updateTokenDot() {
  const d = document.getElementById('token-dot');
  if (d) d.classList.toggle('connected', hasAuth());
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function showToast(msg, isError) {
  const t = document.getElementById('pn-toast');
  if (!t) return;
  t.textContent = msg;
  t.style.background = isError ? '#ef4444' : '#10b981';
  t.style.display = 'block';
  clearTimeout(t._tmr);
  t._tmr = setTimeout(() => { t.style.display = 'none'; }, 5000);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function setVal(id, v)  { var e = document.getElementById(id); if (e) e.value = v || ''; }
function setStatus(msg) { var e = document.getElementById('editor-status'); if (e) e.textContent = msg; }
function todayISO()     { return new Date().toISOString().split('T')[0]; }
function fmtDate(str)   { try { var p=str.split('-'); return new Date(+p[0],+p[1]-1,+p[2]).toLocaleDateString('es-CL',{day:'numeric',month:'short',year:'numeric'}); } catch(e){ return str; } }
function slugify(s)     { return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').substring(0,60); }
function sanitize(s)    { return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9._-]/g,'-').replace(/-+/g,'-'); }
function escH(s)        { return (s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function getYtId(u)     { var m=(u||'').match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/); return m?m[1]:null; }
function utfB64(s)      { return btoa(unescape(encodeURIComponent(s))); }

// ── Start ─────────────────────────────────────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

