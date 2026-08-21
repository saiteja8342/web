import React, { useRef, useState, useEffect, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import VideoControls from './VideoControls';

function VideoCardComponent({
  project,
  index,
  offset,
  isActive,
  onSelect,
  isReducedMotion = false,
  cardWidth = 440,
  cardHeight = 720
}) {
  const videoRef = useRef(null);
  const cardRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCardHovered, setIsCardHovered] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  // Manage video playback based strictly on isActive
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.muted = isMuted;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => {
            // If browser autoplay policy blocked with audio, force mute and retry
            video.muted = true;
            setIsMuted(true);
            video.play()
              .then(() => setIsPlaying(true))
              .catch(() => setIsPlaying(false));
          });
      }
    } else {
      video.pause();
      try {
        video.currentTime = 0;
      } catch (e) {
        // Ignore seek errors on unloaded streams
      }
      setIsPlaying(false);
    }
  }, [isActive, isMuted]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentFs = document.fullscreenElement === cardRef.current ||
                          document.fullscreenElement === videoRef.current;
      setIsFullscreen(Boolean(isCurrentFs));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Subtle Mouse Parallax (Active Card only)
  const handleMouseMove = useCallback((e) => {
    if (!isActive || isReducedMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Max 2 deg rotateX, Max 3 deg rotateY
    const rotateX = -((y / rect.height - 0.5) * 4);
    const rotateY = (x / rect.width - 0.5) * 6;

    setTilt({ x: rotateX, y: rotateY });
  }, [isActive, isReducedMotion]);

  const handleMouseEnter = useCallback(() => {
    setIsCardHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsCardHovered(false);
    setTilt({ x: 0, y: 0 });
  }, []);

  // Play / Pause Toggle
  const togglePlay = useCallback((e) => {
    if (e) e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  // Mute / Unmute Toggle
  const toggleMute = useCallback((e) => {
    if (e) e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  // Fullscreen Toggle
  const toggleFullscreen = useCallback((e) => {
    if (e) e.stopPropagation();
    const target = cardRef.current || videoRef.current;
    if (!target) return;

    if (!document.fullscreenElement) {
      if (target.requestFullscreen) {
        target.requestFullscreen().catch(() => {});
      } else if (target.webkitRequestFullscreen) {
        target.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  }, []);

  // Handle Card Click: if inactive, click smoothly centers it
  const handleCardClick = () => {
    if (!isActive) {
      onSelect(index);
    } else {
      togglePlay();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick();
    }
  };

  const preventContextMenu = (e) => e.preventDefault();

  return (
    <div
      ref={cardRef}
      role="group"
      tabIndex={0}
      aria-label={`Project: ${project.title}, ${project.category}`}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`video-card-container ${isActive ? 'card-active' : 'card-inactive'}`}
      style={{
        width: `${cardWidth}px`,
        height: `${cardHeight}px`,
        cursor: isActive ? 'default' : 'pointer'
      }}
    >
      {/* 3D Parallax Inner Container */}
      <div
        className="video-card-inner"
        style={{
          transform: isActive && !isReducedMotion
            ? `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`
            : 'none',
          transition: 'transform 0.15s ease-out'
        }}
      >
        {/* Video Element */}
        <video
          ref={videoRef}
          src={project.video}
          poster={project.poster}
          autoPlay={isActive}
          muted={isMuted}
          playsInline
          loop
          preload="auto"
          controlsList="nodownload"
          disablePictureInPicture
          aria-label={project.title}
          onContextMenu={preventContextMenu}
          className="video-card-element"
        />

        {/* Center Hover Play/Pause Indicator (56px circle) */}
        <div
          className={`center-play-button ${
            !isPlaying || (isCardHovered && isActive) || (!isActive && isCardHovered)
              ? 'visible'
              : 'hidden'
          }`}
          aria-hidden="true"
        >
          <div className="center-play-circle">
            <Play size={22} fill="white" className="ml-1 text-white" />
          </div>
        </div>

        {/* Bottom Dark Gradient Info Overlay */}
        <div className="card-gradient-overlay">
          <div className="card-info-content">
            <div className="card-meta-top">
              <span className="card-category-badge">{project.category}</span>
              {project.metric && (
                <span className="card-metric-badge">{project.metric}</span>
              )}
            </div>

            <div className="card-meta-bottom">
              <h3 className="card-project-title">{project.title}</h3>
              {project.duration && (
                <span className="card-duration-text">{project.duration}</span>
              )}
            </div>
          </div>
        </div>

        {/* Video Controls Bar (Active card only on hover / always on mobile) */}
        {isActive && (
          <VideoControls
            isPlaying={isPlaying}
            isMuted={isMuted}
            isFullscreen={isFullscreen}
            onTogglePlay={togglePlay}
            onToggleMute={toggleMute}
            onToggleFullscreen={toggleFullscreen}
            className={`card-controls-layer ${isCardHovered ? 'controls-hovered' : ''}`}
          />
        )}
      </div>
    </div>
  );
}

export default memo(VideoCardComponent);
