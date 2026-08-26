// Controlador de la vista detallada de Área
import { fetchAreasData, fetchAreaById } from './data-loader.js';
import { setupModelViewerControls } from './model-viewer-init.js';

const TECH_AREA_ID = 'tecnologia-geomatica';

// Glob all media from public folder statically
const imageGlobs = import.meta.glob('/src/assets/media/**/*.{jpg,jpeg,png,JPG,JPEG,PNG}', { eager: true, query: '?url', import: 'default' });
const videoGlobs = import.meta.glob('/src/assets/media/**/*.{mp4,MP4}', { eager: true, query: '?url', import: 'default' });
const linksGlobs = import.meta.glob('/src/assets/media/**/enlaces.json', { eager: true });

function getDynamicMedia(areaId) {
  const images = [];
  const videos = [];
  let links = { videos_youtube: [], mapas_arcgis: [] };

  // Collect images — excluding map preview images (named with place names)
  const MAP_PREVIEW_PATTERN = /^(Fundo|Liceo|Terreno|Lago|result)/i;
  for (const [path, url] of Object.entries(imageGlobs)) {
    if (path.includes(`/${areaId}/`)) {
      const filename = path.split('/').pop() || '';
      if (!MAP_PREVIEW_PATTERN.test(filename)) {
        images.push({ url, path, caption: 'Registro fotográfico' });
      }
    }
  }
  
  // Collect local videos
  for (const [path, url] of Object.entries(videoGlobs)) {
    if (path.includes(`/${areaId}/`)) {
      videos.push({ title: 'Video Demostrativo', url });
    }
  }

  // Collect external links
  for (const [path, module] of Object.entries(linksGlobs)) {
    if (path.includes(`/${areaId}/`) && module.default) {
      links = module.default;
    }
  }

  // Combine external links with videos & maps
  if (links.videos_youtube) {
    links.videos_youtube.forEach(url => videos.push({ title: 'Video Oficial', url }));
  }
  if (links.videos_instagram) {
    links.videos_instagram.forEach(item => {
      if (typeof item === 'string') {
        videos.push({ title: 'Instagram Reel', url: item, type: 'instagram' });
      } else {
        videos.push({ title: item.title || 'Instagram Reel', url: item.url, type: 'instagram' });
      }
    });
  }
  if (links.mapas_arcgis) {
    links.mapas_arcgis.forEach(item => {
      if (typeof item === 'string') {
        if (item.startsWith('http')) {
          videos.push({ title: 'Mapa Interactivo', url: item });
        } else {
          videos.push({
            title: 'Fotogrametría ArcGIS',
            type: 'arcgis',
            itemId: item,
            center: '-72.1854366630625,-36.54274241200271',
            scale: '9027.977411',
            portalUrl: 'https://lpsn.maps.arcgis.com'
          });
        }
      } else if (typeof item === 'object') {
        videos.push({
          title: item.title || 'Fotogrametría ArcGIS',
          type: 'arcgis',
          itemId: item.itemId || item['item-id'],
          center: item.center || '-72.1854366630625,-36.54274241200271',
          scale: item.scale || '9027.977411',
          portalUrl: item.portalUrl || item['portal-url'] || 'https://lpsn.maps.arcgis.com'
        });
      }
    });
  }

  return { images, videos };
}

// IDs de las imágenes reales disponibles
const REAL_IMAGES = {
  'musica-identidad': {
    hero: '/assets/images/banda-de-guerra/IMG_0926.jpg',
    gallery: [
      { url: '/assets/images/banda-de-guerra/IMG_0927.jpg', caption: 'Banda de percusión en formación' },
      { url: '/assets/images/banda-de-guerra/IMG_0938.jpg', caption: 'Percusionistas en exterior' },
      { url: '/assets/images/banda-de-guerra/IMG_1018.jpg', caption: 'Cornetín con insignia institucional' },
      { url: '/assets/images/banda-de-guerra/IMG_1029.jpg', caption: 'Formación de cajas claras' },
    ],
    project_images: {
      'Banda de Guerra — Concurso Nacional de Carabineros': '/assets/images/banda-de-guerra/IMG_0926.jpg',
      'Repertorio Marcial Institucional': '/assets/images/banda-de-guerra/IMG_1018.jpg',
    },
    news_image: '/assets/images/banda-de-guerra/IMG_1029.jpg',
  },
};

async function initAreaView() {
  const urlParams = new URLSearchParams(window.location.search);
  const areaId = urlParams.get('id') || 'disciplina-formacion';

  const [areas, current] = await Promise.all([
    fetchAreasData(),
    fetchAreaById(areaId),
  ]);

  if (areas && areas.length > 0) renderAreaTabs(areas, areaId);
  if (current) renderAreaContent(current);

  initScrollReveal();
  initNavbarScroll();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAreaView);
} else {
  initAreaView();
}

// ── Tabs en navbar ────────────────────────────────────────────────────────────
function renderAreaTabs(areas, activeId) {
  const nav = document.getElementById('area-tabs-nav');
  if (!nav) return;
  nav.innerHTML = areas.map(a => `
    <a
      href="area.html?id=${a.id}"
      class="area-tab ${a.id === activeId ? 'active' : ''}"
    >${a.shortName || a.name}</a>
  `).join('');
}

// ── Contenido principal del área ──────────────────────────────────────────────
function renderAreaContent(area) {
  document.title = `${area.shortName || area.name} — Sendero Pre-Militar`;

  // Dynamic Media Discovery
  const dynMedia = getDynamicMedia(area.id);

  // Core content
  setById('area-title', area.name);
  setById('area-name', area.name);
  setById('area-tagline', area.tagline);
  setById('area-description', area.description);
  
  let heroImgUrl = './assets/images/peloton-premilitar/IMG_0151.jpg';
  if (area.heroImage) {
    heroImgUrl = area.heroImage.startsWith('/assets/') ? '.' + area.heroImage : area.heroImage;
  } else if (dynMedia.images.length > 0) {
    heroImgUrl = dynMedia.images[0].url;
  }
  
  const heroBg = document.querySelector('.hero-bg');
  if (heroBg) heroBg.style.backgroundImage = `url('${heroImgUrl}')`;

  // Objectives
  renderObjectives(area.objectives, dynMedia.images);

  // Equipment & Sub-areas
  if (area.equipment || area.practicalExample) {
    const equipBlock = document.getElementById('area-equipment');
    if (equipBlock && equipBlock.closest('.reveal')) {
      equipBlock.closest('.reveal').style.display = 'block';
    }
    renderEquipment(area.equipment, area.practicalExample, dynMedia.images);
  } else {
    const equipBlock = document.getElementById('area-equipment');
    if (equipBlock && equipBlock.closest('.reveal')) {
      equipBlock.closest('.reveal').style.display = 'none';
    }
  }
  if (area.subAreas) renderSubAreas(area.subAreas);

  // Proyectos
  if (area.subAreas) {
    renderProjectsBySubArea(area);
  } else {
    renderProjectsSimple(area);
  }

  // Visor 3D solo en Tecnología/Geomática
  if (area.id === TECH_AREA_ID && area.model3D) {
    const section3d = document.getElementById('modelo-3d');
    if (section3d) section3d.style.display = 'block';
    renderModelViewer(area.model3D);
  }

  // Multimedia
  renderMultimedia(dynMedia);
}

// ── Objetivos ─────────────────────────────────────────────────────────────────
function renderObjectives(objectives, dynamicImages) {
  const el = document.getElementById('area-objectives');
  if (!el || !objectives) return;
  
  // Buscar si hay una imagen que se llame "objetivo"
  let imgObj = dynamicImages.find(img => (img.path && img.path.toLowerCase().includes('objetivo')) || (img.url && img.url.toLowerCase().includes('objetivo')));
  let imgUrl = imgObj ? imgObj.url : (dynamicImages.length > 0 ? dynamicImages[0].url : './assets/images/peloton-premilitar/IMG_0151.jpg');

  const listHtml = objectives.map(o => `
    <li class="objective-item">
      <span class="objective-check">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-navy)" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
      </span>
      <span>${o}</span>
    </li>
  `).join('');

  el.innerHTML = `
    <div class="text-image-split">
      <ul class="objectives-list">${listHtml}</ul>
      <img src="${imgUrl}" alt="Objetivos" class="split-image" loading="lazy" />
    </div>
  `;
}

// ── Equipamiento ──────────────────────────────────────────────────────────────
function renderEquipment(equipment, practicalExample, dynamicImages) {
  const el = document.getElementById('area-equipment');
  
  if (el && equipment) {
    const listHtml = equipment.map(item => `
      <li class="equipment-item">
        <span class="equipment-item__dot"></span>
        <span>${item}</span>
      </li>
    `).join('');
    
    // Buscar si hay una imagen que se llame "equipo" o "equipamiento"
    let imgObj = dynamicImages.find(img => (img.path && (img.path.toLowerCase().includes('equipo') || img.path.toLowerCase().includes('equipamiento'))) || (img.url && (img.url.toLowerCase().includes('equipo') || img.url.toLowerCase().includes('equipamiento'))));
    let imgUrl = imgObj ? imgObj.url : (dynamicImages.length > 1 ? dynamicImages[1].url : (dynamicImages.length > 0 ? dynamicImages[0].url : './assets/images/peloton-premilitar/IMG_0060.jpg'));

    el.innerHTML = `
      <div class="text-image-split reverse">
        <ul class="equipment-list">${listHtml}</ul>
        <img src="${imgUrl}" alt="Equipamiento" class="split-image" loading="lazy" />
      </div>
    `;
  }
  const practBlock = document.getElementById('area-practical');
  const practText = document.getElementById('area-practical-text');
  if (practBlock && practText && practicalExample) {
    practBlock.style.display = 'block';
    practText.textContent = practicalExample;
  }
}

// ── Sub-áreas (Tecnología) — en sección de equipamiento ───────────────────────
function renderSubAreas(subAreas) {
  const el = document.getElementById('area-subareas');
  if (!el) return;
  el.innerHTML = subAreas.map(sub => `
    <div class="reveal" style="margin-bottom:3rem;">
      <span class="subarea-level-badge">${sub.level}</span>
      <div class="subarea-header"><h3>${sub.title}</h3></div>
      <p style="color:var(--text-on-light-2);margin-bottom:1.5rem;line-height:1.75;">${sub.description}</p>
      <div class="subarea-grid">
        <div>
          <p style="font-family:var(--font-display);font-size:0.75rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-gold);margin-bottom:0.75rem;">Equipamiento y Software</p>
          <ul class="equipment-list">
            ${sub.equipment.map(e => `<li class="equipment-item"><span class="equipment-item__dot"></span><span>${e}</span></li>`).join('')}
          </ul>
        </div>
        <div class="practical-block">
          <div class="practical-block__label">📋 Ejemplo Práctico</div>
          <p>${sub.example}</p>
        </div>
      </div>
    </div>
  `).join('<hr style="border:none;border-top:1px solid var(--border-light);margin:2.5rem 0;" />');
}

// ── Proyectos simples (áreas normales) ────────────────────────────────────────
function renderProjectsSimple(area) {
  const el = document.getElementById('area-projects');
  if (!el || !area.projects) return;
  el.innerHTML = `<div class="projects-grid">${area.projects.map(p => projectCard(p)).join('')}</div>`;
}

// ── Proyectos por sub-área (Tecnología) ───────────────────────────────────────
function renderProjectsBySubArea(area) {
  const el = document.getElementById('area-projects');
  const titleEl = document.getElementById('projects-title');
  if (!el) return;
  if (titleEl) titleEl.textContent = 'Proyectos por Sub-Área';

  // Separar proyectos: GeoGo (1°-2° medio) vs Geomática (3°-4° medio)
  const geogoProjects   = area.projects.filter(p => p.subArea === 'geogo' || p.id?.includes('robot') || p.title.toLowerCase().includes('arduino') || p.title.toLowerCase().includes('robot') || p.title.toLowerCase().includes('cartogr'));
  const geomProjects    = area.projects.filter(p => p.subArea === 'geomatica' || p.title.toLowerCase().includes('fotogram') || p.title.toLowerCase().includes('levant') || p.title.toLowerCase().includes('drone'));
  // Si no hay separación clara, GeoGo = primer mitad, Geomática = segunda mitad
  const allProjects = area.projects;
  const half = Math.ceil(allProjects.length / 2);
  const geo = (geogoProjects.length > 0 || geomProjects.length > 0)
    ? { googo: geogoProjects, geom: geomProjects }
    : { googo: allProjects.slice(0, half), geom: allProjects.slice(half) };

  el.innerHTML = `
    <div style="margin-bottom:3rem;">
      <div style="display:inline-block;background:var(--color-navy);color:var(--color-gold-light);font-family:var(--font-display);font-size:0.75rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;padding:0.3rem 0.9rem;margin-bottom:1.25rem;">
        GeoGo · 1° y 2° Medio
      </div>
      <div class="projects-grid">${geo.googo.map(p => projectCard(p)).join('')}</div>
    </div>
    <hr style="border:none;border-top:2px solid var(--border-light);margin:2rem 0 3rem;" />
    <div>
      <div style="display:inline-block;background:var(--color-navy);color:var(--color-gold-light);font-family:var(--font-display);font-size:0.75rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;padding:0.3rem 0.9rem;margin-bottom:1.25rem;">
        Geomática y Topografía · 3° y 4° Medio
      </div>
      <div class="projects-grid">${geo.geom.map(p => projectCard(p)).join('')}</div>
    </div>
  `;
}

function projectCard(p) {
  const statusCss = p.status ? p.status.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-') : 'activo';
  let imgSrc = p.image || '';
  if (imgSrc.startsWith('/assets/')) {
    imgSrc = '.' + imgSrc;
  }
  
  if (p.arcgis) {
    const configStr = encodeURIComponent(JSON.stringify(p.arcgis));
    return `
      <div class="project-card reveal">
        <div class="project-card__map-preview" data-arcgis-config="${configStr}">
          <img src="${imgSrc}" alt="${p.title}" loading="lazy" />
          <div class="project-card__map-overlay">
            <span class="project-card__status project-card__status--${statusCss}">${p.status || 'Activo'}</span>
            <button type="button" class="project-card__btn-open-map">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
              Explorar Mapa
            </button>
          </div>
        </div>
        <div class="project-card__body">
          <h4 class="project-card__title">${p.title}</h4>
          <p class="project-card__desc">${p.description}</p>
        </div>
      </div>
    `;
  }

  return `
    <div class="project-card reveal">
      <div class="project-card__img-wrap">
        <img src="${imgSrc}" alt="${p.title}" loading="lazy" />
        <span class="project-card__status project-card__status--${statusCss}">${p.status || 'Activo'}</span>
      </div>
      <div class="project-card__body">
        <h4 class="project-card__title">${p.title}</h4>
        <p class="project-card__desc">${p.description}</p>
      </div>
    </div>
  `;
}

// ── Visor 3D ──────────────────────────────────────────────────────────────────
function renderModelViewer(model3D) {
  const viewer = document.getElementById('area-model-viewer');
  const controls = document.getElementById('area-viewer-controls');
  if (!viewer || !model3D) return;

  const models = Array.isArray(model3D) ? model3D : [model3D];
  let currentIndex = 0;

  function showModel(index) {
    const m = models[index];
    viewer.src = m.src;
    if (m.poster) viewer.setAttribute('poster', m.poster);
    viewer.alt = m.alt || m.title;
    setById('model3d-title', m.title);
    setById('model3d-desc', m.description);
  }

  showModel(0);
  setupModelViewerControls(viewer, controls);

  // If multiple, add navigation buttons
  if (models.length > 1) {
    const navDiv = document.createElement('div');
    navDiv.style.cssText = "display:flex; gap:1rem; justify-content:center; margin-top:1rem;";
    
    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = "◀ Anterior";
    prevBtn.className = "btn-primary";
    prevBtn.style.padding = "0.5rem 1rem";
    prevBtn.onclick = () => {
      currentIndex = (currentIndex - 1 + models.length) % models.length;
      showModel(currentIndex);
    };

    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = "Siguiente ▶";
    nextBtn.className = "btn-primary";
    nextBtn.style.padding = "0.5rem 1rem";
    nextBtn.onclick = () => {
      currentIndex = (currentIndex + 1) % models.length;
      showModel(currentIndex);
    };

    navDiv.appendChild(prevBtn);
    navDiv.appendChild(nextBtn);
    
    const textDesc = document.getElementById('model3d-desc');
    if (textDesc && textDesc.parentElement) {
      textDesc.parentElement.appendChild(navDiv);
    }
  }
}

// ── Multimedia ────────────────────────────────────────────────────────────────
function renderMultimedia(dynMedia) {
  const el = document.getElementById('area-media');
  if (!el) return;

  const gallery = dynMedia.images;
  const videos = dynMedia.videos;

  let html = '';

  if (videos.length > 0) {
    html += `
    <div class="reveal">
      <p style="font-family:var(--font-display);font-size:0.75rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-gold);margin-bottom:0.75rem;">Videos y Mapas Interactivos</p>
      <div class="media-scroll-container">
        ${videos.map(v => {
          if (v.type === 'arcgis') {
            const configStr = encodeURIComponent(JSON.stringify(v));
            return `
              <div class="scroll-item video-item-wrap video-item-wrap--map">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                  <p style="font-size: 0.8rem; color:var(--color-gold);">${v.title}</p>
                  <button type="button" class="project-card__btn-open-map trigger-map-fullscreen" data-arcgis-config="${configStr}" style="padding:0.25rem 0.6rem; font-size:0.65rem;">⛶ Pantalla Completa</button>
                </div>
                <div class="video-wrap">
                  <arcgis-embedded-map style="width:100%; height:100%; border-radius:var(--radius); display:block;" item-id="${v.itemId}" theme="light" time-zone-label-enabled center="${v.center}" scale="${v.scale}" portal-url="${v.portalUrl}"></arcgis-embedded-map>
                </div>
              </div>
            `;
          }
          return `
            <div class="scroll-item video-item-wrap ${v.type === 'instagram' ? 'video-item-wrap--portrait' : ''}">
              <p style="font-size: 0.8rem; margin-bottom:0.5rem; color:var(--color-gold);">${v.title}</p>
              <div class="${v.type === 'instagram' ? 'video-wrap video-wrap--portrait' : 'video-wrap'}">
                ${(typeof v.url === 'string' && v.url.endsWith('.mp4'))
                  ? `<video src="${v.url}" controls style="width: 100%; height: 100%; border-radius: var(--radius); object-fit: cover;"></video>` 
                  : `<iframe src="${v.url}" title="${v.title}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`
                }
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
    `;
  }

  if (gallery && gallery.length > 0) {
    html += `
    <div class="reveal" style="margin-top:2rem;">
      <p style="font-family:var(--font-display);font-size:0.75rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-gold);margin-bottom:0.75rem;">Galería Fotográfica</p>
      <div class="media-scroll-container">
        ${gallery.map(item => `
          <div class="scroll-item gallery-item">
            <img src="${item.url}" alt="${item.caption}" loading="lazy" class="lightbox-trigger" />
            <div class="gallery-caption">${item.caption}</div>
          </div>
        `).join('')}
      </div>
    </div>
    `;
  }

  el.innerHTML = html;

  initLightboxHandlers();
}

function initLightboxHandlers() {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxMapWrap = document.getElementById('lightbox-map-wrap');
  const closeBtn = document.getElementById('lightbox-close-btn') || document.querySelector('.lightbox-close');

  if (!lightbox) return;

  function closeLightbox() {
    lightbox.style.display = 'none';
    if (lightboxImg) {
      lightboxImg.style.display = 'none';
      lightboxImg.src = '';
    }
    if (lightboxMapWrap) {
      lightboxMapWrap.style.display = 'none';
      lightboxMapWrap.innerHTML = '';
    }
  }

  // Image triggers
  document.querySelectorAll('.lightbox-trigger').forEach(img => {
    img.addEventListener('click', (e) => {
      if (lightboxMapWrap) lightboxMapWrap.style.display = 'none';
      if (lightboxImg) {
        lightboxImg.src = e.target.src;
        lightboxImg.style.display = 'block';
      }
      lightbox.style.display = 'flex';
    });
  });

  // Map triggers (from project cards and media items)
  document.querySelectorAll('.project-card__map-preview, .trigger-map-fullscreen').forEach(el => {
    el.addEventListener('click', (e) => {
      const configJson = el.getAttribute('data-arcgis-config');
      if (!configJson) return;

      try {
        const config = JSON.parse(decodeURIComponent(configJson));
        if (lightboxImg) lightboxImg.style.display = 'none';
        if (lightboxMapWrap) {
          const itemId = config.itemId || config['item-id'];
          const center = config.center || '-72.1854366630625,-36.54274241200271';
          const scale = config.scale || '9027.977411';
          const portalUrl = config.portalUrl || config['portal-url'] || 'https://lpsn.maps.arcgis.com';

          lightboxMapWrap.innerHTML = `
            <arcgis-embedded-map 
              style="width: 100%; height: 100%; display: block;" 
              item-id="${itemId}" 
              theme="light" 
              basemap-gallery-enabled 
              time-zone-label-enabled 
              center="${center}" 
              scale="${scale}" 
              portal-url="${portalUrl}">
            </arcgis-embedded-map>
          `;
          lightboxMapWrap.style.display = 'block';
        }
        lightbox.style.display = 'flex';
      } catch (err) {
        console.error('Error abriendo mapa ArcGIS:', err);
      }
    });
  });

  if (closeBtn) {
    closeBtn.onclick = closeLightbox;
  }
  
  lightbox.onclick = (e) => {
    if (e.target === lightbox || e.target.classList.contains('lightbox-body')) {
      closeLightbox();
    }
  };

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.style.display === 'flex') {
      closeLightbox();
    }
  });
}

// ── Utilities ─────────────────────────────────────────────────────────────────
function setById(id, text) {
  const el = document.getElementById(id);
  if (el && text !== undefined) el.textContent = text;
}

function initScrollReveal() {
  const obs = new IntersectionObserver(
    entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('active'); }),
    { threshold: 0.07 }
  );
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}

function initNavbarScroll() {
  window.addEventListener('scroll', () => {
    document.querySelector('.navbar-area')?.classList.toggle('scrolled', window.scrollY > 10);
  });
}
