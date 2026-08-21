import React from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2, Minimize2 } from 'lucide-react';

export default function VideoControls({
  isPlaying,
  isMuted,
  isFullscreen,
  onTogglePlay,
  onToggleMute,
  onToggleFullscreen,
  className = ''
}) {
  return (
    <div
      className={`video-controls-bar ${className}`}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className="ctrl-btn"
        onClick={onTogglePlay}
        aria-label={isPlaying ? "Pause video" : "Play video"}
      >
        {isPlaying ? <Pause size={16} strokeWidth={2} /> : <Play size={16} strokeWidth={2} className="ml-0.5" />}
      </button>

      <button
        type="button"
        className="ctrl-btn"
        onClick={onToggleMute}
        aria-label={isMuted ? "Unmute audio" : "Mute audio"}
      >
        {isMuted ? <VolumeX size={16} strokeWidth={2} /> : <Volume2 size={16} strokeWidth={2} />}
      </button>

      <button
        type="button"
        className="ctrl-btn"
        onClick={onToggleFullscreen}
        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      >
        {isFullscreen ? <Minimize2 size={15} strokeWidth={2} /> : <Maximize2 size={15} strokeWidth={2} />}
      </button>
    </div>
  );
}
