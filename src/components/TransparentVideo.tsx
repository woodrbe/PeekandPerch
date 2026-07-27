import React, { useRef, useEffect, useState } from 'react';

interface TransparentVideoProps {
  src: string;
  poster?: string;
  className?: string;
  style?: React.CSSProperties;
  isPlaying?: boolean;
  onEnded?: () => void;
  playbackRate?: number;
}

export const TransparentVideo: React.FC<TransparentVideoProps> = ({
  src,
  poster,
  className,
  style,
  isPlaying = true,
  onEnded,
  playbackRate = 1.0,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Check if device is iOS / iPadOS / Touch where canvas pixel-processing can be throttled
  const [isMobileOrTouch] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const ua = navigator.userAgent || '';
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    return isIOS || isTouch;
  });

  const [useCanvas, setUseCanvas] = useState<boolean>(!isMobileOrTouch);

  const hasEndedRef = useRef<boolean>(false);
  const onEndedRef = useRef(onEnded);

  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  // Helper to ensure DOM properties are explicitly set for WebKit / iOS Safari
  const enforceVideoProps = (video: HTMLVideoElement) => {
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    if (playbackRate && playbackRate !== 1.0) {
      video.playbackRate = playbackRate;
    }
  };

  const playVideo = (video: HTMLVideoElement) => {
    enforceVideoProps(video);
    const promise = video.play();
    if (promise !== undefined) {
      promise.catch(() => {
        // Autoplay policy fallback for iOS Safari if un-interacted
      });
    }
  };

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
  }, [isPlaying]);

  // Sync play / pause state whenever isPlaying changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    enforceVideoProps(video);

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
    }
  }, [isPlaying, src, playbackRate]);

  // Handle Canvas pixel keying on Desktop browsers
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !useCanvas || !canvas) return;

    let animationFrameId: number;

    const renderFrame = () => {
      if (useCanvas && canvas && video.readyState >= 2 && video.videoWidth > 0) {
        if (canvas.width !== video.videoWidth) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        try {
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
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
          }
        } catch {
          // Fallback to CSS mix-blend-mode if canvas fails
          setUseCanvas(false);
        }
      }

      animationFrameId = requestAnimationFrame(renderFrame);
    };

    animationFrameId = requestAnimationFrame(renderFrame);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [useCanvas, isPlaying]);

  const handleEnded = () => {
    if (isPlaying && !hasEndedRef.current) {
      hasEndedRef.current = true;
      const video = videoRef.current;
      if (video) video.pause();
      if (onEndedRef.current) {
        onEndedRef.current();
      }
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (video && isPlaying && !hasEndedRef.current && video.duration > 0) {
      if (video.currentTime >= video.duration - 0.15) {
        handleEnded();
      }
    }
  };

  return (
    <div className={`relative flex items-center justify-center overflow-hidden rounded-2xl ${className || ''}`} style={style}>
      
      {/* HTML5 Video Element - Always visible with native mix-blend-multiply */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={isPlaying}
        muted
        playsInline
        preload="auto"
        onEnded={handleEnded}
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => {
          if (videoRef.current) enforceVideoProps(videoRef.current);
        }}
        className={
          useCanvas
            ? "absolute inset-0 w-full h-full opacity-0 pointer-events-none"
            : "w-full h-auto object-contain mix-blend-multiply relative z-10"
        }
      />

      {/* Canvas Element for desktop pixel keying if enabled */}
      {useCanvas && (
        <canvas
          ref={canvasRef}
          className="w-full h-auto object-contain relative z-10"
        />
      )}
    </div>
  );
};


