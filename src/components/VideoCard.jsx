import React, { useRef, useState, useEffect, useCallback, useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import VideoControls from './VideoControls';
import { parseYouTubeInput, buildYouTubeEmbedUrl } from '../utils/youtube';

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
  const [imgError, setImgError] = useState(false);

  // Parse YouTube video input if available (from youtubeEmbed, youtubeUrl, or video property)
  const youtubeData = useMemo(() => {
    const raw = project.youtubeEmbed || project.youtubeUrl || project.youtube || project.video;
    return parseYouTubeInput(raw, project.aspectRatio);
  }, [project.youtubeEmbed, project.youtubeUrl, project.youtube, project.video, project.aspectRatio]);

  const isYouTube = Boolean(youtubeData?.videoId);

  // Poster thumbnail resolution
  const posterSrc = useMemo(() => {
    if (project.poster) return project.poster;
    if (isYouTube) {
      return imgError ? youtubeData.thumbnail : youtubeData.maxresThumbnail;
    }
    return '';
  }, [project.poster, isYouTube, imgError, youtubeData]);

  // Manage direct HTML5 video playback strictly on isActive
  useEffect(() => {
    if (isYouTube) return;
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.muted = isMuted;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => {
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
  }, [isActive, isMuted, isYouTube]);

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

  // Play / Pause Toggle for direct video
  const togglePlay = useCallback((e) => {
    if (e) e.stopPropagation();
    if (isYouTube) return;
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
  }, [isYouTube]);

  // Mute / Unmute Toggle for direct video
  const toggleMute = useCallback((e) => {
    if (e) e.stopPropagation();
    if (isYouTube) return;
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, [isYouTube]);

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

  // Handle Card Click
  const handleCardClick = () => {
    if (!isActive) {
      onSelect(index);
    } else if (!isYouTube) {
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
        {/* Active State: YouTube Embed or Direct Video */}
        {isActive ? (
          isYouTube ? (
            <div className="youtube-embed-wrapper">
              <iframe
                src={buildYouTubeEmbedUrl(youtubeData.videoId, {
                  autoplay: true,
                  mute: true,
                  loop: true,
                  controls: true
                })}
                title={project.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="youtube-embed-frame"
              />
            </div>
          ) : (
            <video
              ref={videoRef}
              src={project.video}
              poster={posterSrc}
              autoPlay
              muted={isMuted}
              playsInline
              loop
              preload="metadata"
              controlsList="nodownload"
              disablePictureInPicture
              aria-label={project.title}
              onContextMenu={preventContextMenu}
              className="video-card-element"
            />
          )
        ) : (
          /* Inactive State: High quality poster/thumbnail */
          <img
            src={posterSrc}
            alt={project.title}
            loading="lazy"
            decoding="async"
            onError={() => setImgError(true)}
            className="video-card-element"
          />
        )}

        {/* Center Hover Play Indicator (Inactive card or paused direct video) */}
        {(!isActive || (!isYouTube && !isPlaying)) && (
          <div
            className={`center-play-button ${isCardHovered || !isActive ? 'visible' : 'hidden'}`}
            aria-hidden="true"
          >
            <div className="center-play-circle">
              <Play size={22} fill="white" className="ml-1 text-white" />
            </div>
          </div>
        )}

        {/* Bottom Dark Gradient Info Overlay (Shows metadata; pointer-events: none so clicks pass to video/iframe) */}
        <div className={`card-gradient-overlay ${isActive && isYouTube ? 'youtube-active-overlay' : ''}`}>
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

        {/* Video Controls Bar (Only for direct HTML5 video, active state) */}
        {isActive && !isYouTube && (
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

