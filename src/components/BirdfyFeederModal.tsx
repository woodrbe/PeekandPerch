import React from 'react';
import { BirdfyDevice } from '../types';
import { 
  X, Camera, BatteryCharging, Sun, Wifi, RefreshCw, UploadCloud, 
  Settings, ExternalLink, Sparkles, Trash2, Key, ShieldCheck, Activity
} from 'lucide-react';

interface BirdfyFeederModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: BirdfyDevice;
  sightingsCount: number;
  isSyncing: boolean;
  onSync: () => void;
  onOpenScraper: () => void;
  onLoadDemo: () => void;
  onOpenSettings: () => void;
  onClearData?: () => void;
}

export const BirdfyFeederModal: React.FC<BirdfyFeederModalProps> = ({
  isOpen,
  onClose,
  device,
  sightingsCount,
  isSyncing,
  onSync,
  onOpenScraper,
  onLoadDemo,
  onOpenSettings,
  onClearData,
}) => {
  if (!isOpen) return null;

  const liveStreamUrl = device.highlightUuid && /^[a-zA-Z0-9]{12,20}$/.test(device.highlightUuid)
    ? `https://my.birdfy.com/en/devices/${device.highlightUuid}/events`
    : 'https://my.birdfy.com';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-md animate-fade-in overflow-y-auto font-pixar-body">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-sky-100 my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 transition cursor-pointer"
          title="Close Feeder Info"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-stone-950 flex items-center justify-center text-2xl shadow-lg shadow-amber-500/25 border-2 border-white ring-2 ring-amber-300/40 shrink-0">
            <Camera className="w-7 h-7 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-pixar-sub font-bold border border-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Feeder Online &amp; Active</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600 text-[11px] font-mono border border-stone-200">
                {device.model}
              </span>
            </div>
            <h3 className="font-pixar-title text-2xl sm:text-3xl text-stone-900 tracking-wide">
              {device.name.toUpperCase()}
            </h3>
          </div>
        </div>

        {/* Feeder Telemetry Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 font-pixar-sub">
          
          {/* Battery & Solar */}
          <div className="bg-sky-50/70 border border-sky-200/80 rounded-2xl p-3.5 space-y-1">
            <div className="flex items-center gap-1.5 text-sky-800 text-xs font-bold">
              <BatteryCharging className="w-4 h-4 text-emerald-600" />
              <span>Battery</span>
            </div>
            <p className="text-lg font-pixar-title text-stone-900">
              {device.batteryPercent}%
            </p>
            {device.isSolarCharging && (
              <p className="text-[11px] font-bold text-amber-600 flex items-center gap-1">
                <Sun className="w-3 h-3 fill-amber-500" /> Solar Charging
              </p>
            )}
          </div>

          {/* WiFi Signal */}
          <div className="bg-sky-50/70 border border-sky-200/80 rounded-2xl p-3.5 space-y-1">
            <div className="flex items-center gap-1.5 text-sky-800 text-xs font-bold">
              <Wifi className="w-4 h-4 text-sky-600" />
              <span>WiFi Signal</span>
            </div>
            <p className="text-lg font-pixar-title text-stone-900">
              {device.wifiSignal}
            </p>
            <p className="text-[11px] text-stone-500 font-semibold">
              Live streaming ready
            </p>
          </div>

          {/* Visits Recorded */}
          <div className="bg-sky-50/70 border border-sky-200/80 rounded-2xl p-3.5 space-y-1">
            <div className="flex items-center gap-1.5 text-sky-800 text-xs font-bold">
              <Activity className="w-4 h-4 text-indigo-600" />
              <span>Detections</span>
            </div>
            <p className="text-lg font-pixar-title text-stone-900">
              {sightingsCount} Visits
            </p>
            <p className="text-[11px] text-stone-500 font-semibold">
              In gallery
            </p>
          </div>

          {/* Sync Status */}
          <div className="bg-sky-50/70 border border-sky-200/80 rounded-2xl p-3.5 space-y-1">
            <div className="flex items-center gap-1.5 text-sky-800 text-xs font-bold">
              <RefreshCw className="w-4 h-4 text-amber-600" />
              <span>Sync Status</span>
            </div>
            <p className="text-xs font-bold text-stone-600 truncate" title="Direct sync is turned off; use Scraper">
              Turned Off
            </p>
            <p className="text-[11px] text-amber-700 font-semibold">
              Use Web Scraper
            </p>
          </div>

        </div>

        {/* Paired Device Serial & AI Specs */}
        <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 mb-6 font-pixar-sub space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-500" />
              <span className="font-bold text-stone-700">Paired Feeder Serial Number:</span>
              <code className="px-2 py-0.5 rounded-md bg-stone-200 text-stone-900 font-mono font-bold text-[11px]">
                {device.highlightUuid || '447G561042901276'}
              </code>
            </div>
            <span className="text-stone-500 text-[11px]">
              AI Engine: <strong className="text-stone-800">{device.aiModelVersion || 'Netvue BirdAI v4.2'}</strong>
            </span>
          </div>
        </div>

        {/* Action Buttons Section */}
        <div className="space-y-3 font-pixar-sub">
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
            Feeder Controls &amp; Import Actions
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Scrape / Import from my.birdfy.com (Primary Active Action) */}
            <button
              onClick={() => {
                onClose();
                onOpenScraper();
              }}
              className="py-3 px-4 rounded-2xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white font-pixar-title text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md shadow-sky-500/25 cursor-pointer hover:scale-101 active:scale-98"
            >
              <UploadCloud className="w-4 h-4 stroke-[2.5]" />
              <span>📥 Scrape my.birdfy.com</span>
            </button>

            {/* Sync Feeder Button (Turned Off - Retained in Project) */}
            <button
              onClick={() => {
                // Preserved in project for future use
                onSync();
              }}
              disabled={true}
              className="py-3 px-4 rounded-2xl bg-stone-100 text-stone-400 font-pixar-title text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 border border-stone-200 cursor-not-allowed opacity-60"
              title="Feeder direct sync is currently turned off. Use 'Scrape my.birdfy.com' above to fetch visits."
            >
              <RefreshCw className="w-4 h-4 text-stone-400" />
              <span>⚡ Sync (Turned Off)</span>
            </button>

            {/* Watch Live Web Stream on my.birdfy.com */}
            <a
              href={liveStreamUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-4 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-pixar-title text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 border border-stone-200 cursor-pointer hover:scale-101"
            >
              <span>📺 Open Live Stream</span>
              <ExternalLink className="w-3.5 h-3.5 text-stone-500" />
            </a>

            {/* Pair & Device Settings */}
            <button
              onClick={() => {
                onClose();
                onOpenSettings();
              }}
              className="py-3 px-4 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-pixar-title text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 border border-stone-200 cursor-pointer hover:scale-101"
            >
              <Settings className="w-4 h-4 text-stone-600" />
              <span>⚙️ Feeder Settings</span>
            </button>

          </div>

          {/* Bottom Optional Row: Preview Demo / Clear Data */}
          <div className="flex flex-wrap items-center justify-between pt-2 border-t border-stone-100 text-xs">
            <button
              onClick={() => {
                onLoadDemo();
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-emerald-700 hover:bg-emerald-50 font-bold transition cursor-pointer"
              title="Preview gallery with 5 authentic smart feeder detections"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Preview Demo Feeder Visits</span>
            </button>

            {onClearData && sightingsCount > 0 && (
              <button
                onClick={() => {
                  if (window.confirm('Clear all bird sightings from sightings.json? This permanently empties the dataset file.')) {
                    onClearData();
                    onClose();
                  }
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-rose-600 hover:bg-rose-50 font-bold transition cursor-pointer"
                title="Clear sightings.json data file"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear sightings.json</span>
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
