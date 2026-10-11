import React from 'react';

export default function AboutQualityStandard() {
  const standards = [
    { title: 'VISUAL QUALITY', desc: 'High-resolution AI-generated visuals, rendered with intentional composition and aesthetic direction.' },
    { title: 'STORYTELLING', desc: 'Every video needs a clear purpose and message. We ensure the narrative is structured before production begins.' },
    { title: 'EDITING', desc: 'Professional pacing, composition, sound design, transitions, and refinement — applied after AI generation.' },
    { title: 'BRAND CONSISTENCY', desc: "The final video should feel aligned with the client's brand, tone, and visual identity." }
  ];

  return (
    <section style={{ padding: '130px 0' }}>
      <div className="about-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '60px', alignItems: 'center' }}>
        
        {/* Left */}
        <div className="about-fade-up" style={{ flex: '1 1 40%', minWidth: '300px' }}>
          <div className="chrome-badge" style={{ marginBottom: '20px' }}>OUR BENCHMARK</div>
          <h2 style={{ 
            fontSize: 'clamp(32px, 4.5vw, 56px)', 
            fontWeight: 300, 
            color: 'var(--about-text-primary)', 
            maxWidth: '480px', 
            margin: 0, 
            lineHeight: 1.1,
            textTransform: 'uppercase',
            letterSpacing: '-0.02em'
          }}>
            AI Is The Technology.<br/>
            Quality Is The Standard.
          </h2>
        </div>

        {/* Right */}
        <div className="about-fade-up" style={{ flex: '1 1 50%', minWidth: '300px', display: 'flex', flexDirection: 'column' }}>
          {standards.map((std, idx) => (
            <div key={idx} style={{ 
              padding: '28px 0', 
              borderTop: '1px solid var(--about-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <h3 style={{ 
                fontFamily: 'var(--about-font-heading)',
                fontSize: '20px', 
                fontWeight: 300, 
                color: 'var(--about-text-primary)', 
                margin: 0,
                textTransform: 'uppercase',
                letterSpacing: '0.02em'
              }}>
                {std.title}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--about-text-secondary)', lineHeight: 1.7, margin: 0, fontWeight: 300 }}>
                {std.desc}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
