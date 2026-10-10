/**
 * Migration Script: Migrate public/data/sightings.json to Cloudflare D1 & R2
 * 
 * Usage:
 *   npx tsx scripts/migrate-to-cloudflare.ts [--archive-media] [--limit 50]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { archiveSightingMedia } from './r2-storage.js';
import { upsertSightingsToD1 } from './d1-database.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SIGHTINGS_FILE = path.resolve(__dirname, '../public/data/sightings.json');

async function runMigration() {
  console.log('🚀 ========================================================');
  console.log('📦 Starting Migration to Cloudflare D1 & R2');
  console.log('🚀 ========================================================');

  if (!fs.existsSync(SIGHTINGS_FILE)) {
    console.error(`❌ sightings.json not found at: ${SIGHTINGS_FILE}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(SIGHTINGS_FILE, 'utf-8');
  const sightings = JSON.parse(raw);
  console.log(`📊 Found ${sightings.length} sightings in public/data/sightings.json`);

  const args = process.argv.slice(2);
  const shouldArchiveMedia = args.includes('--archive-media') || process.env.ARCHIVE_MEDIA === 'true';

  let limit = sightings.length;
  const limitIdx = args.indexOf('--limit');
  if (limitIdx !== -1 && args[limitIdx + 1]) {
    limit = parseInt(args[limitIdx + 1], 10);
    console.log(`⚡ Processing limit: ${limit} items`);
  }

  const targetSightings = sightings.slice(0, limit);

  // 1. Optionally archive media to R2
  if (shouldArchiveMedia) {
    console.log('\n☁️ Archiving video clips and photos to Cloudflare R2...');
    let mediaArchived = 0;
    for (let i = 0; i < targetSightings.length; i++) {
      const s = targetSightings[i];
      if (i % 20 === 0 || i === targetSightings.length - 1) {
        console.log(`   [${i + 1}/${targetSightings.length}] Archiving: ${s.speciesName} (${s.date})...`);
      }
      try {
        const result = await archiveSightingMedia(s);
        if (result.archived) {
          s.videoUrl = result.videoUrl;
          s.imageUrl = result.imageUrl;
          if (result.images) s.images = result.images;
          mediaArchived++;
        }
      } catch (err: any) {
        console.warn(`   ⚠️ Warning: failed to archive media for sighting ${s.id}: ${err.message}`);
      }
    }
    console.log(`✅ Finished R2 media processing. Updated ${mediaArchived} sightings.`);

    // Persist updated URLs back to local JSON
    fs.writeFileSync(SIGHTINGS_FILE, JSON.stringify(sightings, null, 2), 'utf-8');
  }

  // 2. Batch Upsert to Cloudflare D1
  console.log('\n🗄️ Upserting sightings to Cloudflare D1...');
  try {
    const { inserted, errors } = await upsertSightingsToD1(targetSightings);
    console.log(`\n🎉 ========================================================`);
    console.log(`✅ Migration complete!`);
    console.log(`📊 Successfully synced to D1: ${inserted} records.`);
    if (errors > 0) {
      console.log(`⚠️ Encountered errors on: ${errors} records.`);
    }
    console.log(`🎉 ========================================================`);
  } catch (err: any) {
    console.error('❌ D1 Sync Error:', err.message);
    console.log('\nℹ️ Make sure CLOUDFLARE_D1_API_TOKEN is set in your .env with Account > D1 > Edit permissions.');
  }
}

runMigration().catch((err) => {
  console.error('Fatal Migration Error:', err);
  process.exit(1);
});

