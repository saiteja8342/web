import React, { useRef, useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Play, Volume2, VolumeX, Sparkles } from 'lucide-react';
import VideoControls from './VideoControls';
import { parseYouTubeInput, buildYouTubeEmbedUrl } from '../utils/youtube';

function getProjectAspectRatio(project) {
  if (project?.aspectRatio === '9/16' || project?.aspectRatio === '16/9') {
    return project.aspectRatio;
  }
  const raw = project?.youtubeEmbed || project?.youtubeUrl || project?.youtube || project?.video;
  const parsed = parseYouTubeInput(raw, project?.aspectRatio);
  return parsed?.aspectRatio || '16/9';
}

function VideoCardComponent({
  project,
  index = 0,
  offset: _offset,
  isActive,
  onSelect,
  isReducedMotion = false,
  cardWidth = 440,
  cardHeight = 720
}) {
  const videoRef = useRef(null);
  const iframeRef = useRef(null);
  const cardRef = useRef(null);
  const innerRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isYouTubePlaying, setIsYouTubePlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCardHovered, setIsCardHovered] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Reset audio and playback state when active card changes
  useEffect(() => {
    if (!isActive) {
      setIsMuted(true);
      setIsYouTubePlaying(true);
    }
  }, [isActive]);

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
      } catch {
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

  // Subtle Mouse Parallax (Active Card only, mutating DOM transform directly to avoid 60-120fps React re-renders)
  const handleMouseMove = useCallback((e) => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) return;
    if (!isActive || isReducedMotion || !cardRef.current || !innerRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const rotateX = -((y / rect.height - 0.5) * 4);
    const rotateY = (x / rect.width - 0.5) * 6;

    innerRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  }, [isActive, isReducedMotion]);

  const handleMouseEnter = useCallback(() => {
    setIsCardHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsCardHovered(false);
    if (innerRef.current) {
      innerRef.current.style.transform = 'none';
    }
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

  // Mute / Unmute Toggle for both YouTube and direct video
  const toggleMute = useCallback((e) => {
    if (e) e.stopPropagation();

    if (isYouTube) {
      const iframe = iframeRef.current;
      const nextMuted = !isMuted;
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage(
          JSON.stringify({
            event: 'command',
            func: nextMuted ? 'mute' : 'unMute',
            args: []
          }),
          '*'
        );
        if (!nextMuted) {
          iframe.contentWindow.postMessage(
            JSON.stringify({ event: 'command', func: 'setVolume', args: [100] }),
            '*'
          );
        }
      }
      setIsMuted(nextMuted);
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, [isYouTube, isMuted]);

  // Click handler on YouTube shield to toggle play/pause without activating YouTube's center skip controls
  const handleYouTubeShieldClick = useCallback((e) => {
    if (e) e.stopPropagation();
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) return;

    const nextPlay = !isYouTubePlaying;
    iframe.contentWindow.postMessage(
      JSON.stringify({
        event: 'command',
        func: nextPlay ? 'playVideo' : 'pauseVideo',
        args: []
      }),
      '*'
    );
    setIsYouTubePlaying(nextPlay);
  }, [isYouTubePlaying]);

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
  const isVertical = getProjectAspectRatio(project) === '9/16';

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
      className={`video-card-container ${isActive ? 'card-active' : 'card-inactive'} ${isVertical ? 'is-vertical-reel' : 'is-widescreen'}`}
      style={{
        width: `${cardWidth}px`,
        height: `${cardHeight}px`,
        cursor: isActive ? 'default' : 'pointer'
      }}
    >
      {/* 3D Parallax Inner Container */}
      <div
        ref={innerRef}
        className="video-card-inner"
        style={{
          transform: 'none',
          transition: 'transform 0.15s ease-out'
        }}
      >
        {/* Smartphone Dynamic Island Notch for 9:16 Vertical Reels - Hides during streaming, unhides on hover */}
        {isVertical && (
          <div
            className={`phone-dynamic-island ${(!isActive || isCardHovered) ? 'island-visible' : 'island-hidden'}`}
            aria-hidden="true"
          >
            {!isMuted && isActive && <span className="island-sound-dot" aria-hidden="true" />}
            <span className="island-lens" />
          </div>
        )}

        {/* Audio Mute/Unmute Quick Icon Button */}
        {isActive && (
          <button
            type="button"
            className="video-audio-toggle-btn"
            onClick={toggleMute}
            aria-label={isMuted ? 'Unmute video audio' : 'Mute video audio'}
            title={isMuted ? 'Click to Unmute' : 'Click to Mute'}
          >
            {isMuted ? (
              <VolumeX size={18} strokeWidth={2.2} className="audio-icon-muted" />
            ) : (
              <Volume2 size={18} strokeWidth={2.2} className="audio-icon-unmuted" />
            )}
          </button>
        )}

        {/* Active State: YouTube Embed or Direct Video */}
        {isActive ? (
          isYouTube ? (
            <div className="youtube-embed-wrapper">
              <iframe
                ref={iframeRef}
                src={buildYouTubeEmbedUrl(youtubeData.videoId, {
                  autoplay: true,
                  mute: true,
                  loop: true,
                  controls: false
                })}
                title={project.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="youtube-embed-frame"
              />
              {/* Invisible Shield prevents YouTube touch overlay & center skip buttons */}
              <div
                className="youtube-click-shield"
                onClick={handleYouTubeShieldClick}
                aria-label="Toggle playback"
              />

              {/* Cover with clean high-res poster when paused so YouTube's internal center pause/skip buttons never render */}
              {!isYouTubePlaying && (
                <div
                  className="youtube-paused-poster-cover"
                  onClick={handleYouTubeShieldClick}
                  aria-label="Play video"
                >
                  <img
                    src={posterSrc}
                    alt={project.title}
                    className="video-card-element"
                  />
                  <div className="center-play-button visible" aria-hidden="true">
                    <div className="center-play-circle">
                      <Play size={24} fill="white" className="ml-1 text-white" />
                    </div>
                  </div>
                </div>
              )}
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
            alt={`${project.title} — ${project.category} video by MotionNodeEdits`}
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

        {/* Bottom Dark Gradient Info Overlay - Hidden on active streaming, shown only on inactive browsing */}
        {!isActive && (
          <div className="card-gradient-overlay">
            <div className="card-info-content">
              <div className="card-meta-top">
                <span className="card-category-badge">
                  <Sparkles size={11} className="badge-icon inline-block mr-1" />
                  {project.category}
                </span>
                {project.metric && (
                  <span className="card-metric-badge">{project.metric}</span>
                )}
                <span className="card-format-pill">
                  {isVertical ? '9:16 REEL' : '16:9 4K'}
                </span>
              </div>

              <div className="card-meta-bottom">
                <h3 className="card-project-title">{project.title}</h3>
                {project.duration && (
                  <span className="card-duration-text">{project.duration}</span>
                )}
              </div>
            </div>
          </div>
        )}

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


