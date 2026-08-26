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
    <section ref={containerRef} className="about-cinematic-hero">
      {/* Background Image with Dark Vignette Gradients */}
      <div className="about-hero-bg-layer" />
      <div className="about-hero-gradient-overlay" />

      <div className="about-container about-hero-content-wrapper">
        
        {/* Left Side Content matching Reference Image */}
        <div className="about-hero-left-col">
          <h1 ref={titleRef} className="about-hero-main-title">
            About Us
          </h1>
          
          <p ref={subtitleRef} className="about-hero-subtitle">
            Crafting compelling stories one frame at a time
          </p>
        </div>

        {/* Lower Left Vertical Scroll Indicator */}
        <div ref={scrollRef} className="about-hero-scroll-indicator">
          <span className="about-hero-scroll-text">scroll</span>
          <div className="about-hero-scroll-line-track">
            <div className="about-hero-scroll-line-thumb" />
          </div>
        </div>

      </div>

      {/* STYLES */}
      <style dangerouslySetInnerHTML={{__html: `
        .about-cinematic-hero {
          position: relative;
          width: 100%;
          min-height: 92vh;
          display: flex;
          align-items: center;
          background-color: #000000;
          overflow: hidden;
          box-sizing: border-box;
          padding-top: 100px;
          padding-bottom: 80px;
        }

        /* Studio Background Image */
        .about-hero-bg-layer {
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          width: 100%;
          background-image: url('/image/about_hero_bg.jpg');
          background-size: cover;
          background-position: center right;
          background-repeat: no-repeat;
          z-index: 1;
          opacity: 0.92;
        }

        /* Seamless Gradient Fade to Black on the Left and Bottom */
        .about-hero-gradient-overlay {
          position: absolute;
          inset: 0;
          background: 
            linear-gradient(90deg, #000000 0%, #000000 28%, rgba(0, 0, 0, 0.85) 48%, rgba(0, 0, 0, 0.35) 75%, rgba(0, 0, 0, 0.05) 100%),
            linear-gradient(to top, #050507 0%, rgba(5, 5, 7, 0.6) 15%, transparent 40%),
            linear-gradient(to bottom, rgba(0, 0, 0, 0.8) 0%, transparent 20%);
          z-index: 2;
          pointer-events: none;
        }

        .about-hero-content-wrapper {
          position: relative;
          z-index: 3;
          width: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 60vh;
          padding: 0 40px;
          box-sizing: border-box;
        }

        .about-hero-left-col {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          max-width: 680px;
          margin-top: 40px;
        }

        .about-hero-main-title {
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif) !important;
          font-size: clamp(52px, 7vw, 92px) !important;
          font-weight: 700 !important;
          color: #FFFFFF !important;
          line-height: 1.02;
          letter-spacing: -0.035em;
          margin: 0 0 16px 0;
          text-shadow: 0 4px 24px rgba(0, 0, 0, 0.6);
        }

        .about-hero-subtitle {
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif) !important;
          font-size: clamp(17px, 1.6vw, 22px) !important;
          font-weight: 400 !important;
          color: rgba(255, 255, 255, 0.82) !important;
          line-height: 1.4;
          letter-spacing: -0.01em;
          margin: 0;
          text-shadow: 0 2px 12px rgba(0, 0, 0, 0.8);
        }

        /* Lower Left Vertical Scroll Indicator */
        .about-hero-scroll-indicator {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 16px;
          margin-top: 80px;
        }

        .about-hero-scroll-text {
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          font-size: 13px;
          font-weight: 400;
          color: rgba(255, 255, 255, 0.7);
          letter-spacing: 0.05em;
          text-transform: lowercase;
        }

        .about-hero-scroll-line-track {
          width: 2px;
          height: 54px;
          background-color: rgba(255, 255, 255, 0.15);
          position: relative;
          overflow: hidden;
          border-radius: 2px;
        }

        .about-hero-scroll-line-thumb {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 24px;
          background: #FFFFFF;
          box-shadow: 0 0 8px rgba(255, 255, 255, 0.8);
          animation: scrollLineMove 2.2s cubic-bezier(0.65, 0, 0.35, 1) infinite;
        }

        @keyframes scrollLineMove {
          0% {
            transform: translateY(-100%);
            opacity: 0;
          }
          30% {
            opacity: 1;
          }
          70% {
            opacity: 1;
          }
          100% {
            transform: translateY(220%);
            opacity: 0;
          }
        }

        @media (max-width: 960px) {
          .about-cinematic-hero {
            min-height: 85vh;
            padding-top: 90px;
          }

          .about-hero-bg-layer {
            background-position: 70% center;
            opacity: 0.65;
          }

          .about-hero-gradient-overlay {
            background: linear-gradient(to top, #050507 0%, rgba(0, 0, 0, 0.85) 50%, rgba(0, 0, 0, 0.65) 100%);
          }

          .about-hero-content-wrapper {
            padding: 0 24px;
            min-height: 50vh;
          }

          .about-hero-main-title {
            font-size: 48px !important;
          }

          .about-hero-subtitle {
            font-size: 16px !important;
          }

          .about-hero-scroll-indicator {
            margin-top: 48px;
          }
        }
      `}} />
    </section>
  );
}
