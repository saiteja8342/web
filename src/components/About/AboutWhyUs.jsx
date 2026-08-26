import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function AboutWhyUs() {
  const sectionRef = useRef(null);
  const cardViewportRef = useRef(null);
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
    const cards = cardsRef.current.filter(Boolean);

    if (!section || cards.length === 0) return;

    const mm = gsap.matchMedia();

    mm.add('(min-width: 961px) and (prefers-reduced-motion: no-preference)', () => {
      // Set initial positions: Card 1 is visible at center; Cards 2, 3, 4 are waiting below
      gsap.set(cards[0], { y: 0, opacity: 1, scale: 1, zIndex: 4 });
      for (let i = 1; i < cards.length; i++) {
        gsap.set(cards[i], { y: 140, opacity: 0, scale: 0.94, zIndex: 4 - i });
      }

      // Master pinned timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          pin: true,
          start: 'top top',
          end: '+=2400',
          scrub: 0.8,
          invalidateOnRefresh: true,
          anticipatePin: 1
        }
      });

      // --- STEP 1: Card 01 -> Card 02 ---
      // Hold Card 01 briefly
      tl.to({}, { duration: 0.3 });
      
      // Card 01 moves UPWARDS and exits; Card 02 moves UPWARDS from bottom into center
      tl.to(cards[0], { 
        y: -140, 
        opacity: 0, 
        scale: 0.94, 
        duration: 0.8, 
        ease: 'power2.inOut' 
      }, 'step1');
      tl.to(cards[1], { 
        y: 0, 
        opacity: 1, 
        scale: 1, 
        duration: 0.8, 
        ease: 'power2.inOut' 
      }, 'step1');

      // Hold Card 02 briefly
      tl.to({}, { duration: 0.4 });

      // --- STEP 2: Card 02 -> Card 03 ---
      // Card 02 moves UPWARDS and exits; Card 03 moves UPWARDS from bottom into center
      tl.to(cards[1], { 
        y: -140, 
        opacity: 0, 
        scale: 0.94, 
        duration: 0.8, 
        ease: 'power2.inOut' 
      }, 'step2');
      tl.to(cards[2], { 
        y: 0, 
        opacity: 1, 
        scale: 1, 
        duration: 0.8, 
        ease: 'power2.inOut' 
      }, 'step2');

      // Hold Card 03 briefly
      tl.to({}, { duration: 0.4 });

      // --- STEP 3: Card 03 -> Card 04 ---
      // Card 03 moves UPWARDS and exits; Card 04 moves UPWARDS from bottom into center
      tl.to(cards[2], { 
        y: -140, 
        opacity: 0, 
        scale: 0.94, 
        duration: 0.8, 
        ease: 'power2.inOut' 
      }, 'step3');
      tl.to(cards[3], { 
        y: 0, 
        opacity: 1, 
        scale: 1, 
        duration: 0.8, 
        ease: 'power2.inOut' 
      }, 'step3');

      // Hold Card 04 to finish
      tl.to({}, { duration: 0.4 });

      return () => {
        tl.kill();
      };
    });

    mm.add('(max-width: 960px), (prefers-reduced-motion: reduce)', () => {
      cards.forEach(c => {
        gsap.set(c, {
          y: 0,
          opacity: 1,
          scale: 1,
          position: 'relative'
        });
      });
    });

    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 200);

    return () => {
      clearTimeout(timer);
      mm.revert();
    };
  }, []);

  return (
    <section ref={sectionRef} className="why-us-stacked-section" id="why-us">
      <div className="about-container why-us-stacked-container">
        
        {/* LEFT COLUMN: STATIONARY HEADING */}
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

        {/* RIGHT COLUMN: CARD STACK VIEWPORT */}
        <div ref={cardViewportRef} className="why-us-card-viewport">
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

      {/* COMPONENT STYLES */}
      <style dangerouslySetInnerHTML={{__html: `
        .why-us-stacked-section {
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

        .why-us-stacked-container {
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

        /* Right Viewport: Holds cards in the exact same focal center */
        .why-us-card-viewport {
          position: relative;
          height: 320px;
          width: 100%;
          max-width: 580px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Card Items: Overlaid in the center, animating vertically */
        .why-us-card-item {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 20px;
          padding: 38px 42px;
          box-sizing: border-box;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.75);
          background-color: rgba(22, 22, 34, 0.96);
          box-shadow: 
            0 0 45px rgba(255, 255, 255, 0.25),
            0 20px 48px rgba(0, 0, 0, 0.8),
            inset 0 1px 2px rgba(255, 255, 255, 0.5);
          display: flex;
          flex-direction: column;
          justify-content: center;
          will-change: transform, opacity;
        }

        .why-us-card-top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        /* Standout Numbers */
        .why-us-highlight-num {
          font-family: var(--about-font-heading, 'Cormorant Garamond', serif);
          font-size: 58px;
          font-weight: 400;
          line-height: 1;
          color: #FFFFFF;
          letter-spacing: -0.02em;
          text-shadow: 0 0 20px rgba(255, 255, 255, 0.8);
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
          .why-us-stacked-section {
            min-height: auto;
            height: auto;
            padding: 70px 0;
          }

          .why-us-stacked-container {
            grid-template-columns: 1fr;
            gap: 40px;
            padding: 0 20px;
          }

          .why-us-card-viewport {
            height: auto;
            display: flex;
            flex-direction: column;
            gap: 20px;
          }

          .why-us-card-item {
            position: relative;
            top: auto;
            left: auto;
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
