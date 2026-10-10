/**
 * Vercel Serverless Function: GET /api/sightings
 * Queries Cloudflare D1 database and returns active bird sightings.
 */

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || 'd5104a85bd311a004b05349e1937b6dd';
const DATABASE_ID = process.env.CLOUDFLARE_D1_DATABASE_ID || '3897e058-22db-4b49-a761-ea9e7d98d1c5';
const API_TOKEN = process.env.CLOUDFLARE_D1_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

function toPublicUrl(url?: string): string | undefined {
  if (!url) return undefined;
  // If user configured a public R2 domain (e.g. pub-xxx.r2.dev or media.peep-and-perch.com), rewrite private S3 URLs
  if (R2_PUBLIC_URL && !R2_PUBLIC_URL.includes('r2.cloudflarestorage.com')) {
    const cleanBase = R2_PUBLIC_URL.replace(/\/+$/, '');
    return url.replace(/https:\/\/[^/]+\.r2\.cloudflarestorage\.com\/[^/]+/, cleanBase);
  }
  return url;
}

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
    res.status(200).json([]);
    return;
  }

  try {
    // Return all records (up to 2000)
    const requestedLimit = req.query?.limit;
    let limit = 2000;
    if (requestedLimit && requestedLimit !== 'all') {
      const parsed = parseInt(String(requestedLimit), 10);
      if (!isNaN(parsed) && parsed > 0) limit = Math.min(parsed, 2000);
    }

    const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}/query`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: 'SELECT * FROM sightings ORDER BY date DESC, time DESC LIMIT ?;',
        params: [limit],
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
        if (row.images) {
          const parsedImgs = JSON.parse(row.images);
          if (Array.isArray(parsedImgs)) {
            images = parsedImgs.map((img: string) => toPublicUrl(img) || img);
          }
        }
      } catch {
        // ignore
      }
      try {
        if (row.birdfy) {
          birdfy = typeof row.birdfy === 'string' ? JSON.parse(row.birdfy) : row.birdfy;
          // Strip duplicated videoUrl & images inside birdfy object to save ~2 MB bandwidth
          delete birdfy.videoUrl;
          delete birdfy.images;
        }
      } catch {
        // ignore
      }

      return {
        ...row,
        imageUrl: toPublicUrl(row.imageUrl) || row.imageUrl,
        videoUrl: toPublicUrl(row.videoUrl) || row.videoUrl,
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
