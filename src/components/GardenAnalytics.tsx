import React from 'react';
import { BirdSighting } from '../types';
import { BarChart3, Feather, Sparkles, Trophy, Sun, Calendar, Plus, Clock } from 'lucide-react';

interface GardenAnalyticsProps {
  sightings: BirdSighting[];
  onOpenLogModal?: () => void;
}

export const GardenAnalytics: React.FC<GardenAnalyticsProps> = ({
  sightings,
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

  // Time of Day frequency map
  const timeBuckets: Record<string, number> = {
    'Early Morning (5-9 AM)': 0,
    'Midday (9 AM-1 PM)': 0,
    'Afternoon (1-5 PM)': 0,
    'Evening & Dusk (5-9 PM)': 0,
  };

  sightings.forEach((s) => {
    if (!s.time) return;
    let hour = -1;
    const ampmMatch = s.time.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (ampmMatch) {
      let h = parseInt(ampmMatch[1], 10);
      const isPM = (ampmMatch[3] || '').toUpperCase() === 'PM';
      const isAM = (ampmMatch[3] || '').toUpperCase() === 'AM';
      if (isPM && h < 12) h += 12;
      if (isAM && h === 12) h = 0;
      hour = h;
    }
    if (hour >= 5 && hour < 9) timeBuckets['Early Morning (5-9 AM)']++;
    else if (hour >= 9 && hour < 13) timeBuckets['Midday (9 AM-1 PM)']++;
    else if (hour >= 13 && hour < 17) timeBuckets['Afternoon (1-5 PM)']++;
    else if (hour >= 17 && hour < 21) timeBuckets['Evening & Dusk (5-9 PM)']++;
    else if (hour >= 0) timeBuckets['Early Morning (5-9 AM)']++;
  });

  const sortedTimeBuckets = Object.entries(timeBuckets).sort((a, b) => b[1] - a[1]);
  const peakTimeSlot = sortedTimeBuckets[0] && sortedTimeBuckets[0][1] > 0 
    ? sortedTimeBuckets[0][0].split(' (')[0] 
    : 'Early Morning';

  return (
    <section id="analytics-section" className="py-12 bg-sky-50/40 border-b-2 border-sky-100 font-pixar-body">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* HEADER */}
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100 text-indigo-950 text-xs font-pixar-sub font-bold mb-3 border-2 border-indigo-200 shadow-xs">
            <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Aviary Flock Intelligence</span>
          </div>
          <h2 className="font-pixar-title text-3xl sm:text-4xl text-stone-900 tracking-wide drop-shadow-xs">
            FLOCK TRENDS 📊
          </h2>
          <p className="font-pixar-sub text-stone-600 text-sm sm:text-base mt-1.5 max-w-xl font-semibold">
            Who’s trending, visitor time distributions, and flock statistics
          </p>
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
              Cataloged in collection
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
              <span>PEAK VISITING TIME</span>
              <Clock className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="font-pixar-title text-2xl sm:text-3xl text-stone-900 line-clamp-1">
              {peakTimeSlot}
            </div>
            <div className="text-[11px] font-pixar-sub font-bold text-emerald-700">
              Most active visitor window
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

          {/* Time of Day Activity */}
          <div className="bg-white p-6 rounded-3xl border-2 border-sky-100 shadow-md space-y-4">
            <h3 className="text-lg font-pixar-title text-stone-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-500" />
              <span>VISITING TIME OF DAY</span>
            </h3>

            <div className="space-y-3.5 pt-2">
              {sortedTimeBuckets.map(([timeSlot, count]) => {
                const percentage = Math.round((count / (totalSightings || 1)) * 100);

                return (
                  <div key={timeSlot} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-stone-800">
                      <span>{timeSlot}</span>
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
