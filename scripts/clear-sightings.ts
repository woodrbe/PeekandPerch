import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sightingsFile = path.resolve(__dirname, '../public/data/sightings.json');
const distSightingsFile = path.resolve(__dirname, '../dist/data/sightings.json');

fs.mkdirSync(path.dirname(sightingsFile), { recursive: true });
fs.writeFileSync(sightingsFile, '[]\n', 'utf8');

if (fs.existsSync(path.dirname(distSightingsFile))) {
  try {
    fs.writeFileSync(distSightingsFile, '[]\n', 'utf8');
  } catch {
    // ignore if dist not present
  }
}

console.log('✅ Successfully cleared sightings.json: []');
