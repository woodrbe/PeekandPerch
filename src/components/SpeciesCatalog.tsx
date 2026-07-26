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
    <section id="species-section" className="py-12 bg-sky-50/40 border-b-2 border-sky-100 font-pixar-body">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-100 text-sky-950 text-xs font-pixar-sub font-bold mb-3 border-2 border-sky-200 shadow-xs">
              <BookOpen className="w-3.5 h-3.5 text-sky-600" />
              <span>Meet the Locals & Identification</span>
            </div>
            <h2 className="font-pixar-title text-3xl sm:text-4xl text-stone-900 tracking-wide drop-shadow-xs">
              MEET THE LOCALS 📖
            </h2>
            <p className="font-pixar-sub text-stone-600 text-sm sm:text-base mt-1.5 max-w-xl font-semibold">
              Learn how to identify backyard birds, attract them with their favorite treats, and recognize their songs.
            </p>
          </div>

          <button
            onClick={onOpenLogModal}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:translate-y-0.5 text-stone-950 font-pixar-title text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 border-b-3 border-amber-700 cursor-pointer self-start md:self-auto hover:scale-105 transition-all"
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
                className={`bg-white rounded-3xl p-5 border-2 transition-all duration-300 shadow-md hover:shadow-xl flex flex-col justify-between cursor-pointer hover:-translate-y-1.5 ${
                  selectedSpecies.id === species.id
                    ? 'border-amber-400 ring-4 ring-amber-300/40 shadow-amber-500/10'
                    : 'border-stone-100 hover:border-sky-300'
                }`}
              >
                <div>
                  {/* Species Actual Photo */}
                  <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-stone-100 border-2 border-stone-100">
                    <img
                      src={species.imageUrl}
                      alt={species.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover hover:scale-108 transition-transform duration-500"
                    />

                    {/* Rarity Badge */}
                    <div className="absolute top-3 left-3">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-pixar-sub font-bold border shadow-xs ${species.badgeColor}`}>
                        {species.rarityInBackyard}
                      </span>
                    </div>

                    {/* Count in Journal Badge */}
                    <div className="absolute bottom-3 right-3 bg-stone-950/85 text-white text-[10px] font-pixar-sub font-bold px-3 py-1 rounded-full backdrop-blur-xs shadow-xs">
                      {countInJournal} logged in yard
                    </div>
                  </div>

                  {/* Info Header */}
                  <div className="mt-4 space-y-1">
                    <h3 className="font-pixar-title text-2xl text-stone-900">
                      {species.name}
                    </h3>
                    <p className="text-xs font-pixar-sub font-bold text-sky-700">
                      {species.scientificName} • {species.size}
                    </p>
                    <p className="text-xs font-pixar-body font-semibold text-stone-600 line-clamp-2 leading-relaxed pt-1">
                      {species.description}
                    </p>
                  </div>

                  {/* Favorite Treats */}
                  <div className="mt-3.5 p-3 rounded-2xl bg-amber-50/80 border-2 border-amber-200/80 text-xs font-pixar-sub">
                    <span className="font-bold text-amber-950 block">Favorite Food / Treat:</span>
                    <span className="text-amber-900 font-semibold">{species.favoriteFood}</span>
                  </div>

                  {/* Call Description */}
                  <div className="mt-2 text-xs font-pixar-sub font-semibold text-stone-600 flex items-start gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>"{species.callDescription}"</span>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="mt-4 pt-3 border-t-2 border-stone-100 flex items-center justify-between font-pixar-sub">
                  <span className="text-[11px] font-bold text-stone-500">
                    💡 {species.funFact.slice(0, 42)}...
                  </span>
                  <span className="text-xs font-pixar-title text-amber-600 group-hover:underline">
                    View Guide →
                  </span>
                </div>

              </div>
            );
          })}
        </div>

        {/* SELECTED SPECIES DETAILED SPOTLIGHT BANNER */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border-3 border-amber-400 shadow-xl shadow-amber-500/10 space-y-6">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <img
              src={selectedSpecies.imageUrl}
              alt={selectedSpecies.name}
              referrerPolicy="no-referrer"
              className="w-full md:w-64 aspect-4/3 rounded-2xl object-cover border-2 border-amber-300 shadow-md"
            />

            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-pixar-sub font-bold border ${selectedSpecies.badgeColor}`}>
                  {selectedSpecies.rarityInBackyard}
                </span>
                <span className="text-xs font-pixar-sub font-bold text-stone-500">
                  {selectedSpecies.scientificName}
                </span>
              </div>

              <h3 className="font-pixar-title text-2xl sm:text-3xl text-stone-900">
                {selectedSpecies.name.toUpperCase()} FIELD PROFILE
              </h3>

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

              <div className="p-3.5 bg-stone-50 rounded-2xl border-2 border-stone-200 text-xs font-pixar-body font-semibold text-stone-700 leading-relaxed">
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
