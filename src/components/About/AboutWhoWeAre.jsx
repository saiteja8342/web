import React from 'react';

export default function AboutWhoWeAre() {
  return (
    <section className="about-agency-section" id="who-we-are">
      {/* Background Animated Contour Waves matching Reference Design */}
      <div className="about-agency-bg-overlay">
        <svg 
          className="about-agency-waves" 
          viewBox="0 0 1440 600" 
          preserveAspectRatio="none"
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M-200 480 C 250 180, 750 480, 1640 220" stroke="rgba(99, 130, 255, 0.14)" strokeWidth="1.8" />
          <path d="M-200 530 C 250 230, 750 530, 1640 270" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1.2" />
          <path d="M-200 580 C 250 280, 750 580, 1640 320" stroke="rgba(130, 160, 255, 0.12)" strokeWidth="1.5" />
          <path d="M-200 630 C 250 330, 750 630, 1640 370" stroke="rgba(255, 255, 255, 0.06)" strokeWidth="1" />
          <path d="M-200 680 C 250 380, 750 680, 1640 420" stroke="rgba(99, 130, 255, 0.1)" strokeWidth="1.4" />
        </svg>
      </div>

      <div className="about-container about-agency-container">
        
        {/* LEFT COLUMN: BRAND LOGO & AGENCY TITLE */}
        <div className="about-agency-left-col about-fade-up">
          <div className="about-agency-brand-wrapper">
            <div className="about-agency-logo-icon">
              <img 
                src="/image/mne_logo.png" 
                alt="MotionNodeEdits Emblem" 
                className="about-agency-logo-img"
              />
            </div>
            <span className="about-agency-brand-name">
              MOTIONNODEEDITS
            </span>
          </div>

          <h2 className="about-agency-main-title">
            About Our Agency
          </h2>
        </div>

        {/* RIGHT COLUMN: REFINED EDITORIAL PARAGRAPH */}
        <div className="about-agency-right-col about-fade-up">
          <p className="about-agency-body-text">
            <strong style={{ color: '#FFFFFF', fontWeight: 600 }}>MotionNodeEdits</strong> is a next-generation AI video production and creative post-production agency. We help brands, businesses, and creators produce high-retention video content with modern generative AI technologies, cinematic editing, and sound design. 
          </p>
          <p className="about-agency-body-text">
            We take care of your AI video commercials, social media reels, talking-avatar videos, product ads, motion graphics, color grading, and corporate visual storytelling. Together, we take your vision from idea to final frame with unmatched speed and uncompromising quality.
          </p>
          <div className="about-agency-meta-tags">
            <span>EST. 2024</span>
            <span className="meta-dot">·</span>
            <span>HYDERABAD, INDIA</span>
            <span className="meta-dot">·</span>
            <span>GLOBAL CLIENTS</span>
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
          padding: 130px 0;
          box-sizing: border-box;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        /* Ambient Wave Lines Background Overlay */
        .about-agency-bg-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 1;
          opacity: 0.85;
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

        .about-agency-container {
          position: relative;
          z-index: 2;
          display: grid;
          grid-template-columns: 1fr 1.65fr;
          gap: 72px;
          align-items: center;
          width: 100%;
          padding: 0 40px;
          box-sizing: border-box;
        }

        /* Left Column */
        .about-agency-left-col {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: center;
        }

        .about-agency-brand-wrapper {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 24px;
        }

        .about-agency-logo-icon {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.16);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          box-shadow: 0 0 24px rgba(255, 255, 255, 0.08);
        }

        .about-agency-logo-img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }

        .about-agency-brand-name {
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.7);
        }

        .about-agency-main-title {
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif) !important;
          font-size: clamp(38px, 4.4vw, 56px) !important;
          font-weight: 700 !important;
          color: #FFFFFF !important;
          line-height: 1.1;
          letter-spacing: -0.03em;
          margin: 0;
        }

        /* Right Column */
        .about-agency-right-col {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .about-agency-body-text {
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          font-size: clamp(16px, 1.4vw, 19.5px);
          font-weight: 300;
          line-height: 1.85;
          color: rgba(240, 240, 245, 0.85);
          letter-spacing: -0.01em;
          margin: 0;
        }

        .about-agency-meta-tags {
          display: flex;
          align-items: center;
          gap: 12px;
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          font-size: 11.5px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.5);
          margin-top: 12px;
        }

        .meta-dot {
          color: rgba(255, 255, 255, 0.25);
        }

        /* Mobile Layout */
        @media (max-width: 960px) {
          .about-agency-section {
            padding: 80px 0;
          }

          .about-agency-container {
            grid-template-columns: 1fr;
            gap: 40px;
            padding: 0 24px;
          }

          .about-agency-main-title {
            font-size: 34px !important;
          }

          .about-agency-body-text {
            font-size: 16px;
            line-height: 1.75;
          }

          .about-agency-meta-tags {
            flex-wrap: wrap;
            gap: 8px;
          }
        }
      `}} />
    </section>
  );
}
