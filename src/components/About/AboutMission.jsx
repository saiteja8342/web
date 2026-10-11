import React from 'react';

export default function AboutMission() {
  return (
    <section className="about-section" style={{ position: 'relative', overflow: 'hidden' }}>
      
      {/* Background Word Visual */}
      <div 
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: 'var(--about-font-heading)',
          fontSize: 'clamp(100px, 22vw, 360px)',
          fontWeight: 300,
          color: 'rgba(255,255,255,0.015)',
          whiteSpace: 'nowrap',
          zIndex: 0,
          pointerEvents: 'none',
          userSelect: 'none'
        }}
      >
        CREATE.
      </div>
      
      {/* Floating words in metallic silver */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <span className="about-float" style={{ position: 'absolute', top: '20%', left: '12%', fontSize: '11px', color: 'var(--about-silver-dark)', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600, opacity: 0.6 }}>IMAGINE</span>
        <span className="about-float" style={{ position: 'absolute', top: '70%', left: '10%', fontSize: '11px', color: 'var(--about-silver-dark)', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600, opacity: 0.6, animationDelay: '1s' }}>GENERATE</span>
        <span className="about-float" style={{ position: 'absolute', top: '15%', right: '15%', fontSize: '11px', color: 'var(--about-silver-dark)', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600, opacity: 0.6, animationDelay: '2s' }}>EDIT</span>
        <span className="about-float" style={{ position: 'absolute', top: '65%', right: '12%', fontSize: '11px', color: 'var(--about-silver-dark)', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600, opacity: 0.6, animationDelay: '0.5s' }}>REFINE</span>
        <span className="about-float" style={{ position: 'absolute', bottom: '10%', left: '50%', fontSize: '11px', color: 'var(--about-silver-dark)', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600, opacity: 0.6, animationDelay: '1.5s' }}>DELIVER</span>
      </div>

      <div className="about-container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        
        <div className="about-fade-up" style={{ marginBottom: '24px' }}>
          <span className="chrome-badge">OUR MISSION</span>
        </div>

        <h2 className="about-fade-up" style={{ 
          fontSize: 'clamp(28px, 4.5vw, 60px)', 
          fontWeight: 300, 
          color: 'var(--about-text-primary)', 
          maxWidth: '900px', 
          margin: '0 auto 32px auto', 
          lineHeight: 1.15,
          textTransform: 'uppercase',
          letterSpacing: '-0.02em'
        }}>
          Make high-quality AI video production accessible to brands that want to move faster.
        </h2>

        <p className="about-fade-up" style={{ fontSize: '16px', color: 'var(--about-text-secondary)', maxWidth: '640px', margin: '0 auto', lineHeight: 1.8, fontWeight: 300 }}>
          Our mission is to create powerful AI video experiences that help 
          businesses reach their audience, communicate their ideas, and grow 
          through better visual content.
        </p>

      </div>
    </section>
  );
}
