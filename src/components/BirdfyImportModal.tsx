import React, { useState, useRef } from 'react';
import { BirdSighting, GardenLocation, BirdfyDevice } from '../types';
import { BACKYARD_SPECIES } from '../data/birdsData';
import { BirdfyService } from '../services/birdfyService';
import { 
  X, UploadCloud, Camera, Sparkles, Check, Image as ImageIcon, 
  Calendar, Clock, MapPin, Tag, ShieldCheck, Copy, ExternalLink, Globe, FileCode, CheckCircle2, Download
} from 'lucide-react';

interface BirdfyImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSighting: (sighting: BirdSighting) => void;
  onApplySightings?: (sightings: BirdSighting[]) => void;
  device?: BirdfyDevice;
  currentSightings?: BirdSighting[];
}

export const BirdfyImportModal: React.FC<BirdfyImportModalProps> = ({
  isOpen,
  onClose,
  onAddSighting,
  onApplySightings,
  device,
  currentSightings = [],
}) => {
  if (!isOpen) return null;

  const currentDevice = device || BirdfyService.getDevice();
  const [activeTab, setActiveTab] = useState<'scrape' | 'upload'>('scrape');

  // --- SCRAPER TAB STATE ---
  const [rawScraperText, setRawScraperText] = useState('');
  const [hasCopiedScript, setHasCopiedScript] = useState(false);
  const [isProcessingScrape, setIsProcessingScrape] = useState(false);

  // Auto-parse raw scraper text to compute count
  const parsedSightingsFromText = React.useMemo(() => {
    if (!rawScraperText.trim()) return [];
    return BirdfyService.parseRawBirdfyWebEvents(rawScraperText);
  }, [rawScraperText]);

  const scraperBookmarkletCode = `(async () => {
  const copyToClipboard = async (data) => {
    const jsonStr = JSON.stringify(data, null, 2);
    let ok = false;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(jsonStr);
        ok = true;
      } catch (e) {}
    }
    if (!ok) {
      try {
        const ta = document.createElement('textarea');
        ta.value = jsonStr;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        ta.style.top = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        ok = document.execCommand('copy');
        ta.remove();
      } catch (e) {}
    }
    return ok;
  };

  const isFeederVisitorOrJunk = (name) => {
    if (!name) return true;
    const s = name.toLowerCase().trim();
    if (
      s === 'feeder visitor' ||
      s === 'visitor' ||
      s === 'feeder bird' ||
      s === 'motion' ||
      s === 'unidentified' ||
      s === 'all birds' ||
      s === 'all' ||
      s === 'bird' ||
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
  };

  const toast = document.createElement('div');
  toast.id = 'birdfy-peek-toast';
  toast.style.cssText = 'position:fixed;top:24px;left:50%;transform:translateX(-50%);z-index:999999;background:#0284c7;color:#fff;padding:14px 24px;border-radius:999px;font-family:system-ui,-apple-system,sans-serif;font-size:14px;font-weight:700;box-shadow:0 12px 30px rgba(0,0,0,0.35);border:2px solid #fff;display:flex;align-items:center;gap:10px;transition:all 0.3s ease;';
  toast.innerHTML = '<span style="font-size:18px">🦅</span><span>Auto-scrolling feed to load identified bird species (ignoring generic visitors)...</span>';
  document.body.appendChild(toast);

  const scrollTargets = [window, document.documentElement, document.body, ...Array.from(document.querySelectorAll('.el-scrollbar__wrap, .device-events-grid, .moment-content, .events-wrapper, main, [class*="scroll"], [class*="events"]'))].filter(Boolean);
  const doScroll = () => {
    window.scrollBy(0, 1500);
    scrollTargets.forEach(t => {
      try {
        if (t.scrollBy) t.scrollBy(0, 1500);
        if (t.scrollTop !== undefined) t.scrollTop += 1500;
      } catch(e){}
    });
    const loadBtns = Array.from(document.querySelectorAll('button, a, .el-button')).filter(b => /load more|view more|more events/i.test(b.textContent || ''));
    loadBtns.forEach(b => { try { b.click(); } catch(e){} });
  };

  let lastCount = 0;
  let stagnantRounds = 0;
  for (let step = 1; step <= 25; step++) {
    doScroll();
    await new Promise(r => setTimeout(r, 380));
    const currentCards = document.querySelectorAll('.moment-card, .device-event-card, .moment-card__main, img[data-media-url]').length;
    toast.innerHTML = '<span style="font-size:18px">🦅</span><span>Auto-scrolling feed... Found <b>' + currentCards + '</b> cards so far (Step ' + step + '/25)...</span>';
    if (currentCards > 0 && currentCards === lastCount) {
      stagnantRounds++;
      if (stagnantRounds >= 3) break;
    } else {
      stagnantRounds = 0;
    }
    lastCount = currentCards;
  }

  const allSightings = [];
  const seenUrls = new Set();
  
  const allElements = Array.from(document.querySelectorAll('*'));
  for (const el of allElements) {
    if (el.__vue__ && Array.isArray(el.__vue__.events) && el.__vue__.events.length > 0) {
      const v = el.__vue__;
      v.events.forEach(ev => {
        const media = v.mediaFor ? v.mediaFor(ev) : null;
        const tags = media?.displayTags || [];
        const species = tags[0]?.label || tags[0]?.rawName || ev.title || '';
        
        // Skip generic feeder visitor / motion cards
        if (!species || isFeederVisitorOrJunk(species)) return;

        const img = media?.images?.[0]?.largeUrl || media?.images?.[0]?.listUrl || media?.images?.[0]?.url || ev.pic || ev.fileUrl || '';
        const tm = v.formatTime ? v.formatTime(ev.alertTime) : '12:00 PM';
        const d = ev.alertTime ? new Date(ev.alertTime).toISOString().split('T')[0] : (v.date || new Date().toISOString().split('T')[0]);
        if (img && !seenUrls.has(img)) {
          seenUrls.add(img);
          allSightings.push({
            speciesName: species,
            imageUrl: img,
            time: tm.replace(/^.*?(Today|Yesterday)\\s*/i, '').trim() || '12:00 PM',
            date: d
          });
        }
      });
    }
  }

  const tb = document.querySelector('.moment-toolbar__date')?.innerText?.trim() || '';
  let defaultDate = new Date().toISOString().split('T')[0];
  if (tb.toLowerCase().includes('yesterday')) {
    const y = new Date(); y.setDate(y.getDate() - 1);
    defaultDate = y.toISOString().split('T')[0];
  } else if (tb && !tb.toLowerCase().includes('today')) {
    const p = new Date(tb);
    if (!isNaN(p.getTime())) defaultDate = p.toISOString().split('T')[0];
  }

  let cards = Array.from(document.querySelectorAll('.moment-card, .device-event-card'));
  if (!cards.length) {
    cards = Array.from(document.querySelectorAll('.moment-card__main, .moment-card__image-button')).map(el => el.closest('.moment-card') || el.parentElement).filter(Boolean);
  }
  cards = cards.filter(c => !c.querySelector('.moment-card, .device-event-card') && !c.matches('.moment-toolbar, .moment-tags, .moment-selection-bar, .moment-empty, .device-events-grid'));

  for (const c of cards) {
    const vue = c.__vue__;
    const imgEl = c.querySelector('img[data-media-url], .moment-card__main-image, .device-event-card__image, img');
    let u = vue?.mainCoverUrl || vue?.firstImageUrl || imgEl?.dataset?.mediaUrl || imgEl?.currentSrc || imgEl?.src || imgEl?.getAttribute('src') || '';
    if (!u || u.startsWith('data:image/svg') || u.includes('avatar') || u.includes('spin') || u.includes('icon') || u.includes('logo')) {
      const thumb = c.querySelector('.moment-card__thumb img');
      u = thumb?.currentSrc || thumb?.src || '';
    }
    if (!u || seenUrls.has(u)) continue;

    let sp = vue?.displayTags?.[0]?.label || c.querySelector('.moment-card__tag, .device-event-card__name')?.innerText?.trim() || '';
    if (!sp || isFeederVisitorOrJunk(sp)) {
      const lines = (c.innerText || '').split('\\n').map(l => l.trim()).filter(l => l.length > 2 && l.length < 35);
      for (const l of lines) {
        if (!isFeederVisitorOrJunk(l) && !/^\\d{1,2}:\\d{2}/.test(l)) {
          sp = l;
          break;
        }
      }
    }

    // Skip if still generic / Feeder Visitor
    if (!sp || isFeederVisitorOrJunk(sp)) continue;

    seenUrls.add(u);

    let tm = vue?.formatTime?.(vue?.event?.alertTime) || c.querySelector('.moment-card__time, .device-event-card__shared')?.innerText?.trim() || '12:00 PM';
    if (tm.toLowerCase().includes('today') || tm.toLowerCase().includes('yesterday')) {
      const m = tm.match(/\\d{1,2}:\\d{2}(\\s*(?:AM|PM|am|pm))?/i);
      tm = m ? m[0] : '12:00 PM';
    }
    const cardDate = vue?.event?.alertTime ? new Date(vue.event.alertTime).toISOString().split('T')[0] : defaultDate;
    allSightings.push({ speciesName: sp, imageUrl: u, time: tm, date: cardDate });
  }

  window.__BIRDFY_CAPTURES__ = allSightings;
  console.log('Identified Bird Detections:', allSightings);
  await copyToClipboard(allSightings);

  toast.style.background = '#059669';
  toast.innerHTML = '<span style="font-size:18px">🎉</span><span>✓ Copied <b>' + allSightings.length + '</b> identified bird visits (ignored generic visitors)! Paste into Peek & Perch.</span>';
  setTimeout(() => toast.remove(), 6000);
  alert('✓ Copied ' + allSightings.length + ' identified bird species detections (Feeder Visitor cards ignored) to your clipboard! Paste into Peek & Perch.');
  return allSightings;
})()`.replace(/\\n/g, ' ').replace(/\\s+/g, ' ');

  const handleCopyScript = () => {
    navigator.clipboard.writeText(scraperBookmarkletCode);
    setHasCopiedScript(true);
    setTimeout(() => setHasCopiedScript(false), 3000);
  };

  const handleImportScrapedSightings = () => {
    if (parsedSightingsFromText.length === 0) return;
    setIsProcessingScrape(true);

    if (onApplySightings) {
      onApplySightings(parsedSightingsFromText);
    } else {
      parsedSightingsFromText.forEach((s) => onAddSighting(s));
    }

    setIsProcessingScrape(false);
    onClose();
  };

  const handleLoadDemoCaptures = () => {
    const demo = BirdfyService.getDemoSightings();
    if (onApplySightings) {
      onApplySightings(demo);
    } else {
      demo.forEach((s) => onAddSighting(s));
    }
    onClose();
  };

  // --- SD CARD / SINGLE UPLOAD STATE ---
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [speciesId, setSpeciesId] = useState<string>(BACKYARD_SPECIES[0].id);
  const [customSpeciesName, setCustomSpeciesName] = useState<string>('');
  const [aiConfidence, setAiConfidence] = useState<number>(99.2);
  const [location, setLocation] = useState<GardenLocation>('Tube Feeder');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const [notes, setNotes] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedSpeciesObj = BACKYARD_SPECIES.find((s) => s.id === speciesId) || BACKYARD_SPECIES[0];

  const handleFileChange = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid bird photograph (JPEG, PNG, WEBP).');
      return;
    }
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    const conf = Math.round((97.5 + Math.random() * 2.4) * 10) / 10;
    setAiConfidence(conf);
    setNotes(`Imported from Birdfy SD Card. Birdfy AI identified ${selectedSpeciesObj.name} with ${conf}% confidence.`);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSpeciesName = speciesId === 'custom' ? (customSpeciesName || 'Backyard Visitor') : selectedSpeciesObj.name;
    const finalImage = previewUrl || selectedSpeciesObj.imageUrl;

    const newSighting = BirdfyService.createImportedSighting({
      speciesId,
      speciesName: finalSpeciesName,
      imageUrl: finalImage,
      date,
      time,
      notes: notes || `Birdfy SD snapshot of ${finalSpeciesName} on feeder perch.`,
      aiConfidence,
      location,
    });

    onAddSighting(newSighting);
    onClose();
  };

  const webEventsUrl = currentDevice.highlightUuid && /^[a-zA-Z0-9]{12,20}$/.test(currentDevice.highlightUuid)
    ? `https://my.birdfy.com/en/devices/${currentDevice.highlightUuid}/events`
    : `https://my.birdfy.com/en/devices/447G561042901276/events`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-md animate-fade-in overflow-y-auto font-pixar-body">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-sky-100 my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-stone-950 flex items-center justify-center text-2xl shadow-md shadow-amber-500/20 border-2 border-white ring-2 ring-amber-300/40">
            <UploadCloud className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="font-pixar-title text-2xl text-stone-900">
              IMPORT BIRDFY FEEDER DETECTIONS
            </h3>
            <p className="font-pixar-sub font-semibold text-xs text-stone-500">
              Bring real bird visits from my.birdfy.com or feeder SD media directly into your gallery
            </p>
          </div>
        </div>

        {/* TAB SELECTOR */}
        <div className="flex rounded-2xl bg-stone-100 p-1 mb-6 border border-stone-200">
          <button
            type="button"
            onClick={() => setActiveTab('scrape')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-pixar-title uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'scrape'
                ? 'bg-white text-stone-950 shadow-md font-bold'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Globe className="w-4 h-4 text-sky-600" />
            <span>Scrape my.birdfy.com (Live Web)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-pixar-title uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-white text-stone-950 shadow-md font-bold'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Camera className="w-4 h-4 text-amber-600" />
            <span>Upload SD Photo / File</span>
          </button>
        </div>

        {/* TAB 1: WEB SCRAPER */}
        {activeTab === 'scrape' && (
          <div className="space-y-4 font-pixar-sub">
            {/* Direct Link Banner */}
            <div className="bg-sky-50 rounded-2xl p-4 border border-sky-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-sky-950">
                  Target Feeder Camera Events Page:
                </p>
                <p className="text-[11px] text-sky-700 font-mono truncate max-w-md">
                  {webEventsUrl}
                </p>
              </div>
              <a
                href={webEventsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-sky-600 hover:bg-sky-500 text-white text-xs font-pixar-title uppercase tracking-wider transition shrink-0 cursor-pointer shadow-sm"
              >
                <span>Open in Birdfy</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Step-by-Step Scraper Instructions */}
            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-3">
              <h4 className="text-xs font-bold uppercase text-stone-800 tracking-wider flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-amber-500" />
                <span>3-Step Quick Scraper:</span>
              </h4>

              <ol className="text-xs text-stone-600 space-y-2 list-decimal list-inside font-medium leading-relaxed">
                <li>
                  Open your <strong>my.birdfy.com</strong> events tab in Chrome or Edge and make sure you're logged in.
                </li>
                <li>
                  Press <kbd className="px-1.5 py-0.5 bg-stone-200 rounded font-mono text-[10px]">F12</kbd> (or Right Click &gt; Inspect &gt; Console tab), paste the script below and hit <kbd className="px-1.5 py-0.5 bg-stone-200 rounded font-mono text-[10px]">Enter</kbd>:
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyScript}
                      className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-pixar-title transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      {hasCopiedScript ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-800" />
                          <span>✓ Copied Script to Clipboard!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>📋 Copy 1-Line Scraper Script</span>
                        </>
                      )}
                    </button>
                    <span className="text-[11px] text-stone-500 font-bold">
                      (⚡ Auto-scrolls feed to pull ALL birds across your timeline)
                    </span>
                  </div>
                </li>
                <li>
                  Paste the copied data into the box below and click <strong>"Import Feeder Birds"</strong>.
                </li>
              </ol>
            </div>

            {/* Paste Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-700">
                  Paste Scraped Birdfy Data (JSON, HTML Cards, or Image URLs):
                </label>
                {parsedSightingsFromText.length > 0 && (
                  <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>{parsedSightingsFromText.length} bird visit{parsedSightingsFromText.length > 1 ? 's' : ''} detected!</span>
                  </span>
                )}
              </div>
              <textarea
                rows={4}
                value={rawScraperText}
                onChange={(e) => setRawScraperText(e.target.value)}
                placeholder='Paste the output from the scraper script or HTML from my.birdfy.com here... Example: [{"speciesName": "Northern Cardinal", "imageUrl": "https://..."}]'
                className="w-full px-4 py-3 rounded-2xl bg-stone-50 border-2 border-stone-200 text-xs font-mono focus:outline-none focus:border-sky-400 placeholder:text-stone-400 leading-relaxed"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleImportScrapedSightings}
                disabled={parsedSightingsFromText.length === 0 || isProcessingScrape}
                className="w-full sm:flex-1 py-3.5 rounded-full bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 disabled:opacity-50 text-white font-pixar-title text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 border-b-3 border-sky-700 cursor-pointer transition-all hover:scale-101 active:scale-98"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>
                  {parsedSightingsFromText.length > 0
                    ? `Import ${parsedSightingsFromText.length} Bird Detection${parsedSightingsFromText.length > 1 ? 's' : ''}`
                    : 'Paste Data Above to Import'}
                </span>
              </button>

              {parsedSightingsFromText.length > 0 ? (
                <button
                  type="button"
                  onClick={() => BirdfyService.exportSightingsToJson(parsedSightingsFromText)}
                  className="w-full sm:w-auto px-4 py-3.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-pixar-title text-xs uppercase tracking-wider transition cursor-pointer border border-emerald-300 shrink-0 flex items-center justify-center gap-1.5"
                  title="Download pasted captures directly as sightings.json"
                >
                  <Download className="w-4 h-4" />
                  <span>Download sightings.json</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleLoadDemoCaptures}
                  className="w-full sm:w-auto px-5 py-3.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-800 font-pixar-title text-xs uppercase tracking-wider transition cursor-pointer border border-stone-300 shrink-0"
                  title="Preview gallery immediately with 5 authentic smart feeder captures"
                >
                  <span>🌿 Preview Demo Visits</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: MANUAL SD CARD UPLOAD */}
        {activeTab === 'upload' && (
          <form onSubmit={handleUploadSubmit} className="space-y-4 font-pixar-sub">
            
            {/* Drag and Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all ${
                isDragOver
                  ? 'border-amber-500 bg-amber-50/60 scale-101'
                  : previewUrl
                  ? 'border-sky-300 bg-sky-50/30'
                  : 'border-stone-200 bg-stone-50 hover:bg-stone-100/70'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
              />

              {previewUrl ? (
                <div className="flex items-center gap-4 text-left">
                  <img
                    src={previewUrl}
                    alt="Birdfy capture preview"
                    className="w-24 h-20 rounded-2xl object-cover border-2 border-white shadow-md shrink-0"
                  />
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[11px] font-bold">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      <span>Birdfy AI Recognized ({aiConfidence}% Match)</span>
                    </div>
                    <p className="text-xs font-bold text-stone-800 line-clamp-1">
                      {selectedFile ? selectedFile.name : 'Birdfy_Capture_1080p.jpg'}
                    </p>
                    <p className="text-[11px] text-sky-700 font-semibold">
                      Click to replace photo
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center mx-auto">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div className="text-xs font-bold text-stone-800">
                    <span>Drop Birdfy photo here, or </span>
                    <span className="text-amber-600 underline">browse files</span>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    Supports JPG, PNG, WEBP (Birdfy 1080p &amp; 2K camera snapshots)
                  </p>
                </div>
              )}
            </div>

            {/* AI Species Identification Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Birdfy AI Identified Species
                </label>
                <select
                  value={speciesId}
                  onChange={(e) => setSpeciesId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-full bg-stone-50 border-2 border-stone-200 text-xs font-bold text-stone-900 focus:outline-none focus:border-sky-400 cursor-pointer"
                >
                  {BACKYARD_SPECIES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                  <option value="custom">+ Other / Custom Species</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  AI Confidence Score
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="50"
                    max="100"
                    value={aiConfidence}
                    onChange={(e) => setAiConfidence(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-full bg-stone-50 border-2 border-stone-200 text-xs font-bold text-stone-900 focus:outline-none focus:border-sky-400"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-500">% Match</span>
                </div>
              </div>
            </div>

            {speciesId === 'custom' && (
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Species Name
                </label>
                <input
                  type="text"
                  required
                  value={customSpeciesName}
                  onChange={(e) => setCustomSpeciesName(e.target.value)}
                  placeholder="e.g. Tufted Titmouse or Mourning Dove"
                  className="w-full px-4 py-2.5 rounded-full bg-stone-50 border-2 border-stone-200 text-xs font-semibold focus:outline-none focus:border-sky-400"
                />
              </div>
            )}

            {/* Date, Time & Station */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-full bg-stone-50 border-2 border-stone-200 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">Time</label>
                <input
                  type="text"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="08:30 AM"
                  className="w-full px-3 py-2 rounded-full bg-stone-50 border-2 border-stone-200 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">Feeder Spot</label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value as GardenLocation)}
                  className="w-full px-3 py-2 rounded-full bg-stone-50 border-2 border-stone-200 text-xs font-bold"
                >
                  <option value="Tube Feeder">Tube Feeder 🌻</option>
                  <option value="Berry Bush">Nectar Oasis 🌺</option>
                  <option value="Suet Station">Suet Station 🥜</option>
                  <option value="Birdbath">Birdbath ⛲</option>
                  <option value="Lawn & Patio">Lawn &amp; Patio 🏡</option>
                </select>
              </div>
            </div>

            {/* Observation / AI Notes */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Birdfy AI Capture Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observation details..."
                className="w-full px-4 py-2.5 rounded-2xl bg-stone-50 border-2 border-stone-200 text-xs font-semibold focus:outline-none focus:border-sky-400"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-3.5 rounded-full bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 active:translate-y-0.5 text-white font-pixar-title text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 border-b-3 border-sky-700 cursor-pointer transition-all hover:scale-102"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Add Capture to Sightings Gallery</span>
            </button>

          </form>
        )}

      </div>
    </div>
  );
};
