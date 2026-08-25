// Cargador centralizado y desacoplado de datos JSON
const BASE = (import.meta.env.BASE_URL || './').replace(/\/$/, '') + '/';

const cache = {};

export async function fetchGeneralData() {
  if (cache.general) return cache.general;
  try {
    const res = await fetch(`${BASE}data/general.json`);
    if (!res.ok) throw new Error('Error al cargar general.json');
    cache.general = await res.json();
    return cache.general;
  } catch (error) {
    console.error('Error fetching general data:', error);
    // Fallback try relative
    try {
      const res2 = await fetch('./data/general.json');
      if (res2.ok) {
        cache.general = await res2.json();
        return cache.general;
      }
    } catch (_) {}
    return null;
  }
}

export async function fetchAreasData() {
  if (cache.areas) return cache.areas;
  try {
    const res = await fetch(`${BASE}data/areas.json`);
    if (!res.ok) throw new Error('Error al cargar areas.json');
    cache.areas = await res.json();
    return cache.areas;
  } catch (error) {
    console.error('Error fetching areas data:', error);
    try {
      const res2 = await fetch('./data/areas.json');
      if (res2.ok) {
        cache.areas = await res2.json();
        return cache.areas;
      }
    } catch (_) {}
    return [];
  }
}

export async function fetchAreaById(id) {
  const areas = await fetchAreasData();
  return areas.find((area) => area.id === id) || areas[0];
}

export async function fetchNewsData() {
  if (cache.news) return cache.news;
  try {
    const res = await fetch(`${BASE}data/news.json`);
    if (!res.ok) throw new Error('Error al cargar news.json');
    cache.news = await res.json();
    return cache.news;
  } catch (error) {
    console.error('Error fetching news data:', error);
    try {
      const res2 = await fetch('./data/news.json');
      if (res2.ok) {
        cache.news = await res2.json();
        return cache.news;
      }
    } catch (_) {}
    return [];
  }
}

