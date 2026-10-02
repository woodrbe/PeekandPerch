import React, { useState, useEffect, useRef } from 'react';
import { BirdSighting, BirdfyDevice } from './types';
import { INITIAL_SIGHTINGS, BACKYARD_SPECIES } from './data/birdsData';
import { BirdfyService } from './services/birdfyService';

import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { SightingsGallery } from './components/SightingsGallery';
import { LogSightingModal } from './components/LogSightingModal';
import { SightingDetailModal } from './components/SightingDetailModal';
import { SpeciesCatalog } from './components/SpeciesCatalog';
import { GardenAnalytics } from './components/GardenAnalytics';
import { Footer } from './components/Footer';
import { BirdfySettingsModal } from './components/BirdfySettingsModal';
import { BirdfyImportModal } from './components/BirdfyImportModal';
import { BirdfyFeederModal } from './components/BirdfyFeederModal';
import { Sparkles, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'gallery' | 'species' | 'analytics'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [isBirdfyFeederModalOpen, setIsBirdfyFeederModalOpen] = useState(false);
  
  // Sightings state with localStorage persistence: strictly real bird feeder sightings only
  const [sightings, setSightings] = useState<BirdSighting[]>(() => {
    try {
      const saved = localStorage.getItem('peep_perch_sightings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Permanently strip out all sample/mock data and clean up duplicates
          const realOnly = BirdfyService.filterOnlyRealFeederSightings(parsed);
          return BirdfyService.cleanAndDeduplicateSightings(realOnly);
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved sightings from localStorage', e);
    }
    return [];
  });

  // Permanently delete all bird data (clears sample/cached data)
  const handleClearAllSightings = () => {
    setSightings([]);
    try {
      localStorage.removeItem('peep_perch_sightings');
    } catch (e) {
      console.warn('Failed to remove sightings from storage', e);
    }
  };

  // Track latest sightings in a ref to prevent stale closures in sync intervals
  const sightingsRef = useRef(sightings);
  useEffect(() => {
    sightingsRef.current = sightings;
  }, [sightings]);

  // Preload shared feeder data from public/data/sightings.json on mount (for all web clients/devices)
  useEffect(() => {
    let isMounted = true;
    BirdfyService.fetchSharedSightings().then((sharedSightings) => {
      if (!isMounted || sharedSightings.length === 0) return;
      setSightings((prev) => {
        const { merged } = BirdfyService.mergeSightings(prev, sharedSightings);
        return merged;
      });
    });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('peep_perch_sightings', JSON.stringify(sightings));
    } catch (e) {
      console.warn('Failed to save sightings to localStorage', e);
    }
  }, [sightings]);

  // Birdfy Feeder State (Auto-sync strictly disabled)
  const [birdfyDevice, setBirdfyDevice] = useState<BirdfyDevice>(() => {
    const dev = BirdfyService.getDevice();
    return { ...dev, autoSyncEnabled: false };
  });
  const [isSyncingBirdfy, setIsSyncingBirdfy] = useState(false);
  const [syncToastMessage, setSyncToastMessage] = useState<string | null>(null);

  // Guarantee auto-sync is disabled across sessions and localStorage
  useEffect(() => {
    if (birdfyDevice.autoSyncEnabled) {
      const disabled = { ...birdfyDevice, autoSyncEnabled: false };
      setBirdfyDevice(disabled);
      BirdfyService.saveDeviceState(disabled);
    }
  }, []);

  // Modal states
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isBirdfySettingsOpen, setIsBirdfySettingsOpen] = useState(false);
  const [isBirdfyImportOpen, setIsBirdfyImportOpen] = useState(false);
  const [inspectedSighting, setInspectedSighting] = useState<BirdSighting | null>(null);

  // Birdfy Feeder Sync Function
  // NOTE: Turned off per user request since API sync does not return data.
  // Kept fully implemented in project for future use / reference.
  const IS_BIRDFY_SYNC_ENABLED = false;

  const handleSyncBirdfy = async () => {
    if (!IS_BIRDFY_SYNC_ENABLED) {
      console.log('Birdfy direct sync function is currently turned off. Use Web Scraper instead.');
      return;
    }
    if (isSyncingBirdfy) return;
    setIsSyncingBirdfy(true);
    try {
      const result = await BirdfyService.syncRecentCaptures(sightingsRef.current);
      // Overwrite/update sightings with the cleanly merged and deduplicated list
      setSightings(result.allSightings);
      setBirdfyDevice(result.updatedDevice);
      setSyncToastMessage(result.message);
      setTimeout(() => {
        setSyncToastMessage(null);
      }, 5000);
    } catch (err) {
      console.error('Failed to sync Birdfy captures', err);
    } finally {
      setIsSyncingBirdfy(false);
    }
  };

  // Auto-sync timer (turned off while direct sync is disabled)
  useEffect(() => {
    if (!IS_BIRDFY_SYNC_ENABLED) return;
    if (!birdfyDevice.autoSyncEnabled || birdfyDevice.syncIntervalSeconds <= 0) return;
    const interval = setInterval(() => {
      handleSyncBirdfy();
    }, birdfyDevice.syncIntervalSeconds * 1000);
    return () => clearInterval(interval);
  }, [birdfyDevice.autoSyncEnabled, birdfyDevice.syncIntervalSeconds]);

  // Apply sightings directly into app state with intelligent deduplicating merge
  const handleApplySightings = (newSightings: BirdSighting[]) => {
    setSightings((prev) => {
      const { merged } = BirdfyService.mergeSightings(prev, newSightings);
      return merged;
    });
    setSyncToastMessage(`Loaded ${newSightings.length} detection${newSightings.length > 1 ? 's' : ''} from Birdfy Feeder!`);
    setTimeout(() => {
      setSyncToastMessage(null);
    }, 5000);
  };

  // Add new sighting (manual or imported) with deduplication
  const handleAddSighting = (newSighting: BirdSighting) => {
    setSightings((prev) => {
      const { merged } = BirdfyService.mergeSightings(prev, [newSighting]);
      return merged;
    });
    setActiveTab('gallery');
    window.scrollTo({ top: 500, behavior: 'smooth' });
  };

  // Toggle favorite star
  const handleToggleFavoriteSighting = (id: string) => {
    setSightings((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isFavorite: !s.isFavorite } : s))
    );
    if (inspectedSighting && inspectedSighting.id === id) {
      setInspectedSighting((prev) => (prev ? { ...prev, isFavorite: !prev.isFavorite } : null));
    }
  };

  // Delete sighting
  const handleDeleteSighting = (id: string) => {
    setSightings((prev) => prev.filter((s) => s.id !== id));
  };

  // Lightbox Navigation
  const currentInspectIndex = inspectedSighting 
    ? sightings.findIndex((s) => s.id === inspectedSighting.id) 
    : -1;

  const handleNextSighting = () => {
    if (currentInspectIndex >= 0 && currentInspectIndex < sightings.length - 1) {
      setInspectedSighting(sightings[currentInspectIndex + 1]);
    } else if (sightings.length > 0) {
      setInspectedSighting(sightings[0]);
    }
  };

  const handlePrevSighting = () => {
    if (currentInspectIndex > 0) {
      setInspectedSighting(sightings[currentInspectIndex - 1]);
    } else if (sightings.length > 0) {
      setInspectedSighting(sightings[sightings.length - 1]);
    }
  };

  const scrollToActiveSection = (tab: 'home' | 'gallery' | 'species' | 'analytics') => {
    if (tab === 'home') {
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
        const topEl = document.getElementById('app-top');
        if (topEl) {
          topEl.scrollIntoView({ behavior: 'smooth' });
        }
      } catch {
        window.scrollTo(0, 0);
      }
      return;
    }

    const sectionMap: Record<string, string> = {
      gallery: 'gallery-section',
      species: 'species-section',
      analytics: 'analytics-section',
    };
    const targetId = sectionMap[tab];

    const doScroll = () => {
      const el = document.getElementById(targetId);
      if (el) {
        const yOffset = -85;
        const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      }
    };

    doScroll();
    requestAnimationFrame(doScroll);
    setTimeout(doScroll, 80);
  };

  const handleGoHome = () => {
    setActiveTab('home');
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
      const topEl = document.getElementById('app-top');
      if (topEl) {
        topEl.scrollIntoView({ behavior: 'smooth' });
      }
    } catch {
      window.scrollTo(0, 0);
    }
  };

  const handleTabChange = (tab: 'home' | 'gallery' | 'species' | 'analytics') => {
    setActiveTab(tab);
    scrollToActiveSection(tab);
  };

  useEffect(() => {
    scrollToActiveSection(activeTab);
  }, [activeTab]);

  const inspectedSpeciesObj = inspectedSighting 
    ? BACKYARD_SPECIES.find((sp) => sp.name === inspectedSighting.speciesName || sp.id === inspectedSighting.speciesId)
    : undefined;

  return (
    <div id="app-top" className="min-h-screen bg-sky-50/20 text-stone-900 font-pixar-body selection:bg-amber-300 selection:text-stone-900 flex flex-col justify-between">
      
      {/* GLOBAL TOAST NOTIFICATION FOR BIRDFY FEEDS */}
      {syncToastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce max-w-md">
          <div className="bg-stone-900/95 text-white px-5 py-3.5 rounded-2xl shadow-2xl border-2 border-amber-400 flex items-center gap-3 backdrop-blur-md">
            <div className="w-8 h-8 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center font-bold text-sm shrink-0">
              📸
            </div>
            <div className="text-xs font-pixar-sub">
              <span className="font-bold text-amber-300 block">Birdfy AI Feeder Alert</span>
              <span className="font-semibold text-stone-200">{syncToastMessage}</span>
            </div>
          </div>
        </div>
      )}

      {/* NAVBAR */}
      <Navbar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onGoHome={handleGoHome}
        onOpenLogModal={() => setIsLogModalOpen(true)}
        birdfyStatus={birdfyDevice.status}
        isSyncingBirdfy={isSyncingBirdfy}
        onSyncBirdfy={handleSyncBirdfy}
        onOpenBirdfySettings={() => setIsBirdfySettingsOpen(true)}
        onOpenBirdfyInfo={() => setIsBirdfyFeederModalOpen(true)}
      />

      {/* HERO SECTION */}
      <HeroSection
        onOpenLogModal={() => setIsLogModalOpen(true)}
        onExploreGallery={() => handleTabChange('gallery')}
      />

      {/* MAIN CONTENT WORKSPACE */}
      <main className="flex-1">
        {(activeTab === 'home' || activeTab === 'gallery') && (
          <SightingsGallery
            sightings={sightings}
            onSelectSighting={(s) => setInspectedSighting(s)}
            onOpenLogModal={() => setIsLogModalOpen(true)}
            onToggleFavoriteSighting={handleToggleFavoriteSighting}
            onDeleteSighting={handleDeleteSighting}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            birdfyDevice={birdfyDevice}
            isSyncingBirdfy={isSyncingBirdfy}
            onSyncBirdfy={handleSyncBirdfy}
            onOpenBirdfySettings={() => setIsBirdfySettingsOpen(true)}
            onOpenBirdfyImport={() => setIsBirdfyImportOpen(true)}
            onOpenBirdfyInfo={() => setIsBirdfyFeederModalOpen(true)}
            onClearAllSightings={handleClearAllSightings}
            onApplySightings={handleApplySightings}
          />
        )}

        {activeTab === 'species' && (
          <SpeciesCatalog
            sightings={sightings}
            onOpenLogModal={() => setIsLogModalOpen(true)}
          />
        )}

        {activeTab === 'analytics' && (
          <GardenAnalytics
            sightings={sightings}
            onOpenLogModal={() => setIsLogModalOpen(true)}
          />
        )}
      </main>

      {/* FOOTER */}
      <Footer
        onTabChange={handleTabChange}
        onOpenLogModal={() => setIsLogModalOpen(true)}
      />

      {/* MANUAL LOG SIGHTING MODAL */}
      <LogSightingModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        onAddSighting={handleAddSighting}
      />

      {/* BIRDFY DEVICE SETTINGS MODAL */}
      <BirdfySettingsModal
        isOpen={isBirdfySettingsOpen}
        onClose={() => setIsBirdfySettingsOpen(false)}
        device={birdfyDevice}
        currentSightings={sightings}
        onUpdateDevice={(updated) => setBirdfyDevice({ ...updated, autoSyncEnabled: false })}
        onTriggerManualSync={handleSyncBirdfy}
        onApplySightings={handleApplySightings}
        onClearAllSightings={handleClearAllSightings}
      />

      {/* BIRDFY SD CARD / MEDIA IMPORT MODAL */}
      <BirdfyImportModal
        isOpen={isBirdfyImportOpen}
        onClose={() => setIsBirdfyImportOpen(false)}
        onAddSighting={handleAddSighting}
        onApplySightings={handleApplySightings}
        device={birdfyDevice}
        currentSightings={sightings}
      />

      {/* BIRDFY SMART FEEDER POPUP MODAL */}
      <BirdfyFeederModal
        isOpen={isBirdfyFeederModalOpen}
        onClose={() => setIsBirdfyFeederModalOpen(false)}
        device={birdfyDevice}
        sightingsCount={sightings.filter(s => s.source === 'birdfy' || s.birdfy).length}
        isSyncing={isSyncingBirdfy}
        onSync={handleSyncBirdfy}
        onOpenScraper={() => setIsBirdfyImportOpen(true)}
        onLoadDemo={() => handleApplySightings(BirdfyService.getDemoSightings())}
        onOpenSettings={() => setIsBirdfySettingsOpen(true)}
        onClearData={handleClearAllSightings}
      />

      {/* PHOTO LIGHTBOX SIGHTING DETAIL MODAL */}
      <SightingDetailModal
        sighting={inspectedSighting}
        speciesObj={inspectedSpeciesObj}
        onClose={() => setInspectedSighting(null)}
        onDeleteSighting={handleDeleteSighting}
        onToggleFavorite={handleToggleFavoriteSighting}
        onNextSighting={handleNextSighting}
        onPrevSighting={handlePrevSighting}
      />

    </div>
  );
}
