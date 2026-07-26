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
  const [activeTab, setActiveTab] = useState<'gallery' | 'species' | 'analytics'>('gallery');
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

  const inspectedSpeciesObj = inspectedSighting 
    ? BACKYARD_SPECIES.find((sp) => sp.name === inspectedSighting.speciesName || sp.id === inspectedSighting.speciesId)
    : undefined;

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-stone-900 font-sans selection:bg-amber-300 selection:text-stone-900 flex flex-col justify-between">
      
      {/* NAVBAR */}
      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 300, behavior: 'smooth' });
        }}
        onOpenLogModal={() => setIsLogModalOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* HERO SECTION */}
      <HeroSection
        onOpenLogModal={() => setIsLogModalOpen(true)}
        onExploreGallery={() => {
          setActiveTab('gallery');
          const el = document.getElementById('gallery-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* MAIN CONTENT WORKSPACE */}
      <main className="flex-1">
        {activeTab === 'gallery' && (
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
        onTabChange={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
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
