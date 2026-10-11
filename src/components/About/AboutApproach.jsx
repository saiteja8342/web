import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function AboutApproach() {
  const lineRef = useRef(null);

  useEffect(() => {
    if (lineRef.current) {
      gsap.fromTo(
        lineRef.current,
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: 'power2.out',
          duration: 1.5,
          scrollTrigger: {
            trigger: lineRef.current,
            start: 'top 85%',
          }
        }
      );
    }
  }, []);

  const nodes = [
    { num: '1', title: 'CLIENT GOAL' },
    { num: '2', title: 'CREATIVE DIRECTION' },
    { num: '3', title: 'AI MODEL SELECTION', sub: 'Runway, Sora, Kling, Veo' },
    { num: '4', title: 'AI GENERATION' },
    { num: '5', title: 'EDITING & REFINEMENT' },
    { num: '6', title: 'FINAL VIDEO' },
  ];

  return (
    <section 
      style={{
        backgroundColor: 'var(--about-bg-secondary)',
        padding: '130px 0',
        position: 'relative',
        overflow: 'hidden',
        borderTop: '1px solid var(--about-border)',
        borderBottom: '1px solid var(--about-border)'
      }}
    >
      <div className="about-container">
        
        <div className="about-fade-up" style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '80px' }}>
          <div style={{ flex: '1 1 45%', minWidth: '320px' }}>
            <div className="chrome-badge" style={{ marginBottom: '16px' }}>OUR METHODOLOGY</div>
            <h2 style={{ 
              fontSize: 'clamp(32px, 4.5vw, 64px)', 
              fontWeight: 300, 
              color: 'var(--about-text-primary)',
              textTransform: 'uppercase',
              letterSpacing: '-0.02em',
              lineHeight: 1.05
            }}>
              We Don't Depend<br/>On One AI Model.
            </h2>
          </div>
          <p style={{ fontSize: '15px', color: 'var(--about-text-secondary)', maxWidth: '560px', flex: '1 1 45%', minWidth: '320px', lineHeight: 1.8, fontWeight: 300 }}>
            Every project is different. We use the latest AI tools and models based 
            on the client's requirements, visual direction, preferred style, and 
            desired result. The technology changes constantly. Our goal is to choose 
            the right tools for the right project.
          </p>
        </div>

        {/* Workflow Component */}
        <div className="about-fade-up about-workflow-container" style={{ position: 'relative', padding: '40px 0' }}>
          
          {/* Connecting Line Desktop */}
          <div className="about-workflow-line-bg" style={{ position: 'absolute', top: '64px', left: '24px', right: '24px', height: '1px', borderTop: '1px dashed rgba(255,255,255,0.08)', zIndex: 0 }}></div>
          <div 
            ref={lineRef}
            className="about-workflow-line-active" 
            style={{ 
              position: 'absolute', top: '64px', left: '24px', right: '24px', height: '1px', 
              borderTop: '1px dashed rgba(255,255,255,0.4)', zIndex: 0, 
              transformOrigin: 'left center' 
            }}
          >
             {/* Animated Silver Dot */}
             <div style={{
               position: 'absolute',
               top: '-4px',
               width: '8px',
               height: '8px',
               borderRadius: '50%',
               backgroundColor: '#FFFFFF',
               boxShadow: '0 0 12px #FFFFFF',
               animation: 'workflowDotAnim 4s linear infinite'
             }}></div>
          </div>

          {/* Nodes */}
          <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 1, gap: '16px' }} className="about-workflow-nodes">
            {nodes.map((node, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', flex: 1 }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--about-surface)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  marginBottom: '20px',
                  position: 'relative',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                }}>
                  {node.num}
                  {i < nodes.length - 1 && <div className="about-workflow-arrow-mobile" style={{ display: 'none', position: 'absolute', bottom: '-24px', color: 'rgba(255,255,255,0.4)', fontSize: '16px' }}>↓</div>}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--about-text-primary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                  {node.title}
                </div>
                {node.sub && (
                  <div style={{ fontSize: '11px', color: 'var(--about-text-secondary)', fontWeight: 300 }}>
                    {node.sub}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="about-fade-up" style={{ textAlign: 'center', marginTop: '72px' }}>
          <h3 style={{ 
            fontFamily: 'var(--about-font-heading)', 
            fontSize: 'clamp(22px, 3vw, 32px)', 
            fontWeight: 300, 
            color: 'var(--about-text-primary)', 
            maxWidth: '700px', 
            margin: '0 auto', 
            lineHeight: 1.4,
            letterSpacing: '-0.01em'
          }}>
            The technology changes constantly.<br/>
            Our goal is to choose the right tools for the right project.
          </h3>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes workflowDotAnim {
          0% { left: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { left: 100%; opacity: 0; }
        }
        @media (max-width: 900px) {
          .about-workflow-line-bg, .about-workflow-line-active {
            display: none !important;
          }
          .about-workflow-nodes {
            flex-direction: column !important;
            gap: 40px !important;
          }
          .about-workflow-arrow-mobile {
            display: block !important;
          }
        }
      `}} />
    </section>
  );
}
