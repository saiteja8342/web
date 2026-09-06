import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Volume2, VolumeX } from 'lucide-react';
import BackgroundRippleEffect from './BackgroundRippleEffect';

export default function Hero({ isLoaded }) {
  const containerRef = useRef(null);
  const titleRef = useRef(null);
  const subRef = useRef(null);
  const btnRef = useRef(null);
  const videoWrapperRef = useRef(null);
  const iframeRef = useRef(null);

  const [videoLoaded, setVideoLoaded] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isMuted, setIsMuted] = useState(true);

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

  // Toggle video mute / unmute using YouTube IFrame Player postMessage API
  const toggleAudio = (e) => {
    if (e) {
      e.stopPropagation();
    }
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({
          event: 'command',
          func: nextMuted ? 'mute' : 'unMute',
          args: []
        }),
        '*'
      );
      if (!nextMuted) {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({
            event: 'command',
            func: 'setVolume',
            args: [100]
          }),
          '*'
        );
      }
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
              onClick={toggleAudio}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{
                transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                transition: 'transform 0.1s ease-out',
                cursor: 'pointer'
              }}
              data-hover-type="card"
              data-hover-label={isMuted ? "UNMUTE" : "MUTE"}
            >
              {!videoLoaded && (
                <div className="skeleton-loader hero-skeleton" aria-hidden="true"></div>
              )}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                borderRadius: '20px',
                pointerEvents: 'none'
              }}>
                <iframe
                  ref={iframeRef}
                  src="https://www.youtube-nocookie.com/embed/qouiu4CbHU8?autoplay=1&mute=1&loop=1&playlist=qouiu4CbHU8&playsinline=1&rel=0&modestbranding=1&controls=0&disablekb=1&iv_load_policy=3&cc_load_policy=0&fs=0&enablejsapi=1"
                  title="MotionNodeEdits Hero Reel"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="hero-video"
                  style={{
                    position: 'absolute',
                    top: '48%',
                    left: '50%',
                    width: '140%',
                    height: '140%',
                    transform: 'translate(-50%, -50%)',
                    border: 0,
                    display: 'block',
                    pointerEvents: 'none'
                  }}
                  onLoad={() => {
                    setVideoLoaded(true);
                    if (iframeRef.current?.contentWindow) {
                      iframeRef.current.contentWindow.postMessage(
                        JSON.stringify({ event: 'listening' }),
                        '*'
                      );
                    }
                  }}
                />
              </div>

              {/* Floating Mute / Unmute Sound Control */}
              <div className="hero-vid-controls">
                <button
                  type="button"
                  onClick={toggleAudio}
                  className={`hero-sound-btn ${!isMuted ? 'is-unmuted' : ''}`}
                  aria-label={isMuted ? "Unmute video audio" : "Mute video audio"}
                  title={isMuted ? "Click to unmute sound" : "Click to mute sound"}
                  data-hover-type="link"
                >
                  {isMuted ? (
                    <>
                      <VolumeX size={15} strokeWidth={2.4} />
                      <span>Unmute</span>
                    </>
                  ) : (
                    <>
                      <Volume2 size={15} strokeWidth={2.4} className="sound-active-pulse" />
                      <span>Mute</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
