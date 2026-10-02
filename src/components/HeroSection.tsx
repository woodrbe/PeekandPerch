import React, { useState } from 'react';
import { Eye, RefreshCw } from 'lucide-react';

import cardinalAnimated from '../assets/images/cardinal animated.mp4';
import goldenAnimated from '../assets/images/golden animated.mp4';
import bluejayAnimated from '../assets/images/bluejay animated.mp4';
import turkeyAnimated from '../assets/images/turkey animated.mp4';
import cardinalCharacter from '../assets/images/cardinal_character_1785015411958.jpg';
import goldfinchCharacter from '../assets/images/goldfinch_character_1785015425426.jpg';
import bluejayCharacter from '../assets/images/bluejay_character_1790964142504.jpg';
import turkeyCharacter from '../assets/images/turkey_character_1790965409759.jpg';
import { TransparentVideo } from './TransparentVideo';

interface HeroSectionProps {
  onOpenLogModal?: () => void;
  onExploreGallery: () => void;
}

interface MascotBird {
  id: string;
  name: string;
  species: string;
  badge: string;
  title: string;
  quote: string;
  video?: string;
  poster: string;
  scaleClass?: string;
  theme: {
    accentGlow: string;
    badgeBg: string;
    cardBorder: string;
    tagBg: string;
    tagText: string;
    quoteBubble: string;
  };
}

const MASCOTS: MascotBird[] = [
  {
    id: 'cardinal',
    name: 'Captain Crimson',
    species: 'Northern Cardinal',
    badge: 'Resident Mascot 👑',
    title: 'Backyard Patrol Commander',
    quote: '“Perimeter secured! Keep those black oil sunflower seeds coming.”',
    video: cardinalAnimated,
    poster: cardinalCharacter,
    theme: {
      accentGlow: 'from-rose-400/20 via-red-300/10 to-transparent',
      badgeBg: 'bg-rose-500 text-white shadow-rose-200',
      cardBorder: 'border-rose-200/90 shadow-rose-100/50',
      tagBg: 'bg-rose-100 text-rose-900 border-rose-300',
      tagText: 'text-rose-600',
      quoteBubble: 'border-rose-200/80 bg-white/95 text-rose-950',
    },
  },
  {
    id: 'goldfinch',
    name: 'Sunny Finchy',
    species: 'American Goldfinch',
    badge: 'Garden Acrobat 🌻',
    title: 'Acrobatic Flower Acrobat',
    quote: '“Look at my upside-down perch move! Got any nyjer seeds?”',
    video: goldenAnimated,
    poster: goldfinchCharacter,
    theme: {
      accentGlow: 'from-amber-400/25 via-yellow-300/10 to-transparent',
      badgeBg: 'bg-amber-500 text-stone-950 shadow-amber-200',
      cardBorder: 'border-amber-200/90 shadow-amber-100/50',
      tagBg: 'bg-amber-100 text-amber-900 border-amber-300',
      tagText: 'text-amber-700',
      quoteBubble: 'border-amber-200/80 bg-white/95 text-amber-950',
    },
  },
  {
    id: 'bluejay',
    name: 'Barnaby Blue',
    species: 'Blue Jay',
    badge: 'Lookout Sentinel 💎',
    title: 'Backyard Perimeter Scout',
    quote: '“Peanuts spotted at 12 o’clock! Sounding the flock perimeter alert!”',
    video: bluejayAnimated,
    poster: bluejayCharacter,
    theme: {
      accentGlow: 'from-sky-400/25 via-blue-300/10 to-transparent',
      badgeBg: 'bg-sky-600 text-white shadow-sky-200',
      cardBorder: 'border-sky-200/90 shadow-sky-100/50',
      tagBg: 'bg-sky-100 text-sky-900 border-sky-300',
      tagText: 'text-sky-700',
      quoteBubble: 'border-sky-200/80 bg-white/95 text-sky-950',
    },
  },
  {
    id: 'turkey',
    name: 'Mayor Gobbles',
    species: 'Wild Turkey',
    badge: 'Ground Patrol Chief 🦃',
    title: 'Under-Feeder Cleanup Specialist',
    quote: '“Dropped seeds? No problem! Ground cleanup squad is on duty.”',
    video: turkeyAnimated,
    poster: turkeyCharacter,
    scaleClass: 'scale-[1.22] sm:scale-[1.26] md:scale-[1.30] origin-center',
    theme: {
      accentGlow: 'from-amber-600/25 via-emerald-600/10 to-transparent',
      badgeBg: 'bg-amber-700 text-white shadow-amber-200',
      cardBorder: 'border-amber-300/90 shadow-amber-100/50',
      tagBg: 'bg-amber-100 text-amber-900 border-amber-300',
      tagText: 'text-amber-800',
      quoteBubble: 'border-amber-200/80 bg-white/95 text-amber-950',
    },
  },
];

export const HeroSection: React.FC<HeroSectionProps> = ({
  onExploreGallery,
}) => {
  // Randomly pick one mascot on initial mount / site refresh
  const [mascotIndex, setMascotIndex] = useState<number>(() => {
    return Math.floor(Math.random() * MASCOTS.length);
  });

  const currentMascot = MASCOTS[mascotIndex] || MASCOTS[0];

  // Quick-shuffle to cycle to next mascot without full reload
  const handleShuffleMascot = () => {
    setMascotIndex((prev) => (prev + 1) % MASCOTS.length);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-sky-50/25 to-white pt-8 pb-12 sm:pt-12 sm:pb-16 border-b border-stone-200/70">
      
      {/* Decorative ambient background accents */}
      <div 
        className={`absolute -top-24 left-1/4 w-96 h-96 rounded-full bg-radial ${currentMascot.theme.accentGlow} blur-3xl pointer-events-none transition-all duration-700`}
        aria-hidden="true" 
      />
      <div 
        className="absolute top-1/2 -right-20 w-80 h-80 rounded-full bg-radial from-sky-300/15 to-transparent blur-3xl pointer-events-none"
        aria-hidden="true" 
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* RESPONSIVE LAYOUT:
            - Mobile (< 768px): Clean stack (Mascot Showcase -> Headline & Subtitle & CTA)
            - Tablet & Desktop (>= 768px): 2-column grid (Left: Featured Mascot, Right: Headline & CTA)
        */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* LEFT COLUMN: The Single Randomly Selected Mascot Character Card */}
          <div className="md:col-span-5 flex flex-col items-center justify-center">
            
            <div className={`w-full max-w-[280px] sm:max-w-[300px] md:max-w-[310px] bg-white/90 backdrop-blur-md p-4 sm:p-5 rounded-3xl border ${currentMascot.theme.cardBorder} shadow-xl relative transition-all duration-300 hover:shadow-2xl`}>
              
              {/* Card Header: Mascot Badge and Switch Bird Button */}
              <div className="flex items-center justify-between gap-2 pb-1.5">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-pixar-sub font-bold ${currentMascot.theme.tagBg}`}>
                  {currentMascot.badge}
                </span>

                {/* Quick Shuffle button */}
                <button
                  onClick={handleShuffleMascot}
                  className="inline-flex items-center gap-1 text-[11px] font-pixar-sub font-semibold text-stone-500 hover:text-stone-900 bg-stone-100 hover:bg-stone-200/80 px-2 py-0.5 rounded-full transition-colors cursor-pointer"
                  title="Switch to another mascot bird"
                >
                  <RefreshCw className="w-3 h-3 text-stone-500" />
                  <span>Switch</span>
                </button>
              </div>

              {/* The Pixar Bird: Transparent video playing continuously in loop - uncropped full body */}
              <div className="relative w-full h-[240px] sm:h-[260px] md:h-[285px] mx-auto flex items-center justify-center my-0.5">
                {/* Soft circular background glow behind mascot */}
                <div 
                  className={`absolute inset-2 rounded-full bg-radial ${currentMascot.theme.accentGlow} blur-xl pointer-events-none`}
                  aria-hidden="true" 
                />

                {currentMascot.video ? (
                  <TransparentVideo
                    key={currentMascot.id}
                    src={currentMascot.video}
                    poster={currentMascot.poster}
                    isPlaying={true}
                    loop={true}
                    loopDelay={15000}
                    className={`w-full h-full relative z-10 ${currentMascot.scaleClass || ''}`}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center relative z-10 animate-fade-in p-1">
                    <img
                      src={currentMascot.poster}
                      alt={currentMascot.name}
                      className={`w-full h-full max-h-[260px] object-contain mix-blend-multiply drop-shadow-lg transition-transform duration-500 hover:scale-105 animate-mascot-float ${currentMascot.scaleClass || ''}`}
                    />
                  </div>
                )}
              </div>

              {/* Mascot Info & Personality Quote */}
              <div className="space-y-1.5 text-center pt-1">
                <div>
                  <h3 className="font-pixar-title text-lg sm:text-xl text-stone-900 tracking-wide leading-tight">
                    {currentMascot.name}
                  </h3>
                  <p className="font-pixar-sub text-[11px] sm:text-xs font-semibold text-stone-500">
                    {currentMascot.species} • {currentMascot.title}
                  </p>
                </div>

                {/* Speech Bubble */}
                <div className={`p-2.5 rounded-2xl border ${currentMascot.theme.quoteBubble} shadow-xs text-left relative`}>
                  <p className="font-pixar-sub text-xs italic leading-relaxed text-stone-700">
                    {currentMascot.quote}
                  </p>
                </div>
              </div>

            </div>

          </div>

          {/* RIGHT COLUMN: Hero Headline, Subtitle, and Primary CTA */}
          <div className="md:col-span-7 flex flex-col items-center md:items-start text-center md:text-left space-y-6">
            
            {/* Pixar-style Main Headline */}
            <h1 className="font-pixar-title text-4xl sm:text-5xl lg:text-6xl tracking-wide text-stone-900 leading-[1.12]">
              <div>MEET THE</div>
              <div className="text-sky-500 relative inline-block">
                BACKYARD FLOCK
                <span className="absolute left-full ml-1.5 -top-1 text-amber-400 font-pixar-sub text-3xl sm:text-4xl lg:text-5xl animate-bounce pointer-events-none select-none">
                  ✦
                </span>
              </div>
            </h1>

            {/* Subtitle */}
            <p className="font-pixar-sub text-stone-600 text-base sm:text-lg max-w-xl font-medium leading-relaxed">
              Look who's stopping by for a snack, track your favorite feathered regulars, and get to know the quirky characters living right outside your window.
            </p>

            {/* Primary Action Button */}
            <div className="pt-2 flex items-center justify-center md:justify-start w-full sm:w-auto">
              <button
                onClick={onExploreGallery}
                className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-sky-500 hover:bg-sky-600 active:translate-y-0.5 text-white font-pixar-sub font-bold text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2.5 border-b-2 border-sky-600 shadow-md shadow-sky-500/20 hover:scale-105"
              >
                <Eye className="w-4.5 h-4.5" />
                <span>See Who Dropped By</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
