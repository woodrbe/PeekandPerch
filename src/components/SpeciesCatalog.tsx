import React, { useState } from 'react';
import { BirdSpecies, BirdSighting } from '../types';
import { BACKYARD_SPECIES } from '../data/birdsData';
import { BookOpen, Volume2, ChevronLeft, ChevronRight, CheckCircle2, Clock } from 'lucide-react';

interface SpeciesCatalogProps {
  sightings: BirdSighting[];
  onOpenLogModal?: () => void;
  onSelectSpeciesFilter?: (speciesName: string) => void;
}

const ITEMS_PER_PAGE = 9;

export const SpeciesCatalog: React.FC<SpeciesCatalogProps> = ({
  sightings,
  onSelectSpeciesFilter,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSpecies, setSelectedSpecies] = useState<BirdSpecies>(BACKYARD_SPECIES[0]);

  // Matching helper function to count sightings for a given species
  const getSpeciesSightingCount = (species: BirdSpecies): number => {
    const normTarget = species.name.toLowerCase().replace(/\s*\(.*\)$/, '').trim();
    return sightings.filter((s) => {
      const sName = s.speciesName.toLowerCase().replace(/\s*\(.*\)$/, '').trim();
      return (
        s.speciesId === species.id ||
        sName === normTarget ||
        sName.startsWith(normTarget) ||
        normTarget.startsWith(sName)
      );
    }).length;
  };

  const totalSpecies = BACKYARD_SPECIES.length;
  const totalPages = Math.ceil(totalSpecies / ITEMS_PER_PAGE);

  // Calculate slice range for current page
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentSpeciesList = BACKYARD_SPECIES.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Overall stats
  const totalSightedCount = BACKYARD_SPECIES.filter((sp) => getSpeciesSightingCount(sp) > 0).length;

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const selectedCount = getSpeciesSightingCount(selectedSpecies);
  const isSelectedSighted = selectedCount > 0;

  return (
    <section id="species-section" className="py-12 bg-sky-50/40 border-b-2 border-sky-100 font-pixar-body">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* HEADER & METRICS */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-100 text-sky-950 text-xs font-pixar-sub font-bold mb-3 border-2 border-sky-200 shadow-xs">
              <BookOpen className="w-3.5 h-3.5 text-sky-600" />
              <span>Meet the Locals & Field Guide</span>
            </div>
            <h2 className="font-pixar-title text-3xl sm:text-4xl text-stone-900 tracking-wide drop-shadow-xs">
              MEET THE LOCALS 📖
            </h2>
            <p className="font-pixar-sub text-stone-600 text-sm sm:text-base mt-1.5 max-w-xl font-semibold">
              Get to know the common birds of our area! Sighted visitors appear in vibrant color, while unspotted species are in grey tones.
            </p>
          </div>

          {/* Sighting Progress Pill */}
          <div className="inline-flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl border-2 border-stone-200 shadow-xs text-xs font-pixar-sub self-start md:self-auto">
            <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{totalSightedCount} Spotted in Yard</span>
            </div>
            <span className="text-stone-300">|</span>
            <div className="flex items-center gap-1.5 text-stone-500 font-semibold">
              <Clock className="w-4 h-4 text-stone-400" />
              <span>{totalSpecies - totalSightedCount} Yet to Visit</span>
            </div>
          </div>
        </div>

        {/* SPECIES GRID CARDS (MAX 9 PER PAGE) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentSpeciesList.map((species) => {
            const countInJournal = getSpeciesSightingCount(species);
            const isSighted = countInJournal > 0;
            const isSelected = selectedSpecies.id === species.id;

            return (
              <div
                key={species.id}
                onClick={() => setSelectedSpecies(species)}
                className={`rounded-3xl p-5 border-2 transition-all duration-300 shadow-md hover:shadow-xl flex flex-col justify-between cursor-pointer hover:-translate-y-1.5 ${
                  isSighted
                    ? isSelected
                      ? 'bg-white border-amber-400 ring-4 ring-amber-300/40 shadow-amber-500/10'
                      : 'bg-white border-stone-100 hover:border-sky-300'
                    : isSelected
                      ? 'bg-stone-100/90 border-stone-400 ring-4 ring-stone-300/50'
                      : 'bg-stone-50/75 border-stone-200 hover:border-stone-300 opacity-85 hover:opacity-100'
                }`}
              >
                <div>
                  {/* Species Photo */}
                  <div className={`relative aspect-4/3 rounded-2xl overflow-hidden border-2 ${
                    isSighted ? 'bg-stone-100 border-stone-100' : 'bg-stone-200 border-stone-200'
                  }`}>
                    <img
                      src={species.imageUrl}
                      alt={species.name}
                      referrerPolicy="no-referrer"
                      className={`w-full h-full object-cover transition-all duration-500 hover:scale-105 ${
                        isSighted
                          ? ''
                          : 'grayscale contrast-90 brightness-95'
                      }`}
                    />

                    {/* Rarity Badge */}
                    <div className="absolute top-3 left-3">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-pixar-sub font-bold border shadow-xs ${
                        isSighted
                          ? species.badgeColor
                          : 'bg-stone-200 text-stone-600 border-stone-300'
                      }`}>
                        {species.rarityInBackyard}
                      </span>
                    </div>

                    {/* Sighting Status Badge */}
                    <div className="absolute bottom-3 right-3">
                      {isSighted ? (
                        <div className="bg-stone-950/85 text-white text-[10px] font-pixar-sub font-bold px-3 py-1 rounded-full backdrop-blur-xs shadow-xs flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                          <span>{countInJournal} logged in yard</span>
                        </div>
                      ) : (
                        <div className="bg-stone-800/80 text-stone-300 text-[10px] font-pixar-sub font-bold px-3 py-1 rounded-full backdrop-blur-xs shadow-xs flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-stone-400"></span>
                          <span>Not yet spotted</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Info Header */}
                  <div className="mt-4 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className={`font-pixar-title text-2xl ${
                        isSighted ? 'text-stone-900' : 'text-stone-700'
                      }`}>
                        {species.name}
                      </h3>
                      {!isSighted && (
                        <span className="text-[10px] uppercase tracking-wider font-pixar-sub font-bold text-stone-400 bg-stone-200/70 px-2 py-0.5 rounded-md">
                          Unspotted
                        </span>
                      )}
                    </div>
                    <p className={`text-xs font-pixar-sub font-bold ${
                      isSighted ? 'text-sky-700' : 'text-stone-500'
                    }`}>
                      {species.scientificName} • {species.size}
                    </p>
                    <p className={`text-xs font-pixar-body font-semibold line-clamp-2 leading-relaxed pt-1 ${
                      isSighted ? 'text-stone-600' : 'text-stone-500'
                    }`}>
                      {species.description}
                    </p>
                  </div>

                  {/* Favorite Treats */}
                  <div className={`mt-3.5 p-3 rounded-2xl border-2 text-xs font-pixar-sub ${
                    isSighted
                      ? 'bg-amber-50/80 border-amber-200/80'
                      : 'bg-stone-100/90 border-stone-200/80'
                  }`}>
                    <span className={`font-bold block ${
                      isSighted ? 'text-amber-950' : 'text-stone-800'
                    }`}>
                      Favorite Food / Treat:
                    </span>
                    <span className={`font-semibold ${
                      isSighted ? 'text-amber-900' : 'text-stone-600'
                    }`}>
                      {species.favoriteFood}
                    </span>
                  </div>

                  {/* Call Description */}
                  <div className={`mt-2 text-xs font-pixar-sub font-semibold flex items-start gap-1.5 ${
                    isSighted ? 'text-stone-600' : 'text-stone-500'
                  }`}>
                    <Volume2 className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                      isSighted ? 'text-amber-500' : 'text-stone-400'
                    }`} />
                    <span>"{species.callDescription}"</span>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="mt-4 pt-3 border-t-2 border-stone-100 flex items-center justify-between font-pixar-sub">
                  <span className={`text-[11px] font-bold truncate max-w-[180px] ${
                    isSighted ? 'text-stone-500' : 'text-stone-400'
                  }`}>
                    💡 {species.funFact.slice(0, 40)}...
                  </span>
                  <span className={`text-xs font-pixar-title ${
                    isSighted ? 'text-amber-600 hover:underline' : 'text-stone-500 hover:underline'
                  }`}>
                    View Profile →
                  </span>
                </div>

              </div>
            );
          })}
        </div>

        {/* PAGINATION CONTROLS */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 pb-2">
            <p className="text-xs font-pixar-sub font-bold text-stone-500 order-2 sm:order-1">
              Showing {startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, totalSpecies)} of {totalSpecies} Species
            </p>

            <div className="flex items-center gap-2 order-1 sm:order-2">
              {/* Prev Button */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3.5 py-2 rounded-xl bg-white border-2 border-stone-200 text-stone-700 text-xs font-pixar-sub font-bold hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 shadow-xs"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev</span>
              </button>

              {/* Page Number Buttons */}
              <div className="flex items-center gap-1.5">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-9 h-9 rounded-xl text-xs font-pixar-sub font-bold transition-all border-2 shadow-xs ${
                      currentPage === pageNum
                        ? 'bg-amber-400 text-stone-950 border-amber-500 ring-2 ring-amber-300/50'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              {/* Next Button */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3.5 py-2 rounded-xl bg-white border-2 border-stone-200 text-stone-700 text-xs font-pixar-sub font-bold hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 shadow-xs"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* SELECTED SPECIES DETAILED SPOTLIGHT BANNER */}
        <div className={`p-6 sm:p-8 rounded-3xl border-3 shadow-xl transition-all ${
          isSelectedSighted
            ? 'bg-white border-amber-400 shadow-amber-500/10'
            : 'bg-stone-50 border-stone-300 shadow-stone-400/10'
        } space-y-6`}>
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="relative w-full md:w-64 aspect-4/3 shrink-0 rounded-2xl overflow-hidden border-2 border-amber-300 shadow-md">
              <img
                src={selectedSpecies.imageUrl}
                alt={selectedSpecies.name}
                referrerPolicy="no-referrer"
                className={`w-full h-full object-cover ${
                  isSelectedSighted ? '' : 'grayscale contrast-90 brightness-95'
                }`}
              />
              <div className="absolute top-3 left-3">
                <span className={`px-3 py-1 rounded-full text-xs font-pixar-sub font-bold border ${
                  isSelectedSighted
                    ? selectedSpecies.badgeColor
                    : 'bg-stone-200 text-stone-600 border-stone-300'
                }`}>
                  {selectedSpecies.rarityInBackyard}
                </span>
              </div>
            </div>

            <div className="space-y-3 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-pixar-sub font-bold text-stone-500">
                    {selectedSpecies.scientificName} • {selectedSpecies.size}
                  </span>
                </div>

                {isSelectedSighted ? (
                  <span className="px-3 py-1 rounded-full text-xs font-pixar-sub font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                    ✓ {selectedCount} Logged in Yard
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-pixar-sub font-bold bg-stone-200 text-stone-600 border border-stone-300">
                    ⏳ Not Yet Logged in Yard
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-pixar-title text-2xl sm:text-3xl text-stone-900">
                  {selectedSpecies.name.toUpperCase()} FIELD PROFILE
                </h3>

                {isSelectedSighted && onSelectSpeciesFilter && (
                  <button
                    onClick={() => onSelectSpeciesFilter(selectedSpecies.name)}
                    className="px-4 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-pixar-title font-bold transition-all border-2 border-amber-500 shadow-xs"
                  >
                    Filter Feed for {selectedSpecies.name} 🔍
                  </button>
                )}
              </div>

              <p className="text-xs sm:text-sm font-pixar-body font-semibold text-stone-700 leading-relaxed">
                {selectedSpecies.description}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 font-pixar-sub">
                <div className="bg-amber-50 p-3.5 rounded-2xl border-2 border-amber-200 text-xs">
                  <span className="font-bold text-amber-950 block">Favorite Feeder Treats</span>
                  <span className="text-amber-900 font-semibold">{selectedSpecies.favoriteFood}</span>
                </div>

                <div className="bg-sky-50 p-3.5 rounded-2xl border-2 border-sky-200 text-xs">
                  <span className="font-bold text-sky-950 block">Song / Whistle Call</span>
                  <span className="text-sky-900 font-semibold">{selectedSpecies.callDescription}</span>
                </div>
              </div>

              <div className="p-3.5 bg-stone-100/80 rounded-2xl border-2 border-stone-200 text-xs font-pixar-body font-semibold text-stone-700 leading-relaxed">
                <strong className="font-pixar-title text-stone-900">AVIARY FUN FACT: </strong>
                {selectedSpecies.funFact}
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
