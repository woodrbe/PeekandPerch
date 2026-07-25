import React from 'react';
import { Feather, Heart, Plus } from 'lucide-react';

interface FooterProps {
  onTabChange: (tab: 'gallery' | 'species' | 'analytics') => void;
  onOpenLogModal: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onTabChange, onOpenLogModal }) => {
  return (
    <footer className="bg-stone-950 text-stone-400 py-12 text-xs border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-stone-800">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center font-bold text-xl shadow-xs">
              🐦
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold text-white tracking-tight">Peep & Perch</span>
                <span className="text-[10px] font-mono text-amber-300 bg-amber-950 px-2 py-0.5 rounded-full border border-amber-800/60">
                  Backyard Aviary Club 🌿
                </span>
              </div>
              <p className="text-[11px] text-stone-500">
                Tracking, photo memories, & song guides for home backyard birds.
              </p>
            </div>
          </div>

          {/* Quick Nav Links */}
          <div className="flex flex-wrap items-center gap-6 text-stone-300 font-medium">
            <button onClick={() => onTabChange('gallery')} className="hover:text-amber-400 transition cursor-pointer">
              Sightings Log
            </button>
            <button onClick={() => onTabChange('species')} className="hover:text-amber-400 transition cursor-pointer">
              Species Field Guide
            </button>
            <button onClick={() => onTabChange('analytics')} className="hover:text-amber-400 transition cursor-pointer">
              Yard Stats
            </button>
            <button onClick={onOpenLogModal} className="text-amber-400 font-bold hover:underline transition cursor-pointer flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" />
              <span>Log Sighting</span>
            </button>
          </div>

        </div>

        {/* Bottom copyright & status */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-stone-500 text-[11px]">
          <div>
            © 2026 Peep & Perch Backyard Bird Club Inc. Dedicated to backyard wildlife lovers & home garden aviaries.
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-stone-400 font-mono">Backyard Feeder Stations Active • Photo Journal Ready</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
