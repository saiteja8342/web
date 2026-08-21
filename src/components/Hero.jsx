import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import BackgroundRippleEffect from './BackgroundRippleEffect';



export default function Hero({ isLoaded }) {
  const containerRef = useRef(null);
  const titleRef = useRef(null);
  const subRef = useRef(null);
  const btnRef = useRef(null);
  const videoWrapperRef = useRef(null);
  const videoRef = useRef(null);

  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  // GSAP Entrance Animations
  useEffect(() => {
    if (!isLoaded) return;

    // Split title into spans while preserving neon-glow-text
    if (titleRef.current && !titleRef.current.dataset.split) {
      titleRef.current.dataset.split = 'true';
      const nodes = Array.from(titleRef.current.childNodes);
      const fragment = document.createDocumentFragment();

      nodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const words = node.textContent.split(' ');
          words.forEach((word, idx) => {
            if (!word && idx === words.length - 1) return;
            const span = document.createElement('span');
            span.className = 'word';
            span.innerHTML = (word || '') + '&nbsp;';
            fragment.appendChild(span);
          });
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const isNeon = node.classList.contains('neon-glow-text');
          const words = node.textContent.split(' ');
          words.forEach((word, idx) => {
            if (!word && idx === words.length - 1) return;
            const span = document.createElement('span');
            span.className = `word ${isNeon ? 'neon-glow-text' : ''}`;
            span.innerHTML = (word || '') + '&nbsp;';
            fragment.appendChild(span);
          });
        }
      });

      titleRef.current.innerHTML = '';
      titleRef.current.appendChild(fragment);
    }

    const tl = gsap.timeline();

    tl.fromTo('.hero-eyebrow',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
    )
    .fromTo('.hero-h1 .word',
      { clipPath: 'inset(0 0 100% 0)', y: 20 },
      { clipPath: 'inset(0 0 0% 0)', y: 0, duration: 0.8, stagger: 0.08, ease: 'power3.out' },
      '<0.2'
    )
    .to(subRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'power3.out'
    }, '-=0.2')
    .to(btnRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'power3.out'
    }, '+=0.2');

    return () => {
      tl.kill();
    };
  }, [isLoaded]);

  // Autoplay immediately on mount and pause/resume based on viewport visibility
  useEffect(() => {
    const video = videoRef.current;
    const wrapper = videoWrapperRef.current;
    if (!video) return;

    if (video.readyState >= 2) {
      setVideoLoaded(true);
    }

    // Direct initial play attempt
    video.play()
      .then(() => setPaused(false))
      .catch(() => {
        video.muted = true;
        video.play()
          .then(() => setPaused(false))
          .catch(() => setPaused(true));
      });

    if (!wrapper) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play()
            .then(() => setPaused(false))
            .catch(() => {});
        } else {
          video.pause();
          setPaused(true);
        }
      },
      {
        root: null,
        rootMargin: '150px 0px',
        threshold: 0.05
      }
    );

    observer.observe(wrapper);

    const preventContextMenu = (e) => e.preventDefault();
    video.addEventListener('contextmenu', preventContextMenu);

    return () => {
      observer.disconnect();
      video.removeEventListener('contextmenu', preventContextMenu);
    };
  }, []);

  // Subtle 3D tilt tracking
  const handleMouseMove = (e) => {
    if (!videoWrapperRef.current) return;
    const rect = videoWrapperRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculate rotation limits (-5deg to 5deg)
    const rotateX = -((y / rect.height - 0.5) * 10);
    const rotateY = (x / rect.width - 0.5) * 10;
    
    setTilt({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const togglePlay = (e) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
      setPaused(false);
    } else {
      videoRef.current.pause();
      setPaused(true);
    }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setMuted(videoRef.current.muted);
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

  return (
    <section className="hero" ref={containerRef} style={{ position: 'relative', overflow: 'hidden' }}>
      <BackgroundRippleEffect />
      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div className="grid hero-grid">
          
          <div className="hero-left">
            <span className="eyebrow hero-eyebrow" style={{ opacity: isLoaded ? 0 : 0 }}>
              Premium Creative Studio
            </span>
            <h1 className="h1 hero-h1" ref={titleRef}>
              YOUR BRAND DESERVES <span className="neon-glow-text">AI VIDEOS.</span>
            </h1>
            <p className="body-large hero-sub" ref={subRef} style={{ opacity: 0, transform: 'translateY(20px)' }}>
              Premium video editing and AI-powered visual production for brands that want to stand out.
            </p>
            <div className="hero-btns" ref={btnRef} style={{ opacity: 0, transform: 'translateY(20px)' }}>
              <a href="#contact" className="slide-btn" data-hover-type="link">
                <span className="slide-btn-text-wrapper">
                  <span className="slide-btn-text-primary">Request a Quote</span>
                  <span className="slide-btn-text-secondary">Let's Talk</span>
                </span>
              </a>
              <a href="#work" className="slide-btn slide-btn-outline" data-hover-type="link">
                <span className="slide-btn-text-wrapper">
                  <span className="slide-btn-text-primary">VIEW OUR WORK</span>
                  <span className="slide-btn-text-secondary">OUR PORTFOLIO</span>
                </span>
              </a>
            </div>
          </div>

          <div className="hero-right">
            <div 
              className="hero-video-wrapper"
              ref={videoWrapperRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{
                transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                transition: 'transform 0.1s ease-out'
              }}
              data-hover-type="card"
              data-hover-label="PLAY"
            >
              {!videoLoaded && (
                <div className="skeleton-loader hero-skeleton" aria-hidden="true"></div>
              )}
              <video 
                ref={videoRef}
                src="/assets/videos/show_reel.mp4"
                poster="/assets/posters/showreel-poster.webp"
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                controlsList="nodownload" 
                disablePictureInPicture 
                className="hero-video"
                onLoadedData={() => setVideoLoaded(true)}
                onCanPlay={() => setVideoLoaded(true)}
                onPlaying={() => setVideoLoaded(true)}
              ></video>
              <div className="hero-video-overlay"></div>
              <div className="hero-vid-controls">
                <button className="v-btn hero-play-pause" onClick={togglePlay} aria-label="Play Pause">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                    {paused ? (
                      <path d="M8 5v14l11-7z"/>
                    ) : (
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                    )}
                  </svg>
                </button>
                <button className="v-btn hero-mute-btn" onClick={toggleMute} aria-label="Mute Unmute">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                    {muted ? (
                      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM11 5.27L9 7.27V9H7.27L11 12.73V5.27z"/>
                    ) : (
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
                    )}
                  </svg>
                </button>
                <button className="v-btn hero-fullscreen-btn" onClick={toggleFullscreen} aria-label="Fullscreen">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
