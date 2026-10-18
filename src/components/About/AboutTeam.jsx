import React from 'react';

export default function AboutTeam() {
  return (
    <section className="about-leadership-section" id="leadership" aria-label="MotionNodeEdits Leadership">
      <div className="about-container">
        
        <div className="about-leadership-header">
          <div className="chrome-badge" style={{ marginBottom: '18px' }}>
            <span style={{ fontSize: '8px' }}>●</span> LEADERSHIP
          </div>
          <h2 className="about-leadership-title">
            BEHIND MOTIONNODEEDITS.
          </h2>
        </div>

        <div className="about-leadership-grid">
          
          {/* Left Column: Glassmorphic Emblem Card */}
          <div className="about-leadership-card-col">
            <div className="leadership-portrait-card">
              
              <div className="leadership-emblem-halo">
                <img 
                  src="/image/mne_logo.png" 
                  alt="MotionNodeEdits Founder Emblem" 
                  className="leadership-emblem-img"
                />
              </div>

              <div className="leadership-founder-tag">
                FOUNDER & CREATIVE LEAD
              </div>

            </div>
          </div>

          {/* Right Column: Narrative & Pull Quote */}
          <div className="about-leadership-text-col">
            <h3 className="leadership-name">
              Vutukuri Sai Teja
            </h3>
            
            <div className="leadership-role-label">
              FOUNDER / CREATIVE DIRECTOR
            </div>
            
            <div className="leadership-bio-paragraphs">
              <p>
                MotionNodeEdits was born from a clear conviction: the tools to craft cinematic, high-converting visual stories are evolving at lightning speed, and modern brands deserve an agile partner that masterfully harnesses this new era.
              </p>
              <p>
                With expertise spanning post-production editing, AI generative workflows, and creative direction, we build bespoke video experiences that elevate brand authority globally.
              </p>
            </div>

            {/* Editorial Pull Quote */}
            <div className="leadership-pull-quote-box">
              <div className="quote-accent-bar" />
              <p className="leadership-quote-text">
                "Technology is the engine. Emotion, storytelling, and meticulous craft are what make a story resonate."
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* COMPONENT STYLES */}
      <style dangerouslySetInnerHTML={{__html: `
        .about-leadership-section {
          padding: 130px 0;
          background-color: #030305;
          border-top: 1px solid rgba(255, 255, 255, 0.07);
          position: relative;
        }

        .about-leadership-header {
          margin-bottom: 60px;
        }

        .about-leadership-title {
          font-family: var(--about-font-heading, 'Cormorant Garamond', serif) !important;
          font-size: clamp(36px, 4.2vw, 56px) !important;
          font-weight: 300 !important;
          color: #FFFFFF !important;
          text-transform: uppercase;
          letter-spacing: -0.015em;
          margin: 0;
        }

        .about-leadership-grid {
          display: grid;
          grid-template-columns: 1fr 1.55fr;
          gap: 68px;
          align-items: center;
        }

        .about-leadership-card-col {
          width: 100%;
        }

        .leadership-portrait-card {
          width: 100%;
          aspect-ratio: 4/5;
          max-height: 520px;
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          padding: 40px;
          background: rgba(14, 14, 22, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-sizing: border-box;
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1),
                      border-color 0.45s cubic-bezier(0.16, 1, 0.3, 1),
                      box-shadow 0.45s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.5);
          overflow: hidden;
        }

        .leadership-portrait-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%);
          opacity: 0.5;
          transition: opacity 0.4s ease;
        }

        .leadership-portrait-card:hover {
          transform: translateY(-8px) scale(1.01);
          border-color: rgba(255, 255, 255, 0.28);
          box-shadow: 
            0 24px 60px rgba(0, 0, 0, 0.7),
            0 0 35px rgba(255, 255, 255, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.25);
        }

        .leadership-portrait-card:hover::before {
          opacity: 1;
        }

        .leadership-emblem-halo {
          width: 106px;
          height: 106px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.14) 0%, transparent 70%);
          border: 1px solid rgba(255, 255, 255, 0.22);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
          box-shadow: 0 0 34px rgba(255, 255, 255, 0.12);
          transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.45s ease;
          animation: emblemHaloBreathe 4s ease-in-out infinite alternate;
        }

        @keyframes emblemHaloBreathe {
          0% { box-shadow: 0 0 28px rgba(255, 255, 255, 0.1); transform: scale(1); }
          100% { box-shadow: 0 0 42px rgba(255, 255, 255, 0.2); transform: scale(1.03); }
        }

        .leadership-portrait-card:hover .leadership-emblem-halo {
          transform: scale(1.08);
          box-shadow: 0 0 48px rgba(255, 255, 255, 0.28);
        }

        .leadership-emblem-img {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          object-fit: cover;
        }

        .leadership-founder-tag {
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          color: #D1D1D6;
          font-size: 11px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          font-weight: 600;
        }

        /* Right Column */
        .about-leadership-text-col {
          display: flex;
          flex-direction: column;
        }

        .leadership-name {
          font-family: var(--about-font-heading, 'Cormorant Garamond', serif) !important;
          font-size: clamp(34px, 3.5vw, 44px) !important;
          font-weight: 400 !important;
          color: #FFFFFF;
          margin: 0 0 6px 0;
          letter-spacing: -0.01em;
        }

        .leadership-role-label {
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          font-size: 11.5px;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: #8E8E93;
          font-weight: 600;
          margin-bottom: 24px;
        }

        .leadership-bio-paragraphs {
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          font-size: 15px;
          color: rgba(255, 255, 255, 0.65);
          line-height: 1.8;
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 30px;
          font-weight: 300;
        }

        .leadership-pull-quote-box {
          display: flex;
          align-items: stretch;
          gap: 18px;
          padding: 6px 0;
        }

        .quote-accent-bar {
          width: 2px;
          background: #FFFFFF;
          flex-shrink: 0;
          border-radius: 2px;
        }

        .leadership-quote-text {
          font-family: var(--about-font-heading, 'Cormorant Garamond', serif) !important;
          font-size: clamp(19px, 1.9vw, 23px) !important;
          font-style: italic;
          color: #FFFFFF;
          line-height: 1.5;
          margin: 0;
          font-weight: 300;
        }

        @media (max-width: 900px) {
          .about-leadership-grid {
            grid-template-columns: 1fr;
            gap: 40px;
          }
          .about-leadership-section {
            padding: 90px 0;
          }
        }
      `}} />
    </section>
  );
}
