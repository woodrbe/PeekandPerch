import React, { useState } from 'react';
import { BirdSighting, GardenLocation, BehaviorType } from '../types';
import { 
  Search, Filter, Heart, Eye, MapPin, Calendar, Plus, Sparkles, Star, Sun, Trash2, Check 
} from 'lucide-react';

interface SightingsGalleryProps {
  sightings: BirdSighting[];
  onSelectSighting: (sighting: BirdSighting) => void;
  onOpenLogModal: () => void;
  onToggleFavoriteSighting: (id: string) => void;
  onDeleteSighting: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const SightingsGallery: React.FC<SightingsGalleryProps> = ({
  sightings,
  onSelectSighting,
  onOpenLogModal,
  onToggleFavoriteSighting,
  onDeleteSighting,
  searchQuery,
  onSearchChange,
}) => {
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [selectedBehavior, setSelectedBehavior] = useState<string>('All');
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'count'>('newest');

  const locations = ['All', 'Tube Feeder', 'Birdbath', 'Berry Bush', 'Suet Station', 'Lawn & Patio', 'Oak Branch'];
  const behaviors = ['All', 'Feeder Snack', 'Water Bathing', 'Perched & Singing', 'Foraging on Ground', 'Preening Feathers'];

  // Filter logic
  const filteredSightings = sightings.filter((s) => {
    const matchesSearch = 
      s.speciesName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.spottedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesLoc = selectedLocation === 'All' || s.location === selectedLocation;
    const matchesBeh = selectedBehavior === 'All' || s.behavior === selectedBehavior;
    const matchesFav = !onlyFavorites || s.isFavorite;

    return matchesSearch && matchesLoc && matchesBeh && matchesFav;
  }).sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime();
    if (sortBy === 'oldest') return new Date(a.date + ' ' + a.time).getTime() - new Date(b.date + ' ' + b.time).getTime();
    if (sortBy === 'count') return b.count - a.count;
    return 0;
  });

  return (
    <section id="gallery-section" className="py-12 bg-sky-50/40 border-b-2 border-sky-100 font-pixar-body">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* TOP HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 text-amber-950 text-xs font-pixar-sub font-bold mb-3 border-2 border-amber-200/80 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              <span>Backyard Photo Memory Journal</span>
            </div>
            <h2 className="font-pixar-title text-3xl sm:text-4xl text-stone-900 tracking-wide drop-shadow-xs">
              WHO DROPPED BY 📷
            </h2>
            <p className="font-pixar-sub text-stone-600 text-sm sm:text-base mt-1.5 max-w-xl font-semibold">
              Actual photograph memories of birds visiting backyard feeders, birdbaths, and flower gardens.
            </p>
          </div>

          <button
            onClick={onOpenLogModal}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:translate-y-0.5 text-stone-950 font-pixar-title text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 border-b-3 border-amber-700 cursor-pointer self-start md:self-auto hover:scale-105 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Log New Sighting</span>
          </button>
        </div>

        {/* CONTROLS & FILTERS BAR */}
        <div className="bg-white p-5 rounded-3xl border-2 border-sky-100 shadow-md shadow-sky-900/5 space-y-4">
          
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
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200'
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
                  className="bg-stone-100 border-2 border-stone-200 text-stone-800 text-xs font-pixar-sub font-bold rounded-full px-4 py-2 focus:outline-none focus:border-sky-400 cursor-pointer"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
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
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200 hover:scale-102'
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* BIRD SIGHTINGS PHOTO GRID */}
        {filteredSightings.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border-2 border-sky-100 shadow-md space-y-3 font-pixar-sub">
            <div className="text-5xl animate-bounce">🪶</div>
            <h3 className="text-xl font-pixar-title text-stone-900">NO SIGHTINGS FOUND</h3>
            <p className="text-xs font-semibold text-stone-500 max-w-sm mx-auto">
              Try adjusting your search query or location filter to reveal saved bird photo memories!
            </p>
            <button
              onClick={() => {
                setSelectedLocation('All');
                setSelectedBehavior('All');
                setOnlyFavorites(false);
                onSearchChange('');
              }}
              className="px-5 py-2.5 rounded-full bg-amber-100 text-amber-950 text-xs font-pixar-title hover:bg-amber-200 transition cursor-pointer border border-amber-300"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSightings.map((s) => (
              <div
                key={s.id}
                onClick={() => onSelectSighting(s)}
                className="group bg-white rounded-3xl p-4 border-2 border-stone-100 hover:border-sky-300 shadow-md hover:shadow-xl hover:shadow-sky-500/10 transition-all duration-300 cursor-pointer flex flex-col justify-between hover:-translate-y-1.5"
              >
                <div>
                  {/* Real Bird Photograph Container */}
                  <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-stone-100 border-2 border-stone-100">
                    <img
                      src={s.imageUrl}
                      alt={s.speciesName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                    />

                    {/* Star Favorite Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavoriteSighting(s.id);
                      }}
                      className={`absolute top-3 right-3 p-2.5 rounded-full backdrop-blur-md shadow-md transition-all duration-200 cursor-pointer ${
                        s.isFavorite 
                          ? 'bg-rose-500 text-white scale-110 ring-2 ring-white' 
                          : 'bg-white/80 text-stone-600 hover:bg-white hover:text-rose-500 hover:scale-110'
                      }`}
                      title={s.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Star className={`w-4 h-4 ${s.isFavorite ? 'fill-white' : ''}`} />
                    </button>

                    {/* Backyard Location Badge */}
                    <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-stone-900/85 text-white text-[11px] font-pixar-sub font-bold backdrop-blur-xs flex items-center gap-1.5 shadow-xs">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" />
                      <span>{s.location}</span>
                    </div>

                    {/* Quick Inspect Photo Overlay */}
                    <div className="absolute inset-0 bg-stone-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-xs">
                      <span className="px-5 py-2.5 rounded-full bg-white text-stone-900 font-pixar-title text-xs shadow-xl flex items-center gap-2 hover:bg-amber-400 transition transform scale-95 group-hover:scale-100 duration-200">
                        <Eye className="w-4 h-4 text-stone-900" />
                        <span>Inspect Photo</span>
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

                    <div className="flex items-center gap-2 text-xs font-pixar-sub font-bold text-stone-500">
                      <span>Behavior: <strong className="text-stone-800">{s.behavior}</strong></span>
                      {s.temperature && (
                        <>
                          <span>•</span>
                          <span className="text-sky-700 font-extrabold">{s.temperature}</span>
                        </>
                      )}
                    </div>

                    <p className="text-xs font-pixar-body font-semibold text-stone-600 line-clamp-2 leading-relaxed pt-1">
                      "{s.notes}"
                    </p>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="mt-4 pt-3 border-t-2 border-stone-100 flex items-center justify-between text-[11px] font-pixar-sub font-semibold text-stone-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-500" />
                    <span>{s.date} at {s.time}</span>
                  </div>

                  <span className="font-bold text-stone-800 bg-stone-100 px-2.5 py-0.5 rounded-full">
                    By {s.spottedBy}
                  </span>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </section>
  );
};
