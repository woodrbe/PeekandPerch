import React, { useState, useEffect, useRef } from 'react';
import { BirdSighting, BirdSpecies } from '../types';
import { BACKYARD_SPECIES } from '../data/birdsData';
import { 
  X, Star, Calendar, 
  Sun, Camera, Sparkles, BatteryCharging, 
  Wifi, Zap, ShieldCheck, Video, Play, Pause, Volume2, VolumeX, RotateCcw, Image as ImageIcon, ExternalLink,
  Download, Maximize2, AlertCircle
} from 'lucide-react';

interface SightingDetailModalProps {
  sighting: BirdSighting | null;
  speciesObj?: BirdSpecies;
  onClose: () => void;
  onDeleteSighting?: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onNextSighting?: () => void;
  onPrevSighting?: () => void;
}

interface MediaItem {
  id: string;
  type: 'video' | 'photo';
  url: string;
  thumbnailUrl: string;
  label: string;
}

export const SightingDetailModal: React.FC<SightingDetailModalProps> = ({
  sighting,
  speciesObj,
  onClose,
  onDeleteSighting: _onDeleteSighting,
  onToggleFavorite,
  onNextSighting,
  onPrevSighting,
}) => {
  if (!sighting) return null;

  const isBirdfy = sighting.birdfy?.isBirdfyCapture;
  const videoUrl = sighting.videoUrl || sighting.birdfy?.videoUrl;
  const catalogFallback = speciesObj?.imageUrl || BACKYARD_SPECIES.find(b => b.name.toLowerCase() === sighting.speciesName.toLowerCase())?.imageUrl;

  // Resolve the best available preview snapshot for the video thumbnail / poster
  const bestThumbnail =
    sighting.imageUrl ||
    (Array.isArray(sighting.images) && sighting.images.find((img) => !!img)) ||
    (Array.isArray(sighting.birdfy?.images) && sighting.birdfy.images.find((img) => !!img)) ||
    catalogFallback ||
    '';

  // Build media collection (video + all distinct snapshots)
  const mediaList: MediaItem[] = [];

  if (videoUrl) {
    mediaList.push({
      id: 'video-main',
      type: 'video',
      url: videoUrl,
      thumbnailUrl: bestThumbnail,
      label: 'HD Video Clip',
    });
  }

  const distinctImages = new Set<string>();
  if (Array.isArray(sighting.images) && sighting.images.length > 0) {
    sighting.images.forEach((img) => {
      if (img && !distinctImages.has(img)) {
        distinctImages.add(img);
      }
    });
  }
  if (sighting.imageUrl && !distinctImages.has(sighting.imageUrl)) {
    distinctImages.add(sighting.imageUrl);
  }

  Array.from(distinctImages).forEach((imgUrl, index) => {
    mediaList.push({
      id: `photo-${index}`,
      type: 'photo',
      url: imgUrl,
      thumbnailUrl: imgUrl,
      label: distinctImages.size > 1 ? `Photo ${index + 1}` : 'Camera Snapshot',
    });
  });

  if (mediaList.length === 0 && catalogFallback) {
    mediaList.push({
      id: 'photo-catalog',
      type: 'photo',
      url: catalogFallback,
      thumbnailUrl: catalogFallback,
      label: 'Species Reference',
    });
  }

  const [selectedMediaId, setSelectedMediaId] = useState<string>(mediaList[0]?.id || 'photo-0');
  const [videoError, setVideoError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setVideoError(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setShowControls(true);
    setSelectedMediaId(mediaList[0]?.id || 'photo-0');
  }, [sighting.id]);

  const handleUserActivity = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2500);
    }
  };

  useEffect(() => {
    if (!isPlaying) {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    } else {
      handleUserActivity();
    }
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying]);

  const togglePlay = () => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused || vid.ended) {
      vid.play().catch(() => {});
    } else {
      vid.pause();
    }
  };

  const toggleMute = () => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.requestFullscreen) {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      } else {
        vid.requestFullscreen().catch(() => {});
      }
    } else if ((vid as any).webkitEnterFullscreen) {
      (vid as any).webkitEnterFullscreen();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const formatVideoTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && onNextSighting) onNextSighting();
      if (e.key === 'ArrowLeft' && onPrevSighting) onPrevSighting();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNextSighting, onPrevSighting]);

  const currentMedia = mediaList.find((m) => m.id === selectedMediaId) || mediaList[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-950/85 backdrop-blur-md animate-fade-in font-pixar-body">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-y-auto md:overflow-hidden border-2 border-sky-100 flex flex-col md:flex-row max-h-[94vh]">
        
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-stone-900/80 text-white hover:bg-stone-900 transition cursor-pointer shadow-md hover:scale-105"
          title="Close Lightbox (Esc)"
        >
          <X className="w-4 h-4" />
        </button>

        {/* LEFT / TOP: High Res Photo / Video Player & Carousel Column */}
        <div className="md:w-3/5 bg-stone-950 flex flex-col justify-between overflow-hidden border-b-2 md:border-b-0 md:border-r-2 border-stone-800 shrink-0 md:shrink">
          
          {/* Main Media Viewport */}
          <div 
            className="relative flex-1 min-h-[240px] sm:min-h-[320px] md:min-h-[440px] flex items-center justify-center bg-black overflow-hidden group select-none"
            onMouseMove={handleUserActivity}
            onTouchStart={handleUserActivity}
          >
            
            {currentMedia?.type === 'video' ? (
              videoError ? (
                <div className="flex flex-col items-center justify-center p-6 text-center text-white space-y-3 max-w-sm">
                  <div className="p-3 bg-amber-500/20 text-amber-300 rounded-full border border-amber-500/40">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <p className="font-pixar-sub text-sm font-bold text-stone-200">
                    Video stream preview unavailable or token expired
                  </p>
                  <p className="text-xs text-stone-400">
                    Birdfy video sessions expire after 72 hours. You can still inspect the full high-resolution AI snapshots below.
                  </p>
                  {mediaList.some(m => m.type === 'photo') && (
                    <button
                      onClick={() => {
                        const firstPhoto = mediaList.find(m => m.type === 'photo');
                        if (firstPhoto) setSelectedMediaId(firstPhoto.id);
                      }}
                      className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-full text-xs font-bold font-pixar-sub transition cursor-pointer shadow-md"
                    >
                      View AI Snapshot Photos
                    </button>
                  )}
                </div>
              ) : (
                <div className="relative w-full h-full flex items-center justify-center">
                  <video
                    ref={videoRef}
                    key={currentMedia.url}
                    src={currentMedia.url}
                    poster={bestThumbnail}
                    preload="metadata"
                    playsInline
                    onClick={togglePlay}
                    onPlay={() => {
                      setIsPlaying(true);
                      handleUserActivity();
                    }}
                    onPause={() => {
                      setIsPlaying(false);
                      setShowControls(true);
                    }}
                    onEnded={() => {
                      setIsPlaying(false);
                      setShowControls(true);
                    }}
                    onTimeUpdate={() => {
                      if (videoRef.current) {
                        setCurrentTime(videoRef.current.currentTime);
                      }
                    }}
                    onLoadedMetadata={() => {
                      if (videoRef.current) {
                        setDuration(videoRef.current.duration);
                      }
                    }}
                    onError={() => setVideoError(true)}
                    className="w-full h-full object-contain max-h-[380px] md:max-h-[520px] bg-black cursor-pointer"
                  />

                  {/* Custom Bottom Video Control Bar (PC & Mobile iPad/iPhone unified at the bottom) */}
                  <div
                    className={`absolute bottom-0 inset-x-0 z-20 px-4 py-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent transition-opacity duration-300 flex flex-col gap-1.5 ${
                      showControls || !isPlaying ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Progress Bar / Scrubber */}
                    <div className="w-full flex items-center">
                      <input
                        type="range"
                        min={0}
                        max={duration || 100}
                        step="0.1"
                        value={currentTime}
                        onChange={handleSeek}
                        className="w-full h-1.5 bg-stone-700/80 rounded-lg appearance-none cursor-pointer accent-rose-500 hover:h-2 transition-all"
                      />
                    </div>

                    {/* Bottom Controls Row */}
                    <div className="flex items-center justify-between text-white text-xs font-pixar-sub">
                      {/* Left: Play/Pause/Replay + Time readout */}
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={togglePlay}
                          className="p-1.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-md transition cursor-pointer hover:scale-105 active:scale-95"
                          title={isPlaying ? 'Pause' : 'Play'}
                        >
                          {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white translate-x-0.5" />}
                        </button>

                        <span className="font-mono text-xs text-stone-300 tracking-wider">
                          {formatVideoTime(currentTime)} / {formatVideoTime(duration)}
                        </span>
                      </div>

                      {/* Right: Audio Mute & Fullscreen */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={toggleMute}
                          className="p-1.5 rounded-full bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white transition cursor-pointer"
                          title={isMuted ? 'Unmute' : 'Mute'}
                        >
                          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        </button>

                        <button
                          type="button"
                          onClick={toggleFullscreen}
                          className="p-1.5 rounded-full bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white transition cursor-pointer"
                          title="Fullscreen"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            ) : (
              <img
                key={currentMedia?.url}
                src={currentMedia?.url || catalogFallback}
                alt={sighting.speciesName}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain max-h-[380px] md:max-h-[520px] transition-transform duration-300"
                onError={(e) => {
                  if (catalogFallback && e.currentTarget.src !== catalogFallback) {
                    e.currentTarget.src = catalogFallback;
                  }
                }}
              />
            )}

            {/* Media Overlay Badges */}
            <div className="absolute top-4 left-16 z-20 flex items-center gap-2">
              {currentMedia?.type === 'video' && !videoError ? (
                <button
                  type="button"
                  onClick={togglePlay}
                  className="px-3 py-1 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-pixar-sub font-bold backdrop-blur-md flex items-center gap-1.5 shadow-lg border border-rose-400/40 cursor-pointer transition hover:scale-105"
                  title={isPlaying ? "Pause 1080p Video Clip" : "Play 1080p Video Clip"}
                >
                  {isPlaying ? <Pause className="w-3 h-3 fill-white" /> : <Play className="w-3 h-3 fill-white" />}
                  <span>{isPlaying ? 'Playing 1080p Video' : 'Click to Play 1080p Video'}</span>
                </button>
              ) : isBirdfy ? (
                <div className="px-3 py-1 rounded-full bg-stone-900/90 text-amber-300 text-[11px] font-pixar-sub font-bold backdrop-blur-md flex items-center gap-1.5 shadow-lg border border-amber-400/40">
                  <Camera className="w-3.5 h-3.5 text-sky-400" />
                  <span>Birdfy 1080p Snapshot</span>
                </div>
              ) : null}

              {/* Quick Switch to Video Button when viewing photos */}
              {currentMedia?.type !== 'video' && mediaList.some((m) => m.type === 'video') && (
                <button
                  type="button"
                  onClick={() => {
                    const vidItem = mediaList.find((m) => m.type === 'video');
                    if (vidItem) {
                      setSelectedMediaId(vidItem.id);
                      setTimeout(() => videoRef.current?.play(), 100);
                    }
                  }}
                  className="px-3 py-1 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-pixar-sub font-bold backdrop-blur-md flex items-center gap-1.5 shadow-lg border border-rose-400/40 cursor-pointer transition hover:scale-105"
                  title="Switch back and play HD Video Clip"
                >
                  <Play className="w-3 h-3 fill-white" />
                  <span>Watch Video Clip</span>
                </button>
              )}
            </div>

            {/* Star Favorite Button */}
            <button
              onClick={() => onToggleFavorite(sighting.id)}
              className={`absolute top-4 left-4 z-20 p-2.5 rounded-full backdrop-blur-md transition-all cursor-pointer shadow-lg ${
                sighting.isFavorite ? 'bg-rose-500 text-white scale-110 ring-2 ring-white' : 'bg-white/80 text-stone-800 hover:bg-white hover:scale-105'
              }`}
              title={sighting.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Star className={`w-4 h-4 ${sighting.isFavorite ? 'fill-white' : ''}`} />
            </button>
          </div>

          {/* Bottom Thumbnail Strip */}
          {mediaList.length > 1 && (
            <div className="p-3 sm:p-3.5 bg-stone-900/95 border-t border-stone-800 flex items-center justify-start sm:justify-center gap-3 overflow-x-auto scrollbar-thin shrink-0 overscroll-x-contain">
              {mediaList.map((item) => {
                const isSelected = item.id === (currentMedia?.id || mediaList[0].id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedMediaId(item.id)}
                    className={`relative rounded-2xl overflow-hidden shrink-0 w-24 sm:w-28 h-16 sm:h-18 border-2 transition-all cursor-pointer group/thumb bg-stone-950 flex items-center justify-center ${
                      isSelected
                        ? 'border-amber-400 ring-2 ring-amber-400/50 scale-105 shadow-md shadow-amber-400/20'
                        : 'border-stone-700 opacity-75 hover:opacity-100 hover:border-stone-400'
                    }`}
                    title={item.label}
                  >
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.label}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          if (catalogFallback && e.currentTarget.src !== catalogFallback) {
                            e.currentTarget.src = catalogFallback;
                          } else {
                            e.currentTarget.style.display = 'none';
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-stone-800 to-stone-950 text-stone-400">
                        {item.type === 'video' ? <Video className="w-6 h-6 text-amber-400" /> : <Camera className="w-6 h-6 text-sky-400" />}
                      </div>
                    )}

                    {item.type === 'video' ? (
                      <div className="absolute inset-0 bg-black/40 group-hover/thumb:bg-black/20 flex flex-col items-center justify-center transition-colors pointer-events-none">
                        <div className="p-1.5 rounded-full bg-rose-600/95 text-white shadow-md scale-95 group-hover/thumb:scale-105 transition-transform">
                          <Play className="w-3.5 h-3.5 fill-white text-white translate-x-0.5" />
                        </div>
                      </div>
                    ) : null}

                    <span className={`absolute bottom-0 inset-x-0 text-[10px] sm:text-[11px] font-pixar-sub font-bold text-center truncate py-1 px-1.5 pointer-events-none ${
                      item.type === 'video' ? 'bg-rose-950/90 text-rose-200 border-t border-rose-800/40' : 'bg-stone-950/85 text-white'
                    }`}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

        </div>

        {/* RIGHT: Observations, AI Identification & Hardware Details */}
        <div className="p-6 md:w-2/5 flex flex-col justify-between overflow-y-auto space-y-4">
          
          <div className="space-y-4">
            
            {/* Species Header */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5 font-pixar-sub font-bold">
                {isBirdfy ? (
                  <span className="text-xs text-sky-950 bg-sky-100 px-3 py-1 rounded-full border border-sky-300 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500 fill-amber-400" />
                    <span>{sighting.birdfy?.aiConfidence || 99}% AI Confidence Match</span>
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

            {/* Time & Conditions Metadata */}
            <div className="bg-stone-50 p-4 rounded-2xl border-2 border-stone-200 text-xs font-pixar-sub font-semibold">
              <div className="flex items-center justify-between text-stone-700">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-600" />
                  {sighting.date} at {sighting.time}
                </span>
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
                  <div className="pt-2.5 border-t border-sky-200/80 flex items-center justify-between">
                    <span className="text-[11px] text-sky-900 font-bold flex items-center gap-1">
                      <Play className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span>Recorded 1080p Video Clip</span>
                    </span>
                    <a
                      href={videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 hover:text-sky-950 underline cursor-pointer"
                      title="Open full video in a new tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Video</span>
                    </a>
                  </div>
                )}
              </div>
            )}

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

        </div>

      </div>
    </div>
  );
};
