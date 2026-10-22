import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowUpRight, Film } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function AboutFinaleCTA() {
  const sectionRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      if (contentRef.current) {
        gsap.fromTo(
          contentRef.current.children,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.15,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 80%',
              toggleActions: 'play none none none'
            }
          }
        );
      }
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section 
      ref={sectionRef} 
      className="about-finale-section" 
      id="commission"
      aria-label="Commission a Project"
    >
      <div className="finale-ambient-glow" aria-hidden="true" />

      <div className="about-container finale-container" ref={contentRef}>
        
        <div className="finale-badge-wrap">
          <span className="chrome-badge finale-pill">
            <Film size={12} style={{ marginRight: 6 }} />
            <span>COMMISSION A PROJECT // 2024–2025 ROSTER</span>
          </span>
        </div>

        <h2 className="finale-title">
          READY TO COMMAND <br />
          <span className="finale-title-italic">THE ATTENTION OF YOUR AUDIENCE?</span>
        </h2>

        <p className="finale-desc">
          Tell us your campaign objective. We'll architect the treatment, direct the synthesis, and deliver studio-grade 4K masters with unprecedented velocity.
        </p>

        <div className="finale-actions">
          <a 
            href="/#contact" 
            className="finale-btn-primary"
            data-hover-type="link"
          >
            <span>COMMISSION A PROJECT</span>
            <ArrowUpRight size={16} />
          </a>

          <a 
            href="/work" 
            className="finale-btn-secondary"
            data-hover-type="link"
          >
            <span>VIEW OUR WORK</span>
          </a>
        </div>

        <div className="finale-footer-guarantee">
          <span className="guarantee-dot" />
          <span>DIRECTOR-LED PRODUCTION · 48H SPRINT DELIVERY · 100% QUALITY GUARANTEE</span>
        </div>

      </div>

      {/* COMPONENT STYLES */}
      <style dangerouslySetInnerHTML={{__html: `
        .about-finale-section {
          position: relative;
          width: 100%;
          background-color: var(--about-bg-primary, #050507);
          color: var(--about-text-primary, #FFFFFF);
          padding: 160px 0 140px 0;
          box-sizing: border-box;
          overflow: hidden;
          text-align: center;
        }

        .finale-ambient-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 800px;
          height: 480px;
          background: radial-gradient(ellipse at center, rgba(255, 255, 255, 0.05) 0%, transparent 70%);
          filter: blur(90px);
          pointer-events: none;
          z-index: 0;
        }

        .finale-container {
          position: relative;
          z-index: 1;
          max-width: 900px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .finale-badge-wrap {
          margin-bottom: 28px;
        }

        .finale-pill {
          padding: 6px 18px;
          font-size: 10.5px;
          letter-spacing: 0.16em;
        }

        .finale-title {
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif) !important;
          font-size: clamp(36px, 5.2vw, 68px) !important;
          font-weight: 700 !important;
          color: #FFFFFF !important;
          line-height: 1.05;
          letter-spacing: -0.025em;
          text-transform: uppercase;
          margin: 0 0 24px 0;
        }

        .finale-title-italic {
          font-family: var(--about-font-heading, 'Cormorant Garamond', serif) !important;
          font-weight: 300 !important;
          font-style: italic;
          background: linear-gradient(180deg, #FFFFFF 15%, #D1D1D6 65%, #8E8F94 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .finale-desc {
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          font-size: clamp(15.5px, 1.3vw, 18.5px);
          font-weight: 300;
          line-height: 1.75;
          color: var(--about-text-secondary, #8E8F94);
          max-width: 680px;
          margin: 0 0 44px 0;
        }

        .finale-actions {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          justify-content: center;
          margin-bottom: 40px;
        }

        .finale-btn-primary {
          height: 52px;
          padding: 0 34px;
          border-radius: 100px;
          background: #FFFFFF;
          color: #050507 !important;
          border: 1px solid #FFFFFF;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 4px 20px rgba(255, 255, 255, 0.15);
        }

        .finale-btn-primary:hover {
          background: #E0E0E6;
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(255, 255, 255, 0.28);
        }

        .finale-btn-secondary {
          height: 52px;
          padding: 0 34px;
          border-radius: 100px;
          background: rgba(255, 255, 255, 0.03);
          color: #FFFFFF !important;
          border: 1px solid rgba(255, 255, 255, 0.15);
          display: inline-flex;
          align-items: center;
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          text-decoration: none;
          cursor: pointer;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .finale-btn-secondary:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.35);
          transform: translateY(-2px);
        }

        .finale-footer-guarantee {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          font-size: 10.5px;
          font-weight: 600;
          letter-spacing: 0.16em;
          color: #71717A;
          text-transform: uppercase;
        }

        .guarantee-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #FFFFFF;
          box-shadow: 0 0 6px #FFFFFF;
        }

        @media (max-width: 600px) {
          .about-finale-section {
            padding: 100px 0 90px 0;
          }

          .finale-title {
            font-size: 36px !important;
          }

          .finale-actions {
            flex-direction: column;
            width: 100%;
          }

          .finale-btn-primary, .finale-btn-secondary {
            width: 100%;
            justify-content: center;
          }
        }
      `}} />
    </section>
  );
}
