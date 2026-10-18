import React from 'react';

export default function AboutQualityStandard() {
  const standards = [
    { 
      title: 'VISUAL QUALITY', 
      desc: 'High-resolution AI-generated visuals, rendered with intentional composition and aesthetic direction.' 
    },
    { 
      title: 'STORYTELLING', 
      desc: 'Every video needs a clear purpose and message. We ensure the narrative is structured before production begins.' 
    },
    { 
      title: 'EDITING', 
      desc: 'Professional pacing, composition, sound design, transitions, and refinement — applied after AI generation.' 
    },
    { 
      title: 'BRAND CONSISTENCY', 
      desc: "The final video should feel aligned with the client's brand, tone, and visual identity." 
    }
  ];

  return (
    <section className="about-benchmark-section" id="benchmark" aria-label="Our Quality Standards Benchmark">
      <div className="about-container about-benchmark-container">
        
        {/* Left Column: Heading with Badge */}
        <div className="about-benchmark-left-col">
          <div className="chrome-badge" style={{ marginBottom: '24px' }}>
            <span style={{ fontSize: '8px' }}>●</span> OUR BENCHMARK
          </div>

          <h2 className="about-benchmark-main-title">
            AI IS THE<br />
            TECHNOLOGY.<br />
            QUALITY IS THE<br />
            STANDARD.
          </h2>
        </div>

        {/* Right Column: Clean Editorial Standard List */}
        <div className="about-benchmark-right-col">
          {standards.map((std, idx) => (
            <div key={idx} className="benchmark-row">
              <h3 className="benchmark-title">{std.title}</h3>
              <p className="benchmark-desc">
                {std.desc}
              </p>
              {idx < standards.length - 1 && <div className="benchmark-divider-line" />}
            </div>
          ))}
        </div>

      </div>

      {/* COMPONENT STYLES */}
      <style dangerouslySetInnerHTML={{__html: `
        .about-benchmark-section {
          padding: 130px 0;
          background-color: #050507;
          border-top: 1px solid rgba(255, 255, 255, 0.07);
          position: relative;
          box-sizing: border-box;
        }

        .about-benchmark-container {
          display: grid;
          grid-template-columns: 1.1fr 1.35fr;
          gap: 72px;
          align-items: flex-start;
          width: 100%;
          box-sizing: border-box;
        }

        .about-benchmark-left-col {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .about-benchmark-main-title {
          font-family: var(--about-font-heading, 'Cormorant Garamond', serif) !important;
          font-size: clamp(38px, 4.4vw, 56px) !important;
          font-weight: 300 !important;
          line-height: 1.12;
          color: #FFFFFF !important;
          text-transform: uppercase;
          letter-spacing: -0.015em;
          margin: 0;
        }

        /* Right Column */
        .about-benchmark-right-col {
          display: flex;
          flex-direction: column;
          width: 100%;
        }

        .benchmark-row {
          padding: 28px 0;
          position: relative;
          box-sizing: border-box;
        }

        .benchmark-row:first-child {
          padding-top: 8px;
        }

        .benchmark-title {
          font-family: var(--about-font-heading, 'Cormorant Garamond', serif) !important;
          font-size: clamp(20px, 1.8vw, 24px) !important;
          font-weight: 400 !important;
          color: #FFFFFF !important;
          margin: 0 0 10px 0 !important;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .benchmark-desc {
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          font-size: 15px;
          color: rgba(255, 255, 255, 0.65);
          line-height: 1.65;
          margin: 0;
          font-weight: 300;
          max-width: 600px;
        }

        .benchmark-divider-line {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 1px;
          background: rgba(255, 255, 255, 0.07);
        }

        @media (max-width: 900px) {
          .about-benchmark-container {
            grid-template-columns: 1fr;
            gap: 48px;
          }
          .about-benchmark-section {
            padding: 90px 0;
          }
        }
      `}} />
    </section>
  );
}
