import React, { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function AboutWhyUs() {
  const sectionRef = useRef(null);
  const leftColRef = useRef(null);
  const rightColRef = useRef(null);
  const progressBarRef = useRef(null);
  const [activeChapter, setActiveChapter] = useState(1);

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
    const rightCol = rightColRef.current;
    const progressBar = progressBarRef.current;
    if (!section || !rightCol) return;

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray('.why-us-card-item');

      // Scroll progress tracking across the 4 cards
      ScrollTrigger.create({
        trigger: rightCol,
        start: 'top center',
        end: 'bottom center',
        onUpdate: (self) => {
          if (progressBar) {
            const progressPct = Math.min(100, Math.max(0, self.progress * 100));
            progressBar.style.height = `${progressPct}%`;
          }
        }
      });

      // Animate the four cards on the right: rise smoothly as user scrolls down
      cards.forEach((card, index) => {
        gsap.fromTo(
          card,
          { opacity: 0.35, y: 60 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 90%',
              end: 'top 65%',
              scrub: 0.5,
            }
          }
        );

        // Highlight card when nearest viewport center
        ScrollTrigger.create({
          trigger: card,
          start: 'top 60%',
          end: 'bottom 40%',
          onEnter: () => {
            setActiveChapter(index + 1);
            cards.forEach(c => c.classList.remove('is-active'));
            card.classList.add('is-active', 'has-shimmered');
          },
          onEnterBack: () => {
            setActiveChapter(index + 1);
            cards.forEach(c => c.classList.remove('is-active'));
            card.classList.add('is-active');
          },
          onLeave: () => {
            card.classList.remove('is-active');
          },
          onLeaveBack: () => {
            card.classList.remove('is-active');
            if (index > 0) {
              cards[index - 1]?.classList.add('is-active');
              setActiveChapter(index);
            }
          }
        });
      });

      // Initial state: Card 01 active by default
      if (cards[0]) {
        cards[0].classList.add('is-active');
      }

      // Recalculate ScrollTrigger positions
      ScrollTrigger.refresh();

    }, section);

    return () => {
      ctx.revert();
    };
  }, []);

  // Cursor Spotlight & 3D Number Parallax Tilt
  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);

    // Gentle 3D parallax on number (max 5deg)
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const tiltX = ((y - centerY) / centerY) * -5;
    const tiltY = ((x - centerX) / centerX) * 5;

    const numEl = card.querySelector('.why-us-card-num');
    if (numEl) {
      numEl.style.transform = `perspective(600px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) translateZ(8px)`;
    }
  };

  const handleMouseLeave = (e) => {
    const card = e.currentTarget;
    card.style.removeProperty('--mouse-x');
    card.style.removeProperty('--mouse-y');

    const numEl = card.querySelector('.why-us-card-num');
    if (numEl) {
      numEl.style.transform = '';
    }
  };

  return (
    <section className="why-us-section" id="why-us" ref={sectionRef} aria-label="Why Work With MotionNodeEdits">
      <div className="about-container why-us-container">
        
        {/* LEFT COLUMN: Completely fixed/stationary via sticky layout while right cards scroll */}
        <div className="why-us-left-col" ref={leftColRef}>
          <div className="chrome-badge" style={{ marginBottom: '20px' }}>
            <span style={{ fontSize: '8px' }}>●</span> WHY WORK WITH US
          </div>

          <h2 className="why-us-main-heading">
            WHY<br />
            MOTIONNODEEDITS?
          </h2>

          <p className="why-us-left-sub">
            Built on creative direction, uncompromised quality standards, and modern generative AI technology.
          </p>

          {/* Vertical Progress Beam & Active Chapter Indicator */}
          <div className="why-us-progress-widget" aria-hidden="true">
            <div className="why-us-progress-track">
              <div 
                className="why-us-progress-fill" 
                ref={progressBarRef}
                style={{ height: '25%' }}
              />
            </div>

            <div className="why-us-progress-meta">
              <span className="why-us-chapter-display">
                <span className="why-us-chapter-current">0{activeChapter}</span>
                <span className="why-us-chapter-sep">/</span>
                <span className="why-us-chapter-total">04</span>
              </span>
              <span className="why-us-chapter-label">
                {reasons[activeChapter - 1]?.title || 'CREATIVITY'}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Stacked Cards in Normal Flow moving upward on scroll */}
        <div className="why-us-right-col" ref={rightColRef}>
          {reasons.map((reason, idx) => (
            <div 
              key={idx} 
              className={`why-us-card-item card-${idx}`}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              {/* Dynamic Cursor Spotlight Layer */}
              <div className="why-us-card-spotlight" />

              {/* One-time Chrome Light Sweep */}
              <div className="why-us-shimmer-sweep" />

              {/* Top Specular Edge Glow */}
              <div className="why-us-top-edge" />

              <div className="why-us-card-num">
                {reason.num}
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
        .why-us-section {
          background-color: var(--about-bg-primary, #050507);
          color: var(--about-text-primary, #FFFFFF);
          position: relative;
          width: 100%;
          border-top: 1px solid var(--about-border, rgba(255, 255, 255, 0.07));
          padding: 0;
          box-sizing: border-box;
        }

        .why-us-container {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 72px;
          width: 100%;
          position: relative;
          box-sizing: border-box;
        }

        /* Left Column: Completely stationary via position: sticky with top: 0 */
        .why-us-left-col {
          width: 440px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: flex-start;
          box-sizing: border-box;
          position: sticky;
          top: 0;
          height: 100vh;
          align-self: flex-start;
          z-index: 2;
          padding: 80px 0 40px 0;
        }

        .why-us-main-heading {
          font-family: var(--about-font-heading, 'Cormorant Garamond', serif) !important;
          font-size: clamp(38px, 4.4vw, 56px) !important;
          font-weight: 300;
          line-height: 1.08;
          color: #FFFFFF;
          text-transform: uppercase;
          letter-spacing: -0.02em;
          margin: 0 0 16px 0;
        }

        .why-us-left-sub {
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          font-size: 15px;
          line-height: 1.75;
          color: var(--about-text-secondary, #8E8F94);
          font-weight: 300;
          margin: 0 0 36px 0;
          max-width: 380px;
        }

        /* Vertical Progress Widget */
        .why-us-progress-widget {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-top: 12px;
          padding: 16px 20px;
          background: rgba(14, 14, 20, 0.45);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 12px;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }

        .why-us-progress-track {
          width: 2px;
          height: 52px;
          background: rgba(255, 255, 255, 0.12);
          position: relative;
          border-radius: 2px;
          overflow: hidden;
        }

        .why-us-progress-fill {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          background: linear-gradient(180deg, #FFFFFF 0%, #D1D1D6 60%, rgba(255, 255, 255, 0.4) 100%);
          border-radius: 2px;
          box-shadow: 0 0 8px rgba(255, 255, 255, 0.6);
          transition: height 0.15s ease-out;
        }

        .why-us-progress-meta {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .why-us-chapter-display {
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          font-size: 16px;
          font-weight: 600;
          letter-spacing: 0.05em;
          color: #FFFFFF;
          display: flex;
          align-items: baseline;
          gap: 4px;
        }

        .why-us-chapter-current {
          color: #FFFFFF;
          font-weight: 700;
        }

        .why-us-chapter-sep {
          color: rgba(255, 255, 255, 0.35);
          font-size: 13px;
        }

        .why-us-chapter-total {
          color: rgba(255, 255, 255, 0.5);
          font-size: 13px;
        }

        .why-us-chapter-label {
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: rgba(255, 255, 255, 0.55);
          font-weight: 500;
        }

        /* Right Column (Cards in normal flow with ample scroll distance) */
        .why-us-right-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 50px;
          width: 100%;
          min-width: 0;
          position: relative;
          z-index: 1;
          padding: 18vh 0 32vh 0;
        }

        /* Individual Obsidian Cards */
        .why-us-card-item {
          background: rgba(14, 14, 22, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.09);
          border-radius: 20px;
          padding: 42px 44px;
          position: relative;
          box-sizing: border-box;
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          transition: border-color 0.45s cubic-bezier(0.16, 1, 0.3, 1),
                      box-shadow 0.45s cubic-bezier(0.16, 1, 0.3, 1),
                      background 0.45s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 10px 32px rgba(0, 0, 0, 0.45);
          overflow: hidden;
          will-change: transform, opacity;
        }

        /* Top Edge Highlight */
        .why-us-top-edge {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.25) 50%, transparent 100%);
          opacity: 0.4;
          transition: opacity 0.4s ease;
          pointer-events: none;
        }

        /* Active Card Focus (Brightened near viewport center) */
        .why-us-card-item.is-active {
          opacity: 1;
          background: rgba(18, 18, 28, 0.85);
          border-color: rgba(255, 255, 255, 0.32);
          box-shadow: 
            0 24px 54px rgba(0, 0, 0, 0.7),
            0 0 35px rgba(255, 255, 255, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.28);
        }

        .why-us-card-item.is-active .why-us-top-edge {
          opacity: 0.9;
        }

        /* Card Hover */
        .why-us-card-item:hover {
          opacity: 1;
          border-color: rgba(255, 255, 255, 0.42);
          background: rgba(20, 20, 32, 0.92);
          transform: translateY(-6px) scale(1.01);
          box-shadow: 
            0 28px 64px rgba(0, 0, 0, 0.75),
            0 0 40px rgba(255, 255, 255, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.35);
        }

        /* Cursor Spotlight Layer */
        .why-us-card-spotlight {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.3s ease;
          background: radial-gradient(
            450px circle at var(--mouse-x, -300px) var(--mouse-y, -300px),
            rgba(255, 255, 255, 0.08) 0%,
            rgba(255, 255, 255, 0.02) 40%,
            transparent 70%
          );
          z-index: 1;
        }

        .why-us-card-item:hover .why-us-card-spotlight {
          opacity: 1;
        }

        /* Chrome Shimmer Sweep across top border */
        .why-us-shimmer-sweep {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 1.5px;
          background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.9) 50%, transparent 100%);
          pointer-events: none;
          opacity: 0;
          z-index: 3;
        }

        .why-us-card-item.has-shimmered .why-us-shimmer-sweep {
          animation: cardTopShimmer 1.1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes cardTopShimmer {
          0% {
            transform: translateX(-100%);
            opacity: 0;
          }
          30% {
            opacity: 1;
          }
          70% {
            opacity: 1;
          }
          100% {
            transform: translateX(100%);
            opacity: 0;
          }
        }

        /* Card Number with 3D Parallax Tilt */
        .why-us-card-num {
          font-family: var(--about-font-heading, 'Cormorant Garamond', serif);
          font-size: 64px;
          font-weight: 300;
          line-height: 1;
          color: #FFFFFF;
          margin-bottom: 6px;
          letter-spacing: -0.02em;
          text-shadow: 0 0 16px rgba(255, 255, 255, 0.3);
          transition: color 0.4s ease, text-shadow 0.4s ease, transform 0.15s ease-out;
          display: inline-block;
          transform-style: preserve-3d;
          will-change: transform;
          position: relative;
          z-index: 2;
        }

        .why-us-card-item.is-active .why-us-card-num {
          text-shadow: 0 0 24px rgba(255, 255, 255, 0.55);
        }

        .why-us-card-title {
          font-family: var(--about-font-heading, 'Cormorant Garamond', serif) !important;
          font-size: 26px;
          font-weight: 400;
          color: #FFFFFF;
          margin: 0 0 12px 0;
          text-transform: uppercase;
          letter-spacing: 0.02em;
          position: relative;
          z-index: 2;
        }

        .why-us-card-desc {
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          font-size: 15px;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.75;
          margin: 0;
          font-weight: 300;
          position: relative;
          z-index: 2;
        }

        /* Mobile Responsive */
        @media (max-width: 960px) {
          .why-us-section {
            padding: 80px 0;
          }

          .why-us-container {
            flex-direction: column;
            gap: 48px;
          }

          .why-us-left-col {
            width: 100%;
            position: static;
            top: auto;
            height: auto;
            padding: 0;
          }

          .why-us-right-col {
            padding: 0;
            gap: 28px;
          }

          .why-us-left-sub {
            max-width: 100%;
            margin-bottom: 24px;
          }

          .why-us-card-item {
            opacity: 1 !important;
            padding: 30px 24px;
          }

          .why-us-progress-widget {
            margin-top: 0;
            width: 100%;
            box-sizing: border-box;
          }
        }

        /* Reduced Motion Accessibility */
        @media (prefers-reduced-motion: reduce) {
          .why-us-card-item,
          .why-us-progress-fill,
          .why-us-card-num {
            transition: none !important;
            animation: none !important;
            transform: none !important;
          }
          .why-us-card-item {
            opacity: 1 !important;
          }
        }
      `}} />
    </section>
  );
}
