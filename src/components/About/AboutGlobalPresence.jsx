import React from 'react';

export default function AboutGlobalPresence() {
  return (
    <section 
      style={{
        height: '520px',
        backgroundColor: 'var(--about-bg-primary)',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderTop: '1px solid var(--about-border)',
        borderBottom: '1px solid var(--about-border)'
      }}
    >
      {/* Background Visual */}
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.4
      }}>
        <div style={{ position: 'relative', width: '80%', height: '80%', maxWidth: '1000px' }}>
          {/* Global Node Dots */}
          <div className="about-globe-dot" style={{ top: '40%', left: '20%' }}></div>
          <div className="about-globe-dot" style={{ top: '30%', left: '45%' }}></div>
          <div className="about-globe-dot" style={{ top: '25%', left: '50%' }}></div>
          <div className="about-globe-dot" style={{ top: '45%', left: '60%' }}></div>
          <div className="about-globe-dot" style={{ top: '55%', left: '70%', background: '#FFFFFF', boxShadow: '0 0 16px #FFFFFF' }}></div> {/* Hyderabad Origin */}
          <div className="about-globe-dot" style={{ top: '65%', left: '80%' }}></div>
          <div className="about-globe-dot" style={{ top: '75%', left: '85%' }}></div>
          
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} pointerEvents="none">
             <path d="M 20% 40% Q 45% 20% 70% 55%" fill="transparent" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="4 4" />
             <path d="M 45% 30% Q 55% 40% 70% 55%" fill="transparent" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="4 4" />
             <path d="M 85% 75% Q 75% 60% 70% 55%" fill="transparent" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="4 4" />
          </svg>
        </div>
      </div>

      <div className="about-container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        
        <div className="about-fade-up" style={{ marginBottom: '16px' }}>
          <span className="chrome-badge">WORLDWIDE REACH</span>
        </div>

        <h2 className="about-fade-up" style={{ 
          fontSize: 'clamp(32px, 4.5vw, 60px)', 
          fontWeight: 300, 
          color: 'var(--about-text-primary)', 
          marginBottom: '20px',
          textTransform: 'uppercase',
          letterSpacing: '-0.02em'
        }}>
          From India To The World.
        </h2>

        <p className="about-fade-up" style={{ fontSize: '16px', color: 'var(--about-text-secondary)', maxWidth: '560px', margin: '0 auto', lineHeight: 1.8, fontWeight: 300 }}>
          MotionNodeEdits works with visionary clients globally, delivering AI-powered 
          video solutions across industries and creative needs.
        </p>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .about-globe-dot {
          position: absolute;
          width: 6px;
          height: 6px;
          background-color: rgba(255,255,255,0.6);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          animation: pulseGlobe 2s infinite alternate;
        }
        @keyframes pulseGlobe {
          0% { box-shadow: 0 0 0px rgba(255,255,255,0); }
          100% { box-shadow: 0 0 14px rgba(255,255,255,0.9); }
        }
        @media (max-width: 768px) {
          section[style*="height: 520px"] {
             height: auto !important;
             padding: 100px 0;
          }
        }
      `}} />
    </section>
  );
}
