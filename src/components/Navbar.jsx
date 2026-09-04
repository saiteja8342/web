import React, { useState, useEffect } from 'react';
import NoiseBackground from './NoiseBackground';
import MobileSidebar from './MobileSidebar';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 80) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const isAboutPage = typeof window !== 'undefined' && window.location.pathname.includes('about');
  const isWorkPage = typeof window !== 'undefined' && window.location.pathname.includes('work');
  const isTermsPage = typeof window !== 'undefined' && window.location.pathname.includes('terms');
  const isSecondaryPage = isAboutPage || isWorkPage || isTermsPage;

  return (
    <>
      <nav className={`nav ${scrolled ? 'scrolled' : ''}`} id="nav">
        <div className="container nav-inner">
          <a href={isSecondaryPage ? "/" : "#"} className="nav-logo" data-hover-type="link" style={{ textDecoration: 'none' }}>
            <span className="logo-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img 
                src="/image/mne_logo.png" 
                alt="MotionNodeEdits AI Video Production Studio Logo"
                className="logo-img-circular"
                width="40"
                height="40"
                loading="lazy"
                onLoad={() => setLogoLoaded(true)}
                style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '50%', 
                  objectFit: 'cover', 
                  border: '1px solid rgba(255,255,255,0.08)',
                  visibility: logoLoaded ? 'visible' : 'hidden' 
                }}
              />
              {!logoLoaded && (
                <div className="skeleton-loader logo-skeleton" aria-hidden="true" style={{ width: 40, height: 40, borderRadius: '50%' }}></div>
              )}
              <div className="nav-logo-text-wrap" style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                <span className="nav-logo-brand" style={{ fontFamily: 'var(--font-sans)', fontSize: '0.95rem', fontWeight: '700', color: '#FFFFFF', letterSpacing: '0.01em', lineHeight: '1.2' }}>MotionNodeEdits</span>
                <span className="nav-logo-subtitle" style={{ fontFamily: 'var(--font-sans)', fontSize: '0.62rem', color: 'var(--text-secondary)', letterSpacing: '0.01em', marginTop: '2px', fontWeight: '400', textTransform: 'none' }}>AI Video & Avatar Production Studio</span>
              </div>
            </span>
          </a>

          <div className="nav-links">
            <a href={isSecondaryPage ? "/" : "#"} data-hover-type="link">Home</a>
            <a href={isSecondaryPage ? "/#services" : "#services"} data-hover-type="link">Services</a>
            <a href="/work.html" className={isWorkPage ? "active" : ""} data-hover-type="link">Our Work</a>
            <a href="/about.html" className={isAboutPage ? "active" : ""} data-hover-type="link">About Us</a>
            <a href={isSecondaryPage ? "/#testimonials" : "#testimonials"} data-hover-type="link">Client Reviews</a>
            <a href={isSecondaryPage ? "/#contact" : "#contact"} data-hover-type="link">Contact</a>
          </div>

          <NoiseBackground
            containerClassName="nav-cta-custom-wrapper"
            gradientColors={[
              "rgb(255, 100, 150)",
              "rgb(100, 150, 255)",
              "rgb(255, 200, 100)",
            ]}
          >
            <a href={isSecondaryPage ? "/#contact" : "#contact"} className="nav-cta-custom-noise" data-hover-type="link">
              Start a project
            </a>
          </NoiseBackground>

          <button 
            className="hamburger" 
            id="hamburger" 
            onClick={toggleMobileMenu}
            aria-label="Toggle Menu"
            data-hover-type="link"
          >
            <span style={{ transform: mobileMenuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }}></span>
            <span style={{ opacity: mobileMenuOpen ? 0 : 1 }}></span>
            <span style={{ transform: mobileMenuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }}></span>
          </button>
        </div>
      </nav>

      {/* ANIMATED MOBILE SIDEBAR DRAWER */}
      <MobileSidebar isOpen={mobileMenuOpen} onClose={closeMobileMenu} />
    </>
  );
}
