import React from 'react';

export default function AboutWhoWeAre() {
  return (
    <section className="about-section">
      <div className="about-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '48px', alignItems: 'center' }}>
        
        {/* Left Column */}
        <div className="about-fade-up" style={{ flex: '1 1 50%', minWidth: '300px' }}>
          <div className="chrome-badge" style={{ marginBottom: '20px' }}>WHO WE ARE</div>
          <h2 style={{ 
            fontSize: 'clamp(36px, 5vw, 64px)', 
            fontWeight: 300, 
            lineHeight: 1.05, 
            color: 'var(--about-text-primary)',
            textTransform: 'uppercase',
            letterSpacing: '-0.03em'
          }}>
            Built For The<br/>
            Next Generation<br/>
            Of Video.
          </h2>
        </div>

        {/* Right Column */}
        <div className="about-fade-up" style={{ flex: '1 1 45%', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ fontSize: '15px', color: 'var(--about-text-secondary)', lineHeight: 1.8, display: 'flex', flexDirection: 'column', gap: '16px', fontWeight: 300 }}>
            <p>
              MotionNodeEdits was created to help brands produce high-quality 
              videos with less effort, faster workflows, and the possibilities 
              of modern AI technology.
            </p>
            <p>
              Businesses need powerful video content for marketing, advertising, 
              branding, and communication — but traditional production can require 
              significant time, resources, and effort.
            </p>
            <p>
              MotionNodeEdits brings AI-powered production into the process to 
              help brands create better video content, faster.
            </p>
          </div>

          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--about-silver-bright)', marginTop: '8px', fontWeight: 600 }}>
            EST. 2024 · HYDERABAD, INDIA · GLOBAL CLIENTS
          </div>

          {/* Cinematic visual card in metallic chrome */}
          <div className="saas-card" style={{ 
            height: '180px', 
            borderRadius: '16px', 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '24px 32px',
            position: 'relative',
            marginTop: '12px'
          }}>
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--about-text-tertiary)', marginBottom: '6px' }}>
                STUDIO PRODUCTION
              </div>
              <div style={{ fontFamily: 'var(--about-font-heading)', fontSize: '24px', color: '#FFFFFF', fontWeight: 300 }}>
                High-Fidelity AI Workflows
              </div>
            </div>
            <img 
              src="/image/mne_logo.png" 
              alt="Logo" 
              style={{ width: '48px', height: '48px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)', opacity: 0.8 }} 
            />
          </div>
        </div>

      </div>
    </section>
  );
}
