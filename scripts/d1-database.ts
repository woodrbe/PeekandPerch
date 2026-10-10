/**
 * Cloudflare D1 Database Service for Peek & Perch
 * Handles executing SQL queries and batch upserts against Cloudflare D1
 */

import dotenv from 'dotenv';

dotenv.config();

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || 'd5104a85bd311a004b05349e1937b6dd';
const CLOUDFLARE_D1_DATABASE_ID = process.env.CLOUDFLARE_D1_DATABASE_ID || '3897e058-22db-4b49-a761-ea9e7d98d1c5';
const CLOUDFLARE_D1_API_TOKEN = process.env.CLOUDFLARE_D1_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN || '';

export interface D1QueryResult<T = any> {
  success: boolean;
  errors: any[];
  messages: any[];
  result: {
    results: T[];
    success: boolean;
    meta?: {
      served_by: string;
      duration: number;
      changes: number;
      last_row_id: number;
      changed_db: boolean;
      size_after: number;
      rows_read: number;
      rows_written: number;
    };
  }[];
}

/**
 * Executes a single SQL query against Cloudflare D1 via the REST API
 */
export async function executeD1Query<T = any>(
  sql: string,
  params: any[] = []
): Promise<T[]> {
  if (!CLOUDFLARE_D1_API_TOKEN) {
    throw new Error('Missing CLOUDFLARE_D1_API_TOKEN (or CLOUDFLARE_API_TOKEN) in environment variables.');
  }

  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/d1/database/${CLOUDFLARE_D1_DATABASE_ID}/query`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CLOUDFLARE_D1_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sql,
      params,
    }),
  });

  const data: D1QueryResult<T> = await response.json();

  if (!data.success) {
    const errMsg = data.errors?.map((e: any) => `[${e.code}] ${e.message}`).join(', ') || 'Unknown D1 query error';
    throw new Error(`Cloudflare D1 Query Failed: ${errMsg}`);
  }

  return (data.result?.[0]?.results || []) as T[];
}

/**
 * Executes multiple SQL queries in a single atomic batch
 */
export async function executeD1Batch(
  statements: { sql: string; params?: any[] }[]
): Promise<any[]> {
  if (!CLOUDFLARE_D1_API_TOKEN) {
    throw new Error('Missing CLOUDFLARE_D1_API_TOKEN in environment variables.');
  }

  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/d1/database/${CLOUDFLARE_D1_DATABASE_ID}/query`;

  // Cloudflare D1 query endpoint accepts an array of query objects for batch execution
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CLOUDFLARE_D1_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(statements),
  });

  const data = await response.json();
  if (!data.success) {
    const errMsg = data.errors?.map((e: any) => `[${e.code}] ${e.message}`).join(', ') || 'Unknown D1 batch error';
    throw new Error(`Cloudflare D1 Batch Failed: ${errMsg}`);
  }

  return data.result || [];
}

/**
 * Upserts a batch of bird sightings into Cloudflare D1
 */
export async function upsertSightingsToD1(sightings: any[]): Promise<{ inserted: number; errors: number }> {
  if (!sightings || sightings.length === 0) return { inserted: 0, errors: 0 };

  let inserted = 0;
  let errors = 0;

  // Process in chunks of 5 records (5 * 17 = 85 params, SQLite/D1 limit is 100 variables per query)
  const CHUNK_SIZE = 5;
  for (let i = 0; i < sightings.length; i += CHUNK_SIZE) {
    const chunk = sightings.slice(i, i + CHUNK_SIZE);
    const valuePlaceholders = chunk.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime(\'now\'))').join(',\n');
    const sql = `
      INSERT INTO sightings (
        id, speciesId, speciesName, imageUrl, images, videoUrl, date, time,
        location, behavior, weather, count, notes, isFavorite, spottedBy,
        temperature, birdfy, updatedAt
      ) VALUES
      ${valuePlaceholders}
      ON CONFLICT(id) DO UPDATE SET
        videoUrl = COALESCE(excluded.videoUrl, sightings.videoUrl),
        imageUrl = COALESCE(excluded.imageUrl, sightings.imageUrl),
        images = COALESCE(excluded.images, sightings.images),
        weather = COALESCE(excluded.weather, sightings.weather),
        temperature = COALESCE(excluded.temperature, sightings.temperature),
        birdfy = COALESCE(excluded.birdfy, sightings.birdfy),
        updatedAt = datetime('now');
    `;

    const params: any[] = [];
    chunk.forEach((s) => {
      params.push(
        s.id,
        s.speciesId || null,
        s.speciesName,
        s.imageUrl,
        Array.isArray(s.images) ? JSON.stringify(s.images) : null,
        s.videoUrl || null,
        s.date,
        s.time,
        s.location || 'Tube Feeder',
        s.behavior || 'Feeder Snack',
        s.weather || null,
        typeof s.count === 'number' ? s.count : 1,
        s.notes || null,
        s.isFavorite ? 1 : 0,
        s.spottedBy || 'Birdfy Feeder Cam',
        s.temperature || null,
        s.birdfy ? (typeof s.birdfy === 'string' ? s.birdfy : JSON.stringify(s.birdfy)) : null
      );
    });

    try {
      await executeD1Query(sql, params);
      inserted += chunk.length;
      if ((i + chunk.length) % 150 === 0 || i + chunk.length === sightings.length) {
        console.log(`   [D1 Sync] ${i + chunk.length}/${sightings.length} records synced...`);
      }
    } catch (e: any) {
      console.error(`[D1 Sync] Error executing chunk [${i}..${i + chunk.length}]:`, e.message);
      errors += chunk.length;
    }
  }

  return { inserted, errors };
}

