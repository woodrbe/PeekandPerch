import React, { useRef, useEffect, useState } from 'react';

interface TransparentVideoProps {
  src: string;
  className?: string;
  style?: React.CSSProperties;
  isPlaying?: boolean;
  onEnded?: () => void;
  playbackRate?: number;
}

export const TransparentVideo: React.FC<TransparentVideoProps> = ({
  src,
  className,
  style,
  isPlaying = true,
  onEnded,
  playbackRate = 1.0,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [useCanvas, setUseCanvas] = useState<boolean>(true);

  const hasEndedRef = useRef<boolean>(false);
  const onEndedRef = useRef(onEnded);

  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  // Ensure iOS / iPad Safari attributes are explicitly set on the DOM element
  const configureVideoDOM = (video: HTMLVideoElement) => {
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');
    video.setAttribute('x5-playsinline', 'true');
    video.setAttribute('preload', 'auto');
  };

  // Safe play helper handling iPad Safari media policies
  const safePlay = (video: HTMLVideoElement) => {
    configureVideoDOM(video);
    if (playbackRate !== 1.0) {
      video.playbackRate = playbackRate;
    }
    const promise = video.play();
    if (promise !== undefined) {
      promise.catch(() => {
        // Autoplay blocked on iPad Safari until user gesture or touch
      });
    }
  };

  // Listen for user touch / interaction to unlock video playback on iPadOS if initially blocked
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
  }, [isPlaying]);

  // Handle controlled play/pause state updates
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    configureVideoDOM(video);

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
    }
  }, [isPlaying, playbackRate]);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video) return;

    configureVideoDOM(video);

    let animationFrameId: number;

    const setupVideo = () => {
      configureVideoDOM(video);
      if (isPlaying) {
        safePlay(video);
      } else {
        video.pause();
      }
    };

    if (video.readyState >= 1) {
      setupVideo();
    }

    video.addEventListener('loadedmetadata', setupVideo);
    video.addEventListener('loadeddata', setupVideo);
    video.addEventListener('canplay', setupVideo);

    const handleEnded = () => {
      if (isPlaying && !hasEndedRef.current) {
        hasEndedRef.current = true;
        video.pause();
        if (onEndedRef.current) {
          onEndedRef.current();
        }
      }
    };

    video.addEventListener('ended', handleEnded);

    const handleTimeUpdate = () => {
      if (isPlaying && !hasEndedRef.current && video.duration > 0) {
        if (video.currentTime >= video.duration - 0.15) {
          handleEnded();
        }
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);

    const renderFrame = () => {
      if (canvas && video.readyState >= 2 && video.videoWidth > 0) {
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

            // Key out grey / white background (r,g,b > 140 & low color tint diff)
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
          // If canvas security context fails or iOS canvas memory limits error, fallback to CSS video filtering
          setUseCanvas(false);
        }
      }

      animationFrameId = requestAnimationFrame(renderFrame);
    };

    const handlePlay = () => {
      configureVideoDOM(video);
      renderFrame();
    };

    video.addEventListener('play', handlePlay);

    if (isPlaying) {
      safePlay(video);
    }
    animationFrameId = requestAnimationFrame(renderFrame);

    return () => {
      video.removeEventListener('loadedmetadata', setupVideo);
      video.removeEventListener('loadeddata', setupVideo);
      video.removeEventListener('canplay', setupVideo);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      cancelAnimationFrame(animationFrameId);
    };
  }, [src, playbackRate, isPlaying]);

  return (
    <div className={`relative ${className || ''}`} style={style}>
      <video
        ref={videoRef}
        src={src}
        autoPlay={isPlaying}
        muted
        playsInline
        preload="auto"
        className={
          useCanvas
            ? "absolute inset-0 w-full h-full opacity-0 pointer-events-none"
            : "w-full h-auto object-contain mix-blend-multiply contrast-[1.65] brightness-[1.2] saturate-[1.1]"
        }
      />
      {useCanvas && <canvas ref={canvasRef} className="w-full h-auto object-contain" />}
    </div>
  );
};

