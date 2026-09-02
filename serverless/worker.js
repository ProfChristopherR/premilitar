/**
 * Cloudflare Worker: Microservicio Seguro de Publicación
 * Repositorio: ProfChristopherR/premilitar
 *
 * Variables de entorno requeridas en Cloudflare Worker (Settings -> Variables and Secrets):
 *  - GITHUB_TOKEN: Token de GitHub con permisos 'repo'
 *  - ADMIN_PASSWORD: Tu contraseña maestra para publicar noticias
 */

const REPO_OWNER = 'ProfChristopherR';
const REPO_NAME = 'premilitar';
const DEFAULT_BRANCH = 'qa';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Password',
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    // Health / info check
    if (url.pathname === '/' || url.pathname === '/health') {
      return new Response(
        JSON.stringify({ status: 'online', service: 'premilitar-publisher' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Extraer contraseña enviada por el cliente
    let clientPassword = '';
    const authHeader = request.headers.get('Authorization') || '';
    if (authHeader.startsWith('Bearer ')) {
      clientPassword = authHeader.substring(7).trim();
    } else if (request.headers.get('X-Admin-Password')) {
      clientPassword = request.headers.get('X-Admin-Password').trim();
    }

    // Parse body si es POST
    let body = {};
    if (request.method === 'POST') {
      try {
        body = await request.json();
      } catch (_) {
        body = {};
      }
    }

    if (!clientPassword && body.password) {
      clientPassword = String(body.password).trim();
    }

    // Validar configuración del Worker
    if (!env.ADMIN_PASSWORD || !env.GITHUB_TOKEN) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'El Worker no tiene configuradas las variables ADMIN_PASSWORD o GITHUB_TOKEN en Cloudflare.',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar contraseña
    if (!clientPassword || clientPassword !== env.ADMIN_PASSWORD) {
      return new Response(
        JSON.stringify({ success: false, error: 'Contraseña de administrador incorrecta.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Endpoint para verificar si la contraseña es válida
    if (url.pathname === '/verify') {
      return new Response(
        JSON.stringify({ success: true, message: 'Autenticación exitosa' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Endpoint principal de publicación
    if (url.pathname === '/publish' && request.method === 'POST') {
      const branch = body.branch || DEFAULT_BRANCH;
      const images = body.images || []; // [{ filename: 'foto.webp', base64: '...' }]
      const newsJson = body.newsJson;

      if (!newsJson) {
        return new Response(
          JSON.stringify({ success: false, error: 'Falta el contenido de newsJson.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      try {
        // 1. Subir cada imagen pendiente
        for (const img of images) {
          if (!img.filename || !img.base64) continue;
          const cleanB64 = img.base64.includes(',') ? img.base64.split(',')[1] : img.base64;
          const imgPath = 'public/data/news-images/' + img.filename;
          await commitToGitHub(
            env.GITHUB_TOKEN,
            imgPath,
            cleanB64,
            'feat: subir imagen ' + img.filename + ' [' + branch + ']',
            branch
          );
        }

        // 2. Subir news.json en ambas rutas
        const newsB64 = newsJson.includes(',')
          ? newsJson.split(',')[1]
          : isBase64(newsJson)
          ? newsJson
          : btoa(unescape(encodeURIComponent(typeof newsJson === 'string' ? newsJson : JSON.stringify(newsJson, null, 2))));

        const paths = ['public/data/news.json', 'data/news.json'];
        for (const p of paths) {
          await commitToGitHub(
            env.GITHUB_TOKEN,
            p,
            newsB64,
            'docs: actualizar noticias desde panel web [' + branch + ']',
            branch
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: '¡Publicación exitosa en GitHub! Desplegándose en la rama ' + branch,
            uploadedImages: images.length,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (err) {
        return new Response(
          JSON.stringify({ success: false, error: err.message || 'Error en la API de GitHub' }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(JSON.stringify({ error: 'Ruta no encontrada' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  },
};

async function commitToGitHub(token, path, base64Content, message, branch) {
  const apiUrl = 'https://api.github.com/repos/' + REPO_OWNER + '/' + REPO_NAME + '/contents/' + path;

  // Obtener SHA actual si existe
  let sha = '';
  try {
    const getRes = await fetch(apiUrl + '?ref=' + branch, {
      headers: {
        Authorization: 'Bearer ' + token,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Cloudflare-Worker-Publisher',
      },
    });
    if (getRes.ok) {
      const data = await getRes.json();
      sha = data.sha || '';
    }
  } catch (_) {}

  const putBody = {
    message,
    content: base64Content,
    branch,
    ...(sha ? { sha } : {}),
  };

  const putRes = await fetch(apiUrl, {
    method: 'PUT',
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'Cloudflare-Worker-Publisher',
    },
    body: JSON.stringify(putBody),
  });

  if (!putRes.ok) {
    const err = await putRes.json().catch(() => ({}));
    throw new Error(err.message || 'Error al guardar ' + path);
  }
}

function isBase64(str) {
  try {
    return btoa(atob(str)) === str;
  } catch (_) {
    return false;
  }
}

