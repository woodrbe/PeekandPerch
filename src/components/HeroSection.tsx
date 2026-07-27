import React from 'react';
import { Eye, Feather } from 'lucide-react';

import cardinalAnimated from '../assets/images/cardinal_ios_ready.mp4';
import goldenAnimated from '../assets/images/golden_animated.mp4';
import { TransparentVideo } from './TransparentVideo';
import cardinalMascot from '../assets/images/cardinal_compass_f1_1785113731087.jpg';
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
                poster={goldfinchMascot}
                isPlaying={activeBird === 'golden'}
                onEnded={handleGoldenEnded}
                className="w-full h-auto max-w-[280px] mx-auto"
              />
            </div>
          </div>

          {/* CENTER COLUMN: Hero Headline & Start Creating Pill Button */}
          <div className="md:col-span-6 text-center space-y-6 order-1 md:order-2 px-2 sm:px-4">
            
            {/* Main Headline styled like the reference Pixar style */}
            <h1 className="font-pixar-title text-4xl sm:text-5xl md:text-6xl tracking-wide text-stone-900 leading-[1.12] drop-shadow-xs text-center">
              <div>MEET THE</div>
              <div className="text-sky-500 relative inline-block">
                BACKYARD FLOCK
                <span className="absolute left-full ml-2 top-0 text-amber-400 font-pixar-sub text-3xl sm:text-5xl animate-bounce pointer-events-none select-none">✦</span>
              </div>
            </h1>

            {/* Subtitle */}
            <p className="font-pixar-sub text-stone-600 text-base sm:text-lg md:text-xl max-w-xl mx-auto font-semibold leading-relaxed">
              Look who's stopping by for a snack, track your favorite feathered regulars, and get to know the quirky characters living right outside your window.
            </p>

            {/* Centered Pill Button matching Pixar style */}
            <div className="pt-3 flex items-center justify-center">
              <button
                onClick={onExploreGallery}
                className="px-7 py-3.5 rounded-full bg-sky-100 hover:bg-sky-200 active:translate-y-0.5 text-sky-900 font-pixar-sub font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 border-b-2 border-sky-300 shadow-md hover:scale-105"
              >
                <Eye className="w-4 h-4 text-sky-600" />
                <span>See Who Dropped By</span>
              </button>
            </div>

          </div>

          {/* RIGHT COLUMN: Cardinal Character - Static positioning */}
          <div className="md:col-span-3 flex items-center justify-center order-3">
            <div className="relative w-full max-w-[280px]">
              <TransparentVideo
                src={cardinalAnimated}
                poster={cardinalMascot}
                isPlaying={activeBird === 'cardinal'}
                onEnded={handleCardinalEnded}
                className="w-full h-auto max-w-[280px] mx-auto"
              />
            </div>
          </div>

        </div>



      </div>
    </section>
  );
};
