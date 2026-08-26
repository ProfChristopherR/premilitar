// Controlador de la vista detallada de Área
import { fetchAreasData, fetchAreaById } from './data-loader.js';
import { setupModelViewerControls } from './model-viewer-init.js';

const TECH_AREA_ID = 'tecnologia-geomatica';

// Glob all media from public folder statically
const imageGlobs = import.meta.glob('/src/assets/media/**/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}', { eager: true, query: '?url', import: 'default' });
const videoGlobs = import.meta.glob('/src/assets/media/**/*.{mp4,MP4}', { eager: true, query: '?url', import: 'default' });
const linksGlobs = import.meta.glob('/src/assets/media/**/enlaces.json', { eager: true });

// ── Descubrimiento automático de imágenes para cada proyecto ──────────────────
function getProjectDynamicGallery(areaId, project) {
  const projectId = (project.id || '').toLowerCase().trim();
  const projectTitleSlug = (project.title || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-');

  const discovered = [];

  for (const [path, url] of Object.entries(imageGlobs)) {
    const normPath = path.toLowerCase();
    const inArea = normPath.includes(`/${areaId}/`);
    const inProjectFolder = projectId && (
      normPath.includes(`/${projectId}/`) ||
      normPath.includes(`/${projectTitleSlug}/`)
    );
    const filename = normPath.split('/').pop() || '';
    const filenameMatches = (projectId && filename.startsWith(projectId)) || (projectTitleSlug && filename.startsWith(projectTitleSlug));

    if ((inArea && inProjectFolder) || filenameMatches) {
      if (!discovered.includes(url)) {
        discovered.push(url);
      }
    }
  }

  // Si se descubren fotos en la carpeta del proyecto, ESA ES LA GALERÍA REAL
  // (Si agregas o borras una foto de la carpeta, se actualiza de inmediato)
  if (discovered.length > 0) {
    return discovered;
  }

  // Fallback si la carpeta aún no tiene fotos
  if (project.image) {
    let img = project.image;
    if (img.startsWith('/assets/')) img = '.' + img;
    return [img];
  }

  return [];
}

function getDynamicMedia(areaId) {
  const images = [];
  const videos = [];
  let links = { videos_youtube: [], mapas_arcgis: [] };

  // Collect images — excluding map preview images (named with place names) y deduplicando
  const MAP_PREVIEW_PATTERN = /^(Fundo|Liceo|Terreno|Lago|result)/i;
  const seenUrls = new Set();
  const seenFilenames = new Set();

  for (const [path, url] of Object.entries(imageGlobs)) {
    if (path.includes(`/${areaId}/`)) {
      const filename = path.split('/').pop() || '';
      const baseFilename = filename.toLowerCase().replace(/(_objetivo|_equipamiento|_equipo)/g, '').replace(/\s+/g, ' ');
      
      if (!MAP_PREVIEW_PATTERN.test(filename) && !seenUrls.has(url) && !seenFilenames.has(baseFilename)) {
        seenUrls.add(url);
        seenFilenames.add(baseFilename);
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

  // Helper para normalizar enlaces de YouTube y YouTube Shorts a embed
  function formatEmbedVideo(item, defaultTitle = 'Video Oficial', defaultType = 'video') {
    let url = typeof item === 'string' ? item : (item.url || '');
    let title = typeof item === 'object' && item.title ? item.title : defaultTitle;
    let type = typeof item === 'object' && item.type ? item.type : defaultType;

    // Si es YouTube Shorts (formato vertical 9:16)
    if (url.includes('/shorts/')) {
      const parts = url.split('/shorts/');
      const id = parts[1].split('?')[0].split('/')[0];
      url = `https://www.youtube-nocookie.com/embed/${id}`;
      type = 'instagram'; // estilo vertical portrait
    }
    // Si es URL de YouTube estándar (youtube.com/watch o youtu.be)
    else if (url.includes('youtu.be/') || (url.includes('youtube.com/') && !url.includes('/embed/'))) {
      let id = '';
      let start = '';
      let end = '';

      if (typeof item === 'object') {
        if (item.start) start = item.start;
        if (item.end) end = item.end;
      }

      try {
        const urlObj = new URL(url.startsWith('http') ? url : 'https://' + url);
        if (url.includes('youtu.be/')) {
          id = urlObj.pathname.replace('/', '').split('?')[0];
        } else if (urlObj.searchParams.get('v')) {
          id = urlObj.searchParams.get('v');
        }

        if (!start && urlObj.searchParams.get('start')) start = urlObj.searchParams.get('start');
        if (!start && urlObj.searchParams.get('t')) start = urlObj.searchParams.get('t').replace('s', '');
        if (!end && urlObj.searchParams.get('end')) end = urlObj.searchParams.get('end');
      } catch (e) {
        if (url.includes('youtu.be/')) id = url.split('youtu.be/')[1].split('?')[0];
      }

      let params = [];
      if (start) params.push(`start=${start}`);
      if (end) params.push(`end=${end}`);
      const paramStr = params.length > 0 ? `?${params.join('&')}` : '';

      url = `https://www.youtube-nocookie.com/embed/${id}${paramStr}`;
    }

    return { title, url, type };
  }

  // Combine external links with videos & maps
  if (links.videos_youtube) {
    links.videos_youtube.forEach(item => videos.push(formatEmbedVideo(item, 'Video Oficial', 'video')));
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
  if (links.videos_shorts) {
    links.videos_shorts.forEach(item => videos.push(formatEmbedVideo(item, 'YouTube Short', 'instagram')));
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

  // Visor 3D 
  if (area.id === TECH_AREA_ID && area.model3D) {
    const section3d = document.getElementById('modelo-3d');
    if (section3d) section3d.style.display = 'block';
    renderModelViewer(area.model3D);
  }

  // Multimedia
  renderMultimedia(dynMedia);

  // Modal de Proyecto y Lightbox
  initProjectModal();
  initLightboxHandlers();
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
    let imgEq = dynamicImages.find(img => (img.path && (img.path.toLowerCase().includes('equip') || img.path.toLowerCase().includes('tactico'))) || (img.url && (img.url.toLowerCase().includes('equip') || img.url.toLowerCase().includes('tactico'))));
    let imgUrl = imgEq ? imgEq.url : (dynamicImages.length > 1 ? dynamicImages[1].url : './assets/images/peloton-premilitar/IMG_0063.jpg');

    el.innerHTML = `
      <div class="text-image-split">
        <img src="${imgUrl}" alt="Equipamiento Táctico" class="split-image" loading="lazy" />
        <ul class="equipment-list">${listHtml}</ul>
      </div>
    `;
  }
  
  if (practicalExample) {
    const pEl = document.getElementById('practical-example-text');
    if (pEl) pEl.textContent = practicalExample;
  }
}

// ── Sub-Áreas (Tecnología y Geomática) ─────────────────────────────────────────
function renderSubAreas(subAreas) {
  const el = document.getElementById('area-subareas');
  if (!el || !subAreas) return;

  el.innerHTML = subAreas.map((sub, i) => `
    <div class="subarea-block reveal">
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
  const enrichedProjects = area.projects.map(p => {
    const dynamicGallery = getProjectDynamicGallery(area.id, p);
    return { ...p, gallery: dynamicGallery, image: dynamicGallery[0] || p.image };
  });
  el.innerHTML = `<div class="projects-grid">${enrichedProjects.map(p => projectCard(p)).join('')}</div>`;
}

// ── Proyectos por sub-área (Tecnología) ───────────────────────────────────────
function renderProjectsBySubArea(area) {
  const el = document.getElementById('area-projects');
  const titleEl = document.getElementById('projects-title');
  if (!el) return;
  if (titleEl) titleEl.textContent = 'Proyectos y Talleres por Sub-Área';

  const enrichedProjects = area.projects.map(p => {
    const dynamicGallery = getProjectDynamicGallery(area.id, p);
    return { ...p, gallery: dynamicGallery, image: dynamicGallery[0] || p.image };
  });

  // Separar proyectos: GeoGo (1°-2° medio) vs Geomática (3°-4° medio)
  const geogoProjects   = enrichedProjects.filter(p => p.subArea === 'geogo' || p.id?.includes('robot') || p.title.toLowerCase().includes('arduino') || p.title.toLowerCase().includes('robot') || p.title.toLowerCase().includes('invernadero') || p.title.toLowerCase().includes('tanque') || p.title.toLowerCase().includes('dav'));
  const geomProjects    = enrichedProjects.filter(p => p.subArea === 'geomatica' || p.title.toLowerCase().includes('fotogram') || p.title.toLowerCase().includes('levant') || p.title.toLowerCase().includes('drone') || p.title.toLowerCase().includes('arbol'));
  
  const allProjects = enrichedProjects;
  const half = Math.ceil(allProjects.length / 2);
  const geo = (geogoProjects.length > 0 || geomProjects.length > 0)
    ? { googo: geogoProjects, geom: geomProjects }
    : { googo: allProjects.slice(0, half), geom: allProjects.slice(half) };

  el.innerHTML = `
    <div style="margin-bottom:3rem;">
      <div style="display:inline-block;background:var(--color-navy);color:var(--color-gold-light);font-family:var(--font-display);font-size:0.75rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;padding:0.3rem 0.9rem;margin-bottom:1.25rem;border-left:3px solid var(--color-gold);">
        GeoGo · 1° y 2° Medio
      </div>
      <div class="projects-grid">${geo.googo.map(p => projectCard(p)).join('')}</div>
    </div>
    <hr style="border:none;border-top:2px solid var(--border-light);margin:2rem 0 3rem;" />
    <div>
      <div style="display:inline-block;background:var(--color-navy);color:var(--color-gold-light);font-family:var(--font-display);font-size:0.75rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;padding:0.3rem 0.9rem;margin-bottom:1.25rem;border-left:3px solid var(--color-gold);">
        Geomática y Topografía · 3° y 4° Medio
      </div>
      <div class="projects-grid">${geo.geom.map(p => projectCard(p)).join('')}</div>
    </div>
  `;
}

function projectCard(p) {
  const statusCss = p.status ? p.status.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-') : 'prototipo';
  let imgSrc = p.image || '';
  if (imgSrc.startsWith('/assets/')) {
    imgSrc = '.' + imgSrc;
  }
  const projectJson = encodeURIComponent(JSON.stringify(p));
  const hasMap = !!p.arcgis;
  const countPhotos = (Array.isArray(p.gallery) ? p.gallery.length : 1) + (hasMap ? 1 : 0);

  return `
    <div class="project-card reveal" data-project-data="${projectJson}">
      <div class="project-card__img-wrap">
        <img src="${imgSrc}" alt="${p.title}" loading="lazy" />
        <span class="project-card__status project-card__status--${statusCss}">${p.status || 'Prototipo'}</span>
      </div>
      <div class="project-card__body">
        <h4 class="project-card__title">${p.title}</h4>
        <p class="project-card__desc">${p.description}</p>
        <div class="project-card__hint">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          <span>Ver proyecto y galería (${countPhotos} fotos)</span>
        </div>
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

// ── Modal de Detalle de Proyecto (Visor expandido con galería de miniaturas) ──
function initProjectModal() {
  const modal = document.getElementById('project-modal');
  if (!modal) return;

  const overlay = document.getElementById('project-modal-overlay');
  const closeBtn = document.getElementById('project-modal-close-btn');
  const titleEl = document.getElementById('project-modal-title');
  const subareaBadge = document.getElementById('project-modal-subarea-badge');
  const statusBadge = document.getElementById('project-modal-status-badge');
  const instructorBadge = document.getElementById('project-modal-instructor-badge');
  const descEl = document.getElementById('project-modal-description');
  const mainImg = document.getElementById('project-modal-main-img');
  const mapContainer = document.getElementById('project-modal-map-container');
  const mapActionWrap = document.getElementById('project-modal-map-action-wrap');
  const toggleMapBtn = document.getElementById('project-modal-toggle-map');
  const mapBtnText = document.getElementById('project-modal-map-btn-text');
  const thumbsContainer = document.getElementById('project-modal-thumbnails');

  let currentProject = null;
  let isMapActive = false;

  function closeModal() {
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (mapContainer) {
      mapContainer.innerHTML = '';
      mapContainer.style.display = 'none';
    }
    if (mainImg) {
      mainImg.style.display = 'block';
      mainImg.src = '';
    }
    isMapActive = false;
  }

  function openProject(p) {
    currentProject = p;
    isMapActive = false;

    // Título
    if (titleEl) titleEl.textContent = p.title || 'Detalle del Proyecto';

    // Sub-área badge
    if (subareaBadge) {
      if (p.subArea === 'geogo') {
        subareaBadge.textContent = 'GeoGo · 1° y 2° Medio';
        subareaBadge.style.display = 'inline-block';
      } else if (p.subArea === 'geomatica') {
        subareaBadge.textContent = 'Geomática y Topografía · 3° y 4° Medio';
        subareaBadge.style.display = 'inline-block';
      } else {
        subareaBadge.style.display = 'none';
      }
    }

    // Estado
    const statusText = p.status || 'Prototipo';
    const statusClass = statusText.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
    if (statusBadge) {
      statusBadge.textContent = statusText;
      statusBadge.className = `project-card__status project-card__status--${statusClass}`;
    }

    // Instructor
    if (instructorBadge) {
      if (p.instructor) {
        instructorBadge.innerHTML = `Instructor: <strong>${p.instructor}</strong>`;
        instructorBadge.style.display = 'inline-flex';
      } else {
        instructorBadge.style.display = 'none';
      }
    }

    // Descripción
    if (descEl) descEl.textContent = p.description || '';

    // Galería de miniaturas (fotos reales descubiertas en la carpeta)
    let galleryList = [];
    if (Array.isArray(p.gallery) && p.gallery.length > 0) {
      galleryList = p.gallery.map(url => url.startsWith('/assets/') ? '.' + url : url);
    } else if (p.image) {
      let img = p.image.startsWith('/assets/') ? '.' + p.image : p.image;
      galleryList = [img];
    }

    // Imagen principal inicial (primera foto real de la galería)
    let primaryImg = galleryList[0] || '';

    if (mainImg) {
      mainImg.src = primaryImg;
      mainImg.style.display = primaryImg ? 'block' : 'none';
      mainImg.style.opacity = '1';
    }
    if (mapContainer) {
      mapContainer.innerHTML = '';
      mapContainer.style.display = 'none';
    }

    // Botón de mapa si aplica
    if (p.arcgis && mapActionWrap) {
      mapActionWrap.style.display = 'block';
      if (mapBtnText) mapBtnText.textContent = 'Ver Mapa Interactivo';
    } else if (mapActionWrap) {
      mapActionWrap.style.display = 'none';
    }

    if (thumbsContainer) {
      let thumbsHtml = galleryList.map((url, i) => `
        <div class="project-modal__thumb ${i === 0 ? 'active' : ''}" data-thumb-src="${url}">
          <img src="${url}" alt="${p.title} foto ${i + 1}" loading="lazy" />
        </div>
      `).join('');

      if (p.arcgis) {
        thumbsHtml += `
          <div class="project-modal__thumb" data-thumb-type="arcgis" title="Explorar Mapa ArcGIS">
            <img src="${primaryImg}" alt="Mapa interactivo" loading="lazy" />
            <div class="project-modal__thumb-map-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/></svg>
              <span>Mapa</span>
            </div>
          </div>
        `;
      }

      thumbsContainer.innerHTML = thumbsHtml;

      // Eventos clic en miniaturas
      thumbsContainer.querySelectorAll('.project-modal__thumb').forEach(thumb => {
        thumb.addEventListener('click', (e) => {
          e.stopPropagation();
          thumbsContainer.querySelectorAll('.project-modal__thumb').forEach(t => t.classList.remove('active'));
          thumb.classList.add('active');

          const thumbType = thumb.getAttribute('data-thumb-type');
          if (thumbType === 'arcgis') {
            showInteractiveMap(p.arcgis);
          } else {
            const src = thumb.getAttribute('data-thumb-src');
            showLargeImage(src);
          }
        });
      });
    }

    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function showLargeImage(src) {
    if (!mainImg) return;
    if (mapContainer) {
      mapContainer.style.display = 'none';
      mapContainer.innerHTML = '';
    }
    isMapActive = false;
    if (mapBtnText) mapBtnText.textContent = 'Ver Mapa Interactivo';

    mainImg.style.opacity = '0.3';
    mainImg.style.transform = 'scale(0.98)';
    setTimeout(() => {
      mainImg.src = src;
      mainImg.style.display = 'block';
      mainImg.style.opacity = '1';
      mainImg.style.transform = 'scale(1)';
    }, 150);
  }

  function showInteractiveMap(arcgisConfig) {
    if (!mapContainer || !arcgisConfig) return;
    isMapActive = true;
    if (mainImg) mainImg.style.display = 'none';
    if (mapBtnText) mapBtnText.textContent = 'Ver Foto Principal';

    const itemId = arcgisConfig.itemId || arcgisConfig['item-id'];
    const center = arcgisConfig.center || '-72.1854366630625,-36.54274241200271';
    const scale = arcgisConfig.scale || '9027.977411';
    const portalUrl = arcgisConfig.portalUrl || arcgisConfig['portal-url'] || 'https://lpsn.maps.arcgis.com';

    mapContainer.innerHTML = `
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
    mapContainer.style.display = 'block';
  }

  if (toggleMapBtn) {
    toggleMapBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!currentProject || !currentProject.arcgis) return;
      if (isMapActive) {
        let primaryImg = currentProject.image || '';
        if (primaryImg.startsWith('/assets/')) primaryImg = '.' + primaryImg;
        showLargeImage(primaryImg);
      } else {
        showInteractiveMap(currentProject.arcgis);
      }
    });
  }

  // Clic en tarjetas de proyecto para abrir modal
  document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('click', () => {
      const dataStr = card.getAttribute('data-project-data');
      if (!dataStr) return;
      try {
        const projectData = JSON.parse(decodeURIComponent(dataStr));
        openProject(projectData);
      } catch (err) {
        console.error('Error al abrir modal de proyecto:', err);
      }
    });
  });

  if (closeBtn) closeBtn.onclick = closeModal;
  if (overlay) overlay.onclick = closeModal;

  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target === overlay) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display === 'flex') {
      closeModal();
    }
  });
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
