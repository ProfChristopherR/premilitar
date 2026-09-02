// Controlador principal del Landing Page
import { fetchGeneralData, fetchAreasData, fetchNewsData } from './data-loader.js';

// Glob all media from public folder statically (excluye respaldo _originals_jpg)
const imageGlobs = import.meta.glob(
  ['/src/assets/media/**/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}', '!/src/assets/media/_originals_jpg/**'],
  { eager: true, query: '?url', import: 'default' }
);

function getAreaCardImage(area) {
  // 1. Si en areas.json hay una imagen definida, respetarla y asegurar webp
  if (area.heroImage) {
    let hero = area.heroImage;
    if (hero.startsWith('http')) return hero;
    hero = hero.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    if (hero.startsWith('/assets/')) return '.' + hero;
    if (hero.startsWith('./assets/')) return hero;
  }
  // 2. Buscar si hay imagen específica en la carpeta del área
  for (const [path, url] of Object.entries(imageGlobs)) {
    if (path.includes(`/${area.id}/`)) return url;
  }
  return './assets/images/peloton-premilitar/IMG_0151.webp';
}

async function initApp() {
  initNavbar();
  initMobileMenu();
  initFeaturedVideo();
  const [general, areas, news] = await Promise.all([
    fetchGeneralData(),
    fetchAreasData(),
    fetchNewsData(),
  ]);
  if (general) {
    renderHeroStats(general.history.stats);
    renderHistory(general.history);
  }
  if (areas && areas.length > 0) renderAreasGrid(areas);
  if (news && news.length > 0) renderNews(news);
  initScrollReveal();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// ── Navbar scroll ──────────────────────────────────────────────────────────────
function initNavbar() {
  const navbar = document.getElementById('main-navbar');
  if (!navbar) return;
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  });
  // Active nav link
  const links = document.querySelectorAll('.nav-link[href^="#"]');
  const sections = [];
  links.forEach(l => {
    const id = l.getAttribute('href').replace('#', '');
    const el = document.getElementById(id);
    if (el) sections.push({ el, link: l });
  });
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY + 100;
    sections.forEach(({ el, link }) => {
      const top = el.offsetTop;
      const bottom = top + el.offsetHeight;
      link.classList.toggle('active', scrollY >= top && scrollY < bottom);
    });
  });
}

// ── Menú móvil ────────────────────────────────────────────────────────────────
function initMobileMenu() {
  const btn = document.getElementById('nav-menu-btn');
  const list = document.getElementById('nav-links-list');
  if (!btn || !list) return;
  let open = false;
  btn.addEventListener('click', () => {
    open = !open;
    list.style.cssText = open
      ? `display:flex;flex-direction:column;position:fixed;top:var(--nav-height);left:0;width:100%;background:var(--color-navy);padding:1.5rem 2rem;gap:1.25rem;z-index:800;border-bottom:2px solid var(--color-gold);`
      : '';
  });
  list.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    open = false; list.removeAttribute('style');
  }));
}

// ── Hero Stats ─────────────────────────────────────────────────────────────────
function renderHeroStats(stats) {
  const el = document.getElementById('hero-stats');
  if (!el || !stats) return;
  el.innerHTML = stats.map(s => `
    <div>
      <div class="hero__stat-value">${s.value}</div>
      <div class="hero__stat-label">${s.label}</div>
    </div>
  `).join('');
}

// ── Historia ─────────────────────────────────────────────────────────────────
function renderHistory(history) {
  const textEl = document.getElementById('history-text');
  if (textEl && history.paragraphs) {
    textEl.innerHTML = history.paragraphs.map(p => `<p>${p}</p>`).join('');
  }
  const timelineEl = document.getElementById('history-timeline');
  if (timelineEl && history.milestones) {
    timelineEl.innerHTML = history.milestones.map(m => `
      <div class="timeline-item">
        <div class="timeline-year">${m.year}</div>
        <div class="timeline-title">${m.title}</div>
        <div class="timeline-desc">${m.description}</div>
      </div>
    `).join('');
  }
}

// ── Grid de Áreas ─────────────────────────────────────────────────────────────
function renderAreasGrid(areas) {
  const el = document.getElementById('areas-grid');
  if (!el) return;
  el.innerHTML = areas.map((area, i) => `
    <article class="area-card">
      <img src="${getAreaCardImage(area)}" alt="${area.name}" class="area-card__img" loading="lazy" />
      <div class="area-card__body">
        <p class="area-card__num">Área 0${i + 1}</p>
        <h3 class="area-card__title">${area.shortName || area.name}</h3>
        <p class="area-card__tagline">${area.tagline}</p>
        <a href="area.html?id=${area.id}" class="area-card__link">
          Explorar área
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </a>
      </div>
    </article>
  `).join('');
}

// ── Noticias (Galería 2x3 con Paginación y Modal Amplio) ──────────────────────
let newsCurrentPage = 1;
const NEWS_ITEMS_PER_PAGE = 6;
let cachedNewsList = [];

function renderNews(newsList) {
  const el = document.getElementById('news-grid');
  if (!el) return;

  cachedNewsList = newsList || [];

  // Usar fotos reales para la noticia destacada de la Banda de Guerra
  const heroNewsImages = {
    'banda-guerra-nacional-2026': './assets/images/banda-de-guerra/IMG_1029.webp',
    'facebook-2026': './assets/images/banda-de-guerra/IMG_0927.webp',
  };

  const totalPages = Math.ceil(cachedNewsList.length / NEWS_ITEMS_PER_PAGE) || 1;
  if (newsCurrentPage > totalPages) newsCurrentPage = totalPages;
  if (newsCurrentPage < 1) newsCurrentPage = 1;

  const startIndex = (newsCurrentPage - 1) * NEWS_ITEMS_PER_PAGE;
  const endIndex   = startIndex + NEWS_ITEMS_PER_PAGE;
  const pageItems  = cachedNewsList.slice(startIndex, endIndex);

  el.innerHTML = pageItems.map(n => {
    const img = heroNewsImages[n.id] || n.coverImage || n.image;
    const isOwn = n.type === 'own-post';
    return `
    <article class="news-card ${isOwn ? 'news-card--own' : ''}" data-news-id="${n.id}" data-href="${n.sourceUrl || '#'}">
      <div class="news-card__img-wrap">
        <img src="${img}" alt="${n.title}" class="news-card__img" loading="lazy" />
        <span class="news-card__category">${n.category || 'Actualidad'}</span>
        ${n.featured ? '<span class="news-card__featured">Destacado</span>' : ''}
        ${isOwn ? '<span class="news-card__badge-own">📖 Artículo</span>' : ''}
      </div>
      <div class="news-card__body">
        <p class="news-card__source">${n.source || (isOwn ? 'Sendero Pre-Militar' : '')}</p>
        <p class="news-card__date">${formatDate(n.date)}</p>
        <h3 class="news-card__title">${n.title}</h3>
        <p class="news-card__summary">${n.summary}</p>
        <div class="news-card__read-more">
          ${isOwn
            ? '<span>Leer artículo</span>'
            : `<span>Leer en ${n.source}</span>`
          }
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </div>
      </div>
    </article>
  `}).join('');

  // Renderizar controles de galería / paginación
  renderNewsPagination(totalPages);

  // Inyectar modal de noticia propia si no existe
  if (!document.getElementById('news-modal')) {
    const modalHtml = `
    <div id="news-modal" class="news-modal" role="dialog" aria-modal="true" style="display:none;">
      <div class="news-modal__overlay" id="news-modal-overlay"></div>
      <div class="news-modal__box">
        <button class="news-modal__close" id="news-modal-close" aria-label="Cerrar">&times;</button>
        <div class="news-modal__content" id="news-modal-content"></div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.getElementById('news-modal-overlay').addEventListener('click', closeNewsModal);
    document.getElementById('news-modal-close').addEventListener('click', closeNewsModal);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeNewsModal(); });
  }

  // Inyectar lightbox de pantalla completa para fotos si no existe
  if (!document.getElementById('news-fullscreen-lightbox')) {
    const fsHtml = `
    <div id="news-fullscreen-lightbox" class="news-fullscreen-lightbox" style="display:none;" role="dialog" aria-modal="true">
      <div class="news-fullscreen-overlay" id="news-fs-overlay"></div>
      <button class="news-fullscreen-close" id="news-fs-close" aria-label="Cerrar pantalla completa">&times;</button>
      <div class="news-fullscreen-body">
        <img id="news-fs-img" class="news-fullscreen-img" src="" alt="" />
        <div id="news-fs-caption" class="news-fullscreen-caption"></div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', fsHtml);
    const closeFs = () => {
      const fs = document.getElementById('news-fullscreen-lightbox');
      if (fs) fs.style.display = 'none';
    };
    document.getElementById('news-fs-overlay').addEventListener('click', closeFs);
    document.getElementById('news-fs-close').addEventListener('click', closeFs);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeFs(); });
  }

  el._newsData = cachedNewsList;

  el.querySelectorAll('.news-card').forEach(card => {
    card.addEventListener('click', () => {
      const id   = card.getAttribute('data-news-id');
      const news = (el._newsData || []).find(n => n.id === id);
      if (!news) return;
      if (news.type === 'own-post') {
        openNewsModal(news);
      } else {
        const href = card.getAttribute('data-href');
        if (href && href !== '#') window.open(href, '_blank', 'noopener,noreferrer');
      }
    });
  });
}

function renderNewsPagination(totalPages) {
  const paginationWrap = document.getElementById('news-pagination');
  if (!paginationWrap) return;

  if (totalPages <= 1) {
    paginationWrap.style.display = 'none';
    return;
  }

  paginationWrap.style.display = 'flex';
  const prevBtn  = document.getElementById('news-prev-btn');
  const nextBtn  = document.getElementById('news-next-btn');
  const dotsWrap = document.getElementById('news-page-dots');

  if (prevBtn) {
    prevBtn.disabled = newsCurrentPage <= 1;
    prevBtn.onclick = () => {
      if (newsCurrentPage > 1) {
        newsCurrentPage--;
        renderNews(cachedNewsList);
        document.getElementById('noticias')?.scrollIntoView({ behavior: 'smooth' });
      }
    };
  }

  if (nextBtn) {
    nextBtn.disabled = newsCurrentPage >= totalPages;
    nextBtn.onclick = () => {
      if (newsCurrentPage < totalPages) {
        newsCurrentPage++;
        renderNews(cachedNewsList);
        document.getElementById('noticias')?.scrollIntoView({ behavior: 'smooth' });
      }
    };
  }

  if (dotsWrap) {
    dotsWrap.innerHTML = Array.from({ length: totalPages }, (_, i) => i + 1).map(num => `
      <button type="button" class="news-dot ${num === newsCurrentPage ? 'active' : ''}" data-page="${num}">
        ${num}
      </button>
    `).join('');

    dotsWrap.querySelectorAll('.news-dot').forEach(btn => {
      btn.onclick = () => {
        const p = parseInt(btn.dataset.page, 10);
        if (p && p !== newsCurrentPage) {
          newsCurrentPage = p;
          renderNews(cachedNewsList);
          document.getElementById('noticias')?.scrollIntoView({ behavior: 'smooth' });
        }
      };
    });
  }
}

function openNewsModal(news) {
  const modal   = document.getElementById('news-modal');
  const content = document.getElementById('news-modal-content');
  if (!modal || !content) return;

  const coverHtml = news.coverImage
    ? `<img src="${news.coverImage}" alt="${news.title}" class="news-modal__cover" loading="lazy" />`
    : '';

  const galleryHtml = (news.gallery && news.gallery.length)
    ? `<div class="news-modal__gallery">
        <h4 class="news-modal__gallery-title">📸 Galería de Fotografías y Videos</h4>
        <div class="news-modal__gallery-grid">
          ${news.gallery.map(item => {
            if (item.type === 'image') {
              return `<img src="${item.src}" alt="${item.caption || ''}" class="news-modal__gallery-img" loading="lazy" title="${item.caption || ''}" />`;
            }
            const ytMatch = (item.src || '').match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
            const ytId = ytMatch ? ytMatch[1] : null;
            if (ytId) {
              return `<div class="news-modal__video-wrap"><iframe src="https://www.youtube.com/embed/${ytId}" title="${item.caption || 'Video'}" allowfullscreen loading="lazy"></iframe></div>`;
            }
            return `<a href="${item.src}" target="_blank" rel="noopener" class="news-modal__video-link">▶ ${item.caption || 'Ver video'}</a>`;
          }).join('')}
        </div>
      </div>`
    : '';

  const tagsHtml = (news.tags && news.tags.length)
    ? `<div class="news-modal__tags">${news.tags.map(t => `<span class="news-modal__tag">${t}</span>`).join('')}</div>`
    : '';

  content.innerHTML = `
    ${coverHtml}
    <div class="news-modal__header">
      ${news.category ? `<span class="news-modal__category">${news.category}</span>` : ''}
      <h2 class="news-modal__title">${news.title}</h2>
      <div class="news-modal__meta">
        <span>📅 ${formatDate(news.date)}</span>
        ${news.author ? `<span>✍️ ${news.author}</span>` : ''}
      </div>
    </div>
    <div class="news-modal__body">${news.body || ''}</div>
    ${tagsHtml}
    ${galleryHtml}
  `;

  // Abrir fotos en Pantalla Completa (Full Screen Lightbox)
  content.querySelectorAll('.news-modal__gallery-img').forEach(img => {
    img.addEventListener('click', () => {
      const fs = document.getElementById('news-fullscreen-lightbox');
      const fsImg = document.getElementById('news-fs-img');
      const fsCap = document.getElementById('news-fs-caption');
      if (fs && fsImg) {
        fsImg.src = img.src;
        const cap = img.getAttribute('title') || img.alt || '';
        if (fsCap) {
          fsCap.textContent = cap;
          fsCap.style.display = cap ? 'block' : 'none';
        }
        fs.style.display = 'flex';
      }
    });
  });

  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeNewsModal() {
  const modal = document.getElementById('news-modal');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';
}

// ── Scroll Reveal ─────────────────────────────────────────────────────────────
function initScrollReveal() {
  const obs = new IntersectionObserver(
    entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('active'); }),
    { threshold: 0.07 }
  );
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}

// ── Utilidades ────────────────────────────────────────────────────────────────
function formatDate(str) {
  try {
    const [y, m, d] = str.split('-');
    return new Date(+y, +m - 1, +d).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return str; }
}

// ── Video Destacado (HTML5 Nativo 1080p sin marcas ni controles de terceros) ──
function initFeaturedVideo() {
  const video = document.getElementById('featured-video-player');
  if (!video) return;

  const playPauseBtn = document.getElementById('btn-video-play-pause');
  const muteBtn = document.getElementById('btn-video-mute');
  const iconPlay = playPauseBtn?.querySelector('.icon-play');
  const iconPause = playPauseBtn?.querySelector('.icon-pause');
  const playText = playPauseBtn?.querySelector('.btn-text');
  const iconMuted = muteBtn?.querySelector('.icon-muted');
  const iconUnmuted = muteBtn?.querySelector('.icon-unmuted');
  const muteText = muteBtn?.querySelector('.btn-text');

  // Asegurar reproducción inicial
  video.play().catch(() => {
    video.muted = true;
    video.play().catch(() => {});
  });

  video.addEventListener('play', () => {
    if (iconPause) iconPause.style.display = 'block';
    if (iconPlay) iconPlay.style.display = 'none';
    if (playText) playText.textContent = 'Pausar';
  });

  video.addEventListener('pause', () => {
    if (iconPause) iconPause.style.display = 'none';
    if (iconPlay) iconPlay.style.display = 'block';
    if (playText) playText.textContent = 'Reproducir';
  });

  if (playPauseBtn) {
    playPauseBtn.addEventListener('click', () => {
      if (video.paused) {
        video.play();
      } else {
        video.pause();
      }
    });
  }

  if (muteBtn) {
    muteBtn.addEventListener('click', () => {
      video.muted = !video.muted;
      if (video.muted) {
        if (iconMuted) iconMuted.style.display = 'block';
        if (iconUnmuted) iconUnmuted.style.display = 'none';
        if (muteText) muteText.textContent = 'Activar Sonido';
      } else {
        if (iconMuted) iconMuted.style.display = 'none';
        if (iconUnmuted) iconUnmuted.style.display = 'block';
        if (muteText) muteText.textContent = 'Silenciar';
      }
    });
  }
}


