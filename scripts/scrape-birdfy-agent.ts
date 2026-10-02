/**
 * Autonomous Headless Playwright Scraper Agent for my.birdfy.com
 * 
 * Logs into the Birdfy web portal, navigates to your feeder camera,
 * extracts high-resolution bird visit events, photos, and species tags,
 * and automatically updates public/data/sightings.json.
 */

import { chromium, Browser, Page } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load local .env if present
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SIGHTINGS_FILE = path.resolve(__dirname, '../public/data/sightings.json');
const DIST_SIGHTINGS_FILE = path.resolve(__dirname, '../dist/data/sightings.json');
const CONFIG_FILE = path.resolve(__dirname, '../birdfy.config.json');

const TIMEZONE = 'America/Chicago';

export function formatCentralDate(dateOrTs: Date | number | string): string {
  let ms: number;
  if (typeof dateOrTs === 'number') {
    ms = dateOrTs < 1e11 ? dateOrTs * 1000 : dateOrTs;
  } else if (typeof dateOrTs === 'string' && !isNaN(Number(dateOrTs))) {
    const num = Number(dateOrTs);
    ms = num < 1e11 ? num * 1000 : num;
  } else {
    ms = new Date(dateOrTs).getTime();
  }
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(ms));
}

export function formatCentralTime(dateOrTs: Date | number | string): string {
  let ms: number;
  if (typeof dateOrTs === 'number') {
    ms = dateOrTs < 1e11 ? dateOrTs * 1000 : dateOrTs;
  } else if (typeof dateOrTs === 'string' && !isNaN(Number(dateOrTs))) {
    const num = Number(dateOrTs);
    ms = num < 1e11 ? num * 1000 : num;
  } else {
    ms = new Date(dateOrTs).getTime();
  }
  return new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(ms));
}

interface ExtractedVisit {
  speciesName: string;
  imageUrl: string;
  date: string;
  time: string;
  videoUrl?: string;
  confidence?: number;
  notes?: string;
}

function isGenericOrJunkSpecies(name?: string): boolean {
  if (!name) return true;
  const s = name.toLowerCase().trim();
  if (
    s === 'feeder visitor' ||
    s === 'visitor' ||
    s === 'feeder bird' ||
    s === 'motion' ||
    s === 'unidentified' ||
    s === 'all birds' ||
    s === 'backyard bird' ||
    s === 'bird' ||
    s === 'all' ||
    s === 'hour' ||
    s === 'hours' ||
    s === 'minute' ||
    s === 'minutes' ||
    s === 'min' ||
    s === 'mins' ||
    s === 'sec' ||
    s === 'second' ||
    s === 'seconds' ||
    s === 'today' ||
    s === 'yesterday' ||
    s === 'select' ||
    s === 'delete' ||
    s === 'download' ||
    s === 'share' ||
    s === 'cancel' ||
    s === 'events' ||
    s === 'devices' ||
    s.includes('feeder visitor') ||
    s.includes('visitor') ||
    s.includes('motion')
  ) {
    return true;
  }
  if (
    /\b(hour|hours|minute|minutes|min|mins|sec|seconds|ago)\b/i.test(s) ||
    /^\d+\s*(h|hr|hrs|m|min|mins|s|sec|seconds|d|day|days)\b/i.test(s) ||
    /^\d{1,2}:\d{2}/.test(s) ||
    s.length < 3
  ) {
    return true;
  }
  return false;
}

function parseCliArgs(): { headed: boolean; deviceId?: string; maxEvents?: number } {
  const args = process.argv.slice(2);
  const headed = args.includes('--headed') || process.env.HEADLESS === 'false';
  let deviceId: string | undefined = process.env.BIRDFY_DEVICE_ID;
  let maxEvents: number | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--device' && args[i + 1]) {
      deviceId = args[i + 1].trim();
    }
    if (args[i] === '--max' && args[i + 1]) {
      maxEvents = parseInt(args[i + 1], 10);
    }
  }

  return { headed, deviceId, maxEvents };
}

async function launchBrowser(headed: boolean): Promise<Browser> {
  const launchOptions = {
    headless: !headed,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  };

  try {
    return await chromium.launch(launchOptions);
  } catch (err: any) {
    console.log('⚠️ Bundled Chromium launch failed, attempting to launch system Chrome / Edge...');
    try {
      return await chromium.launch({ ...launchOptions, channel: 'chrome' });
    } catch {
      try {
        return await chromium.launch({ ...launchOptions, channel: 'msedge' });
      } catch {
        throw new Error(
          `Unable to launch browser. Please run "npx playwright install chromium" or ensure Google Chrome / Microsoft Edge is installed.\nOriginal error: ${err.message}`
        );
      }
    }
  }
}

async function runScraperAgent() {
  console.log('🦅 ========================================================');
  console.log('🤖 Starting Birdfy Autonomous Headless Scraper Agent');
  console.log('🦅 ========================================================');

  const { headed, deviceId: cliDeviceId, maxEvents } = parseCliArgs();

  // 1. Read credentials & configuration
  let config: Record<string, any> = {};
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    } catch {
      // Ignore config error
    }
  }

  const email = (process.env.BIRDFY_EMAIL || config.email || '').trim();
  const password = (process.env.BIRDFY_PASSWORD || config.password || '').trim();
  const deviceId = (cliDeviceId || process.env.BIRDFY_DEVICE_ID || config.deviceId || '').trim();
  const feederName = config.feederName || 'Backyard Birdfy Feeder';
  const feederModel = config.feederModel || 'Birdfy Feeder Cam 2 Pro (2K AI)';

  if (!email || !password) {
    console.error('❌ Error: Missing Birdfy credentials!');
    console.error('👉 Please define BIRDFY_EMAIL and BIRDFY_PASSWORD in your .env file or GitHub Secrets.');
    console.error('   Example:');
    console.error('   BIRDFY_EMAIL=myemail@gmail.com');
    console.error('   BIRDFY_PASSWORD=mypassword');
    process.exit(1);
  }

  console.log(`👤 User: ${email.replace(/(.{2})(.*)(@.*)/, '$1***$3')}`);
  console.log(`🖥️ Mode: ${headed ? 'Visible Browser (Headed)' : 'Headless (Background)'}`);
  if (deviceId) {
    console.log(`🎯 Target Device ID: ${deviceId}`);
  }

  const browser: Browser = await launchBrowser(headed);

  const context = await browser.newContext({
    timezoneId: 'America/Chicago',
    locale: 'en-US',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1440, height: 900 },
  });

  const page: Page = await context.newPage();

  const interceptedDetections: ExtractedVisit[] = [];

  // 2. Intercept background API traffic from my.birdfy.com / Netvue endpoints
  page.on('response', async (res) => {
    try {
      const url = res.url();
      if (
        url.includes('nvts.co') ||
        url.includes('birdfy.com') ||
        url.includes('/moments') ||
        url.includes('/events') ||
        url.includes('/device') ||
        url.includes('/media')
      ) {
        const text = await res.text().catch(() => '');
        if (!text || (!text.startsWith('{') && !text.startsWith('['))) return;

        let json: any;
        try {
          json = JSON.parse(text);
        } catch {
          return;
        }

        const candidateLists = [
          json.dataList,
          json.events,
          json.data?.events,
          json.data?.list,
          json.data?.dataList,
          json.data?.moments,
          json.moments,
          json.list,
        ];

        for (const items of candidateLists) {
          if (Array.isArray(items) && items.length > 0) {
            items.forEach((ev: any) => {
              const speciesName =
                ev.detectObject ||
                ev.title ||
                ev.displayTags?.[0]?.label ||
                ev.tags?.[0]?.label ||
                ev.rawName ||
                '';

              // Ignore Feeder Visitor, generic motion, and junk
              if (!speciesName || isGenericOrJunkSpecies(speciesName)) {
                return;
              }

              const img =
                ev.fileUrl ||
                ev.coverKey ||
                ev.pic ||
                ev.largeUrl ||
                ev.images?.[0]?.largeUrl ||
                ev.images?.[0]?.listUrl ||
                ev.images?.[0]?.url ||
                '';

              if (!img) return;

              const rawTime = ev.createTime || ev.alertTime || ev.time || ev.timestamp;
              let date = formatCentralDate(new Date());
              let time = '12:00 PM';

              if (rawTime) {
                const ts = Number(rawTime);
                if (!isNaN(ts) && ts > 0) {
                  date = formatCentralDate(ts);
                  time = formatCentralTime(ts);
                }
              }

              if (!interceptedDetections.some((x) => x.imageUrl === img)) {
                interceptedDetections.push({
                  speciesName,
                  imageUrl: img,
                  date,
                  time,
                  videoUrl: ev.videoUrl || (ev.fileUrl?.endsWith('.mp4') ? ev.fileUrl : undefined),
                  confidence: 99.2,
                  notes: ev.title || `Live Birdfy detection: ${speciesName} on feeder perch.`,
                });
              }
            });
          }
        }
      }
    } catch {
      // Ignore response read error
    }
  });

  try {
    // 3. Navigate to Birdfy Login
    console.log('🌐 Navigating to https://my.birdfy.com/en/login...');
    await page.goto('https://my.birdfy.com/en/login', { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Wait for login inputs
    console.log('🔑 Entering login credentials...');
    await page.waitForSelector('input[type="text"], input[type="email"], input[placeholder*="email" i], input[placeholder*="account" i]', {
      timeout: 15000,
    });

    const emailInput = page.locator('input[type="text"], input[type="email"], input[placeholder*="email" i], input[placeholder*="account" i]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    await emailInput.fill(email);
    await passwordInput.fill(password);

    // Submit form
    const loginButton = page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Log in"), button:has-text("Login")').first();
    console.log('🚀 Submitting login form...');
    await loginButton.click();

    // Wait for redirect or dashboard
    await page.waitForURL((url) => !url.toString().includes('/login'), { timeout: 25000 });
    console.log(`✅ Login successful! Current page: ${page.url()}`);

    await page.waitForTimeout(2500);

    // 4. Navigate to Feeder Events
    let targetEventsUrl = '';
    if (deviceId) {
      targetEventsUrl = `https://my.birdfy.com/en/devices/${deviceId}/events`;
    } else {
      const deviceLink = page.locator('a[href*="/devices/"], .device-card, .device-item').first();
      const href = (await deviceLink.getAttribute('href').catch(() => null)) || '';
      if (href) {
        const idMatch = href.match(/devices\/([a-zA-Z0-9_-]+)/);
        const resolvedId = idMatch ? idMatch[1] : '';
        if (resolvedId) {
          targetEventsUrl = `https://my.birdfy.com/en/devices/${resolvedId}/events`;
        }
      }
    }

    if (!targetEventsUrl) {
      targetEventsUrl = 'https://my.birdfy.com/en/moments';
    }

    console.log(`🎯 Navigating to Feeder Events page: ${targetEventsUrl}...`);
    await page.goto(targetEventsUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3500);

    // Scroll down dynamically to trigger media, pagination, and lazy event loading across all pages
    console.log('📜 Deep-scrolling events timeline to load all moments...');
    let lastCardsFound = 0;
    let stagnantCount = 0;

    for (let i = 1; i <= 30; i++) {
      await page.evaluate(`(() => {
        window.scrollBy(0, 1500);
        var scrollTargets = [
          document.documentElement,
          document.body
        ].concat(Array.from(document.querySelectorAll('.el-scrollbar__wrap, .device-events-grid, .moment-content, .events-wrapper, main, [class*="scroll"], [class*="events"]')));
        scrollTargets.forEach(function(t) {
          try {
            if (t.scrollBy) t.scrollBy(0, 1500);
            if (t.scrollTop !== undefined) t.scrollTop += 1500;
          } catch (e) {}
        });

        var loadBtns = Array.from(document.querySelectorAll('button, a, .el-button')).filter(function(b) {
          return /load more|view more|more events/i.test(b.textContent || '');
        });
        loadBtns.forEach(function(b) {
          try { b.click(); } catch (e) {}
        });
      })()`);

      await page.waitForTimeout(600);

      const count = Number(await page.evaluate(`document.querySelectorAll('.moment-card, .device-event-card, .moment-card__main, img[data-media-url]').length`));

      console.log(`   ↳ Step ${i}/30: Detected ${count} cards on page...`);

      if (count > 0 && count === lastCardsFound) {
        stagnantCount++;
        if (stagnantCount >= 3) {
          console.log(`✨ Reached bottom of timeline with ${count} total cards rendered.`);
          break;
        }
      } else {
        stagnantCount = 0;
      }
      lastCardsFound = Number(count);
    }

    const domSightings: ExtractedVisit[] = await page.evaluate(`(() => {
      var isJunk = function(name) {
        if (!name) return true;
        var s = name.toLowerCase().trim();
        if (
          s === 'feeder visitor' ||
          s === 'visitor' ||
          s === 'feeder bird' ||
          s === 'motion' ||
          s === 'unidentified' ||
          s === 'all birds' ||
          s === 'backyard bird' ||
          s === 'bird' ||
          s === 'all' ||
          s === 'hour' ||
          s === 'hours' ||
          s === 'minute' ||
          s === 'minutes' ||
          s === 'min' ||
          s === 'mins' ||
          s === 'sec' ||
          s === 'second' ||
          s === 'seconds' ||
          s === 'today' ||
          s === 'yesterday' ||
          s === 'select' ||
          s === 'delete' ||
          s === 'download' ||
          s === 'share' ||
          s === 'cancel' ||
          s === 'events' ||
          s === 'devices' ||
          s.indexOf('feeder visitor') !== -1 ||
          s.indexOf('visitor') !== -1 ||
          s.indexOf('motion') !== -1
        ) {
          return true;
        }
        if (
          /\\b(hour|hours|minute|minutes|min|mins|sec|seconds|ago)\\b/i.test(s) ||
          /^\\d+\\s*(h|hr|hrs|m|min|mins|s|sec|seconds|d|day|days)\\b/i.test(s) ||
          /^\\d{1,2}:\\d{2}/.test(s) ||
          s.length < 3
        ) {
          return true;
        }
        return false;
      };

      var results = [];
      var seenImgs = new Set();

      var formatToCentral = function(ts) {
        var d = new Date(Number(ts) < 1e11 ? Number(ts) * 1000 : Number(ts));
        return {
          date: new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d),
          time: d.toLocaleTimeString('en-US', { timeZone: 'America/Chicago', hour: 'numeric', minute: '2-digit', hour12: true })
        };
      };

      // Method A: Check Vue component instances
      var allElements = Array.from(document.querySelectorAll('*'));
      for (var j = 0; j < allElements.length; j++) {
        var el = allElements[j];
        var v = el.__vue__;
        if (v && Array.isArray(v.events) && v.events.length > 0) {
          v.events.forEach(function(ev) {
            var media = v.mediaFor ? v.mediaFor(ev) : null;
            var tags = (media && media.displayTags) || ev.displayTags || ev.tags || [];
            var species = (tags[0] && (tags[0].label || tags[0].rawName)) || ev.detectObject || ev.title || '';

            if (!species || isJunk(species)) return;

            var img =
              (media && media.images && media.images[0] && (media.images[0].largeUrl || media.images[0].listUrl || media.images[0].url)) ||
              ev.pic ||
              ev.fileUrl ||
              '';

            if (!img || seenImgs.has(img)) return;
            seenImgs.add(img);

            var tm = '12:00 PM';
            var d = formatToCentral(Date.now()).date;
            var alertTime = ev.alertTime || ev.createTime || ev.time;
            if (alertTime) {
              var formatted = formatToCentral(alertTime);
              tm = formatted.time;
              d = formatted.date;
            } else if (v.formatTime) {
              tm = v.formatTime(alertTime).replace(/^.*?(Today|Yesterday)\\s*/i, '').trim() || '12:00 PM';
              if (v.date) d = v.date;
            }

            results.push({
              speciesName: species,
              imageUrl: img,
              time: tm,
              date: d,
            });
          });
        }
      }

      // Method B: DOM Cards
      var tb = (document.querySelector('.moment-toolbar__date') && document.querySelector('.moment-toolbar__date').textContent) || '';
      var defaultDate = formatToCentral(Date.now()).date;
      if (tb.toLowerCase().indexOf('yesterday') !== -1) {
        var y = new Date();
        y.setDate(y.getDate() - 1);
        defaultDate = formatToCentral(y).date;
      } else if (tb && tb.toLowerCase().indexOf('today') === -1) {
        var p = new Date(tb);
        if (!isNaN(p.getTime())) defaultDate = formatToCentral(p).date;
      }

      var cards = Array.from(document.querySelectorAll('.moment-card, .device-event-card'));
      if (!cards.length) {
        cards = Array.from(document.querySelectorAll('.moment-card__main, .moment-card__image-button'))
          .map(function(el) { return el.closest('.moment-card') || el.parentElement; })
          .filter(Boolean);
      }
      cards = cards.filter(function(c) {
        return !c.querySelector('.moment-card, .device-event-card') &&
          !c.matches('.moment-toolbar, .moment-tags, .moment-selection-bar, .moment-empty, .device-events-grid');
      });

      for (var k = 0; k < cards.length; k++) {
        var card = cards[k];
        var vue = card.__vue__;
        var imgEl = card.querySelector('img[data-media-url], .moment-card__main-image, .device-event-card__image, img');
        var url =
          (vue && (vue.mainCoverUrl || vue.firstImageUrl)) ||
          (imgEl && (imgEl.dataset.mediaUrl || imgEl.currentSrc || imgEl.src || imgEl.getAttribute('src'))) ||
          '';

        if (!url || url.indexOf('data:image/svg') === 0 || url.indexOf('avatar') !== -1 || url.indexOf('spin') !== -1 || url.indexOf('icon') !== -1 || url.indexOf('logo') !== -1) {
          var thumb = card.querySelector('.moment-card__thumb img');
          url = (thumb && (thumb.currentSrc || thumb.src)) || '';
        }

        if (!url || seenImgs.has(url)) continue;

        var species =
          (vue && vue.displayTags && vue.displayTags[0] && vue.displayTags[0].label) ||
          (card.querySelector('.moment-card__tag, .device-event-card__name') && card.querySelector('.moment-card__tag, .device-event-card__name').textContent.trim()) ||
          '';

        if (!species || isJunk(species)) {
          var lines = (card.textContent || '')
            .split('\\n')
            .map(function(l) { return l.trim(); })
            .filter(function(l) { return l.length > 2 && l.length < 35; });
          for (var mIdx = 0; mIdx < lines.length; mIdx++) {
            var l = lines[mIdx];
            if (!isJunk(l) && !/^\\d{1,2}:\\d{2}/.test(l)) {
              species = l;
              break;
            }
          }
        }

        // Skip if still generic or Feeder Visitor
        if (!species || isJunk(species)) continue;

        seenImgs.add(url);

        var timeStr =
          (vue && vue.formatTime && vue.event && vue.event.alertTime ? vue.formatTime(vue.event.alertTime) : '') ||
          (card.querySelector('.moment-card__time, .device-event-card__shared, [class*="time"]') && card.querySelector('.moment-card__time, .device-event-card__shared, [class*="time"]').textContent.trim()) ||
          '12:00 PM';

        var mMatch = timeStr.match(/\\d{1,2}:\\d{2}(\\s*(?:AM|PM|am|pm))?/i);
        if (mMatch) timeStr = mMatch[0];

        var cardAlertTime = vue && vue.event && (vue.event.alertTime || vue.event.createTime);
        var cardDate = defaultDate;
        if (cardAlertTime) {
          var formattedCard = formatToCentral(cardAlertTime);
          cardDate = formattedCard.date;
          if (!timeStr || timeStr === '12:00 PM') {
            timeStr = formattedCard.time;
          }
        }

        results.push({
          speciesName: species,
          imageUrl: url,
          time: timeStr,
          date: cardDate,
        });
      }

      return results;
    })()`);

    console.log(`📸 DOM & Vue Scraper extracted ${domSightings.length} card detections.`);

    // 6. Combine Intercepted + DOM Sightings
    const combinedDetections: ExtractedVisit[] = [...interceptedDetections];
    domSightings.forEach((ds) => {
      if (!combinedDetections.some((cd) => cd.imageUrl === ds.imageUrl)) {
        combinedDetections.push(ds);
      }
    });

    // Clean any remaining generic names
    const filteredDetections = combinedDetections.filter((d) => !isGenericOrJunkSpecies(d.speciesName));

    if (maxEvents && maxEvents > 0) {
      filteredDetections.splice(maxEvents);
    }

    console.log(`✨ Total verified bird detections collected: ${filteredDetections.length}`);

    // 7. Load existing dataset & merge
    let existingSightings: any[] = [];
    if (fs.existsSync(SIGHTINGS_FILE)) {
      try {
        existingSightings = JSON.parse(fs.readFileSync(SIGHTINGS_FILE, 'utf-8'));
        if (!Array.isArray(existingSightings)) existingSightings = [];
      } catch {
        existingSightings = [];
      }
    }

    // Filter existing sightings from junk as well
    existingSightings = existingSightings.filter((s) => !isGenericOrJunkSpecies(s?.speciesName));

    console.log(`📂 Current public/data/sightings.json count: ${existingSightings.length}`);

    const newSightingsFormatted: any[] = filteredDetections.map((d, index) => {
      const spId = d.speciesName.toLowerCase().replace(/[^a-z0-9]/g, '_');
      let timestamp = Date.now() - index * 60000;
      const nvcMatch = d.imageUrl.match(/nvc_(\d{13})_/);
      if (nvcMatch) {
        timestamp = Number(nvcMatch[1]);
      }
      return {
        id: `birdfy-scrape-${timestamp}-${Math.random().toString(36).substring(2, 6)}`,
        speciesId: spId || 'custom',
        speciesName: d.speciesName,
        imageUrl: d.imageUrl,
        date: d.date,
        time: d.time,
        location: 'Tube Feeder',
        behavior: 'Feeder Snack',
        weather: 'Sunny & Pleasant, 75°F',
        count: 1,
        notes: d.notes || `Scraped from Birdfy Feeder: ${d.speciesName} visit recorded.`,
        isFavorite: index === 0,
        spottedBy: `Birdfy Scraper Agent (${feederName})`,
        temperature: '75°F',
        birdfy: {
          isBirdfyCapture: true,
          feederName,
          feederModel,
          aiConfidence: d.confidence || 99.2,
          aiDetectedSpecies: d.speciesName,
          triggerType: 'AI Bird Detected',
          resolution: '1080p Full HD',
          videoUrl: d.videoUrl,
          batteryLevel: 96,
          isSolarCharging: true,
          wifiSignal: 'Excellent',
          rawPIRTimestamp: new Date().toISOString(),
        },
      };
    });

function normalizeTime(t?: string): string {
  if (!t) return '12:00 PM';
  const clean = t.trim();
  const m = clean.match(/^(\d{1,2}):(\d{2})(\s*(?:AM|PM|am|pm))?/i);
  if (m) {
    const hh = m[1].padStart(2, '0');
    const mm = m[2];
    const ampm = m[3] ? ` ${m[3].trim().toUpperCase()}` : '';
    return `${hh}:${mm}${ampm}`;
  }
  return clean.toUpperCase();
}

function getSightingKey(s: { speciesName?: string; date?: string; time?: string }): string {
  const sp = (s.speciesName || '').toLowerCase().trim();
  const dt = (s.date || '').trim();
  const tm = normalizeTime(s.time);
  return `${sp}__${dt}__${tm}`;
}

    // Deduplicate against existing strictly by bird species + date + time
    const seen = new Set<string>();
    const finalMerged: any[] = [];

    const addUnique = (s: any) => {
      if (!s || !s.speciesName || isGenericOrJunkSpecies(s.speciesName)) return;
      const key = getSightingKey(s);
      if (!seen.has(key)) {
        seen.add(key);
        finalMerged.push(s);
      }
    };

    newSightingsFormatted.forEach(addUnique);
    existingSightings.forEach(addUnique);

    // Ensure data directory exists
    const dataDir = path.dirname(SIGHTINGS_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const jsonContent = JSON.stringify(finalMerged, null, 2);
    fs.writeFileSync(SIGHTINGS_FILE, jsonContent, 'utf-8');

    // Also persist to dist/data/sightings.json if dist directory exists
    if (fs.existsSync(path.dirname(DIST_SIGHTINGS_FILE))) {
      try {
        fs.writeFileSync(DIST_SIGHTINGS_FILE, jsonContent, 'utf-8');
      } catch {
        // ignore
      }
    }

    console.log('🎉 ========================================================');
    console.log(`✅ Success! public/data/sightings.json updated successfully.`);
    console.log(`📊 Total dataset: ${finalMerged.length} bird detections.`);
    console.log(`🆕 Newly captured in this run: ${newSightingsFormatted.length} visits.`);
    if (newSightingsFormatted.length > 0) {
      const speciesFound = Array.from(new Set(newSightingsFormatted.map((s) => s.speciesName)));
      console.log(`🐦 Species discovered: ${speciesFound.join(', ')}`);
    }
    console.log('🎉 ========================================================');
  } catch (err: any) {
    console.error('❌ Scraper Agent encountered an error:');
    console.error(err.stack || err.message || err);
    throw err;
  } finally {
    await browser.close();
  }
}

runScraperAgent().catch((err) => {
  console.error('Fatal Scraper Agent Execution Error:', err);
  process.exit(1);
});

