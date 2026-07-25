import React from 'react';
import { BirdSighting, BirdSpecies } from '../types';
import { X, Star, Calendar, MapPin, Feather, Trash2, ChevronLeft, ChevronRight, User, Sun } from 'lucide-react';

interface SightingDetailModalProps {
  sighting: BirdSighting | null;
  speciesObj?: BirdSpecies;
  onClose: () => void;
  onDeleteSighting: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onNextSighting?: () => void;
  onPrevSighting?: () => void;
}

export const SightingDetailModal: React.FC<SightingDetailModalProps> = ({
  sighting,
  speciesObj,
  onClose,
  onDeleteSighting,
  onToggleFavorite,
  onNextSighting,
  onPrevSighting,
}) => {
  if (!sighting) return null;

  const handleDelete = () => {
    if (confirm(`Delete the "${sighting.speciesName}" sighting record from your garden log?`)) {
      onDeleteSighting(sighting.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-amber-200 flex flex-col md:flex-row max-h-[90vh]">
        
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-stone-900/80 text-white hover:bg-stone-900 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* LEFT / TOP: High Res Photo View */}
        <div className="relative md:w-1/2 bg-stone-900 flex items-center justify-center overflow-hidden group">
          <img
            src={sighting.imageUrl}
            alt={sighting.speciesName}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover max-h-80 md:max-h-full"
          />

          {/* Quick Nav Chevron Overlay */}
          {onPrevSighting && (
            <button
              onClick={onPrevSighting}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-stone-900/70 text-white hover:bg-stone-900 transition"
              title="Previous photo"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {onNextSighting && (
            <button
              onClick={onNextSighting}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-stone-900/70 text-white hover:bg-stone-900 transition"
              title="Next photo"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {/* Star Favorite Badge */}
          <button
            onClick={() => onToggleFavorite(sighting.id)}
            className={`absolute top-4 left-4 p-2.5 rounded-full backdrop-blur-md transition ${
              sighting.isFavorite ? 'bg-rose-500 text-white shadow-lg' : 'bg-white/80 text-stone-800'
            }`}
          >
            <Star className={`w-4 h-4 ${sighting.isFavorite ? 'fill-white' : ''}`} />
          </button>
        </div>

        {/* RIGHT / BOTTOM: Observations & Details */}
        <div className="p-6 md:w-1/2 flex flex-col justify-between overflow-y-auto space-y-4">
          
          <div className="space-y-4">
            
            {/* Species Header */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                  {sighting.location}
                </span>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  x{sighting.count} spotted
                </span>
              </div>

              <h2 className="text-2xl font-black text-stone-900">
                {sighting.speciesName}
              </h2>

              {speciesObj?.scientificName && (
                <p className="text-xs italic text-stone-500 font-serif">
                  {speciesObj.scientificName}
                </p>
              )}
            </div>

            {/* Time & Observer Metadata */}
            <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 space-y-2 text-xs">
              <div className="flex items-center justify-between text-stone-600">
                <span className="flex items-center gap-1 font-mono">
                  <Calendar className="w-3.5 h-3.5 text-amber-600" />
                  {sighting.date} at {sighting.time}
                </span>
                <span className="flex items-center gap-1 font-semibold text-stone-800">
                  <User className="w-3.5 h-3.5 text-stone-400" />
                  {sighting.spottedBy}
                </span>
              </div>

              <div className="flex items-center justify-between text-stone-600 border-t border-stone-200/60 pt-2">
                <span>Behavior: <strong className="text-stone-900">{sighting.behavior}</strong></span>
                <span>{sighting.weather}</span>
              </div>
            </div>

            {/* Field Observation Notes */}
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider font-mono">
                Field Observation Notes
              </h4>
              <p className="text-xs text-stone-700 bg-amber-50/60 p-3 rounded-2xl border border-amber-200/80 leading-relaxed italic">
                "{sighting.notes}"
              </p>
            </div>

            {/* Species Favorite Treat & Call */}
            {speciesObj && (
              <div className="space-y-2 text-xs pt-2 border-t border-stone-100">
                <div>
                  <span className="font-bold text-stone-800">Favorite Backyard Treat: </span>
                  <span className="text-stone-600">{speciesObj.favoriteFood}</span>
                </div>

                <div>
                  <span className="font-bold text-stone-800">Song / Call: </span>
                  <span className="text-stone-600">{speciesObj.callDescription}</span>
                </div>
              </div>
            )}

          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
            <button
              onClick={handleDelete}
              className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Record</span>
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs transition"
            >
              Close Lightbox
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
