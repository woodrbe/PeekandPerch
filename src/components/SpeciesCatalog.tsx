import React, { useState } from 'react';
import { BirdSpecies, BirdSighting } from '../types';
import { BACKYARD_SPECIES } from '../data/birdsData';
import { BookOpen, Sparkles, Plus, Eye, Music, Heart, Volume2 } from 'lucide-react';

interface SpeciesCatalogProps {
  sightings: BirdSighting[];
  onOpenLogModal: () => void;
  onSelectSpeciesFilter?: (speciesName: string) => void;
}

export const SpeciesCatalog: React.FC<SpeciesCatalogProps> = ({
  sightings,
  onOpenLogModal,
  onSelectSpeciesFilter,
}) => {
  const [selectedSpecies, setSelectedSpecies] = useState<BirdSpecies>(BACKYARD_SPECIES[0]);

  return (
    <section id="species-section" className="py-12 bg-[#FAF9F6] border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sky-100 text-sky-950 text-xs font-bold mb-2 border border-sky-300">
              <BookOpen className="w-3.5 h-3.5 text-sky-700" />
              <span>Backyard Bird Field Guide & Identification</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
              Local Aviary Species Catalog 📖
            </h2>
            <p className="text-stone-600 text-sm sm:text-base mt-1 max-w-xl">
              Learn how to identify backyard birds, attract them with their favorite treats, and recognize their songs.
            </p>
          </div>

          <button
            onClick={onOpenLogModal}
            className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition border border-amber-600/30 cursor-pointer self-start md:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Log Sighting</span>
          </button>
        </div>

        {/* SPECIES GRID CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {BACKYARD_SPECIES.map((species) => {
            const countInJournal = sightings.filter((s) => s.speciesName === species.name).length;

            return (
              <div
                key={species.id}
                onClick={() => setSelectedSpecies(species)}
                className={`bg-white rounded-3xl p-5 border transition-all duration-300 shadow-md flex flex-col justify-between cursor-pointer hover:-translate-y-1 ${
                  selectedSpecies.id === species.id
                    ? 'border-2 border-amber-400 ring-2 ring-amber-200/50'
                    : 'border-stone-200 hover:border-amber-300'
                }`}
              >
                <div>
                  {/* Species Actual Photo */}
                  <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200">
                    <img
                      src={species.imageUrl}
                      alt={species.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />

                    {/* Rarity Badge */}
                    <div className="absolute top-3 left-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border shadow-xs ${species.badgeColor}`}>
                        {species.rarityInBackyard}
                      </span>
                    </div>

                    {/* Count in Journal Badge */}
                    <div className="absolute bottom-3 right-3 bg-stone-950/80 text-white text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-xs font-mono">
                      {countInJournal} logged in yard
                    </div>
                  </div>

                  {/* Info Header */}
                  <div className="mt-4 space-y-1">
                    <h3 className="font-extrabold text-xl text-stone-900">
                      {species.name}
                    </h3>
                    <p className="text-xs italic text-stone-500 font-serif">
                      {species.scientificName} • {species.size}
                    </p>
                    <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed pt-1">
                      {species.description}
                    </p>
                  </div>

                  {/* Favorite Treats */}
                  <div className="mt-3 p-3 bg-amber-50/80 rounded-2xl border border-amber-200/60 text-xs">
                    <span className="font-bold text-amber-950 block">Favorite Food / Treat:</span>
                    <span className="text-amber-800">{species.favoriteFood}</span>
                  </div>

                  {/* Call Description */}
                  <div className="mt-2 text-xs text-stone-600 flex items-start gap-1.5 font-mono">
                    <Volume2 className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                    <span>"{species.callDescription}"</span>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-stone-500">
                    💡 {species.funFact.slice(0, 45)}...
                  </span>
                  <span className="text-xs font-bold text-amber-700 hover:underline">
                    View Guide →
                  </span>
                </div>

              </div>
            );
          })}
        </div>

        {/* SELECTED SPECIES DETAILED SPOTLIGHT BANNER */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-amber-300 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <img
              src={selectedSpecies.imageUrl}
              alt={selectedSpecies.name}
              referrerPolicy="no-referrer"
              className="w-full md:w-64 aspect-4/3 rounded-2xl object-cover border border-amber-200 shadow-md"
            />

            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-0.5 rounded-full text-xs font-bold border ${selectedSpecies.badgeColor}`}>
                  {selectedSpecies.rarityInBackyard}
                </span>
                <span className="text-xs font-mono text-stone-500">
                  {selectedSpecies.scientificName}
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-black text-stone-900">
                {selectedSpecies.name} Field Profile
              </h3>

              <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
                {selectedSpecies.description}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200/80 text-xs">
                  <span className="font-bold text-amber-950 block">Favorite Feeder Treats</span>
                  <span className="text-amber-900">{selectedSpecies.favoriteFood}</span>
                </div>

                <div className="bg-sky-50 p-3 rounded-2xl border border-sky-200/80 text-xs">
                  <span className="font-bold text-sky-950 block">Song / Whistle Call</span>
                  <span className="text-sky-900">{selectedSpecies.callDescription}</span>
                </div>
              </div>

              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 text-xs text-stone-700 leading-relaxed font-mono">
                <strong className="text-stone-900">Aviary Fun Fact: </strong>
                {selectedSpecies.funFact}
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
