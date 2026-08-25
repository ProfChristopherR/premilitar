// Cargador centralizado y desacoplado de datos JSON

const cache = {};

export async function fetchGeneralData() {
  if (cache.general) return cache.general;
  try {
    const res = await fetch('/data/general.json');
    if (!res.ok) throw new Error('Error al cargar general.json');
    cache.general = await res.json();
    return cache.general;
  } catch (error) {
    console.error('Error fetching general data:', error);
    return null;
  }
}

export async function fetchAreasData() {
  if (cache.areas) return cache.areas;
  try {
    const res = await fetch('/data/areas.json');
    if (!res.ok) throw new Error('Error al cargar areas.json');
    cache.areas = await res.json();
    return cache.areas;
  } catch (error) {
    console.error('Error fetching areas data:', error);
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
    const res = await fetch('/data/news.json');
    if (!res.ok) throw new Error('Error al cargar news.json');
    cache.news = await res.json();
    return cache.news;
  } catch (error) {
    console.error('Error fetching news data:', error);
    return [];
  }
}
