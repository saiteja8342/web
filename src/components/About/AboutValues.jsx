import React from 'react';

export default function AboutValues() {
  const values = [
    { word: 'CREATIVITY', sub: 'Ideas come first.' },
    { word: 'QUALITY', sub: 'Every frame matters.' },
    { word: 'SPEED', sub: 'Move faster without losing the creative vision.' }
  ];

  return (
    <section style={{ padding: '130px 0' }}>
      <div className="about-container">
        
        <div className="about-fade-up" style={{ textAlign: 'center', marginBottom: '50px' }}>
          <span className="chrome-badge">WHAT WE STAND FOR</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {values.map((val, idx) => (
            <div key={idx} className="about-fade-up" style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              textAlign: 'center',
              padding: '48px 0',
              borderTop: idx === 0 ? 'none' : '1px solid var(--about-border)'
            }}>
              <div style={{ 
                fontFamily: 'var(--about-font-heading)',
                fontSize: 'clamp(52px, 8.5vw, 130px)', 
                fontWeight: 300, 
                color: 'var(--about-text-primary)', 
                letterSpacing: '-0.03em',
                lineHeight: 1.05,
                marginBottom: '12px'
              }}>
                {val.word}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--about-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.18em', fontWeight: 500 }}>
                {val.sub}
              </div>
            </div>
          ))}
          
          <div className="about-fade-up" style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            padding: '48px 0',
            borderTop: '1px solid var(--about-border)'
          }}>
             <div className="chrome-text" style={{ 
               fontFamily: 'var(--about-font-heading)',
               fontSize: 'clamp(36px, 5vw, 56px)', 
               fontWeight: 300, 
               letterSpacing: '-0.02em' 
             }}>
               INNOVATION
             </div>
          </div>
        </div>

      </div>
    </section>
  );
}
