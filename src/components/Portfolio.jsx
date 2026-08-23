import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ShimmerText from './ShimmerText';

gsap.registerPlugin(ScrollTrigger);

const TILT_MAX = 7;

function PortfolioCard({ videoSrc, poster, category, title, aspectRatio, proofMetric, dimmed, onHoverStart, onHoverEnd }) {
  const cardRef = useRef(null);
  const videoRef = useRef(null);
  const [isInView, setIsInView] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [spotlight, setSpotlight] = useState({ x: 0, y: 0 });

  // IntersectionObserver: Only load video when in viewport
  // Unload video buffer when leaving viewport to keep playback and scrolling smooth
  useEffect(() => {
    const cardEl = cardRef.current;
    if (!cardEl) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        } else {
          setIsInView(false);
          setVideoLoaded(false);
        }
      },
      {
        root: null,
        rootMargin: '120px 60px', // Preloads next incoming video right before entering view
        threshold: 0.05
      }
    );

    observer.observe(cardEl);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Handle video load / play when in view, pause & unload when out of view
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isInView) {
      video.src = videoSrc;
      video.preload = 'auto';
      video.load();

      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
    } else {
      video.pause();
      setIsPlaying(false);
      video.removeAttribute('src');
      video.load();
    }

    const preventContextMenu = (e) => e.preventDefault();
    video.addEventListener('contextmenu', preventContextMenu);

    return () => {
      video.removeEventListener('contextmenu', preventContextMenu);
    };
  }, [isInView, videoSrc]);

  const handleMouseEnter = () => {
    if (videoRef.current && videoRef.current.paused) {
      videoRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    }
    onHoverStart();
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    onHoverEnd();
  };

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Tilt calculations
    const rotateX = -((y / rect.height - 0.5) * TILT_MAX);
    const rotateY = (x / rect.width - 0.5) * TILT_MAX;
    
    setTilt({ x: rotateX, y: rotateY });
    setSpotlight({ x, y });
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const toggleFullscreen = (e) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    } else if (videoRef.current.webkitRequestFullscreen) {
      videoRef.current.webkitRequestFullscreen();
    }
  };

  const isWidescreen = aspectRatio === '16/9';
  const widthStyle = isWidescreen ? 'min(400px, 80vw)' : 'min(225px, 50vw)';
  const ratioStyle = isWidescreen ? '16 / 9' : '9 / 16';

  return (
    <motion.div
      animate={{
        scale: dimmed ? 0.97 : 1,
        opacity: dimmed ? 0.45 : 1,
      }}
      className="portfolio-card"
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: 'transform 0.15s ease-out, opacity 0.4s ease, filter 0.4s ease',
        filter: dimmed ? 'blur(1px)' : 'none',
        width: widthStyle
      }}
    >
      <div 
        className="portfolio-video-wrapper"
        style={{ aspectRatio: ratioStyle }}
      >
        {!videoLoaded && (
          <div className="skeleton-loader" aria-hidden="true"></div>
        )}
        
        {/* Spotlight lighting effect */}
        <div 
          className="spotlight-glow"
          style={{
            '--mouse-x': `${spotlight.x}px`,
            '--mouse-y': `${spotlight.y}px`,
          }}
        ></div>

        {/* Proof metric badge if available (hiding views count) */}
        {proofMetric && !proofMetric.toLowerCase().includes('views') && (
          <div style={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 10,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            padding: '4px 10px',
            borderRadius: '9999px',
            fontSize: '0.7rem',
            fontWeight: 600,
            color: '#38BDF8',
            letterSpacing: '0.02em',
            pointerEvents: 'none'
          }}>
            {proofMetric}
          </div>
        )}

        {/* Video Title Overlay - VISIBLE ONLY WHEN POINTER IS HOVERED */}
        <div className="portfolio-hover-title-overlay">
          <span className="hover-category">{category}</span>
          <h3 className="hover-title">{title}</h3>
        </div>

        <video 
          controlsList="nodownload" 
          disablePictureInPicture 
          className="w-full h-full object-cover" 
          poster={poster}
          muted={isMuted} 
          loop 
          playsInline 
          preload="none"
          ref={videoRef}
          onLoadedData={() => setVideoLoaded(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        ></video>
        
        {/* Play Icon state overlay */}
        <div 
          className="h-vid-overlay" 
          style={{ 
            opacity: isPlaying ? 0 : 1,
            position: 'absolute',
            top: 0, left: 0, width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <span className="h-play-icon">▶</span>
        </div>
        
        {/* Controls */}
        <div 
          className="portfolio-controls"
          style={{ opacity: isPlaying ? 1 : 0 }}
        >
          <button className="vid-btn" onClick={toggleMute} aria-label="Mute Video">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              {isMuted ? (
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM11 5.27L9 7.27V9H7.27L11 12.73V5.27z"/>
              ) : (
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
              )}
            </svg>
          </button>
          <button className="vid-btn" onClick={toggleFullscreen} aria-label="Fullscreen Video">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
            </svg>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function Portfolio() {
  const sectionRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [hoveredTitle, setHoveredTitle] = useState(null);

  const filters = ['ALL', 'REELS', 'AI ADS', 'AI STORY', 'AI AVATARS'];

  const allVideos = [
    // --- VERTICAL VIDEOS (9/16) ---
    {
      videoSrc: '/assets/videos/show_reel.mp4',
      poster: '/assets/posters/showreel-poster.webp',
      category: 'AI AVATARS',
      title: 'Studio Showreel',
      desc: 'Vertical showreel highlighting our absolute best edits.',
      proofMetric: '2.4M Views',
      points: [
        'High-retention vertical pacing',
        'Custom motion graphics & SFX',
        'Cinematic LUT color grading'
      ],
      tags: ['Showreel', 'Production', 'Portfolio'],
      aspectRatio: '9/16'
    },
    {
      videoSrc: '/assets/videos/williams_towing_commercial.mp4',
      poster: '/assets/posters/showreel-poster.webp',
      category: 'REELS',
      title: 'Williams Towing',
      desc: 'Dynamic promotional commercial featuring high energy cuts.',
      proofMetric: '4.8x ROAS',
      points: [
        'High energy commercial cuts',
        'Sound design & audio sync',
        'Brand growth promotional storytelling'
      ],
      tags: ['Ad Film', 'Commercial', 'Sound Design'],
      aspectRatio: '9/16'
    },
    {
      videoSrc: '/assets/videos/garuda_reel.mp4',
      poster: '/assets/posters/ai-avatar-intro.webp',
      category: 'REELS',
      title: 'Garuda Action Story',
      desc: 'High energy vertical action cut optimizing sound rhythm.',
      proofMetric: '78% Retention',
      points: [
        'Action sequence rhythmic cuts',
        'Custom sound rhythm optimization',
        'Dynamic visual FX overlays'
      ],
      tags: ['Action', 'Effects', 'Reels'],
      aspectRatio: '9/16'
    },
    {
      videoSrc: '/assets/videos/kidney_stones.mp4',
      poster: '/assets/posters/ai-avatar-virtual.webp',
      category: 'REELS',
      title: 'Health Awareness Reel',
      desc: 'Informative social graphics with customized subtitle pacing.',
      proofMetric: '1.2M Reach',
      points: [
        'Animated subtitle pacing',
        'Informative social graphics',
        'UGC ad engagement style'
      ],
      tags: ['UGC Ad', 'Typography', 'Social'],
      aspectRatio: '9/16'
    },
    {
      videoSrc: '/assets/videos/davinci_resolve_course_trailer.mp4',
      poster: '/assets/posters/ai-avatar-intro.webp',
      category: 'AI AVATARS',
      title: 'DaVinci Resolve Course',
      desc: 'Promotional trailer editing tailored for social platform release.',
      proofMetric: '520K Views',
      points: [
        'Promotional trailer editing',
        'Typography & color grading',
        'Social release optimization'
      ],
      tags: ['Trailer', 'Typography', 'Grading'],
      aspectRatio: '9/16'
    },
    {
      videoSrc: '/assets/videos/ai-reel.mov',
      poster: '/assets/posters/ai-reel.webp',
      category: 'AI AVATARS',
      title: 'Dynamic AI Social Reel',
      desc: 'High-impact motion design elements tailored for scroll-retention.',
      proofMetric: '850K Views',
      points: [
        'High-impact motion design',
        'Scroll-retention pacing',
        'Generative AI visual enhancements'
      ],
      tags: ['Social', 'AI Reel', 'Pacing'],
      aspectRatio: '9/16'
    },
    // --- HORIZONTAL VIDEOS (16/9) ---
    {
      videoSrc: '/assets/videos/ai-coffee.mp4',
      poster: '/assets/posters/ai-coffee.webp',
      category: 'AI ADS',
      title: 'Coffee Commercial',
      desc: 'Premium CGI product showcase exploring camera panning mechanics.',
      proofMetric: '3.4x Conversion',
      points: [
        '3D camera panning mechanics',
        'CGI product showcase',
        'Atmospheric lighting & textures'
      ],
      tags: ['Commercial', '3D Panning', 'CGI'],
      aspectRatio: '16/9'
    },
    {
      videoSrc: '/assets/videos/ai-sweet.mp4',
      poster: '/assets/posters/ai-sweet.webp',
      category: 'AI ADS',
      title: 'Sweet Symphony',
      desc: 'Sound-synced fluid art rendering with precision LUT grade overlays.',
      proofMetric: '920K Reach',
      points: [
        'Sound-synced fluid rendering',
        'Precision LUT grade overlays',
        'Dynamic audio-visual sync'
      ],
      tags: ['Fluid Art', 'LUT Grading', 'Sync'],
      aspectRatio: '16/9'
    },
    {
      videoSrc: '/assets/videos/ai_skin_serum.mp4',
      poster: '/assets/posters/ai-avatar-virtual.webp',
      category: 'AI ADS',
      title: 'Skin Serum Promo',
      desc: 'Premium cosmetic product visualization utilizing AI simulation renders.',
      proofMetric: '6.1x ROAS',
      points: [
        'Cosmetic product visualization',
        'AI simulation renders',
        'Sleek luxury brand aesthetics'
      ],
      tags: ['Cosmetics', 'AI Promo', 'Simulation'],
      aspectRatio: '16/9'
    },
    {
      videoSrc: '/assets/videos/ai-hanuman.mp4',
      poster: '/assets/posters/ai-hanuman.webp',
      category: 'AI STORY',
      title: 'AI Hanuman Epic',
      desc: 'Widescreen visual narrative driven by custom generative algorithms.',
      proofMetric: '1.9M Views',
      points: [
        'Widescreen visual narrative',
        'Custom generative algorithms',
        'Epic cinematic storytelling'
      ],
      tags: ['AI Render', 'Visuals', 'Cinema'],
      aspectRatio: '16/9'
    },
    {
      videoSrc: '/assets/videos/ai_denta_karna_story.mp4',
      poster: '/assets/posters/ai-hanuman.webp',
      category: 'AI STORY',
      title: 'AI Denta Karna Story',
      desc: 'Epic cinematic storytelling utilizing customized AI generative renders.',
      proofMetric: '3.1M Views',
      points: [
        'Mythological AI renders',
        'High-detail generative scenes',
        'Immersive soundtrack sync'
      ],
      tags: ['AI Story', 'Generative', 'Reels'],
      aspectRatio: '16/9'
    }
  ];

  const filteredVideos = activeFilter === 'ALL'
    ? allVideos
    : allVideos.filter(vid => vid.category === activeFilter);

  // Reset scroll to left when filter changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  }, [activeFilter]);

  // Scroll controls
  const handleScrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -320,
        behavior: 'smooth',
      });
    }
  };

  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 320,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    const el = sectionRef.current;
    
    // GSAP Scroll reveals
    const reveals = el.querySelectorAll('.reveal-element');
    reveals.forEach((element) => {
      gsap.fromTo(element,
        { opacity: 0, y: 35 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: element,
            start: 'top 85%',
            toggleActions: 'play none none none',
            once: true
          }
        }
      );
    });

    const clips = el.querySelectorAll('.section-heading-clip');
    clips.forEach((clip) => {
      gsap.fromTo(clip,
        { clipPath: 'inset(100% 0 0 0)', y: 40 },
        {
          clipPath: 'inset(0% 0 0 0)',
          y: 0,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: clip,
            start: 'top 85%',
            once: true
          }
        }
      );
    });
  }, []);

  return (
    <section className="horizontal-work" id="work" ref={sectionRef}>
      <div className="container">
        
        {/* Header */}
        <div className="portfolio-header">
          <div className="portfolio-label-wrap reveal-element">
            <span className="caption eyebrow">SELECTED WORK</span>
            <div className="portfolio-label-line"></div>
          </div>
          
          <div className="portfolio-split-header">
            <ShimmerText
              text="Designed to<br />stop the scroll."
              className="portfolio-heading section-heading-clip"
            />
            <div className="portfolio-desc-wrap reveal-element">
              <div className="portfolio-divider"></div>
              <p className="body-large portfolio-desc">
                Explore our portfolio filtered by category. Scroll horizontally to view our vertical reels and widescreen productions.
              </p>
            </div>
          </div>
        </div>

        {/* Filters pills row (Clickable pills matching the reference image) */}
        <div className="portfolio-filters reveal-element">
          {filters.map((filter) => (
            <button
              key={filter}
              className={`portfolio-filter-pill ${activeFilter === filter ? 'active' : ''}`}
              onClick={() => setActiveFilter(filter)}
              data-hover-type="link"
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Horizontal Carousel View */}
        <div className="w-full py-4 border-b border-[#ffffff08] reveal-element">
          <div className="carousel-header" style={{ marginBottom: 16, justifyContent: 'flex-end' }}>
            {/* Scroll Navigation */}
            <div className="carousel-buttons">
              <button
                className="w-8 h-8 rounded-full border border-[#ffffff0d] hover:border-white/30 flex items-center justify-center text-zinc-400 hover:text-white transition-all bg-transparent"
                onClick={handleScrollLeft}
                aria-label="Scroll left"
                data-hover-type="link"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                className="w-8 h-8 rounded-full border border-[#ffffff0d] hover:border-white/30 flex items-center justify-center text-zinc-400 hover:text-white transition-all bg-transparent"
                onClick={handleScrollRight}
                aria-label="Scroll right"
                data-hover-type="link"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div
            className="carousel-container"
            ref={scrollContainerRef}
            style={{ minHeight: '380px' }}
          >
            {filteredVideos.map((item, idx) => (
              <PortfolioCard
                key={`${activeFilter}-${idx}`}
                dimmed={hoveredTitle !== null && hoveredTitle !== item.title}
                onHoverStart={() => setHoveredTitle(item.title)}
                onHoverEnd={() => setHoveredTitle(null)}
                {...item}
              />
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
