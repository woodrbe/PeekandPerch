import React, { useState } from 'react';
import { Feather, BookOpen, BarChart3, Plus, Search, Menu, X } from 'lucide-react';

interface NavbarProps {
  activeTab: 'gallery' | 'species' | 'analytics';
  onTabChange: (tab: 'gallery' | 'species' | 'analytics') => void;
  onOpenLogModal: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onOpenLogModal,
  searchQuery,
  onSearchChange,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#FAF9F6]/95 backdrop-blur-md border-b border-amber-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Whimsical Logo - Peep & Perch */}
          <div 
            onClick={() => onTabChange('gallery')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-11 h-11 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center text-2xl shadow-sm group-hover:scale-105 group-hover:rotate-3 transition-transform duration-200 border border-amber-500/30">
              🐦
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-sans text-xl sm:text-2xl font-black tracking-tight text-stone-900">
                  Peep & Perch
                </span>
                <span className="hidden sm:inline-block text-[10px] font-mono font-bold uppercase tracking-widest text-amber-900 bg-amber-200/90 px-2 py-0.5 rounded-full border border-amber-300">
                  Backyard Aviary 🏡
                </span>
              </div>
              <p className="text-[11px] font-medium text-stone-500 hidden sm:block">
                Home Backyard Bird Tracker & Field Log
              </p>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1.5 bg-stone-200/60 p-1.5 rounded-2xl border border-stone-300/50">
            <button
              onClick={() => onTabChange('gallery')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'gallery'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/50'
              }`}
            >
              <Feather className="w-4 h-4 text-amber-600" />
              <span>Sightings Log</span>
            </button>

            <button
              onClick={() => onTabChange('species')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'species'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/50'
              }`}
            >
              <BookOpen className="w-4 h-4 text-sky-600" />
              <span>Field Guide</span>
            </button>

            <button
              onClick={() => onTabChange('analytics')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'analytics'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/50'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <span>Yard Stats</span>
            </button>
          </nav>

          {/* Quick Actions & Log Button */}
          <div className="flex items-center gap-3">
            
            {/* Quick Search Bar */}
            <div className="relative hidden lg:block w-48">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search bird or note..."
                className="w-full pl-8 pr-3 py-1.5 text-xs font-medium rounded-xl bg-white border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-400 text-stone-900"
              />
            </div>

            {/* Log Bird Sighting CTA */}
            <button
              onClick={onOpenLogModal}
              className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-md shadow-amber-500/20 transition-all border border-amber-600/30 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Log Sighting</span>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-stone-100 text-stone-700 hover:bg-stone-200"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>

        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-amber-200 space-y-2 animate-fade-in">
            <button
              onClick={() => { onTabChange('gallery'); setMobileMenuOpen(false); }}
              className={`w-full p-3 rounded-xl text-left text-xs font-bold flex items-center gap-2 ${
                activeTab === 'gallery' ? 'bg-amber-100 text-amber-950 font-black' : 'text-stone-700'
              }`}
            >
              <Feather className="w-4 h-4 text-amber-600" />
              <span>Sightings Log</span>
            </button>

            <button
              onClick={() => { onTabChange('species'); setMobileMenuOpen(false); }}
              className={`w-full p-3 rounded-xl text-left text-xs font-bold flex items-center gap-2 ${
                activeTab === 'species' ? 'bg-amber-100 text-amber-950 font-black' : 'text-stone-700'
              }`}
            >
              <BookOpen className="w-4 h-4 text-sky-600" />
              <span>Field Guide</span>
            </button>

            <button
              onClick={() => { onTabChange('analytics'); setMobileMenuOpen(false); }}
              className={`w-full p-3 rounded-xl text-left text-xs font-bold flex items-center gap-2 ${
                activeTab === 'analytics' ? 'bg-amber-100 text-amber-950 font-black' : 'text-stone-700'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <span>Yard Stats</span>
            </button>

            <div className="pt-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search bird or note..."
                className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-stone-300"
              />
            </div>
          </div>
        )}

      </div>
    </header>
  );
};
