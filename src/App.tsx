import React, { useState, useEffect } from 'react';
import { BirdSighting } from './types';
import { INITIAL_SIGHTINGS, BACKYARD_SPECIES } from './data/birdsData';

import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { SightingsGallery } from './components/SightingsGallery';
import { LogSightingModal } from './components/LogSightingModal';
import { SightingDetailModal } from './components/SightingDetailModal';
import { SpeciesCatalog } from './components/SpeciesCatalog';
import { GardenAnalytics } from './components/GardenAnalytics';
import { Footer } from './components/Footer';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'gallery' | 'species' | 'analytics'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Sightings state with localStorage persistence
  const [sightings, setSightings] = useState<BirdSighting[]>(() => {
    try {
      const saved = localStorage.getItem('peep_perch_sightings');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse saved sightings from localStorage', e);
    }
    return INITIAL_SIGHTINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('peep_perch_sightings', JSON.stringify(sightings));
    } catch (e) {
      console.warn('Failed to save sightings to localStorage', e);
    }
  }, [sightings]);

  // Modal states
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [inspectedSighting, setInspectedSighting] = useState<BirdSighting | null>(null);

  // Add new sighting
  const handleAddSighting = (newSighting: BirdSighting) => {
    setSightings((prev) => [newSighting, ...prev]);
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
      
      {/* NAVBAR */}
      <Navbar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onGoHome={handleGoHome}
        onOpenLogModal={() => setIsLogModalOpen(true)}
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

      {/* LOG SIGHTING MODAL */}
      <LogSightingModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        onAddSighting={handleAddSighting}
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
