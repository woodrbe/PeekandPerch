import React, { useState } from 'react';
import { BirdSighting, BirdSpecies, GardenLocation, BehaviorType } from '../types';
import { BACKYARD_SPECIES } from '../data/birdsData';
import { X, Plus, Sparkles, Camera, Calendar, Clock, User, Feather } from 'lucide-react';

interface LogSightingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSighting: (sighting: BirdSighting) => void;
}

export const LogSightingModal: React.FC<LogSightingModalProps> = ({
  isOpen,
  onClose,
  onAddSighting,
}) => {
  if (!isOpen) return null;

  const [selectedSpeciesId, setSelectedSpeciesId] = useState<string>(BACKYARD_SPECIES[0].id);
  const [customSpeciesName, setCustomSpeciesName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('08:30 AM');
  const [location] = useState<GardenLocation>('Tube Feeder');
  const [behavior] = useState<BehaviorType>('Feeder Snack');
  const [count, setCount] = useState<number>(1);
  const [weather, setWeather] = useState('Sunny & Pleasant, 72°F');
  const [notes, setNotes] = useState('');
  const [spottedBy, setSpottedBy] = useState('Yard Observer');

  const selectedSpeciesObj = BACKYARD_SPECIES.find((s) => s.id === selectedSpeciesId) || BACKYARD_SPECIES[0];
  const [customImage, setCustomImage] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const speciesName = selectedSpeciesId === 'custom' 
      ? (customSpeciesName || 'Backyard Visitor')
      : selectedSpeciesObj.name;

    const imageUrl = customImage || selectedSpeciesObj.imageUrl;

    const newSighting: BirdSighting = {
      id: `sighting-${Date.now()}`,
      speciesId: selectedSpeciesId,
      speciesName,
      imageUrl,
      date,
      time,
      location,
      behavior,
      weather,
      count: Number(count),
      notes: notes || `Spotted a cheerful ${speciesName}!`,
      isFavorite: false,
      spottedBy: spottedBy || 'Yard Observer',
      temperature: weather.includes('°F') ? weather.split(',')[1] || '72°F' : '72°F',
    };

    onAddSighting(newSighting);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-md animate-fade-in overflow-y-auto font-pixar-body">
      <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-sky-100 my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 text-stone-950 flex items-center justify-center text-2xl shadow-md shadow-amber-500/20 border-2 border-white ring-2 ring-amber-300/40">
            📸
          </div>
          <div>
            <h3 className="font-pixar-title text-2xl text-stone-900">
              LOG BACKYARD BIRD SIGHTING
            </h3>
            <p className="font-pixar-sub font-semibold text-xs text-stone-500">
              Record a feathered visitor seen in your home garden or feeder!
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 font-pixar-sub">
          
          {/* Species Selection */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Bird Species
            </label>
            <select
              value={selectedSpeciesId}
              onChange={(e) => setSelectedSpeciesId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-full bg-stone-50 border-2 border-stone-200 text-xs font-bold text-stone-900 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-200 cursor-pointer"
            >
              {BACKYARD_SPECIES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.rarityInBackyard})
                </option>
              ))}
              <option value="custom">+ Other / Unidentified Backyard Bird</option>
            </select>
          </div>

          {selectedSpeciesId === 'custom' && (
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Custom Species Name
              </label>
              <input
                type="text"
                required
                value={customSpeciesName}
                onChange={(e) => setCustomSpeciesName(e.target.value)}
                placeholder="e.g. Downy Woodpecker or Mourning Dove"
                className="w-full px-4 py-2.5 rounded-full bg-stone-50 border-2 border-stone-200 text-xs font-semibold focus:outline-none focus:border-sky-400"
              />
            </div>
          )}

          {/* Photo Preview */}
          <div className="flex items-center gap-3 bg-amber-50 p-3.5 rounded-2xl border-2 border-amber-200/80">
            <img
              src={selectedSpeciesObj.imageUrl}
              alt={selectedSpeciesObj.name}
              referrerPolicy="no-referrer"
              className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-300 shadow-xs"
            />
            <div className="text-xs">
              <span className="font-pixar-title text-stone-900 text-sm block">{selectedSpeciesObj.name}</span>
              <span className="text-stone-600 text-[11px] block font-semibold">{selectedSpeciesObj.favoriteFood}</span>
              <span className="text-emerald-800 text-[10px] font-bold">Photo Attached ✓</span>
            </div>
          </div>


          {/* Date, Time & Count */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-full bg-stone-50 border-2 border-stone-200 text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">Time</label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="08:30 AM"
                className="w-full px-3 py-2 rounded-full bg-stone-50 border-2 border-stone-200 text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">Birds Count</label>
              <input
                type="number"
                min="1"
                max="50"
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-full bg-stone-50 border-2 border-stone-200 text-xs font-bold text-center"
              />
            </div>
          </div>

          {/* Observer Name & Weather */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">Spotted By</label>
              <input
                type="text"
                value={spottedBy}
                onChange={(e) => setSpottedBy(e.target.value)}
                placeholder="Your Name / Family Member"
                className="w-full px-4 py-2 rounded-full bg-stone-50 border-2 border-stone-200 text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">Weather &amp; Temp</label>
              <input
                type="text"
                value={weather}
                onChange={(e) => setWeather(e.target.value)}
                placeholder="Sunny, 72°F"
                className="w-full px-4 py-2 rounded-full bg-stone-50 border-2 border-stone-200 text-xs font-semibold"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Field Observation Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did you observe? (e.g. chirping loudly, bathing in fountain water...)"
              className="w-full px-4 py-3 rounded-2xl bg-stone-50 border-2 border-stone-200 text-xs font-pixar-body font-semibold focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 active:translate-y-0.5 text-stone-950 font-pixar-title text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 border-b-3 border-amber-700 cursor-pointer transition-all hover:scale-102"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Save Sighting to Garden Journal</span>
          </button>

        </form>

      </div>
    </div>
  );
};
