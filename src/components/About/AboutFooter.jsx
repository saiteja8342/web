import React from 'react';

export default function AboutFooter() {
  return (
    <footer 
      style={{
        backgroundColor: 'var(--about-bg-primary)',
        borderTop: '1px solid var(--about-border)',
        paddingTop: '72px',
        paddingBottom: '40px'
      }}
    >
      <div className="about-container">
        
        {/* Top 3 Columns */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '48px', marginBottom: '64px' }} className="about-footer-cols">
          
          {/* Left */}
          <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ color: 'var(--about-white)', fontWeight: 800, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
              MotionNodeEdits
            </div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--about-text-secondary)' }}>
              AI VIDEO PRODUCTION FOR THE NEXT GENERATION.
            </div>
          </div>

          {/* Center */}
          <div style={{ flex: '1 1 300px', display: 'flex', justifyContent: 'center' }} className="about-footer-nav">
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              <a href="/" style={{ fontSize: '13px', color: 'var(--about-text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}>Home</a>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
              <a href="/about.html" style={{ fontSize: '13px', color: 'var(--about-text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}>About</a>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
              <a href="/work" style={{ fontSize: '13px', color: 'var(--about-text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}>Services</a>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
              <a href="/work" style={{ fontSize: '13px', color: 'var(--about-text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}>Our Work</a>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
              <a href="#faq" style={{ fontSize: '13px', color: 'var(--about-text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}>FAQ</a>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
              <a href="/contact" style={{ fontSize: '13px', color: 'var(--about-text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}>Contact</a>
            </div>
          </div>

          {/* Right */}
          <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '16px' }} className="about-footer-social">
            <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--about-text-secondary)' }}>
              FOLLOW OUR WORK
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <a href="#" aria-label="Instagram" style={{ color: 'var(--about-white)', transition: 'color 0.2s' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg></a>
              <a href="#" aria-label="YouTube" style={{ color: 'var(--about-white)', transition: 'color 0.2s' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg></a>
              <a href="#" aria-label="LinkedIn" style={{ color: 'var(--about-white)', transition: 'color 0.2s' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg></a>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div style={{ 
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingTop: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ fontSize: '12px', color: 'var(--about-text-secondary)' }}>
            © 2024 MotionNodeEdits. All Rights Reserved.
          </div>
          <div style={{ fontSize: '12px', color: 'var(--about-text-secondary)', display: 'flex', gap: '16px' }}>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}>Privacy Policy</a>
            <span>·</span>
            <a href="/terms.html" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}>Terms</a>
          </div>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        footer a:hover {
          color: var(--about-white) !important;
        }
        @media (max-width: 768px) {
          .about-footer-cols {
            flex-direction: column !important;
            gap: 32px !important;
          }
          .about-footer-nav {
            justify-content: flex-start !important;
          }
          .about-footer-social {
            align-items: flex-start !important;
          }
        }
      `}} />
    </footer>
  );
}
