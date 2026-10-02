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
  className?: string;
  style?: React.CSSProperties;
  isPlaying?: boolean;
  loop?: boolean;
  loopDelay?: number; // Delay in milliseconds before restarting loop (e.g. 15000)
  onEnded?: () => void;
  playbackRate?: number;
  poster?: string;
}

export const TransparentVideo: React.FC<TransparentVideoProps> = ({
  src,
  className,
  style,
  isPlaying = true,
  loop = true,
  loopDelay = 0,
  onEnded,
  playbackRate = 1.0,
  poster,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isWaitingLoopRef = useRef<boolean>(false);
  const hasEndedRef = useRef<boolean>(false);
  const onEndedRef = useRef(onEnded);

  const [useCanvas, setUseCanvas] = useState<boolean>(true);
  const [canvasHasFrame, setCanvasHasFrame] = useState<boolean>(false);
  const [hasVideoError, setHasVideoError] = useState<boolean>(false);

  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  // Ensure iOS / iPad Safari attributes are explicitly set on the DOM element
  const configureVideoDOM = useCallback((video: HTMLVideoElement) => {
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');
    video.setAttribute('x5-playsinline', 'true');
    video.setAttribute('preload', 'auto');
    if (playbackRate && playbackRate !== 1.0) {
      video.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Safe play helper handling mobile media policies
  const safePlay = useCallback((video: HTMLVideoElement) => {
    configureVideoDOM(video);
    const promise = video.play();
    if (promise !== undefined) {
      promise.catch(() => {
        // Autoplay blocked until user gesture or touch
      });
    }
  }, [configureVideoDOM]);

  // Listen for user touch / interaction to unlock video playback if initially blocked
  useEffect(() => {
    const handleUserGesture = () => {
      const video = videoRef.current;
      if (video && isPlaying && video.paused) {
        safePlay(video);
      }
    };

    window.addEventListener('touchstart', handleUserGesture, { passive: true });
    window.addEventListener('touchend', handleUserGesture, { passive: true });
    window.addEventListener('click', handleUserGesture, { passive: true });
    window.addEventListener('scroll', handleUserGesture, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleUserGesture);
      window.removeEventListener('touchend', handleUserGesture);
      window.removeEventListener('click', handleUserGesture);
      window.removeEventListener('scroll', handleUserGesture);
    };
  }, [isPlaying, safePlay]);

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

      // Key out white / light grey background (r,g,b > 140 & low color tint diff)
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

  // Listen for video loading events to draw first frame immediately
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

  const handleEnded = useCallback(() => {
    if (!isPlaying) return;

    if (loop) {
      const video = videoRef.current;
      if (!video) return;

      if (loopDelay > 0) {
        if (isWaitingLoopRef.current) return;
        isWaitingLoopRef.current = true;

        video.pause();
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
              safePlay(v);
            } catch {
              // ignore
            }
          }
        }, loopDelay);
      } else {
        try {
          video.currentTime = 0;
          safePlay(video);
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
  }, [isPlaying, loop, loopDelay, useCanvas, drawKeyedFrame, safePlay]);

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

  // Handle controlled play/pause state updates
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    configureVideoDOM(video);

    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
    }
    isWaitingLoopRef.current = false;

    if (isPlaying) {
      hasEndedRef.current = false;
      try {
        video.currentTime = 0;
      } catch {
        // Ignore if metadata is still loading
      }
      safePlay(video);
    } else {
      video.pause();
      if (useCanvas && video.readyState >= 1) {
        const ok = drawKeyedFrame();
        if (ok) setCanvasHasFrame(true);
      }
    }
  }, [isPlaying, src, useCanvas, configureVideoDOM, safePlay, drawKeyedFrame]);

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

      {/* HTML5 Video Element: Source for canvas keying */}
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
            if (videoRef.current) configureVideoDOM(videoRef.current);
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
