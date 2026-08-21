import React, { useEffect, useRef } from 'react';
import { Instagram, Youtube, Mail } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function Footer() {
  const footerRef = useRef(null);

  useEffect(() => {
    const el = footerRef.current;
    
    // GSAP Scroll reveals
    const reveals = el.querySelectorAll('.reveal-element');
    reveals.forEach((element) => {
      gsap.fromTo(element,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: element,
            start: 'top 90%',
            toggleActions: 'play none none none',
            once: true
          }
        }
      );
    });
  }, []);

  return (
    <footer className="footer-premium" ref={footerRef}>
      <div className="container">
        
        {/* TOP AREA */}
        <div className="footer-top reveal-element">
          <h2 className="footer-headline">Let's Create Something<br />Exceptional.</h2>
          <a href="#contact" className="btn btn-primary footer-cta" data-hover-type="link">
            Start A Project
          </a>
        </div>

        {/* MIDDLE AREA */}
        <div className="footer-middle">
          {/* Column 1 */}
          <div className="footer-col footer-col-brand reveal-element">
            <a href="#" className="footer-logo-link" data-hover-type="link" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
              <img 
                src="/image/mne_logo.png" 
                alt="MotionNodeEdits Logo" 
                className="footer-logo" 
                width="40"
                height="40"
                loading="lazy"
                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.08)' }}
              />
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '1rem', fontWeight: '700', color: '#FFFFFF', letterSpacing: '0.01em' }}>MotionNodeEdits</span>
            </a>
            <p className="footer-brand-text" style={{ marginTop: '16px' }}>
              We create scroll-stopping content that turns attention into growth.
            </p>
          </div>
          
          {/* Column 2 */}
          <div className="footer-col footer-col-links reveal-element">
            <h4 className="footer-col-title">Navigation</h4>
            <div className="footer-links">
              <a href="#" data-hover-type="link">Home</a>
              <a href="#services" data-hover-type="link">Services</a>
              <a href="#work" data-hover-type="link">Work</a>
              <a href="#testimonials" data-hover-type="link">Testimonials</a>
              <a href="#contact" data-hover-type="link">Contact</a>
            </div>
          </div>
          
          {/* Column 3 */}
          <div className="footer-col footer-col-links reveal-element">
            <h4 className="footer-col-title">Services</h4>
            <div className="footer-links">
              <a href="#services" data-hover-type="link">Video Editing</a>
              <a href="#services" data-hover-type="link">AI Production</a>
              <a href="#services" data-hover-type="link">AI Advertisements</a>
              <a href="#services" data-hover-type="link">Social Media Reels</a>
            </div>
          </div>
          
          {/* Column 4 */}
          <div className="footer-col footer-col-links reveal-element">
            <h4 className="footer-col-title">Connect</h4>
            <div className="footer-links">
              <a 
                href="https://www.instagram.com/motionnodeedits/" 
                target="_blank" 
                rel="noopener noreferrer" 
                data-hover-type="link" 
                style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                onClick={(e) => {
                  e.preventDefault();
                  window.open('https://www.instagram.com/motionnodeedits/', '_blank', 'noopener,noreferrer');
                }}
              >
                <Instagram size={14} /> Instagram
              </a>
              <a 
                href="https://www.youtube.com/@motionnodeedits" 
                target="_blank" 
                rel="noopener noreferrer" 
                data-hover-type="link" 
                style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                onClick={(e) => {
                  e.preventDefault();
                  window.open('https://www.youtube.com/@motionnodeedits', '_blank', 'noopener,noreferrer');
                }}
              >
                <Youtube size={14} /> YouTube
              </a>
              <a 
                href="mailto:motionnodeedits@gmail.com" 
                data-hover-type="link" 
                style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                onClick={(e) => {
                  e.preventDefault();
                  window.location.href = 'mailto:motionnodeedits@gmail.com';
                }}
              >
                <Mail size={14} /> Email
              </a>
            </div>
          </div>
        </div>

        {/* BOTTOM AREA */}
        <div className="footer-bottom reveal-element">
          <div className="footer-divider"></div>
          <div className="footer-bottom-inner">
            <div className="footer-copyright">
              © 2024 MotionNodeEdits. All rights reserved.
            </div>
            <div className="footer-quote">
              Built for brands and creators who want more than views.
            </div>
            <div className="footer-social" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <a 
                href="https://www.instagram.com/motionnodeedits/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="social-link-icon" 
                data-hover-type="link" 
                aria-label="Instagram" 
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                onClick={(e) => {
                  e.preventDefault();
                  window.open('https://www.instagram.com/motionnodeedits/', '_blank', 'noopener,noreferrer');
                }}
              >
                <Instagram size={18} />
              </a>
              <a 
                href="https://www.youtube.com/@motionnodeedits" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="social-link-icon" 
                data-hover-type="link" 
                aria-label="YouTube" 
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                onClick={(e) => {
                  e.preventDefault();
                  window.open('https://www.youtube.com/@motionnodeedits', '_blank', 'noopener,noreferrer');
                }}
              >
                <Youtube size={18} />
              </a>
              <a 
                href="mailto:motionnodeedits@gmail.com" 
                className="social-link-icon" 
                data-hover-type="link" 
                aria-label="Email" 
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                onClick={(e) => {
                  e.preventDefault();
                  window.location.href = 'mailto:motionnodeedits@gmail.com';
                }}
              >
                <Mail size={18} />
              </a>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}
