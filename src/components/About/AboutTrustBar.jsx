import React from 'react';

export default function AboutTrustBar() {
  const stats = [
    { number: '100+', label: 'Completed Projects' },
    { number: '50+', label: 'Global Clients' },
    { number: '8', label: 'Video Categories' },
    { number: '4.9★', label: 'Client Satisfaction' },
  ];

  return (
    <section 
      style={{
        backgroundColor: 'var(--about-surface)',
        borderTop: '1px solid var(--about-border)',
        borderBottom: '1px solid var(--about-border)',
        position: 'relative',
        zIndex: 2
      }}
    >
      <div className="about-container">
        <div 
          className="about-fade-up"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          }}
        >
          {stats.map((stat, index) => (
            <div 
              key={index}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '32px 20px',
                borderRight: index !== stats.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              }}
            >
              <div style={{ 
                fontFamily: 'var(--about-font-heading)', 
                fontSize: 'clamp(32px, 3.5vw, 42px)', 
                fontWeight: 300, 
                color: 'var(--about-text-primary)', 
                lineHeight: 1, 
                marginBottom: '8px' 
              }}>
                {stat.number}
              </div>
              <div style={{ 
                fontSize: '11px', 
                textTransform: 'uppercase', 
                letterSpacing: '0.15em', 
                color: 'var(--about-text-secondary)',
                fontWeight: 500
              }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 768px) {
          .about-fade-up > div {
            border-right: none !important;
            border-bottom: 1px solid rgba(255,255,255,0.06);
          }
          .about-fade-up > div:last-child {
            border-bottom: none;
          }
          .about-fade-up {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .about-fade-up > div:nth-child(1), .about-fade-up > div:nth-child(3) {
             border-right: 1px solid rgba(255,255,255,0.06) !important;
          }
        }
      `}} />
    </section>
  );
}
