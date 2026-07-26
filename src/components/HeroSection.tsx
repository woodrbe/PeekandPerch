import React from 'react';
import { Plus, Eye, Feather } from 'lucide-react';

import cardinalAnimated from '../assets/images/cardinal animated.mp4';
import goldenAnimated from '../assets/images/golden animated.mp4';
import { TransparentVideo } from './TransparentVideo';
import cardinalMascot from '../assets/images/red_cardinal_mascot_1784995985664.jpg';
import goldfinchMascot from '../assets/images/yellow_goldfinch_mascot_1784995995465.jpg';
import bluejayMascot from '../assets/images/blue_jay_mascot_1784996006095.jpg';
import owlMascot from '../assets/images/wise_owl_mascot_1784996016103.jpg';

interface HeroSectionProps {
  onOpenLogModal: () => void;
  onExploreGallery: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenLogModal,
  onExploreGallery,
}) => {
  // Alternating video playback controller state:
  // 'golden' -> plays Golden bird video
  // 'pause_after_golden' -> 2s pause where neither video plays
  // 'cardinal' -> plays Cardinal bird video
  // 'pause_after_cardinal' -> 2s pause where neither video plays
  const [activeBird, setActiveBird] = React.useState<'golden' | 'pause_after_golden' | 'cardinal' | 'pause_after_cardinal'>('golden');

  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeBird === 'pause_after_golden') {
      timer = setTimeout(() => {
        setActiveBird('cardinal');
      }, 2000);
    } else if (activeBird === 'pause_after_cardinal') {
      timer = setTimeout(() => {
        setActiveBird('golden');
      }, 2000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [activeBird]);

  const handleGoldenEnded = React.useCallback(() => {
    setActiveBird('pause_after_golden');
  }, []);

  const handleCardinalEnded = React.useCallback(() => {
    setActiveBird('pause_after_cardinal');
  }, []);

  const ALL_CHARACTERS = [
    {
      id: 'cardinal-mascot',
      name: 'Captain Crimson',
      species: 'Northern Cardinal',
      title: 'Backyard Patrol Commander',
      trait: 'First arrival at sunrise • Sunflower seeds lover',
      image: cardinalMascot,
      badge: 'Resident Mascot 👑',
      badgeBg: 'bg-rose-100 text-rose-950 border-rose-300',
    },
    {
      id: 'goldfinch-mascot',
      name: 'Sunny Finchy',
      species: 'American Goldfinch',
      title: 'Acrobatic Flower Acrobat',
      trait: 'Thistle seed specialist • Flying songbird soloist',
      image: goldfinchMascot,
      badge: 'Garden Acrobat 🌻',
      badgeBg: 'bg-amber-100 text-amber-950 border-amber-300',
    },
    {
      id: 'bluejay-mascot',
      name: 'Jay The Watchman',
      species: 'Blue Jay',
      title: 'Yard Security Sentinel',
      trait: 'Whole peanut collector • High canopy lookout',
      image: bluejayMascot,
      badge: 'Oak Guard 🛡️',
      badgeBg: 'bg-indigo-100 text-indigo-950 border-indigo-300',
    },
    {
      id: 'owl-mascot',
      name: 'Professor Barnaby',
      species: 'Wise Barn Owl',
      title: 'Twilight Garden Scholar',
      trait: 'Nighttime observer • Ancient oak resident',
      image: owlMascot,
      badge: 'Night Guardian 🦉',
      badgeBg: 'bg-stone-200 text-stone-900 border-stone-300',
    },
  ];

  return (
    <section className="relative overflow-hidden bg-white pt-8 pb-16 border-b border-stone-100">
      
      {/* MAIN CONTAINER matching sample animation website layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* HERO 3-COLUMN LAYOUT: Left Character | Center Text & Button | Right Character */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center min-h-[460px] py-4">
          
          {/* LEFT COLUMN: Golden (Goldfinch) Character - Static positioning */}
          <div className="md:col-span-3 flex items-center justify-center order-2 md:order-1">
            <div className="relative w-full max-w-[280px]">
              <TransparentVideo
                src={goldenAnimated}
                isPlaying={activeBird === 'golden'}
                onEnded={handleGoldenEnded}
                className="w-full h-auto max-w-[280px] mx-auto"
              />
            </div>
          </div>

          {/* CENTER COLUMN: Hero Headline & Start Creating Pill Button */}
          <div className="md:col-span-6 text-center space-y-6 order-1 md:order-2 px-2 sm:px-4">
            
            {/* Main Headline styled like the reference sample animation website */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-light tracking-tight text-stone-900 leading-[1.12]">
              Your backyard into
              <br />
              <span className="font-bold text-stone-900 inline-flex items-center justify-center gap-1">
                Bird Magic
                <span className="text-amber-500 font-serif italic text-3xl sm:text-5xl -mt-2">✦</span>
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-stone-500 text-sm sm:text-base md:text-lg max-w-md mx-auto font-normal leading-relaxed">
              Log, track, and discover backyard feathered visitors in a few clicks.
            </p>

            {/* Centered Pill Button matching reference "Start Creating" button design */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={onOpenLogModal}
                className="group relative inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white text-stone-900 font-semibold text-sm border border-stone-200/90 shadow-md shadow-stone-200/80 hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer overflow-hidden"
              >
                {/* Subtle rainbow gradient ring glow behind button */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-400 via-rose-400 to-indigo-400 rounded-full opacity-40 group-hover:opacity-100 transition duration-500 blur-xs -z-10" />
                <div className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center group-hover:bg-amber-400 group-hover:text-stone-950 transition-colors">
                  <Plus className="w-4 h-4 text-stone-800 group-hover:text-stone-950" />
                </div>
                <span>Start Logging</span>
              </button>

              <button
                onClick={onExploreGallery}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium text-xs transition cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-stone-500" />
                <span>Browse Gallery</span>
              </button>
            </div>

          </div>

          {/* RIGHT COLUMN: Cardinal Character - Static positioning */}
          <div className="md:col-span-3 flex items-center justify-center order-3">
            <div className="relative w-full max-w-[280px]">
              <TransparentVideo
                src={cardinalAnimated}
                isPlaying={activeBird === 'cardinal'}
                onEnded={handleCardinalEnded}
                className="w-full h-auto max-w-[280px] mx-auto"
              />
            </div>
          </div>

        </div>

        {/* SECONDARY ROW: Full Backyard Avian Roster */}
        <div className="mt-16 pt-8 border-t border-stone-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-800 uppercase tracking-wider font-mono">
              <Feather className="w-4 h-4 text-amber-600" />
              <span>Backyard Bird Club Characters</span>
            </div>
            <button
              onClick={onExploreGallery}
              className="text-xs font-bold text-amber-800 hover:text-amber-900 hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>Explore All Sightings</span>
              <span>→</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {ALL_CHARACTERS.map((char) => (
              <div
                key={char.id}
                onClick={onExploreGallery}
                className="group bg-stone-50 hover:bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-xs hover:shadow-md transition-all duration-300 cursor-pointer flex items-center gap-3"
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-stone-200 shrink-0 border border-stone-300">
                  <img
                    src={char.image}
                    alt={char.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                  />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-xs text-stone-900 group-hover:text-amber-700 truncate">
                    {char.name}
                  </h4>
                  <p className="text-[10px] text-stone-500 truncate">
                    {char.species}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
