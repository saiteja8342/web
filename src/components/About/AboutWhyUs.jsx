import React from 'react';

export default function AboutWhyUs() {
  const reasons = [
    { 
      num: '01', 
      title: 'CREATIVITY', 
      text: 'Ideas come first. Every video starts with a clear concept and creative direction before any AI tool is used.' 
    },
    { 
      num: '02', 
      title: 'QUALITY', 
      text: 'Every frame matters. We review, refine, and edit until the final video meets our quality standard.' 
    },
    { 
      num: '03', 
      title: 'SPEED', 
      text: 'Move faster without losing the creative vision. AI lets us compress timelines without compressing quality.' 
    },
    { 
      num: '04', 
      title: 'TECHNOLOGY', 
      text: 'We continuously explore what is next in AI video — using the latest models, tools, and techniques for every project.' 
    },
  ];

  return (
    <section className="why-us-section" id="why-us">
      <div className="about-container why-us-container">
        
        {/* LEFT COLUMN: STICKY STATIONARY HEADING */}
        <div className="why-us-left-col about-fade-up">
          <div className="chrome-badge" style={{ marginBottom: '20px' }}>
            WHY WORK WITH US
          </div>
          <h2 className="why-us-main-heading">
            Why<br />
            MotionNodeEdits?
          </h2>
          <p className="why-us-left-sub">
            Built on creative direction, uncompromised quality standards, and modern generative AI technology.
          </p>
        </div>

        {/* RIGHT COLUMN: VERTICAL LIST OF 4 CARDS */}
        <div className="why-us-right-col">
          {reasons.map((reason, idx) => (
            <div key={idx} className="why-us-card-item about-fade-up">
              <div className="why-us-card-num">
                {reason.num}
              </div>
              <h3 className="why-us-card-title">
                {reason.title}
              </h3>
              <p className="why-us-card-desc">
                {reason.text}
              </p>
            </div>
          ))}
        </div>

      </div>

      {/* COMPONENT STYLES */}
      <style dangerouslySetInnerHTML={{__html: `
        .why-us-section {
          background-color: var(--about-bg-primary, #050507);
          color: var(--about-text-primary, #FFFFFF);
          position: relative;
          width: 100%;
          border-top: 1px solid var(--about-border, rgba(255, 255, 255, 0.07));
          padding: 120px 0;
          box-sizing: border-box;
        }

        .why-us-container {
          display: grid;
          grid-template-columns: 1fr 1.35fr;
          gap: 72px;
          align-items: flex-start;
          width: 100%;
          padding: 0 40px;
          box-sizing: border-box;
        }

        /* Left Column (Stationary Sticky) */
        .why-us-left-col {
          position: sticky;
          top: 120px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          max-width: 440px;
        }

        .why-us-main-heading {
          font-family: var(--about-font-heading, 'Cormorant Garamond', serif) !important;
          font-size: clamp(36px, 4.4vw, 54px) !important;
          font-weight: 300;
          line-height: 1.05;
          color: #FFFFFF;
          text-transform: uppercase;
          letter-spacing: -0.02em;
          margin: 0 0 16px 0;
        }

        .why-us-left-sub {
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          font-size: 15px;
          line-height: 1.75;
          color: var(--about-text-secondary, #8E8F94);
          font-weight: 300;
          margin: 0;
        }

        /* Right Column (Vertical Cards Stack) */
        .why-us-right-col {
          display: flex;
          flex-direction: column;
          gap: 28px;
          width: 100%;
        }

        /* Individual Obsidian Cards */
        .why-us-card-item {
          background: rgba(14, 14, 22, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 36px 40px;
          position: relative;
          box-sizing: border-box;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        }

        .why-us-card-item:hover {
          border-color: rgba(255, 255, 255, 0.35);
          background: rgba(22, 22, 34, 0.9);
          transform: translateY(-3px);
          box-shadow: 
            0 0 35px rgba(255, 255, 255, 0.12),
            0 16px 44px rgba(0, 0, 0, 0.6);
        }

        .why-us-card-num {
          font-family: var(--about-font-heading, 'Cormorant Garamond', serif);
          font-size: 64px;
          font-weight: 300;
          line-height: 1;
          color: #FFFFFF;
          margin-bottom: 4px;
          letter-spacing: -0.02em;
          text-shadow: 0 0 16px rgba(255, 255, 255, 0.35);
        }

        .why-us-card-title {
          font-family: var(--about-font-heading, 'Cormorant Garamond', serif) !important;
          font-size: 26px;
          font-weight: 300;
          color: #FFFFFF;
          margin: 0 0 12px 0;
          text-transform: uppercase;
          letter-spacing: -0.01em;
        }

        .why-us-card-desc {
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          font-size: 14.5px;
          color: #A1A1AA;
          line-height: 1.75;
          margin: 0;
          font-weight: 300;
        }

        /* Mobile Responsive */
        @media (max-width: 960px) {
          .why-us-section {
            padding: 80px 0;
          }

          .why-us-container {
            grid-template-columns: 1fr;
            gap: 40px;
            padding: 0 24px;
          }

          .why-us-left-col {
            position: relative;
            top: auto;
          }

          .why-us-card-item {
            padding: 28px 24px;
          }

          .why-us-main-heading {
            font-size: 34px !important;
          }

          .why-us-card-num {
            font-size: 48px;
          }
        }
      `}} />
    </section>
  );
}
