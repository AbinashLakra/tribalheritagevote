'use client';

import React, { useState, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, AlertCircle, Loader2 } from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
}

export function VideoPlayer({ src, poster, title }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {
        setHasError(true);
      });
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullScreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video bg-charcoal-950 rounded-xl overflow-hidden shadow-lg group select-none"
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        playsInline
        onWaiting={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
        onEnded={() => setIsPlaying(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        onClick={togglePlay}
        className="w-full h-full object-cover cursor-pointer"
      />

      {/* Loading Overlay */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-charcoal-950/40 backdrop-blur-xs">
          <Loader2 className="w-10 h-10 text-ivory-200 animate-spin" />
        </div>
      )}

      {/* Error Overlay */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-charcoal-950/90 text-ivory-100 p-4 text-center">
          <AlertCircle className="w-12 h-12 text-terracotta-500 mb-2" />
          <p className="font-semibold text-lg">Unable to play video</p>
          <p className="text-sm text-charcoal-400 mt-1 max-w-sm">
            This media file may still be processing or is temporarily unavailable.
          </p>
        </div>
      )}

      {/* Center Play Button on Pause */}
      {!isPlaying && !isLoading && !hasError && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-forest-700/90 text-white flex items-center justify-center shadow-xl hover:scale-110 hover:bg-forest-600 transition-all focus:outline-none"
          aria-label="Play video"
        >
          <Play className="w-8 h-8 translate-x-0.5 fill-current" />
        </button>
      )}

      {/* Bottom Controls Bar */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-charcoal-950/90 via-charcoal-950/50 to-transparent p-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            className="p-1.5 text-ivory-100 hover:text-white transition-colors"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
          </button>

          <button
            onClick={toggleMute}
            className="p-1.5 text-ivory-100 hover:text-white transition-colors"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>

          {title && (
            <span className="text-sm font-medium text-ivory-100 truncate max-w-xs md:max-w-md">
              {title}
            </span>
          )}
        </div>

        <button
          onClick={toggleFullScreen}
          className="p-1.5 text-ivory-100 hover:text-white transition-colors"
          aria-label="Full screen"
        >
          <Maximize className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
