import React from 'react';

export default function AboutFinalCTA() {
  return (
    <section 
      style={{
        padding: '160px 0',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        backgroundColor: '#050507',
        backgroundImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(255,255,255,0.06) 0%, transparent 70%)'
      }}
    >
      <div className="about-container" style={{ position: 'relative', zIndex: 1 }}>
        
        <div className="about-fade-up" style={{ marginBottom: '20px' }}>
          <span className="chrome-badge">START YOUR PROJECT</span>
        </div>

        <h2 className="about-fade-up" style={{ 
          fontSize: 'clamp(36px, 6vw, 76px)', 
          fontWeight: 300, 
          color: '#FFFFFF', 
          lineHeight: 1.05, 
          margin: '0 0 28px 0',
          textTransform: 'uppercase',
          letterSpacing: '-0.03em'
        }}>
          Have An Idea?<br/>Let's Turn It Into Video.
        </h2>

        <p className="about-fade-up" style={{ fontSize: '16px', color: 'var(--about-text-secondary)', maxWidth: '520px', margin: '0 auto 40px auto', lineHeight: 1.7, fontWeight: 300 }}>
          Tell us what you're imagining. We'll help turn your concept into 
          a high-impact, cinematic AI video.
        </p>

        <div className="about-fade-up" style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/#contact" className="about-btn-primary">START A PROJECT</a>
          <a href="/work" className="about-btn-secondary">VIEW OUR WORK</a>
        </div>

      </div>
    </section>
  );
}
