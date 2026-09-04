const fs = require('fs');
const path = require('path');

const AREAS_PATHS = [
  path.resolve(__dirname, '../data/areas.json'),
  path.resolve(__dirname, '../public/data/areas.json')
];

const areas = JSON.parse(fs.readFileSync(AREAS_PATHS[0], 'utf-8'));

// Mapa de videos por área conocidos
const videosByArea = {
  'disciplina-formacion': [
    { title: 'Instrucción y Desfile Militar', url: 'https://www.youtube.com/watch?v=aSZCVBohzxg' },
    { title: 'Ejercicios de Escuela en Terreno', url: 'https://www.youtube.com/watch?v=0V-b1UtFkpQ' },
    { title: 'Presentación Delegación Premilitar', url: 'https://www.youtube.com/watch?v=Xj9uhaWuMXc' }
  ],
  'acondicionamiento-defensa': [
    { title: 'Video Institucional — Instrucción Premilitar', url: './assets/videos/video-institucional.mp4' }
  ],
  'musica-identidad': [
    { title: 'Banda de Guerra — Presentación Oficial', url: 'https://www.youtube.com/watch?v=6l_Ys79NS4Q' },
    { title: 'Toques y Marchas Militares', url: 'https://www.youtube.com/watch?v=HL3xjZS7SDM' },
    { title: 'Ensamble Instrumental Marcial', url: 'https://www.youtube.com/watch?v=FeAQ8e0PljM' },
    { title: 'Registro Banda de Guerra y Pelotón', url: './assets/videos/VID_20260814_112420.mp4' }
  ],
  'ciencia-criminalistica': [
    { title: 'Instrucción de Ciencia Forense y Criminalística', url: 'https://www.youtube-nocookie.com/embed/SohOLCV-jbM?start=88&end=114' },
    { title: 'YouTube Short — Criminalística', url: 'https://www.youtube.com/shorts/dqw5B8Ci4UE' },
    { title: 'YouTube Short — Procedimiento Forense', url: 'https://www.youtube.com/shorts/ZrRZBuoyyEY' }
  ],
  'tecnologia-geomatica': [
    { title: 'Demostración Robótica y Drones', url: 'https://youtube.com/shorts/t_7MKFt9_XA' },
    { title: 'Reel Oficial Tecnología y Geomática', url: 'https://www.instagram.com/reel/DceOVpDIEoD/' },
    { title: 'Demostración de Robótica GeoGo', url: './assets/videos/VID_20260604_102258.mp4' },
    { title: 'Vuelo FPV Fotogrametría', url: './assets/videos/VID_20260722_165456.mp4' }
  ]
};

areas.forEach(a => {
  a.media = a.media || {};
  const currentVideos = a.media.videos || [];
  const defaultVids = videosByArea[a.id] || [];

  // Merge sin duplicar urls
  const seen = new Set(currentVideos.map(v => v.url));
  const merged = [...currentVideos];
  for (const v of defaultVids) {
    if (!seen.has(v.url)) {
      seen.add(v.url);
      merged.push(v);
    }
  }
  a.media.videos = merged;
  console.log(`Area ${a.id}: ${a.media.videos.length} videos`);
});

AREAS_PATHS.forEach(p => {
  fs.writeFileSync(p, JSON.stringify(areas, null, 2), 'utf-8');
  console.log('Updated', p);
});
