/**
 * Vercel Serverless Function: GET /api/sightings
 * Queries Cloudflare D1 database and returns active bird sightings.
 */

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || 'd5104a85bd311a004b05349e1937b6dd';
const DATABASE_ID = process.env.CLOUDFLARE_D1_DATABASE_ID || '3897e058-22db-4b49-a761-ea9e7d98d1c5';
const API_TOKEN = process.env.CLOUDFLARE_D1_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN;

export default async function handler(req: any, res: any) {
  // Enable CORS & caching headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  if (!API_TOKEN || !DATABASE_ID || !ACCOUNT_ID) {
    // If credentials are not present in Vercel environment, return empty array (app will fallback to static json)
    res.status(200).json([]);
    return;
  }

  try {
    const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}/query`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: 'SELECT * FROM sightings ORDER BY date DESC, time DESC LIMIT 2000;',
        params: [],
      }),
    });

    const data: any = await response.json();
    if (!response.ok || !data.success) {
      console.error('D1 query error:', data.errors);
      res.status(500).json({ error: data.errors });
      return;
    }

    const rows = data.result?.[0]?.results || [];
    const formatted = rows.map((row: any) => {
      let images = undefined;
      let birdfy = undefined;
      try {
        if (row.images) images = JSON.parse(row.images);
      } catch {
        // ignore
      }
      try {
        if (row.birdfy) birdfy = JSON.parse(row.birdfy);
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

    res.status(200).json(formatted);
  } catch (err: any) {
    console.error('Failed to query D1 from Vercel function:', err.message);
    res.status(500).json({ error: err.message });
  }
}

