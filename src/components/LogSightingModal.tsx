import React, { useState } from 'react';
import { BirdSighting, BirdSpecies, GardenLocation, BehaviorType } from '../types';
import { BACKYARD_SPECIES } from '../data/birdsData';
import { X, Plus, Sparkles, MapPin, Camera, Calendar, Clock, User, Feather } from 'lucide-react';

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
  const [location, setLocation] = useState<GardenLocation>('Tube Feeder');
  const [behavior, setBehavior] = useState<BehaviorType>('Feeder Snack');
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
      notes: notes || `Spotted a cheerful ${speciesName} at the ${location}!`,
      isFavorite: false,
      spottedBy: spottedBy || 'Yard Observer',
      temperature: weather.includes('°F') ? weather.split(',')[1] || '72°F' : '72°F',
    };

    onAddSighting(newSighting);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-stone-200 my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center text-xl shadow-xs">
            📸
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-stone-900">
              Log Backyard Bird Sighting
            </h3>
            <p className="text-xs text-stone-500">
              Record a feathered visitor seen in your home garden or feeder.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Species Selection */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Bird Species
            </label>
            <select
              value={selectedSpeciesId}
              onChange={(e) => setSelectedSpeciesId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
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
                className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          )}

          {/* Photo Preview */}
          <div className="flex items-center gap-3 bg-amber-50 p-3 rounded-2xl border border-amber-200/80">
            <img
              src={selectedSpeciesObj.imageUrl}
              alt={selectedSpeciesObj.name}
              referrerPolicy="no-referrer"
              className="w-14 h-14 rounded-xl object-cover border border-amber-300 shadow-xs"
            />
            <div className="text-xs">
              <span className="font-bold text-stone-900 block">{selectedSpeciesObj.name}</span>
              <span className="text-stone-500 text-[11px] block">{selectedSpeciesObj.favoriteFood}</span>
              <span className="text-emerald-800 text-[10px] font-mono font-semibold">Photo Attached ✓</span>
            </div>
          </div>

          {/* Location & Behavior Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Garden Location
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value as GardenLocation)}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold text-stone-900"
              >
                <option value="Tube Feeder">Tube Feeder 🌻</option>
                <option value="Birdbath">Birdbath ⛲</option>
                <option value="Berry Bush">Berry Bush 🌺</option>
                <option value="Suet Station">Suet Station 🥜</option>
                <option value="Lawn & Patio">Lawn & Patio 🏡</option>
                <option value="Oak Branch">Oak Branch 🌳</option>
                <option value="Nest Box">Nest Box 🪺</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Behavior Observed
              </label>
              <select
                value={behavior}
                onChange={(e) => setBehavior(e.target.value as BehaviorType)}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold text-stone-900"
              >
                <option value="Feeder Snack">Feeder Snack 🌽</option>
                <option value="Water Bathing">Water Bathing 💦</option>
                <option value="Perched & Singing">Perched & Singing 🎶</option>
                <option value="Foraging on Ground">Foraging on Ground 🐛</option>
                <option value="Preening Feathers">Preening Feathers 🪶</option>
                <option value="Nesting Material">Nesting Material 🪹</option>
              </select>
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
                className="w-full px-2.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">Time</label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="08:30 AM"
                className="w-full px-2.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium"
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
                className="w-full px-2.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold"
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
                className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">Weather & Temp</label>
              <input
                type="text"
                value={weather}
                onChange={(e) => setWeather(e.target.value)}
                placeholder="Sunny, 72°F"
                className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium"
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
              placeholder="What did you observe? (e.g. chirping loudly, bathing in fountain water, eating sunflower seeds...)"
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Save Sighting to Garden Journal</span>
          </button>

        </form>

      </div>
    </div>
  );
};
