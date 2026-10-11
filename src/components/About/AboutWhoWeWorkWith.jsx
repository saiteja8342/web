import React from 'react';

export default function AboutWhoWeWorkWith() {
  const categories = [
    { name: 'BRANDS', size: 'large' },
    { name: 'STARTUPS', size: 'small' },
    { name: 'BUSINESSES', size: 'small' },
    { name: 'CREATORS', size: 'small' },
    { name: 'AGENCIES', size: 'large' },
    { name: 'MARKETING TEAMS', size: 'small' },
    { name: 'PERSONAL BRANDS', size: 'small' },
    { name: 'GLOBAL CLIENTS', size: 'small' }
  ];

  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  };

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
          <div className="chrome-badge">CLIENT PARTNERSHIPS</div>
          <h2 className="about-section-title">
            Built For Anyone<br/>Who Needs Better Video.
          </h2>
          <p className="about-section-subtitle">
            Whether you are launching a product, promoting a service, building 
            a brand, or creating content — MotionNodeEdits can help turn your 
            idea into an AI-powered video.
          </p>
        </div>

        <div className="about-fade-up about-asymmetric-grid">
          {categories.map((cat, idx) => (
            <div 
              key={idx} 
              onMouseMove={handleMouseMove}
              className={`saas-card ${cat.size === 'large' ? 'about-grid-large' : 'about-grid-small'}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '24px 20px',
                cursor: 'pointer'
              }}
            >
              <span style={{ 
                fontFamily: 'var(--about-font-heading)',
                textTransform: 'uppercase', 
                fontSize: cat.size === 'large' ? '22px' : '17px', 
                fontWeight: 300, 
                color: 'var(--about-text-primary)', 
                letterSpacing: '0.04em' 
              }}>
                {cat.name}
              </span>
            </div>
          ))}
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .about-asymmetric-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          grid-auto-rows: 110px;
          gap: 16px;
        }
        .about-grid-large {
          grid-column: span 2;
        }
        .about-grid-small {
          grid-column: span 1;
        }
        @media (max-width: 900px) {
          .about-asymmetric-grid {
            grid-template-columns: repeat(2, 1fr);
            grid-auto-rows: 90px;
          }
          .about-grid-large {
            grid-column: span 2;
          }
        }
        @media (max-width: 500px) {
          .about-asymmetric-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .about-grid-large {
             grid-column: span 2;
          }
          .about-grid-small {
             grid-column: span 1;
          }
        }
      `}} />
    </section>
  );
}
