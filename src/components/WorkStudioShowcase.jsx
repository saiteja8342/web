import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Sparkles, Clock, Film, ExternalLink, ChevronUp, ChevronDown, Volume2, VolumeX } from 'lucide-react';
import { projects as defaultProjects } from '../data/projects';
import ShimmerText from './ShimmerText';
import { parseYouTubeInput, buildYouTubeEmbedUrl } from '../utils/youtube';
import { getPublicPortfolioVideos, getOurWorkSettings, DEFAULT_OUR_WORK_SETTINGS } from '../lib/db/cms';

export default function WorkStudioShowcase({ isHeadingH1 = true }) {
  const [allProjects, setAllProjects] = useState(defaultProjects);
  const [headerSettings, setHeaderSettings] = useState(DEFAULT_OUR_WORK_SETTINGS);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isCinemaPlaying, setIsCinemaPlaying] = useState(true);
  const videoRef = useRef(null);
  const cinemaIframeRef = useRef(null);
  const cardRef = useRef(null);
  const playlistRef = useRef(null);

  // Reset audio state when selected video cut changes
  useEffect(() => {
    setIsMuted(true);
    setIsCinemaPlaying(true);
  }, [selectedIndex]);

  // Audio Mute/Unmute Toggle for Studio Player
  const toggleCinemaMute = (e) => {
    if (e) e.stopPropagation();
    const nextMuted = !isMuted;
    if (isYouTube && cinemaIframeRef.current?.contentWindow) {
      cinemaIframeRef.current.contentWindow.postMessage(
        JSON.stringify({
          event: 'command',
          func: nextMuted ? 'mute' : 'unMute',
          args: []
        }),
        '*'
      );
      if (!nextMuted) {
        cinemaIframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: 'setVolume', args: [100] }),
          '*'
        );
      }
    } else if (videoRef.current) {
      videoRef.current.muted = nextMuted;
    }
    setIsMuted(nextMuted);
  };

  // Click handler to toggle YouTube play/pause without showing mobile skip/pause overlay
  const handleCinemaShieldClick = (e) => {
    if (e) e.stopPropagation();
    if (isYouTube && cinemaIframeRef.current?.contentWindow) {
      const nextPlay = !isCinemaPlaying;
      cinemaIframeRef.current.contentWindow.postMessage(
        JSON.stringify({
          event: 'command',
          func: nextPlay ? 'playVideo' : 'pauseVideo',
          args: []
        }),
        '*'
      );
      setIsCinemaPlaying(nextPlay);
    }
  };

  // Isolate mouse wheel events from Lenis smooth scroll and enable smooth queue scrolling
  useEffect(() => {
    const card = cardRef.current;
    const list = playlistRef.current;
    if (!card || !list) return;

    const handleWheel = (e) => {
      // If list has no vertical overflow, let the event scroll the page normally
      if (list.scrollHeight <= list.clientHeight) return;

      const delta = e.deltaY;
      const canScrollDown = list.scrollTop < (list.scrollHeight - list.clientHeight - 1);
      const canScrollUp = list.scrollTop > 1;

      if ((delta > 0 && canScrollDown) || (delta < 0 && canScrollUp)) {
        // Prevent window/Lenis scrolling while mouse is within the project queue
        e.preventDefault();
        e.stopPropagation();
        list.scrollTop += delta;
      }
    };

    // passive: false is required to allow e.preventDefault()
    card.addEventListener('wheel', handleWheel, { passive: false });
    return () => card.removeEventListener('wheel', handleWheel);
  }, [allProjects, activeCategory]);

  // Ensure active playlist cut is smoothly scrolled into view inside the playlist container only
  useEffect(() => {
    const container = playlistRef.current;
    if (!container) return;

    const activeEl = container.querySelector('.item-active');
    if (!activeEl) return;

    const containerRect = container.getBoundingClientRect();
    const activeRect = activeEl.getBoundingClientRect();

    if (activeRect.top < containerRect.top) {
      container.scrollBy({ top: activeRect.top - containerRect.top - 12, behavior: 'smooth' });
    } else if (activeRect.bottom > containerRect.bottom) {
      container.scrollBy({ top: activeRect.bottom - containerRect.bottom + 12, behavior: 'smooth' });
    }
  }, [selectedIndex]);

  useEffect(() => {
    let isMounted = true;
    getPublicPortfolioVideos().then((dbVideos) => {
      if (isMounted && dbVideos && dbVideos.length > 0) {
        const transformed = dbVideos.map((v) => ({
          id: v.id,
          title: v.title,
          category: v.category?.toUpperCase() || 'REELS',
          metric: v.metric || '',
          youtubeUrl: v.youtube_url,
          aspectRatio: v.aspect_ratio || '16/9',
          duration: v.duration || '',
          desc: v.description || ''
        }));
        setAllProjects(transformed);
      }
    }).catch(() => {});

    getOurWorkSettings().then((data) => {
      if (isMounted && data) {
        setHeaderSettings(data);
      }
    }).catch(() => {});

    return () => { isMounted = false; };
  }, []);

  // Category filter tabs
  const categories = useMemo(() => {
    const cats = new Set(['ALL']);
    allProjects.forEach(p => {
      if (p.category) cats.add(p.category.toUpperCase());
    });
    return Array.from(cats);
  }, [allProjects]);

  // Filter projects based on active tab
  const filteredProjects = useMemo(() => {
    if (activeCategory === 'ALL') return allProjects;
    return allProjects.filter((p) => p.category === activeCategory);
  }, [allProjects, activeCategory]);

  const total = filteredProjects.length;
  const safeIndex = total > 0 ? (selectedIndex >= total ? 0 : selectedIndex) : 0;
  const currentProject = filteredProjects[safeIndex] || allProjects[0] || {};

  const handleSelectCategory = (cat) => {
    setActiveCategory(cat);
    setSelectedIndex(0);
  };

  // Parse active video input
  const youtubeData = useMemo(() => {
    const raw = currentProject.youtubeEmbed || currentProject.youtubeUrl || currentProject.youtube || currentProject.video;
    return parseYouTubeInput(raw, currentProject.aspectRatio);
  }, [currentProject]);

  const isYouTube = Boolean(youtubeData?.videoId);
  const isVertical = currentProject.aspectRatio === '9/16' || youtubeData?.isVertical;

  const handleKeyDown = (e, idx) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((idx + 1) % total);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((idx - 1 + total) % total);
    }
  };

  return (
    <section className="work-studio-section" id="work" aria-label="Our Work Editorial Video Showcase">
      <div className="container">
        {/* Top Header */}
        <div className="work-studio-header">
          <span className="caption eyebrow">
            {headerSettings.eyebrow || 'PRODUCTION ARCHIVE'}
          </span>
          <ShimmerText
            text={headerSettings.title || (isHeadingH1 ? 'Featured AI Video & Editorial Work' : 'Our Work')}
            className="h2 work-studio-headline"
            as={isHeadingH1 ? 'h1' : 'h2'}
          />
          <p className="body-large work-studio-subtext">
            {headerSettings.subtitle || 'Explore our full commercial and short-form portfolio. Select any cut from the queue to stream in studio high-definition.'}
          </p>

          {/* Category Filter Tabs */}
          <div className="work-studio-filters" role="tablist" aria-label="Filter portfolio categories">
            <div className="work-studio-filters-track">
              {categories.map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={`work-studio-pill ${isActive ? 'active' : ''}`}
                    onClick={() => handleSelectCategory(cat)}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeWorkFilterPill"
                        className="work-studio-pill-indicator"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="work-studio-pill-text">{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Concept 2: Split Cinema Studio & Interactive Playlist */}
        <div className="work-studio-grid">
          {/* LEFT: Cinema Studio Stage */}
          <div className="work-cinema-stage-column">
            <div className={`work-cinema-viewport ${isVertical ? 'viewport-vertical-framed' : 'viewport-widescreen'}`}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentProject.id || currentProject.title || safeIndex}
                  className="work-cinema-player-wrapper"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                >
                  {isYouTube ? (
                    <div className="work-cinema-iframe-holder">
                      <iframe
                        ref={cinemaIframeRef}
                        src={buildYouTubeEmbedUrl(youtubeData.videoId, {
                          autoplay: true,
                          mute: true,
                          loop: true,
                          controls: false
                        })}
                        title={currentProject.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        className="work-cinema-iframe"
                      />
                      {/* Invisible shield to prevent YouTube touch/pause skip overlays */}
                      <div
                        className="youtube-click-shield"
                        onClick={handleCinemaShieldClick}
                        aria-label="Toggle playback"
                      />

                      {/* Cover with clean poster when paused so YouTube's internal center pause/skip buttons never render */}
                      {!isCinemaPlaying && (
                        <div
                          className="youtube-paused-poster-cover"
                          onClick={handleCinemaShieldClick}
                          aria-label="Play video"
                        >
                          <img
                            src={currentProject.poster || youtubeData?.maxresThumbnail || youtubeData?.thumbnail}
                            alt={currentProject.title}
                            className="work-cinema-poster-img"
                          />
                          <div className="work-cinema-play-overlay">
                            <div className="work-cinema-play-circle">
                              <Play size={28} fill="white" className="ml-1 text-white" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : currentProject.video ? (
                    <video
                      ref={videoRef}
                      src={currentProject.video}
                      poster={currentProject.poster || youtubeData?.thumbnail}
                      autoPlay
                      muted={isMuted}
                      controls
                      playsInline
                      loop
                      className="work-cinema-direct-video"
                    />
                  ) : (
                    <div className="work-cinema-poster-fallback">
                      <img
                        src={currentProject.poster || youtubeData?.maxresThumbnail || youtubeData?.thumbnail}
                        alt={currentProject.title}
                        className="work-cinema-poster-img"
                      />
                      <div className="work-cinema-play-overlay">
                        <div className="work-cinema-play-circle">
                          <Play size={28} fill="white" className="ml-1 text-white" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Top-Right Audio Mute/Unmute Icon Button */}
                  <div className="work-cinema-top-chips">
                    <div />
                    <button
                      type="button"
                      className="video-audio-toggle-btn work-cinema-audio-btn"
                      onClick={toggleCinemaMute}
                      aria-label={isMuted ? 'Unmute studio audio' : 'Mute studio audio'}
                      title={isMuted ? 'Click to Unmute' : 'Click to Mute'}
                    >
                      {isMuted ? (
                        <VolumeX size={18} strokeWidth={2.2} className="audio-icon-muted" />
                      ) : (
                        <Volume2 size={18} strokeWidth={2.2} className="audio-icon-unmuted" />
                      )}
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Studio Meta Card */}
            <div className="work-cinema-meta-card">
              <div className="work-meta-header-row">
                <div className="work-meta-badges">
                  <span className="work-badge category">
                    <Sparkles size={11} className="mr-1 inline-block" />
                    {currentProject.category}
                  </span>
                  {currentProject.metric && (
                    <span className="work-badge metric">
                      {currentProject.metric}
                    </span>
                  )}
                  {currentProject.duration && (
                    <span className="work-badge duration">
                      <Clock size={11} className="mr-1 inline-block" />
                      {currentProject.duration}
                    </span>
                  )}
                </div>

                <a
                  href="#contact"
                  className="work-meta-cta-btn"
                  data-hover-type="button"
                >
                  Order Similar Cut <ExternalLink size={12} className="ml-1 inline-block" />
                </a>
              </div>

              <h2 className="work-cinema-title">{currentProject.title}</h2>

              {currentProject.desc && (
                <p className="work-cinema-desc">{currentProject.desc}</p>
              )}

              {/* Tech Workflow Pills */}
              <div className="work-tech-tags">
                <span className="work-tech-tag">Generative AI</span>
                <span className="work-tech-tag">Studio Grading</span>
                <span className="work-tech-tag">Bespoke Audio</span>
                <span className="work-tech-tag">High Retention</span>
              </div>
            </div>
          </div>

          {/* RIGHT: Interactive Studio Playlist / Queue */}
          <div className="work-playlist-column">
            <div ref={cardRef} className="work-playlist-card" data-lenis-prevent="true">
              <div className="work-playlist-header">
                <div className="work-playlist-header-left">
                  <Film size={15} className="text-secondary" />
                  <span className="work-playlist-heading">PROJECT QUEUE</span>
                </div>
                <div className="work-playlist-header-actions">
                  <span className="work-playlist-counter">
                    {safeIndex + 1} OF {total}
                  </span>
                  <div className="work-playlist-nav-btns">
                    <button
                      type="button"
                      className="work-queue-nav-btn"
                      aria-label="Previous cut"
                      onClick={() => setSelectedIndex((prev) => (prev > 0 ? prev - 1 : total - 1))}
                      title="Previous Cut"
                    >
                      <ChevronUp size={13} />
                    </button>
                    <button
                      type="button"
                      className="work-queue-nav-btn"
                      aria-label="Next cut"
                      onClick={() => setSelectedIndex((prev) => (prev < total - 1 ? prev + 1 : 0))}
                      title="Next Cut"
                    >
                      <ChevronDown size={13} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Scrollable list of video cards with Lenis scroll isolation */}
              <div
                ref={playlistRef}
                className="work-playlist-items"
                role="tablist"
                aria-label="Available cuts in portfolio"
                data-lenis-prevent="true"
                data-lenis-prevent-touch="true"
              >
                {filteredProjects.map((project, idx) => {
                  const isActive = idx === safeIndex;
                  const itemYt = parseYouTubeInput(
                    project.youtubeEmbed || project.youtubeUrl || project.youtube || project.video,
                    project.aspectRatio
                  );
                  const thumb = project.poster || itemYt?.thumbnail || '';

                  return (
                    <button
                      key={project.id || idx}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      className={`work-playlist-item ${isActive ? 'item-active' : ''}`}
                      onClick={() => setSelectedIndex(idx)}
                      onKeyDown={(e) => handleKeyDown(e, idx)}
                      data-hover-type="link"
                    >
                      {/* Thumbnail Preview */}
                      <div className="work-playlist-thumb-box">
                        {thumb ? (
                          <img
                            src={thumb}
                            alt=""
                            loading="lazy"
                            className="work-playlist-thumb-img"
                          />
                        ) : (
                          <div className="work-playlist-thumb-placeholder">
                            <Film size={18} />
                          </div>
                        )}
                        <span className="work-playlist-thumb-duration">
                          {project.duration || (project.aspectRatio === '9/16' ? '0:30' : '0:45')}
                        </span>
                        {isActive && (
                          <div className="work-playlist-active-badge">
                            <span className="equalizer-bar eq-1" />
                            <span className="equalizer-bar eq-2" />
                            <span className="equalizer-bar eq-3" />
                          </div>
                        )}
                      </div>

                      {/* Item Info */}
                      <div className="work-playlist-item-info">
                        <div className="work-playlist-item-top">
                          <span className="work-playlist-item-cat">{project.category}</span>
                          {project.metric && (
                            <span className="work-playlist-item-metric">{project.metric}</span>
                          )}
                        </div>
                        <h4 className="work-playlist-item-title">{project.title}</h4>
                        <span className="work-playlist-item-status">
                          {isActive ? '● NOW STREAMING' : 'CLICK TO STREAM'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
