import React, { useState } from 'react';
import { BirdfyDevice, BirdSighting } from '../types';
import { BirdfyService, extractBirdfyUuid } from '../services/birdfyService';
import { 
  X, Camera, Sun, BatteryCharging, Wifi, Sparkles, RefreshCw, 
  Settings, CheckCircle2, AlertCircle, Link, HardDrive, ShieldCheck,
  ExternalLink, Info, Key, User, Calendar, Share2, Trash2, Download, FileJson, Globe
} from 'lucide-react';

interface BirdfySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: BirdfyDevice;
  currentSightings?: BirdSighting[];
  onUpdateDevice: (updated: BirdfyDevice) => void;
  onTriggerManualSync: () => void;
  onApplySightings?: (sightings: BirdSighting[]) => void;
}

export const BirdfySettingsModal: React.FC<BirdfySettingsModalProps> = ({
  isOpen,
  onClose,
  device,
  currentSightings = [],
  onUpdateDevice,
  onTriggerManualSync,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState(device.name);
  const [model, setModel] = useState(device.model);
  const [deviceId, setDeviceId] = useState(device.id || 'birdfy-feeder-01');
  const [highlightUuid, setHighlightUuid] = useState(device.highlightUuid || '');
  const [recapUuid, setRecapUuid] = useState(device.recapUuid || '');
  const [dateRange, setDateRange] = useState(device.dateRange || 'last_7_days');
  const [batteryPercent, setBatteryPercent] = useState(device.batteryPercent);
  const [isSolarCharging, setIsSolarCharging] = useState(device.isSolarCharging);
  const [wifiSignal, setWifiSignal] = useState(device.wifiSignal);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(device.autoSyncEnabled);
  const [syncIntervalSeconds, setSyncIntervalSeconds] = useState(device.syncIntervalSeconds);
  const [webhookEndpoint, setWebhookEndpoint] = useState(device.webhookEndpoint || '');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isTestingPing, setIsTestingPing] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanHighlightUuid = extractBirdfyUuid(highlightUuid);
    const cleanRecapUuid = extractBirdfyUuid(recapUuid);

    const updated: BirdfyDevice = {
      ...device,
      id: deviceId,
      name,
      model,
      highlightUuid: cleanHighlightUuid,
      recapUuid: cleanRecapUuid,
      dateRange,
      batteryPercent,
      isSolarCharging,
      wifiSignal,
      autoSyncEnabled,
      syncIntervalSeconds: Number(syncIntervalSeconds),
      webhookEndpoint,
    };

    BirdfyService.saveDeviceState(updated);
    onUpdateDevice(updated);
    setStatusMessage(`Saved! Connected to "${name}".`);
    setIsError(false);
    
    setTimeout(() => {
      onClose();
      // If a new UUID was configured, trigger an immediate live sync
      if (cleanHighlightUuid) {
        onTriggerManualSync();
      }
    }, 600);
  };

  const handleTestUuid = async () => {
    const cleanHighlight = extractBirdfyUuid(highlightUuid);
    const cleanRecap = extractBirdfyUuid(recapUuid);

    if (!cleanHighlight && !cleanRecap) {
      setIsError(true);
      setStatusMessage('Please paste your Birdfy Highlight or Recap Share Link (or UUID).');
      return;
    }

    setIsTestingPing(true);
    setStatusMessage(null);
    setIsError(false);

    try {
      const result = await BirdfyService.fetchAnyBirdfyData(
        cleanHighlight || cleanRecap,
        cleanRecap || '',
        dateRange
      );
      setIsTestingPing(false);

      if (result.sightings.length > 0) {
        const uniqueSpecies = Array.from(new Set(result.sightings.map((s) => s.speciesName))).join(', ');
        const sourceName = result.source === 'recap' ? 'Birdfy Recap' : result.source === 'both' ? 'Birdfy Highlights & Recap' : 'Birdfy Highlights';
        setStatusMessage(`✓ Success! Connected to ${sourceName}. Found ${result.sightings.length} real bird detections: [${uniqueSpecies}]`);
      } else {
        setIsError(true);
        setStatusMessage('Connected to server, but no bird moments were found for this UUID/date range. Try choosing "All Time" or pasting your Recap link.');
      }
    } catch (err: any) {
      setIsTestingPing(false);
      setIsError(true);
      setStatusMessage(`Connection error: ${err.message || 'Could not reach Birdfy API'}`);
    }
  };

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

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 text-white flex items-center justify-center text-2xl shadow-md shadow-sky-500/20 border-2 border-white ring-2 ring-sky-300/40">
            <Camera className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-pixar-title text-2xl text-stone-900">
                CONNECT YOUR BIRDFY FEEDER
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-pixar-sub font-bold border border-emerald-300">
                ● Live Integration Active
              </span>
            </div>
            <p className="font-pixar-sub font-semibold text-xs text-stone-500">
              Powered by Birdfy Moments API (via homeassistant-birdfy protocol)
            </p>
          </div>
        </div>

        {/* Highlight UUID Instructions Banner */}
        <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-sky-50 to-amber-50/70 border-2 border-sky-200 text-xs font-pixar-sub text-stone-900 space-y-2">
          <div className="flex items-start gap-2">
            <Share2 className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-sky-950 block">How to get your feeder's live data:</span>
              <p className="text-stone-700 font-semibold leading-relaxed">
                1. Open your <strong>Birdfy Mobile App</strong>.<br />
                2. Go to <strong>Highlights / Moments</strong> and tap <strong>Share</strong>.<br />
                3. Copy the shared link (e.g. <code className="bg-white px-1 py-0.5 rounded border border-stone-200 text-sky-800 text-[11px]">https://highlight.birdfy.com/?uuid=YOUR_UUID</code>) and paste it below!
              </p>
            </div>
          </div>
          
          <div className="pt-1 flex flex-wrap items-center justify-end gap-2">
            <a
              href="https://my.birdfy.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 hover:text-sky-900 hover:underline bg-white px-3 py-1 rounded-full border border-sky-200 shadow-2xs"
            >
              <span>Birdfy Web Portal (my.birdfy.com)</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {statusMessage && (
          <div className={`mb-4 p-3.5 rounded-2xl border-2 text-xs font-pixar-sub font-bold flex items-center gap-2 ${
            isError 
              ? 'bg-rose-50 border-rose-200 text-rose-900' 
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}>
            {isError ? <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            <span>{statusMessage}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4 font-pixar-sub">
          
          {/* PRIMARY: Highlight UUID / Share Link */}
          <div className="p-4 rounded-2xl bg-amber-50/60 border-2 border-amber-300 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <Key className="w-4 h-4 text-amber-600" />
                <span>Birdfy Highlight Share Link or UUID (Required for Live Feeder Data)</span>
              </label>
              <span className="text-[10px] font-bold text-amber-900 bg-amber-200 px-2 py-0.5 rounded-full">
                Live Data Link
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={highlightUuid}
                onChange={(e) => setHighlightUuid(e.target.value)}
                placeholder="https://highlight.birdfy.com/?uuid=YOUR_UUID or YOUR_UUID"
                className="flex-1 px-4 py-2.5 rounded-full bg-white border-2 border-stone-200 text-xs font-mono font-semibold focus:outline-none focus:border-amber-500 text-stone-900"
              />
              <button
                type="button"
                onClick={handleTestUuid}
                disabled={isTestingPing}
                className="px-4 py-2.5 rounded-full bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-75 shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingPing ? 'animate-spin' : ''}`} />
                <span>{isTestingPing ? 'Validating...' : 'Verify & Test Feed'}</span>
              </button>
            </div>

            {/* Date Range Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Import Date Range
                </label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full px-4 py-2 rounded-full bg-white border border-stone-200 text-xs font-bold text-stone-900 focus:outline-none focus:border-sky-400 cursor-pointer"
                >
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="last_7_days">Last 7 Days (Recommended)</option>
                  <option value="last_14_days">Last 14 Days</option>
                  <option value="last_30_days">Last 30 Days</option>
                  <option value="this_week">This Week</option>
                  <option value="this_month">This Month</option>
                  <option value="all_time">All Time (Full History)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Monthly Recap UUID (Optional)
                </label>
                <input
                  type="text"
                  value={recapUuid}
                  onChange={(e) => setRecapUuid(e.target.value)}
                  placeholder="https://recap.birdfy.com/?uuid=..."
                  className="w-full px-4 py-2 rounded-full bg-white border border-stone-200 text-xs font-mono font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Feeder Device Name & Model */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Feeder Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ben's Backyard Feeder"
                className="w-full px-4 py-2.5 rounded-full bg-stone-50 border-2 border-stone-200 text-xs font-bold focus:outline-none focus:border-sky-400 text-stone-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Hardware Model
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-4 py-2.5 rounded-full bg-stone-50 border-2 border-stone-200 text-xs font-bold text-stone-900 focus:outline-none focus:border-sky-400 cursor-pointer"
              >
                <option value="Birdfy Feeder Cam 2 Pro (2K AI)">Birdfy Feeder Cam 2 Pro (2K AI)</option>
                <option value="Birdfy Feeder Cam Bamboo Edition">Birdfy Feeder Cam Bamboo Edition</option>
                <option value="Birdfy Hummee Pro (Nectar AI)">Birdfy Hummee Pro (Nectar AI)</option>
                <option value="Birdfy Smart AI Nest Box">Birdfy Smart AI Nest Box</option>
                <option value="Birdfy Feeder Classic 1080p">Birdfy Feeder Classic 1080p</option>
              </select>
            </div>
          </div>

          {/* Hardware & Power Status */}
          <div className="p-4 rounded-2xl bg-sky-50/60 border-2 border-sky-100 space-y-3">
            <span className="text-[11px] font-pixar-title text-sky-900 uppercase tracking-wide block">
              HARDWARE TELEMETRY &amp; POWER
            </span>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">Battery Level (%)</label>
                <div className="flex items-center gap-1.5">
                  <BatteryCharging className="w-4 h-4 text-emerald-600" />
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={batteryPercent}
                    onChange={(e) => setBatteryPercent(Number(e.target.value))}
                    className="w-20 px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-xs font-bold text-center"
                  />
                  <span className="font-bold text-stone-600">%</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">Solar Roof Panel</label>
                <button
                  type="button"
                  onClick={() => setIsSolarCharging(!isSolarCharging)}
                  className={`w-full px-3 py-1.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                    isSolarCharging
                      ? 'bg-amber-100 text-amber-950 border-amber-300'
                      : 'bg-stone-100 text-stone-500 border-stone-200'
                  }`}
                >
                  <Sun className={`w-3.5 h-3.5 ${isSolarCharging ? 'text-amber-500 fill-amber-400' : ''}`} />
                  <span>{isSolarCharging ? 'Solar Active (Charging)' : 'No Solar Connected'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Auto-Sync Rules */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Periodic Auto-Sync
              </label>
              <button
                type="button"
                onClick={() => setAutoSyncEnabled(!autoSyncEnabled)}
                className={`w-full px-4 py-2.5 rounded-full text-xs font-bold flex items-center justify-center gap-2 border transition cursor-pointer ${
                  autoSyncEnabled
                    ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
                    : 'bg-stone-100 text-stone-700 border-stone-200'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${autoSyncEnabled ? 'animate-spin' : ''}`} />
                <span>{autoSyncEnabled ? 'Auto-Sync Active' : 'Auto-Sync Paused'}</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Sync Interval
              </label>
              <select
                value={syncIntervalSeconds}
                onChange={(e) => setSyncIntervalSeconds(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-full bg-stone-50 border-2 border-stone-200 text-xs font-bold text-stone-900 cursor-pointer"
              >
                <option value="30">Every 30 seconds</option>
                <option value="60">Every 1 minute</option>
                <option value="300">Every 5 minutes</option>
                <option value="900">Every 15 minutes (Standard)</option>
              </select>
            </div>
          </div>

          {/* Global Dataset & Backup Export */}
          <div className="p-3.5 rounded-2xl bg-sky-50/80 border border-sky-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-pixar-sub">
            <div className="space-y-0.5">
              <span className="font-bold text-sky-950 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-sky-600" />
                <span>Global Dataset &amp; GitHub Sync</span>
              </span>
              <p className="text-sky-800 text-[11px] leading-tight">
                Peek &amp; Perch preloads <code className="bg-sky-100 px-1 py-0.5 rounded font-mono text-[10px]">public/data/sightings.json</code> for all web visitors.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                BirdfyService.exportSightingsToJson(currentSightings);
                setStatusMessage(`✓ Exported ${currentSightings.length} sightings to sightings.json!`);
                setIsError(false);
              }}
              className="px-3.5 py-1.5 rounded-full bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-xs hover:scale-102"
              title="Download your active sightings dataset to update public/data/sightings.json"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export sightings.json</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t-2 border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white font-pixar-title text-xs uppercase tracking-wider shadow-md shadow-sky-500/25 cursor-pointer transition-all hover:scale-102"
            >
              Save Feeder &amp; Start Live Sync
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
