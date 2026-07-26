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
  const [useCanvas, setUseCanvas] = useState(true);

  const hasEndedRef = useRef<boolean>(false);
  const onEndedRef = useRef(onEnded);

  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  // Handle controlled play/pause state updates
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      hasEndedRef.current = false;
      video.currentTime = 0;
      if (playbackRate !== 1.0) {
        video.playbackRate = playbackRate;
      }
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isPlaying, playbackRate]);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    let animationFrameId: number;

    const setupVideo = () => {
      if (playbackRate !== 1.0) {
        video.playbackRate = playbackRate;
      }
      if (isPlaying) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    };

    if (video.readyState >= 2) {
      setupVideo();
    } else {
      video.addEventListener('loadeddata', setupVideo, { once: true });
    }

    const renderFrame = () => {
      if (video.readyState >= 2 && video.videoWidth > 0) {
        if (canvas.width !== video.videoWidth) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        // Check if video reached end frame
        if (isPlaying && !hasEndedRef.current && video.duration > 0 && (video.currentTime >= video.duration - 0.15 || video.ended)) {
          hasEndedRef.current = true;
          video.pause();
          if (onEndedRef.current) {
            onEndedRef.current();
          }
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

              // Difference between min & max RGB channels (saturation check)
              const maxVal = Math.max(r, g, b);
              const minVal = Math.min(r, g, b);
              const diff = maxVal - minVal;

              if (r > 140 && g > 140 && b > 140 && diff < 40) {
                if (r > 185 && g > 185 && b > 185) {
                  // Pure transparent
                  data[i + 3] = 0;
                } else {
                  // Smooth anti-aliased edge
                  const avg = (r + g + b) / 3;
                  const alphaFactor = (185 - avg) / 45;
                  data[i + 3] = Math.min(255, Math.max(0, Math.floor(alphaFactor * 255)));
                }
              }
            }

            ctx.putImageData(frame, 0, 0);
          }
        } catch {
          // If canvas security context fails, fallback to CSS video filtering
          setUseCanvas(false);
        }
      }

      animationFrameId = requestAnimationFrame(renderFrame);
    };

    const handlePlay = () => {
      if (video && playbackRate) {
        video.playbackRate = playbackRate;
      }
      renderFrame();
    };

    video.addEventListener('play', handlePlay);
    video.playbackRate = playbackRate;
    if (isPlaying) {
      video.play().catch(() => {});
    }
    animationFrameId = requestAnimationFrame(renderFrame);

    return () => {
      video.removeEventListener('loadeddata', setupVideo);
      video.removeEventListener('play', handlePlay);
      cancelAnimationFrame(animationFrameId);
    };
  }, [src, playbackRate, isPlaying]);

  return (
    <div className={`relative ${className || ''}`} style={style}>
      <video
        ref={videoRef}
        src={src}
        muted
        playsInline
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

