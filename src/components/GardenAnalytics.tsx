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
    <section id="analytics-section" className="py-12 bg-[#FAF9F6] border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-100 text-indigo-950 text-xs font-bold mb-2 border border-indigo-300">
              <BarChart3 className="w-3.5 h-3.5 text-indigo-700" />
              <span>Backyard Aviary Intelligence</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
              Yard Aviary Statistics & Trends 📊
            </h2>
            <p className="text-stone-600 text-sm sm:text-base mt-1 max-w-xl">
              Insights into backyard visitor frequency, favorite feeding spots, and active observation times.
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

        {/* METRIC CARDS ROW */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          
          <div className="bg-white p-5 rounded-3xl border border-amber-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-stone-500 font-mono">
              <span>Total Birds Counted</span>
              <span className="text-xl">🐦</span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-stone-900">
              {totalBirdsCounted}
            </div>
            <div className="text-[11px] font-semibold text-emerald-700">
              Across {totalSightings} logged sessions
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-sky-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-stone-500 font-mono">
              <span>Unique Species</span>
              <span className="text-xl">🎨</span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-stone-900">
              {uniqueSpeciesNames.length}
            </div>
            <div className="text-[11px] font-semibold text-sky-700">
              Spotted in home garden
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-rose-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-stone-500 font-mono">
              <span>Top Visitor</span>
              <Trophy className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-stone-900 line-clamp-1">
              {mostFrequentSpecies}
            </div>
            <div className="text-[11px] font-semibold text-rose-700">
              Most frequent feeder guest
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-emerald-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-stone-500 font-mono">
              <span>Favorite Hotspot</span>
              <MapPin className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-stone-900 line-clamp-1">
              {topLocation}
            </div>
            <div className="text-[11px] font-semibold text-emerald-700">
              Highest activity zone
            </div>
          </div>

        </div>

        {/* VISUAL CHARTS & BREAKDOWN */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Visitor Species Distribution Bar List */}
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
            <h3 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
              <Feather className="w-4 h-4 text-amber-600" />
              <span>Visitor Frequency by Species</span>
            </h3>

            <div className="space-y-3 pt-2">
              {sortedSpecies.map(([speciesName, count]) => {
                const percentage = Math.round((count / (totalBirdsCounted || 1)) * 100);

                return (
                  <div key={speciesName} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-stone-800">
                      <span>{speciesName}</span>
                      <span className="font-mono text-stone-500">{count} birds ({percentage}%)</span>
                    </div>

                    <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-amber-400 to-amber-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(percentage, 8)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Backyard Feeding Spots Activity */}
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
            <h3 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Feeding Spot Activity</span>
            </h3>

            <div className="space-y-3 pt-2">
              {sortedLocations.map(([locName, count]) => {
                const percentage = Math.round((count / (totalSightings || 1)) * 100);

                return (
                  <div key={locName} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-stone-800">
                      <span>{locName}</span>
                      <span className="font-mono text-stone-500">{count} visits ({percentage}%)</span>
                    </div>

                    <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-full rounded-full transition-all duration-500"
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
