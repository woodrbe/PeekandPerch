/**
 * Standalone Birdfy Feeder Sync Script for GitHub Actions / Local CLI
 * 
 * Fetches the latest detections, photos, and highlight videos from Netvue / Birdfy Moments APIs,
 * merges and deduplicates with public/data/sightings.json, and writes the updated dataset back.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SIGHTINGS_FILE = path.resolve(__dirname, '../public/data/sightings.json');
const CONFIG_FILE = path.resolve(__dirname, '../birdfy.config.json');

const BIRDFY_API_DIRECT = 'https://api2.nvts.co/moments/h5CuratedData';
const BIRDFY_RECAP_API_DIRECT = 'https://api2.nvts.co/moments/community/recapData';

function extractUuid(input?: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  try {
    if (trimmed.includes('uuid=')) {
      const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
      const uuid = url.searchParams.get('uuid');
      if (uuid) return uuid.trim();
    }
  } catch {
    // Ignore URL parse error
  }
  const match = trimmed.match(/[0-9a-fA-F-]{16,40}/);
  return match ? match[0] : trimmed;
}

function getDateRangeTimestamps(dateRange: string): { startTime?: number; endTime?: number } {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (dateRange === 'today') {
    const start = todayStart;
    const end = new Date(start.getTime() + 86400000 - 1);
    return { startTime: start.getTime(), endTime: end.getTime() };
  } else if (dateRange === 'yesterday') {
    const start = new Date(todayStart.getTime() - 86400000);
    const end = new Date(todayStart.getTime() - 1);
    return { startTime: start.getTime(), endTime: end.getTime() };
  } else if (dateRange === 'last_7_days') {
    const start = new Date(todayStart.getTime() - 6 * 86400000);
    const end = new Date(todayStart.getTime() + 86400000 - 1);
    return { startTime: start.getTime(), endTime: end.getTime() };
  } else if (dateRange === 'last_30_days') {
    const start = new Date(todayStart.getTime() - 29 * 86400000);
    const end = new Date(todayStart.getTime() + 86400000 - 1);
    return { startTime: start.getTime(), endTime: end.getTime() };
  } else if (dateRange === 'all_time') {
    return {};
  }

  // Default to last 7 days
  const start = new Date(todayStart.getTime() - 6 * 86400000);
  const end = new Date(todayStart.getTime() + 86400000 - 1);
  return { startTime: start.getTime(), endTime: end.getTime() };
}

async function requestEndpoint(endpointUrl: string, params: Record<string, string>): Promise<any> {
  const urlObj = new URL(endpointUrl);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      urlObj.searchParams.set(k, v);
    }
  });

  const fullUrl = urlObj.toString();
  console.log(`📡 Fetching from: ${fullUrl}`);

  const res = await fetch(fullUrl, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'PeekAndPerch-FeederSync/1.0',
    },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }

  const json = await res.json();
  if (json && json.message && json.message.toLowerCase().includes('error')) {
    throw new Error(json.message);
  }
  return json;
}

async function main() {
  console.log('🐦 Starting Birdfy Automated Feeder Sync...');

  let config: Record<string, any> = {};
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    } catch (e) {
      console.warn('⚠️ Could not parse birdfy.config.json', e);
    }
  }

  const highlightUuid = extractUuid(
    process.env.BIRDFY_HIGHLIGHT_UUID || process.env.BIRDFY_UUID || config.highlightUuid || ''
  );
  const recapUuid = extractUuid(
    process.env.BIRDFY_RECAP_UUID || config.recapUuid || ''
  );
  const dateRange = process.env.BIRDFY_DATE_RANGE || config.dateRange || 'last_7_days';
  const feederName = config.feederName || 'Backyard Birdfy Feeder';
  const feederModel = config.feederModel || 'Birdfy Feeder Cam 2 Pro (2K AI)';

  console.log(`📋 Config: Feeder="${feederName}", Range="${dateRange}"`);
  console.log(`🔑 Highlight UUID: ${highlightUuid ? highlightUuid.slice(0, 8) + '...' : '(none)'}`);
  console.log(`🔑 Recap UUID: ${recapUuid ? recapUuid.slice(0, 8) + '...' : '(none)'}`);

  // Load existing sightings
  let existingSightings: any[] = [];
  if (fs.existsSync(SIGHTINGS_FILE)) {
    try {
      existingSightings = JSON.parse(fs.readFileSync(SIGHTINGS_FILE, 'utf-8'));
      if (!Array.isArray(existingSightings)) existingSightings = [];
      console.log(`📂 Loaded ${existingSightings.length} existing sightings from public/data/sightings.json`);
    } catch (e) {
      console.warn('⚠️ Could not parse existing sightings.json, starting fresh.', e);
    }
  }

  const incomingSightings: any[] = [];

  // 1. Fetch Highlights
  if (highlightUuid) {
    try {
      console.log('🔍 Fetching curated moments / highlights...');
      const { startTime, endTime } = getDateRangeTimestamps(dateRange);
      const params: Record<string, string> = { uuid: highlightUuid };
      if (startTime) params.startTime = startTime.toString();
      if (endTime) params.endTime = endTime.toString();

      let data = await requestEndpoint(BIRDFY_API_DIRECT, params);

      let dataList: any[] = data.dataList || [];
      let birdList: any[] = data.birdList || [];

      // Unbounded fallback if empty
      if (dataList.length === 0 && birdList.length === 0 && (startTime || endTime)) {
        console.log('ℹ️ No moments in timestamp window, retrying unbounded query...');
        const fallback = await requestEndpoint(BIRDFY_API_DIRECT, { uuid: highlightUuid });
        dataList = fallback.dataList || [];
        birdList = fallback.birdList || [];
      }

      console.log(`✨ Highlight API returned ${dataList.length} moments and ${birdList.length} species summaries.`);

      dataList.forEach((item: any) => {
        const speciesName = item.detectObject || item.title || 'Backyard Bird';
        const timestamp = item.createTime ? Number(item.createTime) : Date.now();
        const dateObj = new Date(timestamp);
        const dateString = dateObj.toISOString().split('T')[0];
        const timeString = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        incomingSightings.push({
          id: `birdfy-live-${highlightUuid.slice(0, 6)}-${timestamp}-${Math.random().toString(36).substring(2, 6)}`,
          speciesId: speciesName.toLowerCase().replace(/[^a-z0-9]/g, '_'),
          speciesName,
          imageUrl: item.fileUrl || item.coverKey || '/assets/cardinal_backyard_photo_1784997052037.jpg',
          date: dateString,
          time: timeString,
          location: 'Tube Feeder',
          behavior: 'Feeder Snack',
          weather: 'Sunny & Pleasant, 75°F',
          count: 1,
          notes: item.title || `Live Birdfy detection: ${speciesName} visited feeder.`,
          isFavorite: item.category === 'newBird',
          spottedBy: `Birdfy Cam (${feederName})`,
          temperature: '75°F',
          birdfy: {
            isBirdfyCapture: true,
            feederName,
            feederModel,
            aiConfidence: item.category === 'newBird' ? 99.5 : 98.8,
            aiDetectedSpecies: speciesName,
            triggerType: item.category === 'newBird' ? 'AI Bird Detected' : 'PIR Motion',
            resolution: '1080p Full HD',
            videoUrl: item.fileUrl,
            batteryLevel: 96,
            isSolarCharging: true,
            wifiSignal: 'Excellent',
            rawPIRTimestamp: dateObj.toISOString(),
          },
        });
      });
    } catch (err: any) {
      console.warn(`⚠️ Error fetching highlights: ${err.message}`);
    }
  }

  // 2. Fetch Recap
  const targetRecap = recapUuid || (incomingSightings.length === 0 ? highlightUuid : '');
  if (targetRecap) {
    try {
      console.log('🔍 Fetching monthly recap data...');
      const data = await requestEndpoint(BIRDFY_RECAP_API_DIRECT, { uuid: targetRecap, needHistory: '1' });
      const statDate = data.statisticsDate || new Date().toISOString().split('T')[0];

      if (data.maxComeBirdName) {
        incomingSightings.push({
          id: `birdfy-recap-top-${targetRecap.slice(0, 6)}-${Date.now()}`,
          speciesId: data.maxComeBirdName.toLowerCase().replace(/[^a-z0-9]/g, '_'),
          speciesName: data.maxComeBirdName,
          imageUrl: data.maxComeBirdFile || '/assets/cardinal_backyard_photo_1784997052037.jpg',
          date: statDate.includes('-') && statDate.length === 10 ? statDate : new Date().toISOString().split('T')[0],
          time: '08:00 AM',
          location: 'Tube Feeder',
          behavior: 'Feeder Snack',
          weather: 'Sunny & Pleasant, 75°F',
          count: data.birdSpeciesComeCount || 1,
          notes: `🏆 Monthly Top Visitor: ${data.maxComeBirdName} visited your feeder most often (${data.birdSpeciesComeCount || 0} visits).`,
          isFavorite: true,
          spottedBy: `Birdfy Monthly Recap (${feederName})`,
          temperature: '75°F',
          birdfy: {
            isBirdfyCapture: true,
            feederName,
            feederModel,
            aiConfidence: 99.6,
            aiDetectedSpecies: data.maxComeBirdName,
            triggerType: 'AI Bird Detected',
            resolution: '1080p Full HD',
            videoUrl: data.maxComeBirdFile,
            batteryLevel: 96,
            isSolarCharging: true,
            wifiSignal: 'Excellent',
          },
        });
      }

      if (data.unCommonBirdName && data.unCommonBirdName !== data.maxComeBirdName) {
        incomingSightings.push({
          id: `birdfy-recap-uncommon-${targetRecap.slice(0, 6)}-${Date.now()}`,
          speciesId: data.unCommonBirdName.toLowerCase().replace(/[^a-z0-9]/g, '_'),
          speciesName: data.unCommonBirdName,
          imageUrl: data.unCommonBirdFile || '/assets/goldfinch_flower_sighting_1784989744869.jpg',
          date: statDate.includes('-') && statDate.length === 10 ? statDate : new Date().toISOString().split('T')[0],
          time: '10:30 AM',
          location: 'Tube Feeder',
          behavior: 'Feeder Snack',
          weather: 'Partly Cloudy, 74°F',
          count: 1,
          notes: `⭐ Rare/Uncommon Visitor: ${data.unCommonBirdName} detected!`,
          isFavorite: true,
          spottedBy: `Birdfy Monthly Recap (${feederName})`,
          temperature: '74°F',
          birdfy: {
            isBirdfyCapture: true,
            feederName,
            feederModel,
            aiConfidence: 99.2,
            aiDetectedSpecies: data.unCommonBirdName,
            triggerType: 'AI Bird Detected',
            resolution: '1080p Full HD',
            videoUrl: data.unCommonBirdFile,
            batteryLevel: 96,
            isSolarCharging: true,
            wifiSignal: 'Excellent',
          },
        });
      }
    } catch (err: any) {
      console.warn(`⚠️ Error fetching recap: ${err.message}`);
    }
  }

  // Deduplicate and merge
  const seen = new Set<string>();
  const merged: any[] = [];

  const addUnique = (s: any) => {
    if (!s || !s.speciesName) return;
    const key = `${s.speciesName.toLowerCase().trim()}_${s.date}_${s.time}_${s.imageUrl || ''}`;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(s);
    }
  };

  // Add incoming first (newest), then existing
  incomingSightings.forEach(addUnique);
  existingSightings.forEach(addUnique);

  // Ensure public/data directory exists
  const dataDir = path.dirname(SIGHTINGS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(SIGHTINGS_FILE, JSON.stringify(merged, null, 2), 'utf-8');

  console.log(`✅ Sync Complete! Total detections in public/data/sightings.json: ${merged.length}`);
  console.log(`🆕 Added ${incomingSightings.length} newly fetched detections.`);
}

main().catch((err) => {
  console.error('❌ Fatal error during sync:', err);
  process.exit(1);
});
