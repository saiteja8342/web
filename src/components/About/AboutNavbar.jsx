import React, { useState, useEffect } from 'react';

export default function AboutNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <nav 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '64px',
          backgroundColor: scrolled ? 'rgba(5,5,7,0.85)' : 'transparent',
          backdropFilter: scrolled ? 'blur(16px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(16px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
          zIndex: 100,
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <div className="about-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          
          {/* Left: Logo */}
          <a href="/" style={{ color: 'var(--about-white)', textDecoration: 'none', fontWeight: 800, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* SVG Placeholder */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
            MotionNodeEdits
          </a>

          {/* Center: Desktop Nav */}
          <div className="about-nav-desktop" style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
            <a href="/" style={{ color: 'var(--about-text-secondary)', textDecoration: 'none', fontSize: '13px', fontWeight: 500, transition: 'color 0.2s' }}>Home</a>
            <a href="/about" style={{ color: 'var(--about-white)', textDecoration: 'none', fontSize: '13px', fontWeight: 500, transition: 'color 0.2s' }}>About</a>
            <a href="/work" style={{ color: 'var(--about-text-secondary)', textDecoration: 'none', fontSize: '13px', fontWeight: 500, transition: 'color 0.2s' }}>Services</a>
            <a href="/work" style={{ color: 'var(--about-text-secondary)', textDecoration: 'none', fontSize: '13px', fontWeight: 500, transition: 'color 0.2s' }}>Our Work</a>
            <a href="/contact" style={{ color: 'var(--about-text-secondary)', textDecoration: 'none', fontSize: '13px', fontWeight: 500, transition: 'color 0.2s' }}>Contact</a>
          </div>

          {/* Right: CTA & Mobile Hamburger */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <a href="/contact" className="about-nav-cta about-btn-primary" style={{ height: '36px', padding: '0 16px', fontSize: '12px' }}>
              START A PROJECT
            </a>
            
            <button 
              className="about-hamburger"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                display: 'none',
                padding: '4px'
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          </div>

        </div>
      </nav>

      {/* Mobile Menu Slide-in */}
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(5,5,7,0.98)',
          backdropFilter: 'blur(20px)',
          zIndex: 99,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '32px',
          transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.4s cubic-bezier(0.77, 0, 0.175, 1)'
        }}
      >
        <button 
          onClick={() => setMobileMenuOpen(false)}
          style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'white', fontSize: '32px', cursor: 'pointer' }}
        >
          ×
        </button>
        <a href="/" onClick={() => setMobileMenuOpen(false)} style={{ color: 'white', textDecoration: 'none', fontSize: '24px', fontWeight: 700 }}>Home</a>
        <a href="/about" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--about-accent)', textDecoration: 'none', fontSize: '24px', fontWeight: 700 }}>About</a>
        <a href="/work" onClick={() => setMobileMenuOpen(false)} style={{ color: 'white', textDecoration: 'none', fontSize: '24px', fontWeight: 700 }}>Services</a>
        <a href="/work" onClick={() => setMobileMenuOpen(false)} style={{ color: 'white', textDecoration: 'none', fontSize: '24px', fontWeight: 700 }}>Our Work</a>
        <a href="/contact" onClick={() => setMobileMenuOpen(false)} style={{ color: 'white', textDecoration: 'none', fontSize: '24px', fontWeight: 700 }}>Contact</a>
        <a href="/contact" onClick={() => setMobileMenuOpen(false)} className="about-btn-primary" style={{ marginTop: '24px' }}>START A PROJECT</a>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .about-nav-desktop a:hover {
          color: var(--about-white) !important;
        }
        @media (max-width: 768px) {
          nav { height: 56px !important; }
          .about-nav-desktop, .about-nav-cta { display: none !important; }
          .about-hamburger { display: block !important; }
        }
      `}} />
    </>
  );
}
