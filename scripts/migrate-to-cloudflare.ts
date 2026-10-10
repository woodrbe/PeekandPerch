/**
 * Migration Script: Migrate public/data/sightings.json to Cloudflare D1 & R2
 * 
 * Features:
 * - Concurrency pool (5 parallel media downloads & R2 uploads)
 * - Automatic resume & periodic persistence every 25 records
 * - Synchronizes updated permanent R2 URLs directly into Cloudflare D1
 * 
 * Usage:
 *   npx tsx scripts/migrate-to-cloudflare.ts --archive-media [--limit 100] [--concurrency 5]
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

  let concurrency = 5;
  const concIdx = args.indexOf('--concurrency');
  if (concIdx !== -1 && args[concIdx + 1]) {
    concurrency = parseInt(args[concIdx + 1], 10);
  }

  const targetSightings = sightings.slice(0, limit);

  // 1. Archive Media to Cloudflare R2
  if (shouldArchiveMedia) {
    console.log(`\n☁️ Archiving video clips and photos to Cloudflare R2 (Concurrency: ${concurrency})...`);
    
    let processed = 0;
    let archivedCount = 0;
    let expiredCount = 0;
    let skippedCount = 0;
    const modifiedBatch: any[] = [];

    const saveProgress = async () => {
      fs.writeFileSync(SIGHTINGS_FILE, JSON.stringify(sightings, null, 2), 'utf-8');
      if (modifiedBatch.length > 0) {
        try {
          await upsertSightingsToD1([...modifiedBatch]);
        } catch {
          // silent fallback
        }
        modifiedBatch.length = 0;
      }
    };

    // Worker queue pattern
    let nextIndex = 0;
    async function worker() {
      while (nextIndex < targetSightings.length) {
        const i = nextIndex++;
        const s = targetSightings[i];

        try {
          const result = await archiveSightingMedia(s);
          if (result.archived) {
            s.videoUrl = result.videoUrl;
            s.imageUrl = result.imageUrl;
            if (result.images) s.images = result.images;
            if (s.birdfy) {
              s.birdfy.videoUrl = result.videoUrl;
              s.birdfy.images = result.images;
            }
            archivedCount++;
            modifiedBatch.push(s);
          } else {
            // Already archived or link expired
            if (s.videoUrl && (s.videoUrl.includes('r2.cloudflarestorage.com') || s.videoUrl.includes('.r2.dev'))) {
              skippedCount++;
            } else {
              expiredCount++;
            }
          }
        } catch (err: any) {
          // continue
        }

        processed++;

        if (processed % 20 === 0 || processed === targetSightings.length) {
          console.log(`   [${processed}/${targetSightings.length}] Progress: ${archivedCount} uploaded to R2, ${skippedCount} already in R2, ${expiredCount} expired/skipped.`);
          await saveProgress();
        }
      }
    }

    const workers = Array.from({ length: concurrency }, () => worker());
    await Promise.all(workers);

    // Final save of remaining items
    await saveProgress();
    console.log(`\n✅ Finished R2 media processing!`);
    console.log(`   - Uploaded to R2: ${archivedCount}`);
    console.log(`   - Already in R2: ${skippedCount}`);
    console.log(`   - Expired Netvue links: ${expiredCount}`);
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
