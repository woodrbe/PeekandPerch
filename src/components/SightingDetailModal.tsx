import React, { useState, useEffect } from 'react';
import { BirdSighting, BirdSpecies } from '../types';
import { BACKYARD_SPECIES } from '../data/birdsData';
import { 
  X, Star, Calendar, Trash2, ChevronLeft, 
  ChevronRight, User, Sun, Camera, Sparkles, BatteryCharging, 
  Wifi, Zap, ShieldCheck, Video, Play, Image as ImageIcon, ExternalLink
} from 'lucide-react';

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

  const isBirdfy = sighting.birdfy?.isBirdfyCapture;
  const videoUrl = sighting.videoUrl || sighting.birdfy?.videoUrl;

  const [activeMedia, setActiveMedia] = useState<'photo' | 'video'>('photo');

  useEffect(() => {
    setActiveMedia('photo');
  }, [sighting.id]);

  const handleDelete = () => {
    if (confirm(`Delete the "${sighting.speciesName}" sighting record from your garden log?`)) {
      onDeleteSighting(sighting.id);
      onClose();
    }
  };

  const catalogFallback = speciesObj?.imageUrl || BACKYARD_SPECIES.find(b => b.name.toLowerCase() === sighting.speciesName.toLowerCase())?.imageUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md animate-fade-in font-pixar-body">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-sky-100 flex flex-col md:flex-row max-h-[92vh]">
        
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-stone-900/80 text-white hover:bg-stone-900 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* LEFT / TOP: High Res Photo / Video View */}
        <div className="relative md:w-1/2 bg-stone-950 flex items-center justify-center overflow-hidden group">
          {activeMedia === 'video' && videoUrl ? (
            <video
              key={videoUrl}
              src={videoUrl}
              controls
              autoPlay
              playsInline
              className="w-full h-full object-contain max-h-80 md:max-h-full bg-black"
            />
          ) : (
            <img
              src={sighting.imageUrl || catalogFallback}
              alt={sighting.speciesName}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover max-h-80 md:max-h-full"
              onError={(e) => {
                if (catalogFallback && e.currentTarget.src !== catalogFallback) {
                  e.currentTarget.src = catalogFallback;
                }
              }}
            />
          )}

          {/* Media Switcher Pill (Photo / Video) */}
          {videoUrl && (
            <div className="absolute top-4 left-16 z-20 flex items-center bg-stone-900/85 backdrop-blur-md p-1 rounded-full border border-stone-700 shadow-md">
              <button
                onClick={() => setActiveMedia('photo')}
                className={`px-3 py-1 rounded-full text-xs font-pixar-sub font-bold flex items-center gap-1 transition ${
                  activeMedia === 'photo' ? 'bg-amber-400 text-stone-950 shadow-sm' : 'text-stone-300 hover:text-white'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Photo</span>
              </button>
              <button
                onClick={() => setActiveMedia('video')}
                className={`px-3 py-1 rounded-full text-xs font-pixar-sub font-bold flex items-center gap-1 transition ${
                  activeMedia === 'video' ? 'bg-amber-400 text-stone-950 shadow-sm' : 'text-stone-300 hover:text-white'
                }`}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Video</span>
              </button>
            </div>
          )}

          {/* Birdfy AI Match Watermark Badge (when no video switcher) */}
          {!videoUrl && isBirdfy && (
            <div className="absolute top-4 left-16 px-3 py-1 rounded-full bg-stone-900/90 text-amber-300 text-xs font-pixar-sub font-bold backdrop-blur-md flex items-center gap-1.5 shadow-lg border border-amber-400/40">
              <Camera className="w-3.5 h-3.5 text-sky-400" />
              <span>Birdfy 1080p AI Capture</span>
            </div>
          )}

          {/* Quick Nav Chevron Overlay */}
          {onPrevSighting && (
            <button
              onClick={onPrevSighting}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-stone-900/70 text-white hover:bg-stone-900 transition cursor-pointer"
              title="Previous photo"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {onNextSighting && (
            <button
              onClick={onNextSighting}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-stone-900/70 text-white hover:bg-stone-900 transition cursor-pointer"
              title="Next photo"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {/* Star Favorite Badge */}
          <button
            onClick={() => onToggleFavorite(sighting.id)}
            className={`absolute top-4 left-4 p-2.5 rounded-full backdrop-blur-md transition-all cursor-pointer ${
              sighting.isFavorite ? 'bg-rose-500 text-white shadow-lg scale-110' : 'bg-white/80 text-stone-800 hover:bg-white'
            }`}
          >
            <Star className={`w-4 h-4 ${sighting.isFavorite ? 'fill-white' : ''}`} />
          </button>
        </div>

        {/* RIGHT / BOTTOM: Observations, AI Identification & Hardware Details */}
        <div className="p-6 md:w-1/2 flex flex-col justify-between overflow-y-auto space-y-4">
          
          <div className="space-y-4">
            
            {/* Species Header */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5 font-pixar-sub font-bold">
                {isBirdfy ? (
                  <span className="text-xs text-sky-950 bg-sky-100 px-3 py-1 rounded-full border border-sky-300 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500 fill-amber-400" />
                    <span>{sighting.birdfy?.aiConfidence || 98}% AI Confidence Match</span>
                  </span>
                ) : (
                  <span className="text-xs text-amber-950 bg-amber-200 px-3 py-1 rounded-full border border-amber-300">
                    Field Observation
                  </span>
                )}
                <span className="text-xs text-emerald-900 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200">
                  x{sighting.count} spotted
                </span>
              </div>

              <h2 className="font-pixar-title text-3xl text-stone-900">
                {sighting.speciesName}
              </h2>

              {speciesObj?.scientificName && (
                <p className="text-xs font-pixar-sub font-bold text-sky-700">
                  {speciesObj.scientificName}
                </p>
              )}
            </div>

            {/* Time & Observer Metadata */}
            <div className="bg-stone-50 p-4 rounded-2xl border-2 border-stone-200 space-y-2 text-xs font-pixar-sub font-semibold">
              <div className="flex items-center justify-between text-stone-700">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-600" />
                  {sighting.date} at {sighting.time}
                </span>
                <span className="flex items-center gap-1 font-bold text-stone-900">
                  <User className="w-3.5 h-3.5 text-stone-400" />
                  {sighting.spottedBy}
                </span>
              </div>

              <div className="flex items-center justify-between text-stone-600 border-t-2 border-stone-200/60 pt-2">
                <span className="text-stone-700 font-semibold">Conditions &amp; Environment</span>
                <span className="text-sky-700 font-bold flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  {sighting.weather}
                </span>
              </div>
            </div>

            {/* BIRDFY HARDWARE & AI TELEMETRY PANEL */}
            {isBirdfy && sighting.birdfy && (
              <div className="bg-sky-50/70 p-4 rounded-2xl border-2 border-sky-200 space-y-2.5 text-xs font-pixar-sub">
                <div className="flex items-center justify-between">
                  <span className="font-pixar-title text-sky-950 uppercase tracking-wide flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-sky-600" />
                    <span>BIRDFY HARDWARE TELEMETRY</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold text-[10px] border border-emerald-300">
                    PIR Motion Trigger
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-stone-700 pt-1">
                  <div>
                    <span className="text-stone-500 block">Feeder Source:</span>
                    <strong className="text-stone-900">{sighting.birdfy.feederName || 'Birdfy Feeder Cam'}</strong>
                  </div>

                  <div>
                    <span className="text-stone-500 block">Resolution &amp; Lens:</span>
                    <strong className="text-stone-900">{sighting.birdfy.resolution || '1080p Full HD'} (Wide Angle)</strong>
                  </div>

                  <div>
                    <span className="text-stone-500 block">Device Power:</span>
                    <strong className="text-emerald-700">
                      {sighting.birdfy.batteryLevel || 96}% Battery • Solar Active
                    </strong>
                  </div>

                  <div>
                    <span className="text-stone-500 block">AI Classification:</span>
                    <strong className="text-amber-800">
                      {sighting.birdfy.aiConfidence}% match • {sighting.speciesName}
                    </strong>
                  </div>
                </div>

                {videoUrl && (
                  <div className="pt-2 border-t border-sky-200/80 flex items-center justify-between">
                    <span className="text-[11px] text-sky-900 font-bold flex items-center gap-1">
                      <Play className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span>HD Video Clip Available</span>
                    </span>
                    <a
                      href={videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 hover:text-sky-950 underline cursor-pointer"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Open in New Tab</span>
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Field Observation Notes */}
            <div className="space-y-1">
              <h4 className="text-[11px] font-pixar-title text-stone-500 uppercase tracking-wider">
                FIELD OBSERVATION NOTES
              </h4>
              <p className="text-xs font-pixar-body font-semibold text-stone-800 bg-amber-50/80 p-3.5 rounded-2xl border-2 border-amber-200/80 leading-relaxed italic">
                "{sighting.notes}"
              </p>
            </div>

            {/* Species Favorite Treat & Call */}
            {speciesObj && (
              <div className="space-y-2 text-xs pt-2 border-t-2 border-stone-100 font-pixar-sub">
                <div>
                  <span className="font-bold text-stone-900">Favorite Feeder Treat: </span>
                  <span className="text-stone-700 font-semibold">{speciesObj.favoriteFood}</span>
                </div>

                <div>
                  <span className="font-bold text-stone-900">Song / Call: </span>
                  <span className="text-stone-700 font-semibold">{speciesObj.callDescription}</span>
                </div>
              </div>
            )}

          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t-2 border-stone-100 flex items-center justify-between font-pixar-sub">
            <button
              onClick={handleDelete}
              className="px-3.5 py-2 rounded-full text-xs font-bold text-rose-600 hover:bg-rose-50 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Record</span>
            </button>

            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-full bg-stone-900 hover:bg-stone-800 text-white font-pixar-title text-xs transition cursor-pointer"
            >
              Close Lightbox
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
