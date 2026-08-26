import React from 'react';

export default function AboutProblemSolving() {
  const traditionalSteps = [
    'Idea', 'Planning & Budgeting', 'Location / Casting', 'Production Days', 'Post-Production', 'Revisions', 'Delivery'
  ];
  
  const aiSteps = [
    'Idea', 'Creative Direction', 'AI Model Selection', 'AI Generation', 'Editing & Refinement', 'Review', 'Delivery'
  ];

  return (
    <section 
      style={{
        backgroundColor: 'var(--about-bg-secondary)',
        padding: '130px 0',
        borderTop: '1px solid var(--about-border)',
        borderBottom: '1px solid var(--about-border)'
      }}
    >
      <div className="about-container">
        
        <div className="about-fade-up about-section-header">
          <div className="chrome-badge">THE PARADIGM SHIFT</div>
          <h2 className="about-section-title">
            Video Production Is Changing.
          </h2>
          <p className="about-section-subtitle">
            Most brands still produce video the old way.<br/>We built a faster, higher-fidelity path.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', marginBottom: '64px' }}>
          
          {/* Traditional Panel */}
          <div className="about-fade-up saas-card" style={{ padding: '40px' }}>
            <div style={{ display: 'inline-block', backgroundColor: 'rgba(255,255,255,0.04)', color: 'var(--about-text-secondary)', padding: '6px 14px', borderRadius: '100px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '32px', border: '1px solid rgba(255,255,255,0.06)' }}>
              Traditional Workflow
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
              <div style={{ position: 'absolute', left: '7px', top: '10px', bottom: '10px', width: '1px', backgroundColor: 'rgba(255,255,255,0.08)' }}></div>
              {traditionalSteps.map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', zIndex: 2 }}>
                  <div style={{ width: '15px', height: '15px', borderRadius: '50%', backgroundColor: 'var(--about-surface)', border: '1px solid rgba(255,255,255,0.2)' }}></div>
                  <span style={{ fontSize: '14px', color: 'var(--about-text-secondary)' }}>{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Panel (Metallic Chrome Highlight) */}
          <div className="about-fade-up saas-card" style={{ padding: '40px', borderColor: 'rgba(255, 255, 255, 0.2)', boxShadow: '0 20px 40px rgba(0,0,0,0.7), inset 0 1px 1px rgba(255,255,255,0.2)' }}>
            <div style={{ display: 'inline-block', backgroundColor: '#FFFFFF', color: '#050507', padding: '6px 14px', borderRadius: '100px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '32px', boxShadow: '0 0 15px rgba(255,255,255,0.3)' }}>
              AI-Powered Studio
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
              <div style={{ position: 'absolute', left: '7px', top: '10px', bottom: '10px', width: '1px', backgroundColor: 'rgba(255,255,255,0.25)' }}></div>
              {aiSteps.map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', zIndex: 2 }}>
                  <div style={{ width: '15px', height: '15px', borderRadius: '50%', backgroundColor: '#FFFFFF', border: '2px solid #FFFFFF', boxShadow: '0 0 10px rgba(255,255,255,0.5)' }}></div>
                  <span style={{ fontSize: '14px', color: '#FFFFFF', fontWeight: 500 }}>{step}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        <div className="about-fade-up" style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '15px', color: 'var(--about-text-secondary)', maxWidth: '600px', margin: '0 auto', lineHeight: 1.7, fontWeight: 300 }}>
            We are building a faster, more flexible approach to video production 
            while keeping cinematic craft and storytelling at the center.
          </p>
        </div>

      </div>
    </section>
  );
}
