import React from 'react';

export default function AboutServices() {
  const services = [
    { num: '01', title: 'AI ADS', desc: 'High-converting AI-generated advertising videos for social media, paid campaigns, and digital platforms.' },
    { num: '02', title: 'AI TALKING AVATAR', desc: 'Spokesperson videos with AI-generated or avatar-based presenters for brand communication and content.' },
    { num: '03', title: 'AI PRODUCT VIDEOS', desc: 'Product showcase videos using AI visuals, motion, and cinematic presentation for eCommerce and marketing.' },
    { num: '04', title: 'AI STORY VIDEOS', desc: 'Narrative-driven AI video content with emotional storytelling and cinematic composition.' },
    { num: '05', title: 'AI SOCIAL MEDIA VIDEOS', desc: 'Fast, engaging short-form AI video content designed for Instagram, TikTok, YouTube Shorts, and Reels.' },
    { num: '06', title: 'AI CINEMATIC VIDEOS', desc: 'High-quality AI-generated cinematic scenes, brand films, and premium video productions.' },
    { num: '07', title: 'AI EXPLAINER VIDEOS', desc: 'Clear, engaging AI-animated videos that explain products, services, and ideas simply and effectively.' },
    { num: '08', title: 'AI BRAND VIDEOS', desc: 'Long-form or campaign AI videos that establish and communicate your brand identity and vision.' }
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
    <section className="about-section">
      <div className="about-container">
        
        <div className="about-fade-up about-section-header">
          <div className="chrome-badge">STUDIO CAPABILITIES</div>
          <h2 className="about-section-title">
            One Studio.<br/>Every Kind Of AI Video.
          </h2>
          <p className="about-section-subtitle">
            From AI ads to cinematic stories — we create every format of AI video 
            your brand needs.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px'
        }}>
          {services.map((service, idx) => (
            <div 
              key={idx} 
              className="about-fade-up saas-card"
              onMouseMove={handleMouseMove}
              style={{
                padding: '36px 30px',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer'
              }}
            >
              <div style={{ fontSize: '12px', color: 'var(--about-silver-dark)', fontWeight: 600, letterSpacing: '0.12em', marginBottom: '20px' }}>
                {service.num}
              </div>
              <h3 style={{ 
                fontFamily: 'var(--about-font-heading)', 
                fontSize: '22px', 
                fontWeight: 300, 
                color: 'var(--about-text-primary)', 
                marginBottom: '14px',
                letterSpacing: '-0.01em',
                textTransform: 'uppercase'
              }}>
                {service.title}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--about-text-secondary)', lineHeight: 1.7, flexGrow: 1, fontWeight: 300 }}>
                {service.desc}
              </p>
              
              <div className="about-service-arrow" style={{
                alignSelf: 'flex-end',
                marginTop: '24px',
                color: '#FFFFFF',
                fontSize: '18px',
                transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
              }}>
                →
              </div>
            </div>
          ))}
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .saas-card:hover .about-service-arrow {
          transform: translateX(6px);
        }
        @media (min-width: 1024px) {
          section[class*="about-section"] > div > div:last-child {
            grid-template-columns: repeat(4, 1fr);
          }
        }
      `}} />
    </section>
  );
}
