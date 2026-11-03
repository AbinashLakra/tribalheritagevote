'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, AlertCircle, Loader2 } from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  autoPlay?: boolean;
}

export function VideoPlayer({ src, poster, title, autoPlay = false }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset states whenever source changes (e.g. previewing new video or selecting new artist)
  useEffect(() => {
    setIsPlaying(false);
    setIsBuffering(false);
    setHasError(false);
    setShowControls(true);
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, [src]);

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      setShowControls(true);
    } else {
      setIsBuffering(true);
      videoRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setIsBuffering(false);
          resetControlsTimeout();
        })
        .catch((err) => {
          console.warn('Playback error or user policy restriction:', err);
          setIsBuffering(false);
          setIsPlaying(false);
        });
    }
  };

  const toggleMute = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullScreen = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if ((videoRef.current as any)?.webkitEnterFullscreen) {
        // iOS Safari native fullscreen method
        (videoRef.current as any).webkitEnterFullscreen();
      }
    } else {
      document.exitFullscreen?.();
    }
  };

  const resetControlsTimeout = () => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 2500);
  };

  const handleContainerClick = () => {
    setShowControls(true);
    resetControlsTimeout();
  };

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      className="relative w-full aspect-video bg-charcoal-950 rounded-xl overflow-hidden shadow-lg group select-none cursor-pointer"
    >
      {/* Video Element (Optimized for iPhone Safari, Android, and Windows) */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        playsInline
        webkit-playsinline="true"
        preload="metadata"
        autoPlay={autoPlay}
        muted={isMuted}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => {
          setIsBuffering(false);
          setIsPlaying(true);
        }}
        onCanPlay={() => setIsBuffering(false)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setShowControls(true);
        }}
        onError={() => {
          setIsBuffering(false);
          setHasError(true);
        }}
        className="w-full h-full object-contain bg-black"
      />

      {/* Buffering Spinner: ONLY shown when user actively started playing and video is buffering network data */}
      {isBuffering && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
          <Loader2 className="w-10 h-10 text-white animate-spin drop-shadow-md" />
        </div>
      )}

      {/* Error Overlay */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-charcoal-950/90 text-ivory-100 p-4 text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mb-2" />
          <p className="font-semibold text-sm sm:text-base">Unable to play video</p>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            Format or network connection issue. Tap to retry.
          </p>
        </div>
      )}

      {/* Center Big Play Button (ALWAYS VISIBLE WHEN PAUSED) */}
      {!isPlaying && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/25 transition-opacity">
          <button
            type="button"
            onClick={togglePlay}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#0f2d59]/90 hover:bg-[#0f2d59] text-white flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all focus:outline-none ring-4 ring-white/30 cursor-pointer"
            aria-label="Play video"
          >
            <Play className="w-8 h-8 sm:w-10 sm:h-10 translate-x-0.5 fill-current text-amber-400" />
          </button>
        </div>
      )}

      {/* Tap Overlay when Playing (tap anywhere to pause or show controls) */}
      {isPlaying && (
        <div
          onClick={togglePlay}
          className="absolute inset-0"
        />
      )}

      {/* Bottom Controls Bar (Visible on touch tap or hover) */}
      <div
        className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 sm:p-4 flex items-center justify-between transition-opacity duration-200 ${
          showControls || !isPlaying ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={togglePlay}
            className="p-1.5 text-white hover:text-amber-400 transition-colors"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current text-amber-400" />}
          </button>

          <button
            type="button"
            onClick={toggleMute}
            className="p-1.5 text-white hover:text-amber-400 transition-colors"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>

          {title && (
            <span className="text-xs sm:text-sm font-medium text-white truncate max-w-[150px] sm:max-w-xs md:max-w-md">
              {title}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={toggleFullScreen}
          className="p-1.5 text-white hover:text-amber-400 transition-colors"
          aria-label="Full screen"
        >
          <Maximize className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
