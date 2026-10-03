import React from 'react';
import { Feather, Heart, Camera } from 'lucide-react';
import { BirdfyDevice } from '../types';
import logoImg from '../assets/images/cardinal_logo_1785078694540.jpg';

interface FooterProps {
  onTabChange: (tab: 'home' | 'gallery' | 'species' | 'analytics') => void;
  onOpenBirdfyInfo?: () => void;
  birdfyDevice?: BirdfyDevice;
}

export const Footer: React.FC<FooterProps> = ({ onTabChange, onOpenBirdfyInfo, birdfyDevice }) => {
  return (
    <footer className="bg-stone-950 text-stone-400 py-12 text-xs border-t-2 border-stone-800 font-pixar-body">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b-2 border-stone-800/80">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white text-stone-950 flex items-center justify-center shadow-md shadow-amber-500/20 border-2 border-white/20 overflow-hidden shrink-0">
              <img src={logoImg} alt="Peep & Perch Cardinal Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-pixar-title text-2xl text-white tracking-wide">Peep &amp; Perch</span>
                <span className="text-[10px] font-pixar-sub font-bold text-amber-300 bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-800/80 shadow-2xs">
                  Backyard Aviary Club 🌿
                </span>
              </div>
              <p className="font-pixar-sub text-xs text-stone-400 font-semibold">
                Tracking, photo memories, &amp; song guides for home backyard birds.
              </p>
            </div>
          </div>

          {/* Quick Nav Links & Feeder Info */}
          <div className="flex flex-wrap items-center gap-6 text-stone-300 font-pixar-sub font-bold text-xs">
            <button onClick={() => onTabChange('gallery')} className="hover:text-amber-400 transition cursor-pointer">
              Who Dropped By
            </button>
            <button onClick={() => onTabChange('species')} className="hover:text-amber-400 transition cursor-pointer">
              Meet the Locals
            </button>
            <button onClick={() => onTabChange('analytics')} className="hover:text-amber-400 transition cursor-pointer">
              Flock Trends
            </button>
            {onOpenBirdfyInfo && (
              <button
                onClick={onOpenBirdfyInfo}
                className="px-4 py-2 rounded-full bg-stone-900 hover:bg-stone-800 text-stone-200 hover:text-white font-pixar-sub font-bold text-xs flex items-center gap-2 border border-stone-700 shadow-sm transition-all cursor-pointer hover:scale-105 active:scale-95"
                title="Open Birdfy Feeder Status & Controls"
              >
                <Camera className="w-3.5 h-3.5 text-amber-400" />
                <span>Feeder Info ({birdfyDevice?.batteryPercent || 96}%)</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </button>
            )}
          </div>

        </div>

        {/* Bottom copyright & status */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-stone-500 text-xs font-pixar-sub font-semibold">
          <div>
            © 2026 Peep &amp; Perch Backyard Bird Club Inc. Dedicated to backyard wildlife lovers &amp; home garden aviaries.
          </div>

          <div className="flex items-center gap-2 bg-stone-900 px-3.5 py-1.5 rounded-full border border-stone-800">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-stone-300 text-[11px] font-bold">Backyard Feeder Stations Active • Photo Journal Ready</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
