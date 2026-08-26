import React from 'react';

export default function AboutVision() {
  return (
    <section 
      style={{
        height: '540px',
        position: 'relative',
        background: 'linear-gradient(180deg, #050507 0%, #0A0A0E 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        overflow: 'hidden',
        borderTop: '1px solid var(--about-border)',
        borderBottom: '1px solid var(--about-border)'
      }}
    >
      {/* Chrome Radial Light overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.04) 0%, transparent 60%)',
        zIndex: 1
      }}></div>

      {/* Silver Grid dot matrix */}
      <div style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.12,
        backgroundImage: 'radial-gradient(circle at center, #FFFFFF 1px, transparent 1px)',
        backgroundSize: '36px 36px',
        zIndex: 0
      }}></div>

      <div className="about-container" style={{ position: 'relative', zIndex: 2 }}>
        
        <div className="about-fade-up" style={{ marginBottom: '20px' }}>
          <span className="chrome-badge">OUR VISION</span>
        </div>

        <h2 className="about-fade-up" style={{ 
          fontSize: 'clamp(36px, 5.5vw, 76px)', 
          fontWeight: 300, 
          color: 'var(--about-text-primary)', 
          lineHeight: 1.05, 
          margin: '0 0 24px 0',
          textTransform: 'uppercase',
          letterSpacing: '-0.03em'
        }}>
          Building The Future<br/>Of AI Video.
        </h2>

        <p className="about-fade-up" style={{ fontSize: '16px', color: 'var(--about-text-secondary)', maxWidth: '600px', margin: '0 auto', lineHeight: 1.8, fontWeight: 300 }}>
          Our vision is to become a leading global brand in AI video production 
          and help shape the next generation of visual storytelling.
        </p>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 768px) {
          section[style*="height: 540px"] {
            height: 420px !important;
          }
        }
      `}} />
    </section>
  );
}
