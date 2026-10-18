import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function AboutHero() {
  const containerRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.fromTo(
      titleRef.current,
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 1.0, delay: 0.2 }
    )
    .fromTo(
      subtitleRef.current,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.8 },
      '-=0.6'
    )
    .fromTo(
      scrollRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8 },
      '-=0.4'
    );
  }, []);

  return (
    <section ref={containerRef} className="about-cinematic-hero" id="hero" aria-label="About MotionNodeEdits Hero">
      {/* Background Studio Image */}
      <div className="about-hero-bg-layer" aria-hidden="true" />
      {/* Dark Vignette Overlay Gradients */}
      <div className="about-hero-gradient-overlay" aria-hidden="true" />

      <div className="about-container about-hero-content-wrapper">
        {/* Left Side Content matching Live Site */}
        <div className="about-hero-left-col">
          <h1 ref={titleRef} className="about-hero-main-title">
            About Us
          </h1>
          <p ref={subtitleRef} className="about-hero-subtitle">
            Crafting compelling stories one frame at a time
          </p>
        </div>

        {/* Lower Left Vertical Scroll Indicator */}
        <div ref={scrollRef} className="about-hero-scroll-indicator" aria-hidden="true">
          <span className="about-hero-scroll-text">scroll</span>
          <div className="about-hero-scroll-line-track">
            <div className="about-hero-scroll-line-thumb" />
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .about-cinematic-hero {
          position: relative;
          width: 100%;
          min-height: 100vh;
          display: flex;
          align-items: center;
          background-color: #050507;
          overflow: hidden;
          box-sizing: border-box;
          padding-top: 110px;
        }

        .about-hero-bg-layer {
          position: absolute;
          inset: 0;
          background-image: url('/image/about_hero_bg.jpg');
          background-size: cover;
          background-position: center right;
          background-repeat: no-repeat;
          opacity: 0.85;
          z-index: 0;
          pointer-events: none;
        }

        .about-hero-gradient-overlay {
          position: absolute;
          inset: 0;
          background: 
            linear-gradient(to right, #050507 0%, rgba(5, 5, 7, 0.95) 30%, rgba(5, 5, 7, 0.6) 60%, rgba(5, 5, 7, 0.2) 100%),
            linear-gradient(to top, #050507 0%, transparent 22%),
            linear-gradient(to bottom, #050507 0%, transparent 18%);
          z-index: 1;
          pointer-events: none;
        }

        .about-hero-content-wrapper {
          position: relative;
          z-index: 2;
          width: 100%;
          min-height: calc(100vh - 110px);
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding-bottom: 70px;
          box-sizing: border-box;
        }

        .about-hero-left-col {
          max-width: 680px;
        }

        .about-hero-main-title {
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif) !important;
          font-size: clamp(52px, 6.8vw, 92px) !important;
          font-weight: 700 !important;
          letter-spacing: -0.035em !important;
          color: #FFFFFF !important;
          line-height: 1.05 !important;
          margin: 0 0 18px 0 !important;
        }

        .about-hero-subtitle {
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif) !important;
          font-size: clamp(18px, 2.1vw, 24px) !important;
          font-weight: 400 !important;
          color: rgba(255, 255, 255, 0.72) !important;
          line-height: 1.5 !important;
          letter-spacing: -0.01em !important;
          margin: 0 !important;
        }

        .about-hero-scroll-indicator {
          position: absolute;
          bottom: 48px;
          left: 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          z-index: 3;
        }

        @media (max-width: 768px) {
          .about-cinematic-hero {
            min-height: 85vh;
            padding-top: 100px;
          }
          .about-hero-content-wrapper {
            min-height: calc(85vh - 100px);
            padding-bottom: 60px;
          }
          .about-hero-scroll-indicator {
            left: 20px;
            bottom: 24px;
          }
        }

        .about-hero-scroll-text {
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          font-size: 13px;
          font-weight: 400;
          color: rgba(255, 255, 255, 0.45);
          letter-spacing: 0.05em;
          text-transform: lowercase;
        }

        .about-hero-scroll-line-track {
          width: 1.5px;
          height: 48px;
          background: rgba(255, 255, 255, 0.16);
          position: relative;
          overflow: hidden;
        }

        .about-hero-scroll-line-thumb {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 20px;
          background: #FFFFFF;
          animation: aboutHeroScrollDown 2.2s cubic-bezier(0.65, 0, 0.35, 1) infinite;
        }

        @keyframes aboutHeroScrollDown {
          0% { transform: translateY(-100%); opacity: 0; }
          30% { opacity: 1; }
          70% { opacity: 1; }
          100% { transform: translateY(50px); opacity: 0; }
        }
      `}} />
    </section>
  );
}
