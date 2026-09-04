const fs = require('fs');
const path = require('path');

const MEDIA_BASE = path.resolve(__dirname, '../public/assets/media');
const DATA_PATHS = [
  path.resolve(__dirname, '../data/areas.json'),
  path.resolve(__dirname, '../public/data/areas.json')
];

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    if (file.startsWith('_originals')) return;
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(full));
    } else if (file.toLowerCase().endsWith('.webp')) {
      results.push(full);
    }
  });
  return results;
}

const allWebp = getFiles(MEDIA_BASE).map(p => {
  const rel = path.relative(MEDIA_BASE, p).replace(/\\/g, '/');
  return './assets/media/' + rel;
});

console.log('Total webp in public/assets/media:', allWebp.length);

const areas = JSON.parse(fs.readFileSync(DATA_PATHS[0], 'utf-8'));

areas.forEach(area => {
  const areaPrefix = './assets/media/' + area.id + '/';
  const areaImages = allWebp.filter(u => u.startsWith(areaPrefix));

  console.log(`Area: ${area.id}, found ${areaImages.length} images`);

  // 1. Hero Image
  if (!area.heroImage || area.heroImage.includes('/src/assets/media/')) {
    const normalHero = areaImages.find(u => !u.toLowerCase().includes('objetivo') && !u.toLowerCase().includes('equip'));
    area.heroImage = normalHero || areaImages[0] || './assets/images/peloton-premilitar/IMG_0151.webp';
  } else if (area.heroImage.startsWith('/assets/')) {
    area.heroImage = '.' + area.heroImage;
  }

  // 2. Objectives Image
  let objImg = areaImages.find(u => u.toLowerCase().includes('objetivo'));
  if (objImg) {
    area.objectivesImage = objImg;
  } else if (!area.objectivesImage || area.objectivesImage.includes('/src/assets/media/')) {
    area.objectivesImage = areaImages[0] || '';
  }

  // 3. Equipment Image
  let eqImg = areaImages.find(u => u.toLowerCase().includes('equip') || u.toLowerCase().includes('equipo'));
  if (eqImg) {
    area.equipmentImage = eqImg;
  } else if (!area.equipmentImage || area.equipmentImage.includes('/src/assets/media/')) {
    area.equipmentImage = areaImages[1] || '';
  }

  // 4. Gallery: exclude objectivesImage and equipmentImage
  const used = new Set([area.heroImage, area.objectivesImage, area.equipmentImage]);
  const galleryImgs = areaImages.filter(u => !used.has(u));

  area.media = area.media || {};
  area.media.gallery = galleryImgs.map(u => {
    const filename = u.split('/').pop().replace('.webp', '').replace(/[-_]/g, ' ');
    return {
      url: u,
      caption: filename.length > 25 ? 'Registro fotográfico' : filename
    };
  });

  // 5. Projects images if available
  if (Array.isArray(area.projects)) {
    area.projects.forEach(p => {
      if (p.image && p.image.startsWith('/src/assets/media/')) {
        p.image = p.image.replace('/src/assets/media/', './assets/media/');
      } else if (p.image && p.image.startsWith('/assets/')) {
        p.image = '.' + p.image;
      }
      if (!p.image) {
        // Look for project folder matching p.id or title
        const pSlug = (p.id || '').toLowerCase();
        const foundProjImg = areaImages.find(u => pSlug && u.toLowerCase().includes('/' + pSlug + '/'));
        if (foundProjImg) {
          p.image = foundProjImg;
        }
      }
    });
  }
});

DATA_PATHS.forEach(dp => {
  fs.writeFileSync(dp, JSON.stringify(areas, null, 2), 'utf-8');
  console.log('Saved to', dp);
});
