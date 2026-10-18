import React, { useState, useEffect } from 'react';
import { getPublicTestimonials } from '../../lib/db/cms';

const DEFAULT_ABOUT_TESTIMONIALS = [
  { 
    quote: "They transformed our raw footage with edits that stopped people scrolling. Engagement tripled.", 
    name: "Prasad", 
    role: "YouTube Creator, Creator Studio" 
  },
  { 
    quote: "MotionNodeEdits completely transformed our visual identity. The AI-generated campaigns they built were delivered in half the time of our usual production schedule.", 
    name: "Sarah Jenkins", 
    role: "CMO, Nexus Tech" 
  },
  { 
    quote: "The quality and cinematic detail in the AI storytelling blew us away. We didn't expect this level of emotional depth from an AI production.", 
    name: "Marcus Thorne", 
    role: "Creative Director, Studio 9" 
  },
  { 
    quote: "Fast, incredibly creative, and the communication was seamless. They are defining what the future of video production looks like.", 
    name: "Elena Rodriguez", 
    role: "Founder, Elevate Brands" 
  }
];

export default function AboutTestimonials() {
  const [testimonials, setTestimonials] = useState(DEFAULT_ABOUT_TESTIMONIALS);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getPublicTestimonials().then((dbData) => {
      if (isMounted && dbData && dbData.length > 0) {
        const transformed = dbData.map((item) => {
          const roleParts = [];
          if (item.role) roleParts.push(item.role);
          if (item.company) roleParts.push(item.company);
          const role = roleParts.length > 0 ? roleParts.join(', ') : 'Client';
          return {
            name: item.name || 'Client',
            role,
            quote: item.feedback || '',
          };
        });
        setTestimonials(transformed);
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const changeSlide = (newIndex) => {
    if (isFading || newIndex === activeIndex) return;
    setIsFading(true);
    setTimeout(() => {
      setActiveIndex(newIndex);
      setIsFading(false);
    }, 220);
  };

  const safeIndex = testimonials.length > 0 ? (activeIndex >= testimonials.length ? 0 : activeIndex) : 0;
  const currentItem = testimonials[safeIndex] || testimonials[0];
  const currentQuote = (currentItem?.quote || '').replace(/^["“”\s]+|["“”\s]+$/g, '');

  return (
    <section className="about-testimonials-section" id="testimonials" aria-label="Client Testimonials">
      <div className="about-container">
        
        <div className="about-testimonials-header">
          <div className="chrome-badge" style={{ marginBottom: '18px' }}>
            <span style={{ fontSize: '8px' }}>●</span> CLIENT ENDORSEMENTS
          </div>
          <h2 className="about-testimonials-title">
            What Our Clients Say
          </h2>
        </div>

        {/* Cinematic Review Showcase Card */}
        <div className="saas-card about-review-card">
          
          <div className="about-review-watermark" aria-hidden="true">
            “
          </div>

          <div className={`about-review-inner ${isFading ? 'is-fading' : ''}`}>
            
            {/* Stars & Verified Badge */}
            <div className="about-review-top-meta">
              <div className="about-review-stars">
                <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
              </div>
              <span className="about-review-verified">
                VERIFIED PARTNER
              </span>
            </div>

            {/* Testimonial Quote */}
            <p className="about-review-quote">
              "{currentQuote}"
            </p>

            {/* Client Author */}
            <div className="about-review-author-group">
              <h4 className="about-review-name">
                {currentItem?.name}
              </h4>
              <div className="about-review-role">
                {currentItem?.role}
              </div>
            </div>

          </div>

          {/* Navigation Controls */}
          <div className="about-review-nav-bar">
            <button 
              onClick={() => changeSlide(safeIndex === 0 ? testimonials.length - 1 : safeIndex - 1)}
              className="about-nav-btn"
              aria-label="Previous Testimonial"
              data-hover-type="link"
            >
              ←
            </button>
            
            <div className="about-nav-dots">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => changeSlide(idx)}
                  className={`about-dot-pill ${idx === safeIndex ? 'active' : ''}`}
                  aria-label={`Go to slide ${idx + 1}`}
                  data-hover-type="link"
                />
              ))}
            </div>

            <button 
              onClick={() => changeSlide(safeIndex === testimonials.length - 1 ? 0 : safeIndex + 1)}
              className="about-nav-btn"
              aria-label="Next Testimonial"
              data-hover-type="link"
            >
              →
            </button>
          </div>

        </div>

      </div>

      {/* COMPONENT STYLES */}
      <style dangerouslySetInnerHTML={{__html: `
        .about-testimonials-section {
          background-color: var(--about-bg-secondary, #0A0A0E);
          padding: 140px 0;
          border-top: 1px solid var(--about-border, rgba(255, 255, 255, 0.07));
          border-bottom: 1px solid var(--about-border, rgba(255, 255, 255, 0.07));
          position: relative;
        }

        .about-testimonials-header {
          text-align: center;
          margin-bottom: 64px;
        }

        .about-testimonials-title {
          font-family: var(--about-font-heading, 'Cormorant Garamond', serif) !important;
          font-size: clamp(38px, 4.5vw, 62px) !important;
          font-weight: 300 !important;
          color: #FFFFFF !important;
          text-transform: none !important;
          letter-spacing: -0.015em;
          margin: 0;
          background: linear-gradient(180deg, #FFFFFF 30%, #D1D1D6 75%, #8E8E93 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .about-review-card {
          position: relative;
          max-width: 880px;
          margin: 0 auto;
          text-align: center;
          padding: 64px 52px 48px 52px;
          background: rgba(14, 14, 22, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow: 0 16px 44px rgba(0, 0, 0, 0.6);
          transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1),
                      border-color 0.45s cubic-bezier(0.16, 1, 0.3, 1),
                      box-shadow 0.45s cubic-bezier(0.16, 1, 0.3, 1);
          overflow: hidden;
        }

        .about-review-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.35) 50%, transparent 100%);
          opacity: 0.6;
          transition: opacity 0.4s ease;
        }

        .about-review-card:hover {
          transform: translateY(-6px);
          border-color: rgba(255, 255, 255, 0.28);
          box-shadow: 
            0 24px 60px rgba(0, 0, 0, 0.75),
            0 0 40px rgba(255, 255, 255, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }

        .about-review-card:hover::before {
          opacity: 1;
        }

        .about-review-watermark {
          position: absolute;
          top: -24px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 130px;
          color: rgba(255, 255, 255, 0.04);
          font-family: var(--about-font-heading, 'Cormorant Garamond', serif);
          line-height: 1;
          user-select: none;
          pointer-events: none;
          animation: quoteWatermarkFloat 6s ease-in-out infinite alternate;
        }

        @keyframes quoteWatermarkFloat {
          0% { transform: translate(-50%, 0); }
          100% { transform: translate(-50%, -8px); }
        }

        .about-review-inner {
          position: relative;
          z-index: 1;
          min-height: 220px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .about-review-inner.is-fading {
          opacity: 0;
          transform: translateY(12px) scale(0.98);
        }

        .about-review-top-meta {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }

        .about-review-stars {
          display: flex;
          gap: 4px;
          color: #FFFFFF;
          font-size: 14px;
          letter-spacing: 2px;
          text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
        }

        .about-review-verified {
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          font-size: 10px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #71717A;
          padding: 3px 8px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 4px;
        }

        .about-review-quote {
          font-family: var(--about-font-heading, 'Cormorant Garamond', serif) !important;
          font-size: clamp(22px, 2.5vw, 29px) !important;
          font-weight: 300 !important;
          color: #FFFFFF !important;
          line-height: 1.55;
          margin: 0 0 32px 0;
          letter-spacing: -0.015em;
          font-style: italic;
          max-width: 760px;
        }

        .about-review-author-group {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .about-review-name {
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif) !important;
          font-size: 15px;
          font-weight: 600;
          color: #FFFFFF;
          margin: 0;
          letter-spacing: 0.04em;
        }

        .about-review-role {
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          font-size: 12.5px;
          color: var(--about-text-secondary, #8E8F94);
          font-weight: 300;
        }

        /* Nav controls */
        .about-review-nav-bar {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 24px;
          margin-top: 42px;
          position: relative;
          z-index: 2;
        }

        .about-nav-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.14);
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.25s ease;
        }

        .about-nav-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.35);
          transform: scale(1.06);
        }

        .about-nav-dots {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .about-dot-pill {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          border: none;
          padding: 0;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .about-dot-pill.active {
          width: 24px;
          border-radius: 10px;
          background: #FFFFFF;
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.7);
        }

        @media (max-width: 768px) {
          .about-testimonials-section {
            padding: 80px 0;
          }

          .about-review-card {
            padding: 44px 24px 36px 24px;
          }

          .about-review-quote {
            font-size: 20px !important;
          }
        }
      `}} />
    </section>
  );
}
