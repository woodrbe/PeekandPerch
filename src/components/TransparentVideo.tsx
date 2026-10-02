import React, { useRef, useEffect, useState, useCallback } from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

interface TransparentVideoProps {
  src: string;
  poster?: string;
  className?: string;
  style?: React.CSSProperties;
  isPlaying?: boolean;
  loop?: boolean;
  loopDelay?: number; // Delay in milliseconds before restarting loop (e.g. 15000)
  onEnded?: () => void;
  playbackRate?: number;
}

export const TransparentVideo: React.FC<TransparentVideoProps> = ({
  src,
  poster,
  className,
  style,
  isPlaying = true,
  loop = true,
  loopDelay = 0,
  onEnded,
  playbackRate = 1.0,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isWaitingLoopRef = useRef<boolean>(false);

  // Check if device is iOS / iPadOS / Touch where canvas pixel-processing can be throttled
  const [isMobileOrTouch] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const ua = navigator.userAgent || '';
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    return isIOS || isTouch;
  });

  const [useCanvas, setUseCanvas] = useState<boolean>(!isMobileOrTouch);
  const [canvasHasFrame, setCanvasHasFrame] = useState<boolean>(false);
  const [hasVideoError, setHasVideoError] = useState<boolean>(false);

  const hasEndedRef = useRef<boolean>(false);
  const onEndedRef = useRef(onEnded);

  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  // Helper to ensure DOM properties are explicitly set for WebKit / iOS Safari
  const enforceVideoProps = useCallback((video: HTMLVideoElement) => {
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    if (playbackRate && playbackRate !== 1.0) {
      video.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const playVideo = useCallback((video: HTMLVideoElement) => {
    enforceVideoProps(video);
    const promise = video.play();
    if (promise !== undefined) {
      promise.catch(() => {
        // Autoplay policy fallback for iOS Safari if un-interacted
      });
    }
  }, [enforceVideoProps]);

  // User gesture interaction listener to unlock video if browser autoplay policy blocks initial attempt
  useEffect(() => {
    const handleUserInteraction = () => {
      const video = videoRef.current;
      if (video && isPlaying && video.paused) {
        playVideo(video);
      }
    };

    window.addEventListener('touchstart', handleUserInteraction, { passive: true, once: true });
    window.addEventListener('click', handleUserInteraction, { passive: true, once: true });
    window.addEventListener('scroll', handleUserInteraction, { passive: true, once: true });

    return () => {
      window.removeEventListener('touchstart', handleUserInteraction);
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('scroll', handleUserInteraction);
    };
  }, [isPlaying, playVideo]);

  // Render a single video frame onto the transparent canvas
  const drawKeyedFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0) return false;

    if (canvas.width !== video.videoWidth) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.style.aspectRatio = `${video.videoWidth} / ${video.videoHeight}`;
    }

    try {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return false;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = frame.data;
      const len = data.length;

      // Key out white / light grey background
      for (let i = 0; i < len; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const maxVal = Math.max(r, g, b);
        const minVal = Math.min(r, g, b);
        const diff = maxVal - minVal;

        if (r > 140 && g > 140 && b > 140 && diff < 40) {
          if (r > 185 && g > 185 && b > 185) {
            data[i + 3] = 0;
          } else {
            const avg = (r + g + b) / 3;
            const alphaFactor = (185 - avg) / 45;
            data[i + 3] = Math.min(255, Math.max(0, Math.floor(alphaFactor * 255)));
          }
        }
      }

      ctx.putImageData(frame, 0, 0);
      return true;
    } catch {
      // Fallback to CSS mix-blend-mode if canvas fails
      setUseCanvas(false);
      return false;
    }
  }, []);

  // Listen for video loading events to draw first frame immediately (even when paused)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleDataReady = () => {
      if (useCanvas) {
        const ok = drawKeyedFrame();
        if (ok) setCanvasHasFrame(true);
      }
    };

    video.addEventListener('loadeddata', handleDataReady);
    video.addEventListener('canplay', handleDataReady);
    video.addEventListener('seeked', handleDataReady);

    // Initial check in case video is already cached/loaded
    if (video.readyState >= 2) {
      handleDataReady();
    }

    return () => {
      video.removeEventListener('loadeddata', handleDataReady);
      video.removeEventListener('canplay', handleDataReady);
      video.removeEventListener('seeked', handleDataReady);
    };
  }, [src, useCanvas, drawKeyedFrame]);

  // Clean up restart timer on unmount
  useEffect(() => {
    return () => {
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
      }
    };
  }, []);

  // Sync play / pause state whenever isPlaying changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    enforceVideoProps(video);

    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
    }
    isWaitingLoopRef.current = false;

    if (isPlaying) {
      hasEndedRef.current = false;
      try {
        video.currentTime = 0;
      } catch {
        // Continue if metadata loading
      }
      playVideo(video);
    } else {
      video.pause();
      // Render the paused frame so the bird stays visible on canvas
      if (useCanvas && video.readyState >= 1) {
        const ok = drawKeyedFrame();
        if (ok) setCanvasHasFrame(true);
      }
    }
  }, [isPlaying, src, playbackRate, useCanvas, enforceVideoProps, playVideo, drawKeyedFrame]);

  // Handle Canvas pixel keying animation loop while active
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !useCanvas) return;

    let animationFrameId: number;

    const renderLoop = () => {
      if (useCanvas && video.readyState >= 2 && video.videoWidth > 0) {
        const ok = drawKeyedFrame();
        if (ok && !canvasHasFrame) {
          setCanvasHasFrame(true);
        }
      }
      animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [useCanvas, drawKeyedFrame, canvasHasFrame]);

  const handleEnded = useCallback(() => {
    if (!isPlaying) return;

    if (loop) {
      const video = videoRef.current;
      if (!video) return;

      if (loopDelay > 0) {
        if (isWaitingLoopRef.current) return;
        isWaitingLoopRef.current = true;

        video.pause();
        // Render the resting end frame onto canvas
        if (useCanvas && video.readyState >= 1) {
          const ok = drawKeyedFrame();
          if (ok) setCanvasHasFrame(true);
        }

        if (onEndedRef.current) {
          onEndedRef.current();
        }

        if (restartTimerRef.current) {
          clearTimeout(restartTimerRef.current);
        }

        restartTimerRef.current = setTimeout(() => {
          isWaitingLoopRef.current = false;
          const v = videoRef.current;
          if (v && isPlaying) {
            try {
              v.currentTime = 0;
              playVideo(v);
            } catch {
              // ignore
            }
          }
        }, loopDelay);
      } else {
        try {
          video.currentTime = 0;
          playVideo(video);
        } catch {
          // ignore
        }
      }
    } else if (!hasEndedRef.current) {
      hasEndedRef.current = true;
      const video = videoRef.current;
      if (video) video.pause();
      if (onEndedRef.current) {
        onEndedRef.current();
      }
    }
  }, [isPlaying, loop, loopDelay, useCanvas, drawKeyedFrame, playVideo]);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || !isPlaying || video.duration <= 0) return;

    if (loop && loopDelay > 0) {
      if (!isWaitingLoopRef.current && video.currentTime >= video.duration - 0.12) {
        handleEnded();
      }
    } else if (!loop && !hasEndedRef.current) {
      if (video.currentTime >= video.duration - 0.15) {
        handleEnded();
      }
    }
  }, [isPlaying, loop, loopDelay, handleEnded]);

  return (
    <div className={`relative flex items-center justify-center ${className || ''}`} style={style}>
      
      {/* Fallback Image: Displayed if video completely fails to load */}
      {hasVideoError && poster && (
        <img
          src={poster}
          alt="Bird Character"
          className="w-full h-full object-contain mix-blend-multiply relative z-10"
        />
      )}

      {/* HTML5 Video Element: Source for canvas keying (hidden on canvas mode, mix-blend-multiply on fallback) */}
      {!hasVideoError && (
        <video
          ref={videoRef}
          src={src}
          autoPlay={isPlaying}
          loop={loop && loopDelay === 0}
          muted
          playsInline
          preload="auto"
          onEnded={handleEnded}
          onTimeUpdate={handleTimeUpdate}
          onError={() => {
            setHasVideoError(true);
            setUseCanvas(false);
          }}
          onPlay={() => {
            if (videoRef.current) enforceVideoProps(videoRef.current);
          }}
          className={
            useCanvas
              ? "absolute inset-0 w-full h-full opacity-0 pointer-events-none"
              : `w-full h-full object-contain mix-blend-multiply relative z-10 transition-opacity duration-300 ${canvasHasFrame ? 'opacity-100' : 'opacity-0'}`
          }
        />
      )}

      {/* Canvas Element: Delivers zero-halo pixel keying with smooth entrance */}
      {useCanvas && !hasVideoError && (
        <canvas
          ref={canvasRef}
          className={`w-full h-full object-contain relative z-10 transition-opacity duration-300 ${canvasHasFrame ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
    </div>
  );
};
