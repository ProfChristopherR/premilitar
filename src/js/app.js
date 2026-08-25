// Controlador principal del Landing Page
import { fetchGeneralData, fetchAreasData, fetchNewsData } from './data-loader.js';

const imageGlobs = import.meta.glob('/src/assets/media/**/*.{jpg,jpeg,png}', { eager: true, query: '?url', import: 'default' });

function getAreaCardImage(area) {
  // Buscar si hay imagen específica en la carpeta del área
  for (const [path, url] of Object.entries(imageGlobs)) {
    if (path.includes(`/${area.id}/`)) return url;
  }
  // Si en areas.json hay una URL web (http...)
  if (area.heroImage && area.heroImage.startsWith('http')) return area.heroImage;
  return 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=800&q=80';
}

async function initApp() {
  initNavbar();
  initMobileMenu();
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

// ── Noticias ───────────────────────────────────────────────────────────────────
function renderNews(newsList) {
  const el = document.getElementById('news-grid');
  if (!el) return;

  // Usar fotos reales para la noticia destacada de la Banda de Guerra
  const heroNewsImages = {
    'banda-guerra-nacional-2026': './assets/images/banda-de-guerra/IMG_1029.jpg',
    'facebook-2026': './assets/images/banda-de-guerra/IMG_0927.jpg',
  };

  el.innerHTML = newsList.map(n => {
    const img = heroNewsImages[n.id] || n.image;
    return `
    <article class="news-card" data-href="${n.sourceUrl || '#'}">
      <div class="news-card__img-wrap">
        <img src="${img}" alt="${n.title}" class="news-card__img" loading="lazy" />
        <span class="news-card__category">${n.category}</span>
        ${n.featured ? '<span class="news-card__featured">Destacado</span>' : ''}
      </div>
      <div class="news-card__body">
        <p class="news-card__source">${n.source}</p>
        <p class="news-card__date">${formatDate(n.date)}</p>
        <h3 class="news-card__title">${n.title}</h3>
        <p class="news-card__summary">${n.summary}</p>
        <div class="news-card__read-more">
          <span>Leer en ${n.source}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </div>
      </div>
    </article>
  `}).join('');

  el.querySelectorAll('.news-card').forEach(card => {
    card.addEventListener('click', () => {
      const href = card.getAttribute('data-href');
      if (href && href !== '#') window.open(href, '_blank', 'noopener,noreferrer');
    });
  });
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
