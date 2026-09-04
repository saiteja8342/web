import React, { useEffect, useRef } from 'react';
import { Phone, Mail, Instagram, Youtube, Linkedin } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function Footer() {
  const footerRef = useRef(null);
  const isAboutPage = typeof window !== 'undefined' && window.location.pathname.includes('about');
  const isWorkPage = typeof window !== 'undefined' && window.location.pathname.includes('work');
  const isTermsPage = typeof window !== 'undefined' && window.location.pathname.includes('terms');
  const isSecondaryPage = isAboutPage || isWorkPage || isTermsPage;

  useEffect(() => {
    const el = footerRef.current;
    if (!el) return;
    
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
            start: 'top 95%',
            toggleActions: 'play none none none',
            once: true
          }
        }
      );
    });

    ScrollTrigger.refresh();
  }, []);

  const handleOpenAiDemo = () => {
    const waBtn = document.getElementById('waBtn');
    if (waBtn) {
      waBtn.click();
    } else {
      window.open('https://wa.me/918985351756?text=Hi%20MotionNodeEdits,%20I%20would%20like%20to%20try%20an%20AI%20demo', '_blank');
    }
  };

  return (
    <footer className="footer-premium footer-ref-style" ref={footerRef}>
      <div className="container">

        {/* TOP CALLOUT HEADLINE */}
        <div className="footer-top reveal-element">
          <h2 className="footer-headline">Let's Create Something<br className="footer-br-desktop" /> Exceptional.</h2>
          <a href={isSecondaryPage ? "/#contact" : "#contact"} className="btn btn-primary footer-cta" data-hover-type="link">
            Start A Project
          </a>
        </div>
        
        {/* MAIN REFERENCE FOOTER AREA */}
        <div className="footer-main-grid reveal-element">
          
          {/* COLUMN 1: BRAND, STUDIO INFO, PHONE/EMAIL & SOCIALS */}
          <div className="footer-brand-column">
            <a href={isSecondaryPage ? "/" : "#"} className="footer-logo-brand-wrap" data-hover-type="link">
              <img 
                src="/image/mne_logo.png" 
                alt="MotionNodeEdits Logo" 
                className="footer-logo-badge" 
                width="44" 
                height="44" 
                loading="lazy" 
              />
              <span className="footer-brand-title">MotionNodeEdits</span>
            </a>

            {/* Studio / Address Details */}
            <div className="footer-studio-info">
              <div className="footer-info-block">
                <span className="footer-info-label">Post-Production Studio:</span>
                <span className="footer-info-value">Hyderabad, India</span>
              </div>
            </div>

            {/* Phone & Email Row */}
            <div className="footer-contact-row">
              <a 
                href="tel:+918985351756" 
                className="footer-contact-item"
                data-hover-type="link"
              >
                <div className="footer-contact-icon-box">
                  <Phone size={16} />
                </div>
                <span>+91 89853 51756</span>
              </a>

              <a 
                href="mailto:hello@motionnodeedits.com" 
                className="footer-contact-item"
                data-hover-type="link"
                onClick={(e) => {
                  e.preventDefault();
                  window.location.href = 'mailto:hello@motionnodeedits.com';
                }}
              >
                <div className="footer-contact-icon-box">
                  <Mail size={16} />
                </div>
                <span>hello@motionnodeedits.com</span>
              </a>
            </div>

            {/* Rounded Square Social Badges */}
            <div className="footer-social-squares">
              <a 
                href="https://www.instagram.com/motionnodeedits/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="footer-social-square" 
                data-hover-type="link" 
                aria-label="Instagram"
              >
                <Instagram size={18} />
              </a>

              <a 
                href="https://www.youtube.com/@motionnodeedits" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="footer-social-square" 
                data-hover-type="link" 
                aria-label="YouTube"
              >
                <Youtube size={18} />
              </a>

              <a 
                href="https://www.linkedin.com/company/motionnodeedits" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="footer-social-square" 
                data-hover-type="link" 
                aria-label="LinkedIn"
              >
                <Linkedin size={18} />
              </a>

              <a 
                href="mailto:hello@motionnodeedits.com" 
                className="footer-social-square" 
                data-hover-type="link" 
                aria-label="Email"
              >
                <Mail size={18} />
              </a>
            </div>
          </div>
          
          {/* 2-COLUMN GRID WRAPPER FOR QUICK LINKS & SERVICES */}
          <div className="footer-links-grid-wrapper">
            {/* QUICK LINKS */}
            <div className="footer-links-column">
              <h4 className="footer-section-title">Quick Links</h4>
              <ul className="footer-nav-list">
                <li>
                  <a href={isSecondaryPage ? "/" : "#"} data-hover-type="link">Home</a>
                </li>
                <li>
                  <a href={isSecondaryPage ? "/#services" : "#services"} data-hover-type="link">Services</a>
                </li>
                <li>
                  <a href="/work.html" className={isWorkPage ? "active" : ""} data-hover-type="link">Our Work</a>
                </li>
                <li>
                  <a href="/about.html" className={isAboutPage ? "active" : ""} data-hover-type="link">About Us</a>
                </li>
                <li>
                  <a href={isSecondaryPage ? "/#testimonials" : "#testimonials"} data-hover-type="link">Client Reviews</a>
                </li>
                <li>
                  <a href={isSecondaryPage ? "/#contact" : "#contact"} data-hover-type="link">Contact Us</a>
                </li>
              </ul>
            </div>
            
            {/* SERVICES */}
            <div className="footer-links-column">
              <h4 className="footer-section-title">Services</h4>
              <ul className="footer-nav-list">
                <li>
                  <a href={isSecondaryPage ? "/#services" : "#services"} data-hover-type="link">AI Video Production</a>
                </li>
                <li>
                  <a href={isSecondaryPage ? "/#services" : "#services"} data-hover-type="link">Video Editing</a>
                </li>
                <li>
                  <a href={isSecondaryPage ? "/#services" : "#services"} data-hover-type="link">AI Advertisements</a>
                </li>
                <li>
                  <a href={isSecondaryPage ? "/#services" : "#services"} data-hover-type="link">Social Media Reels & UGC</a>
                </li>
                <li>
                  <a href={isSecondaryPage ? "/#services" : "#services"} data-hover-type="link">Color Grading & Sound Design</a>
                </li>
              </ul>
            </div>
          </div>

        </div>

        {/* BOTTOM AREA / COPYRIGHT & LEGAL BAR */}
        <div className="footer-bottom-bar reveal-element">
          <div className="footer-bottom-divider"></div>
          <div className="footer-legal-row">
            <div className="footer-legal-left-group">
              <div className="footer-copyright-text">
                © 2026 MotionNodeEdits. All rights reserved.
              </div>
              <button 
                className="footer-ai-demo-pill" 
                onClick={handleOpenAiDemo}
                data-hover-type="link"
                aria-label="Try an AI demo"
              >
                Try an AI demo
              </button>
            </div>
            <div className="footer-legal-links">
              <a href="/terms.html" data-hover-type="link">Privacy Policy</a>
              <span className="footer-legal-pipe">||</span>
              <a href="/terms.html" data-hover-type="link">Terms of Service</a>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}
