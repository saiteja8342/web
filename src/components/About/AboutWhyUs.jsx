import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function AboutWhyUs() {
  const sectionRef = useRef(null);
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const cardsRef = useRef([]);

  const reasons = [
    { 
      num: '01', 
      title: 'CREATIVITY', 
      text: 'Ideas come first. Every video starts with a clear concept and creative direction before any AI tool is used.' 
    },
    { 
      num: '02', 
      title: 'QUALITY', 
      text: 'Every frame matters. We review, refine, and edit until the final video meets our quality standard.' 
    },
    { 
      num: '03', 
      title: 'SPEED', 
      text: 'Move faster without losing the creative vision. AI lets us compress timelines without compressing quality.' 
    },
    { 
      num: '04', 
      title: 'TECHNOLOGY', 
      text: 'We continuously explore what is next in AI video — using the latest models, tools, and techniques for every project.' 
    },
  ];

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    const viewport = viewportRef.current;
    const cards = cardsRef.current.filter(Boolean);

    if (!section || !track || !viewport || cards.length === 0) return;

    const mm = gsap.matchMedia();

    mm.add('(min-width: 961px) and (prefers-reduced-motion: no-preference)', () => {
      // Step distance between each card center (card height + gap)
      const cardHeight = 260;
      const cardGap = 32;
      const stepDistance = cardHeight + cardGap;
      const totalDistance = stepDistance * (cards.length - 1);

      const activeState = {
        opacity: 1,
        scale: 1.02,
        borderColor: 'rgba(255, 255, 255, 0.85)',
        backgroundColor: 'rgba(24, 24, 36, 0.95)',
        boxShadow: '0 0 45px rgba(255, 255, 255, 0.28), 0 20px 48px rgba(0, 0, 0, 0.8), inset 0 1px 2px rgba(255, 255, 255, 0.5)'
      };

      const inactiveState = {
        opacity: 0.28,
        scale: 0.96,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        backgroundColor: 'rgba(12, 12, 18, 0.6)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.05)'
      };

      // Set initial styles
      gsap.set(cards[0], activeState);
      for (let i = 1; i < cards.length; i++) {
        gsap.set(cards[i], inactiveState);
      }

      // Master ScrollTrigger timeline pinned to viewport
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          pin: true,
          start: 'top top',
          end: () => `+=${Math.max(window.innerHeight * 2.5, 2400)}`,
          scrub: 0.7,
          invalidateOnRefresh: true,
          anticipatePin: 1
        }
      });

      // Move track vertically upward
      tl.to(track, {
        y: -totalDistance,
        ease: 'none',
        duration: 3.0
      }, 0);

      // Card 0 -> Card 1
      tl.to(cards[0], { ...inactiveState, duration: 0.35, ease: 'power2.inOut' }, 0.45);
      tl.to(cards[1], { ...activeState, duration: 0.35, ease: 'power2.inOut' }, 0.65);

      // Card 1 -> Card 2
      tl.to(cards[1], { ...inactiveState, duration: 0.35, ease: 'power2.inOut' }, 1.35);
      tl.to(cards[2], { ...activeState, duration: 0.35, ease: 'power2.inOut' }, 1.55);

      // Card 2 -> Card 3
      tl.to(cards[2], { ...inactiveState, duration: 0.35, ease: 'power2.inOut' }, 2.25);
      tl.to(cards[3], { ...activeState, duration: 0.35, ease: 'power2.inOut' }, 2.45);

      return () => {
        tl.kill();
      };
    });

    mm.add('(max-width: 960px), (prefers-reduced-motion: reduce)', () => {
      cards.forEach(c => {
        gsap.set(c, {
          opacity: 1,
          scale: 1,
          borderColor: 'rgba(255, 255, 255, 0.2)',
          backgroundColor: 'rgba(16, 16, 24, 0.85)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)'
        });
      });
      gsap.set(track, { y: 0 });
    });

    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 250);

    return () => {
      clearTimeout(timer);
      mm.revert();
    };
  }, []);

  return (
    <section ref={sectionRef} className="why-us-pinned-viewport-section" id="why-us">
      <div className="about-container why-us-pinned-container">
        
        {/* LEFT COLUMN: STATIONARY HEADING (LOCKED AT SAME POSITION) */}
        <div className="why-us-fixed-left-col">
          <div className="chrome-badge" style={{ marginBottom: '20px' }}>
            WHY WORK WITH US
          </div>
          <h2 className="why-us-main-heading">
            Why<br />
            MotionNodeEdits?
          </h2>
          <p className="why-us-left-sub">
            Built on creative direction, uncompromised quality standards, and modern generative AI technology.
          </p>
        </div>

        {/* RIGHT COLUMN: VIEWPORT (CARDS MOVE VERTICALLY INSIDE) */}
        <div ref={viewportRef} className="why-us-pinned-viewport">
          <div ref={trackRef} className="why-us-card-track">
            {reasons.map((reason, idx) => (
              <div 
                key={idx} 
                ref={(el) => (cardsRef.current[idx] = el)}
                className="why-us-card-item"
              >
                <div className="why-us-card-top-row">
                  <span className="why-us-highlight-num">
                    {reason.num}
                  </span>
                </div>

                <h3 className="why-us-card-title">
                  {reason.title}
                </h3>
                
                <p className="why-us-card-desc">
                  {reason.text}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* COMPONENT STYLES */}
      <style dangerouslySetInnerHTML={{__html: `
        .why-us-pinned-viewport-section {
          background-color: var(--about-bg-primary, #050507);
          color: var(--about-text-primary, #FFFFFF);
          position: relative;
          width: 100%;
          min-height: 100vh;
          height: 100vh;
          display: flex;
          align-items: center;
          border-top: 1px solid var(--about-border, rgba(255, 255, 255, 0.07));
          overflow: hidden;
          box-sizing: border-box;
          z-index: 10;
        }

        .why-us-pinned-container {
          display: grid;
          grid-template-columns: 1fr 1.35fr;
          gap: 64px;
          align-items: center;
          width: 100%;
          padding: 0 40px;
          box-sizing: border-box;
          position: relative;
        }

        /* Left Stationary Column */
        .why-us-fixed-left-col {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: center;
          z-index: 2;
          max-width: 440px;
        }

        /* Compact Refined Title */
        .why-us-main-heading {
          font-family: var(--about-font-heading, 'Cormorant Garamond', serif) !important;
          font-size: clamp(32px, 3.8vw, 48px) !important;
          font-weight: 300;
          line-height: 1.08;
          color: #FFFFFF;
          text-transform: uppercase;
          letter-spacing: -0.02em;
          margin: 0 0 16px 0;
        }

        .why-us-left-sub {
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          font-size: 14.5px;
          line-height: 1.7;
          color: var(--about-text-secondary, #8E8F94);
          font-weight: 300;
          margin: 0;
        }

        /* Right Viewport (Only the focused card is visible at center) */
        .why-us-pinned-viewport {
          position: relative;
          height: 380px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          padding: 10px 14px;
          box-sizing: border-box;
          mask-image: linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%);
          -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%);
        }

        /* Right Track (Translates vertically upward) */
        .why-us-card-track {
          display: flex;
          flex-direction: column;
          gap: 32px;
          will-change: transform;
          padding-top: 60px;
          padding-bottom: 60px;
        }

        /* Luminous Glowing Card Items */
        .why-us-card-item {
          border-radius: 20px;
          padding: 34px 38px;
          position: relative;
          box-sizing: border-box;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          background-color: rgba(12, 12, 18, 0.65);
          height: 260px;
          min-height: 260px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          transform-origin: center center;
          will-change: transform, opacity, border-color, box-shadow;
        }

        .why-us-card-top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        /* Highlighted Standout Numbers */
        .why-us-highlight-num {
          font-family: var(--about-font-heading, 'Cormorant Garamond', serif);
          font-size: 58px;
          font-weight: 400;
          line-height: 1;
          color: #FFFFFF;
          letter-spacing: -0.02em;
          text-shadow: 0 0 16px rgba(255, 255, 255, 0.6);
        }

        .why-us-card-title {
          font-family: var(--about-font-heading, 'Cormorant Garamond', serif) !important;
          font-size: 26px;
          font-weight: 300;
          color: #FFFFFF;
          margin: 0 0 10px 0;
          text-transform: uppercase;
          letter-spacing: -0.01em;
        }

        .why-us-card-desc {
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          font-size: 14.5px;
          color: #E2E8F0;
          line-height: 1.7;
          margin: 0;
          font-weight: 300;
        }

        /* Mobile Responsive */
        @media (max-width: 960px) {
          .why-us-pinned-viewport-section {
            min-height: auto;
            height: auto;
            padding: 70px 0;
          }

          .why-us-pinned-container {
            grid-template-columns: 1fr;
            gap: 40px;
            padding: 0 20px;
          }

          .why-us-pinned-viewport {
            height: auto;
            overflow: visible;
            padding: 0;
            mask-image: none;
            -webkit-mask-image: none;
          }

          .why-us-card-track {
            gap: 20px;
            transform: none !important;
            padding: 0;
          }

          .why-us-card-item {
            height: auto;
            min-height: auto;
            opacity: 1 !important;
            transform: none !important;
            padding: 28px 24px;
          }

          .why-us-main-heading {
            font-size: 32px !important;
          }

          .why-us-highlight-num {
            font-size: 44px;
          }
        }
      `}} />
    </section>
  );
}
