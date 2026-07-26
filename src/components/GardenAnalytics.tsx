import React from 'react';
import { BirdSighting } from '../types';
import { BarChart3, Feather, MapPin, Sparkles, Trophy, Sun, Calendar, Plus } from 'lucide-react';

interface GardenAnalyticsProps {
  sightings: BirdSighting[];
  onOpenLogModal: () => void;
}

export const GardenAnalytics: React.FC<GardenAnalyticsProps> = ({
  sightings,
  onOpenLogModal,
}) => {
  const totalSightings = sightings.length;
  const totalBirdsCounted = sightings.reduce((acc, curr) => acc + curr.count, 0);

  // Unique species count
  const uniqueSpeciesNames = Array.from(new Set(sightings.map((s) => s.speciesName)));

  // Species frequency map
  const speciesCounts: Record<string, number> = {};
  sightings.forEach((s) => {
    speciesCounts[s.speciesName] = (speciesCounts[s.speciesName] || 0) + s.count;
  });

  const sortedSpecies = Object.entries(speciesCounts).sort((a, b) => b[1] - a[1]);
  const mostFrequentSpecies = sortedSpecies[0] ? sortedSpecies[0][0] : 'Northern Cardinal';

  // Location frequency map
  const locationCounts: Record<string, number> = {};
  sightings.forEach((s) => {
    locationCounts[s.location] = (locationCounts[s.location] || 0) + 1;
  });

  const sortedLocations = Object.entries(locationCounts).sort((a, b) => b[1] - a[1]);
  const topLocation = sortedLocations[0] ? sortedLocations[0][0] : 'Tube Feeder';

  // Behavior frequency map
  const behaviorCounts: Record<string, number> = {};
  sightings.forEach((s) => {
    behaviorCounts[s.behavior] = (behaviorCounts[s.behavior] || 0) + 1;
  });

  return (
    <section id="analytics-section" className="py-12 bg-sky-50/40 border-b-2 border-sky-100 font-pixar-body">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100 text-indigo-950 text-xs font-pixar-sub font-bold mb-3 border-2 border-indigo-200 shadow-xs">
              <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Backyard Aviary Intelligence</span>
            </div>
            <h2 className="font-pixar-title text-3xl sm:text-4xl text-stone-900 tracking-wide drop-shadow-xs">
              FLOCK TRENDS &amp; AVIARY STATS 📊
            </h2>
            <p className="font-pixar-sub text-stone-600 text-sm sm:text-base mt-1.5 max-w-xl font-semibold">
              Insights into backyard visitor frequency, favorite feeding spots, and active observation times.
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

        {/* METRIC CARDS ROW */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          
          <div className="bg-white p-5 rounded-3xl border-2 border-amber-200 shadow-md shadow-amber-500/5 space-y-2 hover:scale-102 transition-transform">
            <div className="flex items-center justify-between text-xs font-pixar-title text-stone-500">
              <span>TOTAL BIRDS COUNTED</span>
              <span className="text-2xl">🐦</span>
            </div>
            <div className="font-pixar-title text-4xl sm:text-5xl text-stone-900">
              {totalBirdsCounted}
            </div>
            <div className="text-[11px] font-pixar-sub font-bold text-emerald-700">
              Across {totalSightings} logged sessions
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border-2 border-sky-200 shadow-md shadow-sky-500/5 space-y-2 hover:scale-102 transition-transform">
            <div className="flex items-center justify-between text-xs font-pixar-title text-stone-500">
              <span>UNIQUE SPECIES</span>
              <span className="text-2xl">🎨</span>
            </div>
            <div className="font-pixar-title text-4xl sm:text-5xl text-stone-900">
              {uniqueSpeciesNames.length}
            </div>
            <div className="text-[11px] font-pixar-sub font-bold text-sky-700">
              Spotted in home garden
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border-2 border-rose-200 shadow-md shadow-rose-500/5 space-y-2 hover:scale-102 transition-transform">
            <div className="flex items-center justify-between text-xs font-pixar-title text-stone-500">
              <span>TOP VISITOR</span>
              <Trophy className="w-5 h-5 text-amber-500" />
            </div>
            <div className="font-pixar-title text-2xl sm:text-3xl text-stone-900 line-clamp-1">
              {mostFrequentSpecies}
            </div>
            <div className="text-[11px] font-pixar-sub font-bold text-rose-700">
              Most frequent feeder guest
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border-2 border-emerald-200 shadow-md shadow-emerald-500/5 space-y-2 hover:scale-102 transition-transform">
            <div className="flex items-center justify-between text-xs font-pixar-title text-stone-500">
              <span>FAVORITE HOTSPOT</span>
              <MapPin className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="font-pixar-title text-2xl sm:text-3xl text-stone-900 line-clamp-1">
              {topLocation}
            </div>
            <div className="text-[11px] font-pixar-sub font-bold text-emerald-700">
              Highest activity zone
            </div>
          </div>

        </div>

        {/* VISUAL CHARTS & BREAKDOWN */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-pixar-sub">
          
          {/* Visitor Species Distribution Bar List */}
          <div className="bg-white p-6 rounded-3xl border-2 border-sky-100 shadow-md space-y-4">
            <h3 className="text-lg font-pixar-title text-stone-900 flex items-center gap-2">
              <Feather className="w-5 h-5 text-amber-500" />
              <span>VISITOR FREQUENCY BY SPECIES</span>
            </h3>

            <div className="space-y-3.5 pt-2">
              {sortedSpecies.map(([speciesName, count]) => {
                const percentage = Math.round((count / (totalBirdsCounted || 1)) * 100);

                return (
                  <div key={speciesName} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-stone-800">
                      <span>{speciesName}</span>
                      <span className="text-sky-700">{count} birds ({percentage}%)</span>
                    </div>

                    <div className="w-full bg-stone-100 h-3 rounded-full overflow-hidden p-0.5 border border-stone-200/60">
                      <div
                        className="bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(percentage, 8)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Backyard Feeding Spots Activity */}
          <div className="bg-white p-6 rounded-3xl border-2 border-sky-100 shadow-md space-y-4">
            <h3 className="text-lg font-pixar-title text-stone-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-500" />
              <span>FEEDING SPOT ACTIVITY</span>
            </h3>

            <div className="space-y-3.5 pt-2">
              {sortedLocations.map(([locName, count]) => {
                const percentage = Math.round((count / (totalSightings || 1)) * 100);

                return (
                  <div key={locName} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-stone-800">
                      <span>{locName}</span>
                      <span className="text-emerald-700">{count} visits ({percentage}%)</span>
                    </div>

                    <div className="w-full bg-stone-100 h-3 rounded-full overflow-hidden p-0.5 border border-stone-200/60">
                      <div
                        className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(percentage, 8)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
