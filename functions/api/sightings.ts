/**
 * Cloudflare Pages Function: /api/sightings
 * Serverless edge endpoint connecting Peek & Perch frontend to Cloudflare D1
 */

interface Env {
  DB?: any;
}

export const onRequestGet = async (context: { env: Env; request: Request }) => {
  try {
    const { env, request } = context;
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '2000', 10);
    const species = url.searchParams.get('species');

    if (!env.DB) {
      // If DB binding is not yet attached, return empty list or hint
      return new Response(JSON.stringify([]), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    let query = 'SELECT * FROM sightings WHERE 1=1';
    const params: any[] = [];

    if (species) {
      query += ' AND speciesName = ?';
      params.push(species);
    }

    query += ' ORDER BY date DESC, time DESC LIMIT ?';
    params.push(limit);

    const { results } = await env.DB.prepare(query).bind(...params).all();

    const formatted = (results || []).map((row: any) => {
      let images = undefined;
      let birdfy = undefined;
      try {
        if (row.images) images = JSON.parse(row.images);
      } catch {
        // ignore
      }
      try {
        if (row.birdfy) {
          birdfy = typeof row.birdfy === 'string' ? JSON.parse(row.birdfy) : row.birdfy;
          delete birdfy.videoUrl;
          delete birdfy.images;
        }
      } catch {
        // ignore
      }

      return {
        ...row,
        images,
        birdfy,
        isFavorite: Boolean(row.isFavorite),
      };
    });

    return new Response(JSON.stringify(formatted), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=30, s-maxage=60',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
};

