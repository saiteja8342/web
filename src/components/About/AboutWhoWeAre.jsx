import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function AboutWhoWeAre() {
  const sectionRef = useRef(null);
  const emblemRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      // Subtle reveal for agency section
      gsap.fromTo(
        section.querySelector('.about-agency-top-grid'),
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            toggleActions: 'play none none none'
          }
        }
      );
    }, section);

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <section className="about-agency-section" id="who-we-are" ref={sectionRef}>
      {/* Background Animated Contour Waves */}
      <div className="about-agency-bg-overlay" aria-hidden="true">
        <svg 
          className="about-agency-waves" 
          viewBox="0 0 1440 600" 
          preserveAspectRatio="none"
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M-200 480 C 250 180, 750 480, 1640 220" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1.8" className="wave-line-1" />
          <path d="M-200 530 C 250 230, 750 530, 1640 270" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1.2" className="wave-line-2" />
          <path d="M-200 580 C 250 280, 750 580, 1640 320" stroke="rgba(255, 255, 255, 0.07)" strokeWidth="1.5" className="wave-line-3" />
          <path d="M-200 630 C 250 330, 750 630, 1640 370" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1" className="wave-line-4" />
        </svg>
      </div>

      <div className="about-container about-agency-container">
        
        {/* TOP ROW: BRAND LOGO & EDITORIAL AGENCY INTRODUCTION */}
        <div className="about-agency-top-grid">
          
          {/* LEFT COLUMN: BRAND EMBLEM & TITLE */}
          <div className="about-agency-left-col">
            <div className="about-agency-brand-wrapper">
              <div className="about-agency-logo-container" ref={emblemRef}>
                {/* Rotating Dashed Halo */}
                <div className="about-agency-halo-ring" />
                <div className="about-agency-logo-icon">
                  <img 
                    src="/image/mne_logo.png" 
                    alt="MotionNodeEdits Emblem" 
                    className="about-agency-logo-img"
                  />
                </div>
              </div>

              <div className="about-agency-brand-info">
                <span className="about-agency-brand-name">
                  MOTIONNODEEDITS
                </span>
                <span className="about-agency-brand-tag">
                  CREATIVE STUDIO // EST. 2024
                </span>
              </div>
            </div>

            <h2 className="about-agency-main-title">
              About Our<br />
              Agency
            </h2>
          </div>

          {/* RIGHT COLUMN: REFINED EDITORIAL PARAGRAPH */}
          <div className="about-agency-right-col">
            <p className="about-agency-body-text lead-text">
              <strong className="text-white-highlight">MotionNodeEdits</strong> is a next-generation AI video production and creative post-production agency. We help brands, businesses, and creators produce high-retention video content with modern generative AI technologies, cinematic editing, and sound design.
            </p>
            <p className="about-agency-body-text">
              We take care of your AI video commercials, social media reels, talking-avatar videos, product ads, motion graphics, color grading, and corporate visual storytelling. Together, we take your vision from idea to final frame with unmatched speed and uncompromising quality.
            </p>
            
            <div className="about-agency-meta-tags">
              <span className="meta-tag">EST. 2024</span>
              <span className="meta-dot">·</span>
              <span className="meta-tag">HYDERABAD, INDIA</span>
              <span className="meta-dot">·</span>
              <span className="meta-tag">GLOBAL CLIENTS</span>
            </div>
          </div>

        </div>

      </div>

      {/* COMPONENT STYLES */}
      <style dangerouslySetInnerHTML={{__html: `
        .about-agency-section {
          position: relative;
          width: 100%;
          background-color: #030305;
          color: #FFFFFF;
          overflow: hidden;
          padding: 140px 0 130px 0;
          box-sizing: border-box;
          border-top: 1px solid rgba(255, 255, 255, 0.07);
          border-bottom: 1px solid rgba(255, 255, 255, 0.07);
        }

        /* Ambient Wave Lines Background Overlay */
        .about-agency-bg-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 1;
          opacity: 0.9;
          overflow: hidden;
        }

        .about-agency-waves {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .wave-line-1 { animation: wavePulse 8s ease-in-out infinite alternate; }
        .wave-line-2 { animation: wavePulse 11s ease-in-out infinite alternate 1s; }
        .wave-line-3 { animation: wavePulse 9s ease-in-out infinite alternate 2s; }
        .wave-line-4 { animation: wavePulse 13s ease-in-out infinite alternate 0.5s; }

        @keyframes wavePulse {
          0% { opacity: 0.4; transform: translateY(0); }
          100% { opacity: 0.9; transform: translateY(-8px); }
        }

        .about-agency-container {
          position: relative;
          z-index: 2;
          width: 100%;
          box-sizing: border-box;
        }

        .about-agency-top-grid {
          display: grid;
          grid-template-columns: 1fr 1.65fr;
          gap: 76px;
          align-items: flex-start;
          margin-bottom: 72px;
        }

        /* Left Column */
        .about-agency-left-col {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .about-agency-brand-wrapper {
          display: flex;
          align-items: center;
          gap: 18px;
          margin-bottom: 28px;
        }

        .about-agency-logo-container {
          position: relative;
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .about-agency-halo-ring {
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          border: 1px dashed rgba(255, 255, 255, 0.25);
          animation: haloSpin 24s linear infinite;
        }

        @keyframes haloSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .about-agency-logo-icon {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: rgba(14, 14, 20, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3px;
          box-shadow: 0 0 24px rgba(255, 255, 255, 0.1);
          z-index: 1;
        }

        .about-agency-logo-img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }

        .about-agency-brand-info {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .about-agency-brand-name {
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: #FFFFFF;
        }

        .about-agency-brand-tag {
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.12em;
          color: #71717A;
        }

        .about-agency-main-title {
          font-family: var(--about-font-heading, 'Cormorant Garamond', serif) !important;
          font-size: clamp(44px, 5.2vw, 68px) !important;
          font-weight: 300 !important;
          color: #FFFFFF !important;
          line-height: 1.04;
          letter-spacing: -0.025em;
          text-transform: uppercase;
          margin: 0;
          background: linear-gradient(180deg, #FFFFFF 30%, #D1D1D6 75%, #8E8E93 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        /* Right Column */
        .about-agency-right-col {
          display: flex;
          flex-direction: column;
          gap: 22px;
        }

        .about-agency-body-text {
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          font-size: clamp(15.5px, 1.35vw, 18px);
          font-weight: 300;
          line-height: 1.85;
          color: rgba(228, 228, 235, 0.85);
          letter-spacing: -0.01em;
          margin: 0;
        }

        .lead-text {
          color: #FFFFFF;
          font-size: clamp(16.5px, 1.45vw, 19.5px);
          line-height: 1.8;
        }

        .text-white-highlight {
          color: #FFFFFF;
          font-weight: 600;
        }

        .about-agency-meta-tags {
          display: flex;
          align-items: center;
          gap: 12px;
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #8E8E93;
          margin-top: 14px;
          flex-wrap: wrap;
        }

        .meta-tag {
          padding: 4px 10px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 4px;
        }

        .meta-dot {
          color: rgba(255, 255, 255, 0.2);
        }

        /* Bottom Row: Metrics Grid */
        .about-agency-metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          width: 100%;
        }

        .agency-metric-box {
          background: rgba(14, 14, 20, 0.65);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 28px 24px;
          box-sizing: border-box;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          display: flex;
          flex-direction: column;
          position: relative;
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .agency-metric-box:hover {
          border-color: rgba(255, 255, 255, 0.3);
          background: rgba(20, 20, 30, 0.85);
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6);
        }

        .metric-box-corner {
          position: absolute;
          width: 6px;
          height: 6px;
          pointer-events: none;
          opacity: 0.35;
          transition: opacity 0.3s ease;
        }

        .agency-metric-box:hover .metric-box-corner {
          opacity: 0.9;
        }

        .metric-box-corner.top-left {
          top: 10px;
          left: 10px;
          border-top: 1px solid #FFFFFF;
          border-left: 1px solid #FFFFFF;
        }

        .metric-box-corner.bottom-right {
          bottom: 10px;
          right: 10px;
          border-bottom: 1px solid #FFFFFF;
          border-right: 1px solid #FFFFFF;
        }

        .metric-value {
          font-family: var(--about-font-heading, 'Cormorant Garamond', serif);
          font-size: clamp(38px, 3.8vw, 50px);
          font-weight: 300;
          line-height: 1;
          color: #FFFFFF;
          margin-bottom: 8px;
          letter-spacing: -0.02em;
          text-shadow: 0 0 16px rgba(255, 255, 255, 0.25);
        }

        .metric-label {
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          color: #D1D1D6;
          margin-bottom: 4px;
        }

        .metric-detail {
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          font-size: 12px;
          color: #71717A;
          font-weight: 300;
        }

        /* Mobile Layout */
        @media (max-width: 960px) {
          .about-agency-section {
            padding: 90px 0;
          }

          .about-agency-top-grid {
            grid-template-columns: 1fr;
            gap: 40px;
            margin-bottom: 48px;
          }

          .about-agency-main-title {
            font-size: 38px !important;
          }

          .about-agency-metrics-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 14px;
          }

          .agency-metric-box {
            padding: 22px 18px;
          }

          .metric-value {
            font-size: 36px;
          }
        }

        @media (max-width: 560px) {
          .about-agency-metrics-grid {
            grid-template-columns: 1fr;
          }
        }
      `}} />
    </section>
  );
}
