import React from 'react';

export default function AboutPortfolio() {
  const projects = [
    { title: 'Nexus AI Campaign', category: 'AI ADS', desc: 'High-conversion product ad using fully synthesized AI visual assets.' },
    { title: 'Synth Presenter', category: 'AI TALKING AVATAR', desc: 'Custom avatar presenter trained for consistent brand messaging.' },
    { title: 'Aero Motion Reveal', category: 'AI PRODUCT', desc: 'Cinematic 3D-style AI generation for eCommerce launch.' },
    { title: 'Echoes of Tomorrow', category: 'AI CINEMATIC', desc: 'Narrative brand film entirely produced with generative AI.' }
  ];

  return (
    <section className="about-section">
      <div className="about-container">
        
        <div className="about-fade-up about-section-header">
          <div className="chrome-badge">PORTFOLIO HIGHLIGHTS</div>
          <h2 className="about-section-title">
            See What We Create.
          </h2>
        </div>

        {/* Featured Project */}
        <div className="about-fade-up saas-card" style={{ marginBottom: '40px', position: 'relative', borderRadius: '20px', height: '460px', padding: 0 }}>
           <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, #08080C 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <img src="/image/mne_logo.png" alt="Logo" style={{ width: '64px', height: '64px', opacity: 0.25 }} />
           </div>
           
           <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(5,5,7,0.95) 0%, rgba(5,5,7,0.2) 60%, transparent 100%)', pointerEvents: 'none' }}></div>
           
           <div className="about-portfolio-play" style={{
             position: 'absolute',
             top: '50%',
             left: '50%',
             transform: 'translate(-50%, -50%) scale(0.9)',
             width: '72px',
             height: '72px',
             borderRadius: '50%',
             backgroundColor: 'rgba(255,255,255,0.1)',
             backdropFilter: 'blur(16px)',
             WebkitBackdropFilter: 'blur(16px)',
             border: '1px solid rgba(255,255,255,0.3)',
             display: 'flex',
             alignItems: 'center',
             justifyContent: 'center',
             color: '#FFFFFF',
             opacity: 0,
             transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
             cursor: 'pointer'
           }}>
             <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
           </div>
           
           <div style={{ position: 'absolute', bottom: '36px', left: '36px', right: '36px' }}>
              <div style={{ display: 'inline-block', backgroundColor: '#FFFFFF', color: '#050507', padding: '4px 14px', borderRadius: '100px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>
                FEATURED AI BRAND FILM
              </div>
              <h3 style={{ 
                fontFamily: 'var(--about-font-heading)',
                fontSize: 'clamp(24px, 3vw, 34px)', 
                fontWeight: 300, 
                color: '#FFFFFF', 
                marginBottom: '8px',
                letterSpacing: '-0.01em',
                textTransform: 'uppercase'
              }}>
                The Dawn of Creation
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--about-text-secondary)', margin: 0, fontWeight: 300 }}>
                A cinematic journey showcasing high-end generative visual storytelling.
              </p>
           </div>
        </div>

        {/* Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          marginBottom: '64px'
        }}>
          {projects.map((proj, idx) => (
            <div key={idx} className="about-fade-up about-portfolio-card" style={{ cursor: 'pointer' }}>
               <div className="saas-card" style={{ position: 'relative', borderRadius: '16px', aspectRatio: '16/9', marginBottom: '16px', padding: 0 }}>
                  <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600 }}>{proj.category}</span>
                  </div>
                  <div className="about-portfolio-play" style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%) scale(0.9)',
                    width: '54px',
                    height: '54px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255,255,255,0.12)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    opacity: 0,
                    transition: 'all 0.3s'
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                  </div>
               </div>
               <div>
                 <h3 style={{ 
                   fontFamily: 'var(--about-font-heading)',
                   fontSize: '18px', 
                   fontWeight: 300, 
                   color: 'var(--about-text-primary)', 
                   marginBottom: '4px',
                   textTransform: 'uppercase'
                 }}>
                   {proj.title}
                 </h3>
                 <div style={{ fontSize: '11px', color: 'var(--about-silver-mid)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: '6px' }}>
                   {proj.category}
                 </div>
                 <p style={{ fontSize: '12px', color: 'var(--about-text-secondary)', margin: 0, fontWeight: 300, lineHeight: 1.6 }}>
                   {proj.desc}
                 </p>
               </div>
            </div>
          ))}
        </div>
        
        <div className="about-fade-up" style={{ textAlign: 'center' }}>
           <a href="/work" style={{
             fontSize: '12px',
             fontWeight: 600,
             color: '#FFFFFF',
             textTransform: 'uppercase',
             letterSpacing: '0.14em',
             textDecoration: 'none',
             borderBottom: '1px solid #FFFFFF',
             paddingBottom: '4px',
             transition: 'opacity 0.3s'
           }} className="about-portfolio-cta">
             VIEW ALL WORK →
           </a>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .saas-card:hover .about-portfolio-play,
        .about-portfolio-card:hover .about-portfolio-play {
          opacity: 1 !important;
          transform: translate(-50%, -50%) scale(1) !important;
        }
        .about-portfolio-cta:hover {
          opacity: 0.7;
        }
      `}} />
    </section>
  );
}
