import React, { useState } from 'react';
import { Feather, BookOpen, BarChart3, Menu, X, Home } from 'lucide-react';
import logoImg from '../assets/images/cardinal_logo_1785078694540.jpg';

interface NavbarProps {
  activeTab: 'home' | 'gallery' | 'species' | 'analytics';
  onTabChange: (tab: 'home' | 'gallery' | 'species' | 'analytics') => void;
  onGoHome: () => void;
  onOpenLogModal?: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  birdfyStatus?: 'online' | 'syncing' | 'offline';
  isSyncingBirdfy?: boolean;
  onSyncBirdfy?: () => void;
  onOpenBirdfySettings?: () => void;
  onOpenBirdfyInfo?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onGoHome,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b-2 border-sky-100 shadow-md shadow-sky-900/5 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Pixar-inspired Logo */}
          <div 
            onClick={onGoHome}
            className="flex items-center gap-3 cursor-pointer group select-none"
            title="Go to Home / Top"
          >
            <div className="relative w-12 h-12 rounded-2xl bg-white text-stone-950 flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 border-2 border-white ring-2 ring-amber-400/40 overflow-hidden">
              <img src={logoImg} alt="Peep & Perch Cardinal Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-pixar-title text-2xl sm:text-3xl tracking-wide text-stone-900 drop-shadow-xs group-hover:text-sky-600 transition-colors">
                  PEEP <span className="text-amber-500">&amp;</span> PERCH
                </span>
              </div>
              <p className="text-[11px] font-pixar-sub font-semibold text-stone-500 hidden sm:block tracking-wide">
                Birdfy AI Feeder &amp; Backyard Journal
              </p>
            </div>
          </div>

          {/* Pixar-style Nav Tabs */}
          <nav className="hidden md:flex items-center gap-1.5 bg-stone-100/90 p-1.5 rounded-full border-2 border-stone-200/80 shadow-inner">
            <button
              onClick={onGoHome}
              className={`px-3.5 py-2.5 rounded-full text-xs font-pixar-sub font-bold tracking-wide transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'home'
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30 scale-105 border-b-2 border-sky-700'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/80 hover:scale-102'
              }`}
              title="Home / Back to top"
            >
              <Home className={`w-4 h-4 ${activeTab === 'home' ? 'text-amber-300' : 'text-sky-500'}`} />
              <span>Home</span>
            </button>

            <button
              onClick={() => onTabChange('gallery')}
              className={`px-4.5 py-2.5 rounded-full text-xs font-pixar-sub font-bold tracking-wide transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                activeTab === 'gallery'
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30 scale-105 border-b-2 border-sky-700'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/80 hover:scale-102'
              }`}
            >
              <Feather className={`w-4 h-4 ${activeTab === 'gallery' ? 'text-amber-300' : 'text-amber-500'}`} />
              <span>Who Dropped By</span>
            </button>

            <button
              onClick={() => onTabChange('species')}
              className={`px-4.5 py-2.5 rounded-full text-xs font-pixar-sub font-bold tracking-wide transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                activeTab === 'species'
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30 scale-105 border-b-2 border-sky-700'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/80 hover:scale-102'
              }`}
            >
              <BookOpen className={`w-4 h-4 ${activeTab === 'species' ? 'text-amber-300' : 'text-sky-500'}`} />
              <span>Meet the Locals</span>
            </button>

            <button
              onClick={() => onTabChange('analytics')}
              className={`px-4.5 py-2.5 rounded-full text-xs font-pixar-sub font-bold tracking-wide transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30 scale-105 border-b-2 border-sky-700'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/80 hover:scale-102'
              }`}
            >
              <BarChart3 className={`w-4 h-4 ${activeTab === 'analytics' ? 'text-amber-300' : 'text-indigo-500'}`} />
              <span>Flock Trends</span>
            </button>
          </nav>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-2xl bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t-2 border-sky-100 space-y-2 animate-fade-in font-pixar-sub">
            <button
              onClick={() => { onGoHome(); setMobileMenuOpen(false); }}
              className={`w-full p-3 rounded-2xl text-left text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'home' ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20' : 'text-stone-700 hover:bg-stone-100'
              }`}
            >
              <Home className={`w-4 h-4 ${activeTab === 'home' ? 'text-amber-300' : 'text-sky-500'}`} />
              <span>Home</span>
            </button>

            <button
              onClick={() => { onTabChange('gallery'); setMobileMenuOpen(false); }}
              className={`w-full p-3 rounded-2xl text-left text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'gallery' ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20' : 'text-stone-700 hover:bg-stone-100'
              }`}
            >
              <Feather className="w-4 h-4" />
              <span>Who Dropped By (Birdfy Gallery)</span>
            </button>

            <button
              onClick={() => { onTabChange('species'); setMobileMenuOpen(false); }}
              className={`w-full p-3 rounded-2xl text-left text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'species' ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20' : 'text-stone-700 hover:bg-stone-100'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Meet the Locals</span>
            </button>

            <button
              onClick={() => { onTabChange('analytics'); setMobileMenuOpen(false); }}
              className={`w-full p-3 rounded-2xl text-left text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'analytics' ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20' : 'text-stone-700 hover:bg-stone-100'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Flock Trends</span>
            </button>
          </div>
        )}

      </div>
    </header>
  );
};
