import React from 'react';

export default function AboutTeam() {
  return (
    <section style={{ padding: '130px 0' }}>
      <div className="about-container">
        
        <div className="about-fade-up" style={{ marginBottom: '64px' }}>
          <div className="chrome-badge" style={{ marginBottom: '16px' }}>LEADERSHIP</div>
          <h2 style={{ 
            fontSize: 'clamp(32px, 4.5vw, 56px)', 
            fontWeight: 300, 
            color: 'var(--about-text-primary)',
            textTransform: 'uppercase',
            letterSpacing: '-0.02em'
          }}>
            Behind MotionNodeEdits.
          </h2>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '64px', alignItems: 'center' }}>
          
          {/* Image */}
          <div className="about-fade-up" style={{ flex: '1 1 38%', minWidth: '280px' }}>
             <div className="saas-card" style={{ 
               width: '100%', 
               aspectRatio: '3/4', 
               borderRadius: '20px', 
               display: 'flex',
               flexDirection: 'column',
               alignItems: 'center',
               justifyContent: 'center',
               position: 'relative',
               padding: '32px'
             }}>
                <div style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                  boxShadow: '0 0 30px rgba(255,255,255,0.15)'
                }}>
                  <img 
                    src="/image/mne_logo.png" 
                    alt="MotionNodeEdits Emblem" 
                    style={{ width: '70px', height: '70px', borderRadius: '50%' }} 
                  />
                </div>
                <span style={{ color: 'var(--about-silver-bright)', fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600 }}>
                  FOUNDER & CREATIVE LEAD
                </span>
             </div>
          </div>

          {/* Text */}
          <div className="about-fade-up" style={{ flex: '1 1 52%', minWidth: '300px' }}>
             <h3 style={{ 
               fontFamily: 'var(--about-font-heading)',
               fontSize: '36px', 
               fontWeight: 300, 
               color: '#FFFFFF', 
               marginBottom: '4px',
               letterSpacing: '-0.01em'
             }}>
               Vutukuri Sai Teja
             </h3>
             <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--about-silver-dark)', fontWeight: 600, marginBottom: '28px' }}>
               FOUNDER / CREATIVE DIRECTOR
             </div>
             
             <div style={{ fontSize: '15px', color: 'var(--about-text-secondary)', lineHeight: 1.8, display: 'flex', flexDirection: 'column', gap: '18px', marginBottom: '36px', fontWeight: 300 }}>
                <p>
                  MotionNodeEdits was born from a clear conviction: the tools to craft cinematic, high-converting visual stories are evolving at lightning speed, and modern brands deserve an agile partner that masterfully harnesses this new era.
                </p>
                <p>
                  With expertise spanning post-production editing, AI generative workflows, and creative direction, we build bespoke video experiences that elevate brand authority globally.
                </p>
             </div>

             <div style={{ position: 'relative', paddingLeft: '24px', borderLeft: '2px solid #FFFFFF' }}>
                <p style={{ 
                  fontFamily: 'var(--about-font-heading)',
                  fontSize: '22px', 
                  fontStyle: 'italic', 
                  color: '#FFFFFF', 
                  margin: 0, 
                  lineHeight: 1.5,
                  fontWeight: 300
                }}>
                  "Technology is the engine. Emotion, storytelling, and meticulous craft are what make it extraordinary."
                </p>
             </div>
          </div>

        </div>

      </div>
    </section>
  );
}
