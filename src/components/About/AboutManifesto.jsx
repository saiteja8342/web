import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowUpRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function AboutManifesto() {
  const sectionRef = useRef(null);
  const quoteRef = useRef(null);
  const bodyRef = useRef(null);
  const metricsRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      // Pull-quote reveal with power3.out
      if (quoteRef.current) {
        gsap.fromTo(
          quoteRef.current,
          { opacity: 0, y: 32 },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: quoteRef.current,
              start: 'top 82%',
              toggleActions: 'play none none none'
            }
          }
        );
      }

      // Narrative text reveal
      if (bodyRef.current) {
        gsap.fromTo(
          bodyRef.current.children,
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.15,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: bodyRef.current,
              start: 'top 85%',
              toggleActions: 'play none none none'
            }
          }
        );
      }

      // Metrics reveal
      if (metricsRef.current) {
        gsap.fromTo(
          metricsRef.current.querySelectorAll('.manifesto-stat-block'),
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            stagger: 0.1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: metricsRef.current,
              start: 'top 88%',
              toggleActions: 'play none none none'
            }
          }
        );
      }
    }, section);

    return () => ctx.revert();
  }, []);

  const stats = [
    { value: '100+', label: 'COMPLETED PRODUCTIONS', note: 'AI Commercials & Brand Films' },
    { value: '48H', label: 'AVERAGE SPRINT VELOCITY', note: 'Short-Form Reels & Digital Avatars' },
    { value: '99.4%', label: 'CLIENT RETENTION RATE', note: 'Ongoing Retainers & Repeat Orders' },
    { value: 'GLOBAL', label: 'COMMISSION FOOTPRINT', note: 'Brands in US, EU & Asia-Pacific' }
  ];

  return (
    <section 
      ref={sectionRef} 
      className="about-manifesto-section" 
      id="studio-manifesto"
      aria-label="Studio Manifesto and Philosophy"
    >
      {/* Anchor for backward compatibility with `#who-we-are` */}
      <span id="who-we-are" style={{ position: 'absolute', top: '-80px', left: 0, height: 0, width: 0, visibility: 'hidden' }} aria-hidden="true" />

      <div className="about-container">
        
        {/* CHAPTER LABEL */}
        <div className="manifesto-chapter-tag">
          <span className="manifesto-tag-num">CHAPTER 01</span>
          <span className="manifesto-tag-sep">/</span>
          <span className="manifesto-tag-title">THE STUDIO MANIFESTO</span>
        </div>

        {/* BOLD EDITORIAL STATEMENT */}
        <div ref={quoteRef} className="manifesto-pullquote-wrap">
          <blockquote className="manifesto-pullquote">
            “Most AI video fails because it lacks a director. Most traditional production houses fail because they move too slowly. We operate in the deliberate space between both.”
          </blockquote>
        </div>

        {/* TWO-COLUMN EDITORIAL ESSAY */}
        <div ref={bodyRef} className="manifesto-essay-grid">
          
          <div className="manifesto-col">
            <h3 className="manifesto-subheading">
              DIRECTORIAL DISCIPLINE IN THE AGE OF ALGORITHMS
            </h3>
            <p className="manifesto-p">
              Prompt engineering is not creative direction. When every brand has access to identical generative models, raw technological access provides zero competitive moat. What sets exceptional films apart is human directorial taste: narrative architecture, character motivation, lighting composition, tension, and emotional pacing.
            </p>
            <p className="manifesto-p">
              At MotionNodeEdits, we treat generative engines as the most versatile virtual cameras ever engineered. Every scene is storyboarded, lit, and paced by master editors before neural synthesis begins.
            </p>
          </div>

          <div className="manifesto-col">
            <h3 className="manifesto-subheading">
              THE 10X PRODUCTION PARADIGM
            </h3>
            <p className="manifesto-p">
              Traditional commercial production is burdened by months of logistical inertia, permits, crew bloat, and rigid physical sets. By replacing physical constraints with neural environments and digital twins, we compress months of timeline into 48 to 72 hours without losing a single drop of cinematic polish.
            </p>
            <p className="manifesto-p">
              From script ideation to final 4K master export, your brand receives studio-grade commercial assets with transparent timestamped revision control and zero friction.
            </p>
          </div>

        </div>

        {/* VERIFIED PERFORMANCE METRICS STRIP */}
        <div ref={metricsRef} className="manifesto-stats-grid">
          {stats.map((stat, idx) => (
            <div key={idx} className="manifesto-stat-block">
              <span className="stat-value">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
              <span className="stat-note">{stat.note}</span>
            </div>
          ))}
        </div>

      </div>

      {/* COMPONENT STYLES */}
      <style dangerouslySetInnerHTML={{__html: `
        .about-manifesto-section {
          position: relative;
          width: 100%;
          background-color: var(--about-bg-primary, #050507);
          color: var(--about-text-primary, #FFFFFF);
          padding: 120px 0 110px 0;
          box-sizing: border-box;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .manifesto-chapter-tag {
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #8E8F94;
          margin-bottom: 32px;
        }

        .manifesto-tag-num {
          color: #FFFFFF;
        }

        .manifesto-tag-sep {
          color: rgba(255, 255, 255, 0.18);
        }

        .manifesto-pullquote-wrap {
          max-width: 1100px;
          margin-bottom: 72px;
        }

        .manifesto-pullquote {
          margin: 0;
          font-family: var(--about-font-heading, 'Cormorant Garamond', serif);
          font-size: clamp(32px, 4.4vw, 56px);
          font-weight: 300;
          font-style: italic;
          line-height: 1.15;
          letter-spacing: -0.02em;
          color: #FFFFFF;
          border-left: 2px solid rgba(255, 255, 255, 0.25);
          padding-left: 36px;
        }

        .manifesto-essay-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 64px;
          margin-bottom: 72px;
        }

        .manifesto-col {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .manifesto-subheading {
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif) !important;
          font-size: 13px !important;
          font-weight: 700 !important;
          letter-spacing: 0.14em;
          color: #FFFFFF !important;
          text-transform: uppercase;
          margin: 0 0 4px 0;
        }

        .manifesto-p {
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          font-size: 15.5px;
          font-weight: 300;
          line-height: 1.85;
          color: var(--about-text-secondary, #8E8F94);
          margin: 0;
        }

        /* Stats Grid */
        .manifesto-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
          padding-top: 48px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .manifesto-stat-block {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .stat-value {
          font-family: var(--about-font-heading, 'Cormorant Garamond', serif);
          font-size: clamp(38px, 4.2vw, 56px);
          font-weight: 300;
          color: #FFFFFF;
          line-height: 1;
          letter-spacing: -0.02em;
        }

        .stat-label {
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          color: #D1D1D6;
          text-transform: uppercase;
        }

        .stat-note {
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          font-size: 12.5px;
          font-weight: 300;
          color: #71717A;
          line-height: 1.5;
        }

        @media (max-width: 900px) {
          .manifesto-essay-grid {
            grid-template-columns: 1fr;
            gap: 36px;
          }

          .manifesto-pullquote {
            padding-left: 20px;
          }

          .manifesto-stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 28px;
          }
        }

        @media (max-width: 520px) {
          .manifesto-stats-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
        }
      `}} />
    </section>
  );
}
