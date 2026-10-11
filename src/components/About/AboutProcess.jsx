import React from 'react';

export default function AboutProcess() {
  const steps = [
    { num: '01', title: 'IDEA', desc: 'You bring us your concept, idea, or goal.' },
    { num: '02', title: 'UNDERSTAND', desc: 'We understand your audience, requirements, style, and objective.' },
    { num: '03', title: 'SCRIPT / CONCEPT', desc: 'We develop the creative direction and structure.' },
    { num: '04', title: 'AI GENERATION', desc: 'We create visual content using the most suitable AI technologies.' },
    { num: '05', title: 'EDITING', desc: 'We refine, edit, animate, and structure the video.' },
    { num: '06', title: 'REVIEW', desc: 'You review the result and provide feedback.' },
    { num: '07', title: 'FINAL DELIVERY', desc: 'We deliver the completed video in your required format.' },
  ];

  return (
    <section className="about-section">
      <div className="about-container">
        
        <div className="about-fade-up about-section-header">
          <div className="chrome-badge">STEP-BY-STEP EXECUTION</div>
          <h2 className="about-section-title">
            From Idea<br/>To Final Frame.
          </h2>
        </div>

        {/* Process Timeline Desktop/Horizontal & Mobile/Vertical */}
        <div className="about-fade-up about-process-timeline" style={{ position: 'relative', display: 'flex', justifyContent: 'space-between' }}>
          
          <div className="about-process-line" style={{ position: 'absolute', top: '20px', left: '0', right: '0', height: '1px', backgroundColor: 'rgba(255,255,255,0.12)', zIndex: 0 }}></div>

          {steps.map((step, idx) => (
            <div key={idx} className="about-process-node" style={{ display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1, flex: 1, paddingRight: '16px' }}>
              <div 
                className="about-process-circle"
                style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '50%', 
                  backgroundColor: 'var(--about-surface)', 
                  border: '1px solid rgba(255,255,255,0.3)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#FFFFFF',
                  marginBottom: '24px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                {step.num}
              </div>
              <h3 style={{ 
                fontFamily: 'var(--about-font-heading)',
                fontSize: '18px', 
                fontWeight: 300, 
                color: 'var(--about-text-primary)', 
                marginBottom: '8px', 
                textTransform: 'uppercase',
                letterSpacing: '0.02em'
              }}>
                {step.title}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--about-text-secondary)', lineHeight: 1.6, margin: 0, fontWeight: 300 }}>
                {step.desc}
              </p>
            </div>
          ))}

        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .about-process-node:hover .about-process-circle {
          background-color: #FFFFFF !important;
          color: #050507 !important;
          border-color: #FFFFFF !important;
          box-shadow: 0 0 20px rgba(255,255,255,0.5) !important;
          transform: translateY(-2px);
        }
        
        @media (max-width: 900px) {
          .about-process-timeline {
            flex-direction: column !important;
            gap: 36px !important;
            padding-left: 20px;
          }
          .about-process-line {
            top: 0 !important;
            bottom: 0 !important;
            left: 20px !important;
            width: 1px !important;
            height: auto !important;
          }
          .about-process-node {
            flex-direction: row !important;
            align-items: flex-start !important;
            padding-right: 0 !important;
          }
          .about-process-circle {
            margin-bottom: 0 !important;
            margin-right: 20px !important;
            transform: translateX(-50%);
          }
          .about-process-node h3, .about-process-node p {
             padding-left: 20px;
          }
        }
      `}} />
    </section>
  );
}
