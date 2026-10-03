import React, { useState } from 'react';
import { BirdSighting, BirdfyDevice } from '../types';
import { BirdfyService, formatCentralDate } from '../services/birdfyService';
import { 
  Search, Filter, Heart, Eye, MapPin, Calendar, Plus, Sparkles, Star, 
  Sun, CloudSun, Trash2, Check, ChevronDown, ChevronUp, Camera, RefreshCw, 
  BatteryCharging, Wifi, UploadCloud, Settings, Zap, ShieldCheck, Clock
} from 'lucide-react';

export type DateFilterPreset = 'today' | 'yesterday' | 'week' | 'month' | 'all' | 'custom';

interface SightingsGalleryProps {
  sightings: BirdSighting[];
  onSelectSighting: (sighting: BirdSighting) => void;
  onOpenLogModal?: () => void;
  onToggleFavoriteSighting: (id: string) => void;
  onDeleteSighting: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  birdfyDevice: BirdfyDevice;
  isSyncingBirdfy: boolean;
  onSyncBirdfy: () => void;
  onOpenBirdfySettings: () => void;
  onOpenBirdfyImport: () => void;
  onOpenBirdfyInfo?: () => void;
  onClearAllSightings?: () => void;
  onApplySightings?: (sightings: BirdSighting[]) => void;
  onRefreshSightings?: () => void;
}

export const SightingsGallery: React.FC<SightingsGalleryProps> = ({
  sightings,
  onSelectSighting,
  onOpenLogModal,
  onToggleFavoriteSighting,
  onDeleteSighting,
  searchQuery,
  onSearchChange,
  birdfyDevice,
  isSyncingBirdfy,
  onSyncBirdfy,
  onOpenBirdfySettings,
  onOpenBirdfyImport,
  onOpenBirdfyInfo,
  onClearAllSightings,
  onApplySightings,
  onRefreshSightings,
}) => {
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [selectedBehavior, setSelectedBehavior] = useState<string>('All');
  const [selectedSource, setSelectedSource] = useState<'all' | 'birdfy' | 'manual'>('all');
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'count' | 'confidence'>('newest');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  // Date Filtering State (defaults to 'today')
  const [dateFilter, setDateFilter] = useState<DateFilterPreset>('today');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Calculate reference dates in Central Time (America/Chicago)
  const now = new Date();
  const todayStr = formatCentralDate(now);
  const yesterdayStr = formatCentralDate(new Date(now.getTime() - 86400000));
  const sevenDaysAgoStr = formatCentralDate(new Date(now.getTime() - 6 * 86400000));
  const thirtyDaysAgoStr = formatCentralDate(new Date(now.getTime() - 29 * 86400000));

  // Compute counts for each timeframe preset
  const countToday = sightings.filter((s) => s?.date === todayStr).length;
  const countYesterday = sightings.filter((s) => s?.date === yesterdayStr).length;
  const countWeek = sightings.filter((s) => s?.date && s.date >= sevenDaysAgoStr && s.date <= todayStr).length;
  const countMonth = sightings.filter((s) => s?.date && s.date >= thirtyDaysAgoStr && s.date <= todayStr).length;
  const countAll = sightings.length;

  const activeFilterCount = 
    (searchQuery ? 1 : 0) + 
    (selectedLocation !== 'All' ? 1 : 0) + 
    (selectedBehavior !== 'All' ? 1 : 0) + 
    (selectedSource !== 'all' ? 1 : 0) + 
    (onlyFavorites ? 1 : 0) +
    (dateFilter !== 'today' ? 1 : 0) +
    (dateFilter === 'custom' && (customStartDate || customEndDate) ? 1 : 0);

  const locations = ['All', 'Tube Feeder', 'Birdbath', 'Berry Bush', 'Suet Station', 'Lawn & Patio', 'Oak Branch'];
  const behaviors = ['All', 'Feeder Snack', 'Water Bathing', 'Perched & Singing', 'Foraging on Ground', 'Preening Feathers'];

  // Count birdfy captures
  const birdfyCapturesCount = sightings.filter((s) => s.birdfy?.isBirdfyCapture).length;

  // Filter logic with safe null/undefined handling and date matching
  const filteredSightings = sightings.filter((s) => {
    if (!s) return false;
    const query = (searchQuery || '').trim().toLowerCase();
    const species = (s.speciesName || '').toLowerCase();
    const notes = (s.notes || '').toLowerCase();
    const spottedBy = (s.spottedBy || '').toLowerCase();
    const loc = (s.location || '').toLowerCase();

    const matchesSearch = !query ||
      species.includes(query) ||
      notes.includes(query) ||
      spottedBy.includes(query) ||
      loc.includes(query);
    
    const matchesLoc = selectedLocation === 'All' || s.location === selectedLocation;
    const matchesBeh = selectedBehavior === 'All' || s.behavior === selectedBehavior;
    const matchesFav = !onlyFavorites || Boolean(s.isFavorite);
    
    const isBirdfy = Boolean(s.birdfy?.isBirdfyCapture);
    const matchesSource = 
      selectedSource === 'all' || 
      (selectedSource === 'birdfy' && isBirdfy) ||
      (selectedSource === 'manual' && !isBirdfy);

    const matchesDate = (() => {
      if (!s.date) return dateFilter === 'all';
      if (dateFilter === 'today') {
        return s.date === todayStr;
      }
      if (dateFilter === 'yesterday') {
        return s.date === yesterdayStr;
      }
      if (dateFilter === 'week') {
        return s.date >= sevenDaysAgoStr && s.date <= todayStr;
      }
      if (dateFilter === 'month') {
        return s.date >= thirtyDaysAgoStr && s.date <= todayStr;
      }
      if (dateFilter === 'custom') {
        if (customStartDate && s.date < customStartDate) return false;
        if (customEndDate && s.date > customEndDate) return false;
        return true;
      }
      if (dateFilter === 'all') {
        return true;
      }
      return true;
    })();

    return matchesSearch && matchesLoc && matchesBeh && matchesFav && matchesSource && matchesDate;
  }).sort((a, b) => {
    if (sortBy === 'newest') {
      const timeB = new Date(`${b.date} ${b.time || '12:00 PM'}`).getTime() || 0;
      const timeA = new Date(`${a.date} ${a.time || '12:00 PM'}`).getTime() || 0;
      return timeB - timeA;
    }
    if (sortBy === 'oldest') {
      const timeB = new Date(`${b.date} ${b.time || '12:00 PM'}`).getTime() || 0;
      const timeA = new Date(`${a.date} ${a.time || '12:00 PM'}`).getTime() || 0;
      return timeA - timeB;
    }
    if (sortBy === 'count') return (b.count || 1) - (a.count || 1);
    if (sortBy === 'confidence') {
      const confA = a.birdfy?.aiConfidence || 0;
      const confB = b.birdfy?.aiConfidence || 0;
      return confB - confA;
    }
    return 0;
  });

  return (
    <section id="gallery-section" className="py-12 bg-sky-50/40 border-b-2 border-sky-100 font-pixar-body">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* TOP HEADER WITH SEARCH & FILTER BUTTONS */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 text-amber-950 text-xs font-pixar-sub font-bold border-2 border-amber-200/80 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                <span>Birdfy Smart Feeder Sightings Log</span>
              </div>
              {onOpenBirdfyInfo && (
                <button
                  onClick={onOpenBirdfyInfo}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-stone-50 text-stone-800 text-xs font-pixar-sub font-bold border-2 border-amber-300 shadow-xs transition cursor-pointer hover:scale-102 active:scale-95"
                  title="Open Birdfy Feeder Status & Controls"
                >
                  <Camera className="w-3.5 h-3.5 text-amber-600" />
                  <span>Feeder Info ({birdfyDevice?.batteryPercent || 96}%)</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
                </button>
              )}
            </div>
            <h2 className="font-pixar-title text-3xl sm:text-4xl text-stone-900 tracking-wide drop-shadow-xs">
              WHO DROPPED BY 📷
            </h2>
            <p className="font-pixar-sub text-stone-600 text-sm sm:text-base mt-1.5 max-w-xl font-semibold">
              Photographic evidence and AI bird detections captured automatically by our Birdfy smart feeder camera!
            </p>
          </div>

          {/* Source Tabs & Search Toggle */}
          <div className="flex flex-wrap items-center gap-2.5">
            
            {/* Source Segment Filter */}
            <div className="flex items-center bg-white p-1 rounded-full border-2 border-stone-200 shadow-xs text-xs font-pixar-sub font-bold">
              <button
                onClick={() => setSelectedSource('all')}
                className={`px-3 py-1.5 rounded-full transition cursor-pointer ${
                  selectedSource === 'all' ? 'bg-sky-500 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                All ({sightings.length})
              </button>

              <button
                onClick={() => setSelectedSource('birdfy')}
                className={`px-3 py-1.5 rounded-full transition flex items-center gap-1.5 cursor-pointer ${
                  selectedSource === 'birdfy' ? 'bg-amber-400 text-stone-950 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Camera className="w-3 h-3" />
                <span>Birdfy Cam ({birdfyCapturesCount})</span>
              </button>

              <button
                onClick={() => setSelectedSource('manual')}
                className={`px-3 py-1.5 rounded-full transition cursor-pointer ${
                  selectedSource === 'manual' ? 'bg-sky-500 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Manual Logs ({sightings.length - birdfyCapturesCount})
              </button>
            </div>

            {/* Refresh / Reload from disk button */}
            {onRefreshSightings && (
              <button
                onClick={onRefreshSightings}
                className="px-3 py-2 rounded-full border-2 border-stone-200 bg-white hover:bg-stone-50 text-stone-700 hover:text-stone-950 transition-all flex items-center gap-1.5 cursor-pointer text-xs font-pixar-sub font-bold shrink-0 shadow-xs hover:scale-102"
                title="Reload latest detections from sightings.json"
              >
                <RefreshCw className="w-3.5 h-3.5 text-sky-600" />
                <span>Reload</span>
              </button>
            )}

            {/* Search & Filter Toggle Button Beside Header */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={`px-4 py-2 rounded-full border-2 transition-all flex items-center gap-2 cursor-pointer text-xs font-pixar-sub font-bold shrink-0 ${
                isSearchOpen || activeFilterCount > 0
                  ? 'bg-sky-500 text-white border-sky-600 shadow-md shadow-sky-500/20'
                  : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-200 shadow-xs'
              }`}
            >
              <Search className="w-4 h-4 stroke-[2.5]" />
              <span>{isSearchOpen ? 'Hide Filters' : 'Filters'}</span>
              {activeFilterCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-stone-950 font-bold text-[10px] uppercase shadow-xs">
                  {activeFilterCount} Active
                </span>
              )}
              {isSearchOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {/* Clear / Delete All Data Button */}
            {onClearAllSightings && sightings.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm('Clear all bird sightings from sightings.json? This permanently empties the dataset file and removes all detections.')) {
                    onClearAllSightings();
                  }
                }}
                className="px-3.5 py-2 rounded-full border-2 border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-900 transition-all flex items-center gap-1.5 cursor-pointer text-xs font-pixar-sub font-bold shrink-0 shadow-2xs hover:scale-102"
                title="Clear all bird sightings from sightings.json"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Delete All Data</span>
              </button>
            )}

          </div>
        </div>

        {/* COLLAPSIBLE CONTROLS & FILTERS PANEL */}
        {isSearchOpen && (
          <div className="bg-white p-5 rounded-3xl border-2 border-sky-100 shadow-md shadow-sky-900/5 space-y-4 transition-all">
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search by species, notes, or observer..."
                  className="w-full pl-10 pr-4 py-2.5 text-xs font-pixar-body font-semibold rounded-full bg-stone-50 border-2 border-stone-200 focus:outline-none focus:bg-white focus:border-sky-400 focus:ring-2 focus:ring-sky-200 text-stone-900 transition-all placeholder:text-stone-400"
                />
              </div>

              {/* Sort & Favorites Toggle */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setOnlyFavorites(!onlyFavorites)}
                  className={`px-4 py-2 rounded-full text-xs font-pixar-sub font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                    onlyFavorites
                      ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30 border-b-2 border-rose-700 scale-102'
                      : 'bg-stone-50 text-stone-700 hover:bg-stone-100 border border-stone-200'
                  }`}
                >
                  <Star className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-white' : ''}`} />
                  <span>Favorites Only</span>
                </button>

                <div className="flex items-center gap-2 text-xs font-pixar-sub font-bold text-stone-600">
                  <span>Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-stone-50 border-2 border-stone-200 text-stone-800 text-xs font-pixar-sub font-bold rounded-full px-4 py-2 focus:outline-none focus:border-sky-400 cursor-pointer"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="confidence">Highest AI Match</option>
                    <option value="count">Most Birds Counted</option>
                  </select>
                </div>
              </div>

            </div>

            {/* Backyard Feeding Location Filter Pills */}
            <div className="space-y-2 pt-3 border-t-2 border-stone-100">
              <span className="text-[11px] font-pixar-title text-stone-500 uppercase tracking-wider block">
                BACKYARD SPOT:
              </span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {locations.map((loc) => (
                  <button
                    key={loc}
                    onClick={() => setSelectedLocation(loc)}
                    className={`px-4 py-1.5 rounded-full text-xs font-pixar-sub font-bold transition-all whitespace-nowrap cursor-pointer ${
                      selectedLocation === loc
                        ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30 scale-102 border-b-2 border-sky-700'
                        : 'bg-stone-50 text-stone-700 hover:bg-stone-100 border border-stone-200 hover:scale-102'
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            {/* Bird Behavior Filter Pills */}
            <div className="space-y-2 pt-3 border-t-2 border-stone-100">
              <span className="text-[11px] font-pixar-title text-stone-500 uppercase tracking-wider block">
                BIRD ACTIVITY:
              </span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {behaviors.map((beh) => (
                  <button
                    key={beh}
                    onClick={() => setSelectedBehavior(beh)}
                    className={`px-4 py-1.5 rounded-full text-xs font-pixar-sub font-bold transition-all whitespace-nowrap cursor-pointer ${
                      selectedBehavior === beh
                        ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30 scale-102 border-b-2 border-sky-700'
                        : 'bg-stone-50 text-stone-700 hover:bg-stone-100 border border-stone-200 hover:scale-102'
                    }`}
                  >
                    {beh}
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* PROMINENT TIMEFRAME & DATE FILTER BAR */}
        <div className="bg-white rounded-3xl p-3 sm:p-4 border-2 border-sky-100 shadow-xs space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            
            {/* Timeframe Selection Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-50 text-sky-900 text-xs font-pixar-sub font-bold mr-1 shrink-0">
                <Calendar className="w-3.5 h-3.5 text-sky-600" />
                <span>Date:</span>
              </div>

              {/* Today (Default) */}
              <button
                onClick={() => setDateFilter('today')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-pixar-sub font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  dateFilter === 'today'
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25 scale-102 border-b-2 border-sky-700'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200'
                }`}
              >
                <span>Today</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${dateFilter === 'today' ? 'bg-sky-700 text-white' : 'bg-stone-200 text-stone-700'}`}>
                  {countToday}
                </span>
              </button>

              {/* Yesterday */}
              <button
                onClick={() => setDateFilter('yesterday')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-pixar-sub font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  dateFilter === 'yesterday'
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25 scale-102 border-b-2 border-sky-700'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200'
                }`}
              >
                <span>Yesterday</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${dateFilter === 'yesterday' ? 'bg-sky-700 text-white' : 'bg-stone-200 text-stone-700'}`}>
                  {countYesterday}
                </span>
              </button>

              {/* Past 7 Days */}
              <button
                onClick={() => setDateFilter('week')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-pixar-sub font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  dateFilter === 'week'
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25 scale-102 border-b-2 border-sky-700'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200'
                }`}
              >
                <span>Past 7 Days</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${dateFilter === 'week' ? 'bg-sky-700 text-white' : 'bg-stone-200 text-stone-700'}`}>
                  {countWeek}
                </span>
              </button>

              {/* Past 30 Days */}
              <button
                onClick={() => setDateFilter('month')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-pixar-sub font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  dateFilter === 'month'
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25 scale-102 border-b-2 border-sky-700'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200'
                }`}
              >
                <span>Past 30 Days</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${dateFilter === 'month' ? 'bg-sky-700 text-white' : 'bg-stone-200 text-stone-700'}`}>
                  {countMonth}
                </span>
              </button>

              {/* All Time */}
              <button
                onClick={() => setDateFilter('all')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-pixar-sub font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  dateFilter === 'all'
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25 scale-102 border-b-2 border-sky-700'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200'
                }`}
              >
                <span>All Time</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${dateFilter === 'all' ? 'bg-sky-700 text-white' : 'bg-stone-200 text-stone-700'}`}>
                  {countAll}
                </span>
              </button>

              {/* Custom Date Range */}
              <button
                onClick={() => setDateFilter('custom')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-pixar-sub font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  dateFilter === 'custom'
                    ? 'bg-amber-400 text-stone-950 shadow-md shadow-amber-400/25 scale-102 border-b-2 border-amber-600 font-extrabold'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-amber-700" />
                <span>Custom Range</span>
              </button>
            </div>

            {/* Showing Count Indicator & Quick View All Link */}
            <div className="text-xs font-pixar-sub font-bold text-stone-500 flex items-center gap-2 self-end lg:self-center">
              <span>
                Showing: <strong className="text-sky-700 text-sm font-pixar-title">{filteredSightings.length}</strong> of {sightings.length} detections
              </span>
              {dateFilter !== 'all' && (
                <button
                  onClick={() => {
                    setDateFilter('all');
                    setCustomStartDate('');
                    setCustomEndDate('');
                  }}
                  className="text-[11px] text-sky-600 hover:text-sky-800 underline font-semibold cursor-pointer"
                >
                  View All Time
                </button>
              )}
            </div>

          </div>

          {/* Custom Date Range Picker Accordion */}
          {dateFilter === 'custom' && (
            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-amber-200/60 bg-amber-50/60 p-3 rounded-2xl animate-fade-in">
              <div className="flex items-center gap-2">
                <span className="text-xs font-pixar-sub font-bold text-stone-700">From Date:</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-white border-2 border-amber-300 text-stone-900 rounded-xl px-3 py-1.5 text-xs font-pixar-sub font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-xs"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-pixar-sub font-bold text-stone-700">To Date:</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-white border-2 border-amber-300 text-stone-900 rounded-xl px-3 py-1.5 text-xs font-pixar-sub font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-xs"
                />
              </div>

              {(customStartDate || customEndDate) && (
                <button
                  onClick={() => {
                    setCustomStartDate('');
                    setCustomEndDate('');
                  }}
                  className="px-3 py-1.5 rounded-full bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 transition text-xs font-pixar-sub font-bold cursor-pointer shadow-xs"
                >
                  Clear Dates
                </button>
              )}

              <span className="text-xs font-pixar-sub text-stone-500 italic">
                {customStartDate && customEndDate 
                  ? `Showing detections from ${customStartDate} through ${customEndDate}` 
                  : customStartDate 
                  ? `Showing detections from ${customStartDate} onwards`
                  : customEndDate 
                  ? `Showing detections up to ${customEndDate}` 
                  : 'Pick start and end dates to filter your bird log.'}
              </span>
            </div>
          )}
        </div>

        {/* BIRD SIGHTINGS PHOTO GRID */}
        {filteredSightings.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border-2 border-sky-100 shadow-md space-y-4 font-pixar-sub">
            <div className="text-5xl animate-bounce">🪶</div>
            <div className="space-y-1">
              <h3 className="text-xl sm:text-2xl font-pixar-title text-stone-900">
                {sightings.length === 0
                  ? 'NO FEEDER DETECTIONS YET'
                  : dateFilter === 'today' && countToday === 0
                  ? "NO BIRDS SPOTTED TODAY YET"
                  : dateFilter === 'yesterday' && countYesterday === 0
                  ? 'NO DETECTIONS LOGGED YESTERDAY'
                  : 'NO SIGHTINGS MATCH YOUR FILTERS'}
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-stone-500 max-w-lg mx-auto">
                {sightings.length === 0
                  ? `Your feeder (SN: ${birdfyDevice.highlightUuid || '447G561042901276'}) is paired! Use the 1-click Web Scraper to pull events from my.birdfy.com, or preview sample feeder visits below.`
                  : dateFilter === 'today' && countToday === 0
                  ? `No feeder visits recorded so far for today (${todayStr}). You have ${countWeek} detections in the past 7 days and ${sightings.length} total across all time.`
                  : 'Try expanding your timeframe or resetting active filters to view all captured bird visits.'}
              </p>
            </div>

            {sightings.length === 0 ? (
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={onOpenBirdfyImport}
                  className="px-5 py-3 rounded-full bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white font-pixar-title text-xs uppercase tracking-wider transition cursor-pointer shadow-lg shadow-sky-500/25 flex items-center gap-2 hover:scale-102"
                >
                  <UploadCloud className="w-4 h-4 stroke-[2.5]" />
                  <span>📥 Scrape / Import from my.birdfy.com</span>
                </button>

                {onApplySightings && (
                  <button
                    onClick={() => onApplySightings(BirdfyService.getDemoSightings())}
                    className="px-5 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white font-pixar-title text-xs uppercase tracking-wider transition cursor-pointer shadow-md flex items-center gap-1.5 hover:scale-102"
                    title="Load 5 authentic feeder visits to preview Who Dropped By"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>🌿 Preview Demo Feeder Visits</span>
                  </button>
                )}

                <button
                  onClick={onOpenBirdfySettings}
                  className="px-4 py-3 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-800 font-pixar-title text-xs uppercase tracking-wider transition cursor-pointer border border-stone-300"
                >
                  ⚙️ Settings
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                {dateFilter === 'today' && countWeek > 0 && (
                  <button
                    onClick={() => setDateFilter('week')}
                    className="px-5 py-2.5 rounded-full bg-sky-500 hover:bg-sky-600 text-white text-xs font-pixar-title uppercase tracking-wider transition cursor-pointer shadow-md flex items-center gap-1.5 hover:scale-102"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Show Past 7 Days ({countWeek})</span>
                  </button>
                )}

                {dateFilter !== 'all' && (
                  <button
                    onClick={() => setDateFilter('all')}
                    className="px-5 py-2.5 rounded-full bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-pixar-title uppercase tracking-wider transition cursor-pointer shadow-md flex items-center gap-1.5 hover:scale-102"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Show All Time ({sightings.length})</span>
                  </button>
                )}

                {activeFilterCount > 0 && (
                  <button
                    onClick={() => {
                      setSelectedLocation('All');
                      setSelectedBehavior('All');
                      setSelectedSource('all');
                      setOnlyFavorites(false);
                      setDateFilter('all');
                      setCustomStartDate('');
                      setCustomEndDate('');
                      onSearchChange('');
                    }}
                    className="px-5 py-2.5 rounded-full bg-stone-100 text-stone-800 text-xs font-pixar-title hover:bg-stone-200 transition cursor-pointer border border-stone-300"
                  >
                    Reset All Filters
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSightings.map((s) => {
              const isBirdfy = s.birdfy?.isBirdfyCapture;

              return (
                <div
                  key={s.id}
                  onClick={() => onSelectSighting(s)}
                  className={`group bg-white rounded-3xl p-4 border-2 transition-all duration-300 cursor-pointer flex flex-col justify-between hover:-translate-y-1.5 ${
                    isBirdfy
                      ? 'border-sky-200/80 hover:border-amber-400 shadow-md hover:shadow-xl hover:shadow-sky-500/15'
                      : 'border-stone-100 hover:border-sky-300 shadow-md hover:shadow-xl'
                  }`}
                >
                  <div>
                    {/* Real Bird Photograph Container */}
                    <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-stone-900 border-2 border-stone-100">
                      <img
                        src={s.imageUrl}
                        alt={s.speciesName}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                      />

                      {/* Birdfy AI Confidence Badge */}
                      {isBirdfy && s.birdfy?.aiConfidence && (
                        <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-sky-950/85 text-amber-300 text-[10px] font-pixar-sub font-bold backdrop-blur-md flex items-center gap-1.5 shadow-md border border-amber-400/40">
                          <Sparkles className="w-3 h-3 text-amber-400 fill-amber-400" />
                          <span>{s.birdfy.aiConfidence}% AI Match</span>
                        </div>
                      )}

                      {!isBirdfy && (
                        <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-stone-900/85 text-white text-[11px] font-pixar-sub font-bold backdrop-blur-xs flex items-center gap-1.5 shadow-xs">
                          <MapPin className="w-3.5 h-3.5 text-amber-400" />
                          <span>{s.location}</span>
                        </div>
                      )}

                      {/* Card Action Buttons (Favorite + Delete) */}
                      <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                        {/* Delete Single Card Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Delete sighting of ${s.speciesName}?`)) {
                              onDeleteSighting(s.id);
                            }
                          }}
                          className="p-2.5 rounded-full bg-white/80 hover:bg-rose-500 text-stone-600 hover:text-white backdrop-blur-md shadow-md transition-all duration-200 cursor-pointer hover:scale-110"
                          title="Delete this sighting"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        {/* Star Favorite Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavoriteSighting(s.id);
                          }}
                          className={`p-2.5 rounded-full backdrop-blur-md shadow-md transition-all duration-200 cursor-pointer ${
                            s.isFavorite 
                              ? 'bg-rose-500 text-white scale-110 ring-2 ring-white' 
                              : 'bg-white/80 text-stone-600 hover:bg-white hover:text-rose-500 hover:scale-110'
                          }`}
                          title={s.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          <Star className={`w-4 h-4 ${s.isFavorite ? 'fill-white' : ''}`} />
                        </button>
                      </div>

                      {/* Quick Inspect Photo Overlay */}
                      <div className="absolute inset-0 bg-stone-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-xs">
                        <span className="px-5 py-2.5 rounded-full bg-white text-stone-900 font-pixar-title text-xs shadow-xl flex items-center gap-2 hover:bg-amber-400 transition transform scale-95 group-hover:scale-100 duration-200">
                          <Eye className="w-4 h-4 text-stone-900" />
                          <span>Inspect Birdfy Capture</span>
                        </span>
                      </div>
                    </div>

                    {/* Sighting Details */}
                    <div className="mt-4 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-pixar-title text-xl text-stone-900 group-hover:text-sky-600 transition-colors">
                          {s.speciesName}
                        </h3>
                        <span className="text-[11px] font-pixar-title uppercase tracking-wide text-amber-950 bg-gradient-to-r from-amber-200 to-amber-300 px-3 py-1 rounded-full border border-amber-400/60 shadow-2xs shrink-0">
                          x{s.count} {s.count === 1 ? 'bird' : 'birds'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs font-pixar-sub font-bold text-stone-500">
                        <CloudSun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>Weather: <strong className="text-sky-700 font-extrabold">{s.weather || s.temperature || 'Sunny & Pleasant'}</strong></span>
                      </div>

                      <p className="text-xs font-pixar-body font-semibold text-stone-600 line-clamp-2 leading-relaxed pt-1">
                        "{s.notes}"
                      </p>
                    </div>
                  </div>

                  {/* Card Footer with Birdfy Telemetry */}
                  <div className="mt-4 pt-3 border-t-2 border-stone-100 flex items-center justify-between text-[11px] font-pixar-sub font-semibold text-stone-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-500" />
                      <span>{s.date} at {s.time}</span>
                    </div>

                    {isBirdfy ? (
                      <span className="font-bold text-sky-900 bg-sky-100 border border-sky-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Camera className="w-3 h-3 text-sky-600" />
                        <span>Birdfy Cam</span>
                      </span>
                    ) : (
                      <span className="font-bold text-stone-800 bg-stone-100 px-2.5 py-0.5 rounded-full">
                        By {s.spottedBy}
                      </span>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
};
