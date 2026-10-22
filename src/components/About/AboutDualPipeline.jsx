import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Film, Cpu, Sparkles } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function AboutDualPipeline() {
  const sectionRef = useRef(null);
  const leftColRef = useRef(null);
  const rightColRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        [leftColRef.current, rightColRef.current],
        { opacity: 0, y: 35 },
        {
          opacity: 1,
          y: 0,
          duration: 0.85,
          stagger: 0.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            toggleActions: 'play none none none'
          }
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  const humanCraft = [
    { title: 'Directorial Storyboarding', desc: 'Narrative tension, visual hooks, and shot-by-shot composition engineered for audience conversion.' },
    { title: 'Frame-Accurate Pacing', desc: 'Micro-timing and editorial rhythm tailored specifically for modern high-retention feeds.' },
    { title: 'Cinematic Sound Architecture', desc: 'Custom Foley, impact risers, environmental ambiances, and balanced commercial audio mixing.' },
    { title: 'Hollywood 4K Color Grading', desc: 'Bespoke cinematic LUTs, balanced skin tones, and rich contrast in DCI-P3 10-bit color spaces.' }
  ];

  const neuralSynthesis = [
    { title: 'Multi-Engine Neural Orchestration', desc: 'Harnessing Runway Gen-3, Midjourney v6, Kling, and Sora for bespoke scene generation.' },
    { title: 'Custom Brand Character LoRAs', desc: 'Proprietary fine-tuning to ensure actors, faces, and brand mascots remain 100% consistent across scenes.' },
    { title: 'Photorealistic Digital Twin Avatars', desc: 'Ultra-realistic talking head avatars with nuanced facial micro-expressions and voice clones.' },
    { title: 'Neural Upscale & Texture Refinement', desc: 'AI frame-interpolation and artifact removal for pristine 4K broadcast delivery.' }
  ];

  return (
    <section 
      ref={sectionRef} 
      className="about-dual-section" 
      id="dual-pipeline"
      aria-label="Human Direction and Generative AI Dual Pipeline"
    >
      <div className="about-container">
        
        {/* CHAPTER TAG */}
        <div className="dual-chapter-tag">
          <span className="dual-tag-num">CHAPTER 02</span>
          <span className="dual-tag-sep">/</span>
          <span className="dual-tag-title">THE DUAL ENGINE ARCHITECTURE</span>
        </div>

        {/* SECTION HEADER */}
        <div className="dual-header-wrap">
          <h2 className="dual-heading">
            HUMAN DIRECTORIAL CRAFT <br />
            <span className="dual-heading-italic">AMPLIFIED BY NEURAL VELOCITY.</span>
          </h2>
          <p className="dual-subtext">
            We don't choose between human artistry and machine intelligence. We engineer the exact intersection where both perform at their peak.
          </p>
        </div>

        {/* ASYMMETRICAL DUAL ENGINE GRID */}
        <div className="dual-engine-grid">
          
          {/* LEFT: HUMAN DIRECTORIAL CRAFT */}
          <div ref={leftColRef} className="engine-card human-craft-card">
            <div className="engine-card-top">
              <div className="engine-icon-box">
                <Film size={22} className="engine-icon" />
              </div>
              <span className="engine-badge">THE EYE & EAR</span>
            </div>

            <h3 className="engine-title">Directorial Craft & Editorial Discipline</h3>
            <p className="engine-lead">
              The creative intentionality that transforms raw computer-generated pixels into compelling, unforgettable brand films.
            </p>

            <div className="engine-capabilities-list">
              {humanCraft.map((item, idx) => (
                <div key={idx} className="engine-cap-item">
                  <div className="cap-indicator">
                    <span className="cap-dot" />
                  </div>
                  <div className="cap-content">
                    <h4 className="cap-title">{item.title}</h4>
                    <p className="cap-desc">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="engine-footer-meta">
              <span>OUTPUT STANDARD: DIRECTORIAL MASTERY</span>
            </div>
          </div>

          {/* RIGHT: FRONTIER NEURAL SYNTHESIS */}
          <div ref={rightColRef} className="engine-card neural-synth-card">
            <div className="engine-card-top">
              <div className="engine-icon-box neural-box">
                <Cpu size={22} className="engine-icon neural-icon" />
              </div>
              <span className="engine-badge neural-badge">THE EXPONENTIAL CAMERA</span>
            </div>

            <h3 className="engine-title">Frontier Generative Synthesis</h3>
            <p className="engine-lead">
              The boundless neural pipeline that unlocks impossible cinematic shots, custom environments, and 48-hour delivery speeds.
            </p>

            <div className="engine-capabilities-list">
              {neuralSynthesis.map((item, idx) => (
                <div key={idx} className="engine-cap-item">
                  <div className="cap-indicator">
                    <span className="cap-dot neural-dot" />
                  </div>
                  <div className="cap-content">
                    <h4 className="cap-title">{item.title}</h4>
                    <p className="cap-desc">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="engine-footer-meta">
              <span>PIPELINE VELOCITY: 10X TRADITIONAL SPEED</span>
            </div>
          </div>

        </div>

        {/* BOTTOM SYNTHESIS CALLOUT */}
        <div className="dual-synthesis-callout">
          <div className="synthesis-badge">
            <Sparkles size={14} />
            <span>THE VERIFIED RESULT</span>
          </div>
          <p className="synthesis-text">
            Studio-quality commercial advertising and digital twin videos delivered in <strong>48 to 72 hours</strong> at a fraction of legacy agency budgets — with <strong>100% frame-accurate revision control</strong>.
          </p>
        </div>

      </div>

      {/* COMPONENT STYLES */}
      <style dangerouslySetInnerHTML={{__html: `
        .about-dual-section {
          position: relative;
          width: 100%;
          background-color: var(--about-bg-primary, #050507);
          color: var(--about-text-primary, #FFFFFF);
          padding: 130px 0 120px 0;
          box-sizing: border-box;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .dual-chapter-tag {
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

        .dual-tag-num { color: #FFFFFF; }
        .dual-tag-sep { color: rgba(255, 255, 255, 0.18); }

        .dual-header-wrap {
          max-width: 920px;
          margin-bottom: 64px;
        }

        .dual-heading {
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif) !important;
          font-size: clamp(34px, 4.6vw, 58px) !important;
          font-weight: 700 !important;
          color: #FFFFFF !important;
          line-height: 1.08;
          letter-spacing: -0.025em;
          text-transform: uppercase;
          margin: 0 0 18px 0;
        }

        .dual-heading-italic {
          font-family: var(--about-font-heading, 'Cormorant Garamond', serif) !important;
          font-style: italic;
          font-weight: 300 !important;
          background: linear-gradient(180deg, #FFFFFF 15%, #D1D1D6 65%, #8E8F94 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .dual-subtext {
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          font-size: clamp(15.5px, 1.25vw, 18px);
          font-weight: 300;
          line-height: 1.75;
          color: var(--about-text-secondary, #8E8F94);
          margin: 0;
        }

        /* Dual Engine Grid */
        .dual-engine-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
          margin-bottom: 48px;
        }

        .engine-card {
          background: #09090D;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 44px 40px;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
        }

        .engine-card:hover {
          border-color: rgba(255, 255, 255, 0.28);
          background: #0E0E14;
          transform: translateY(-3px);
          box-shadow: 0 20px 48px rgba(0, 0, 0, 0.8), 0 0 32px rgba(255, 255, 255, 0.04);
        }

        .engine-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .engine-icon-box {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFFFFF;
        }

        .engine-badge {
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #D1D1D6;
          padding: 4px 12px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 100px;
        }

        .engine-title {
          font-family: var(--about-font-heading, 'Cormorant Garamond', serif) !important;
          font-size: clamp(26px, 2.4vw, 34px) !important;
          font-weight: 400 !important;
          color: #FFFFFF !important;
          line-height: 1.15;
          margin: 0 0 14px 0;
          text-transform: uppercase;
          letter-spacing: -0.015em;
        }

        .engine-lead {
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          font-size: 14.5px;
          font-weight: 300;
          line-height: 1.7;
          color: var(--about-text-secondary, #8E8F94);
          margin: 0 0 32px 0;
          padding-bottom: 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .engine-capabilities-list {
          display: flex;
          flex-direction: column;
          gap: 22px;
          margin-bottom: 36px;
        }

        .engine-cap-item {
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }

        .cap-indicator {
          margin-top: 5px;
        }

        .cap-dot {
          display: block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #FFFFFF;
          box-shadow: 0 0 8px #FFFFFF;
        }

        .cap-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .cap-title {
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          font-size: 13.5px;
          font-weight: 600;
          letter-spacing: 0.02em;
          color: #FFFFFF;
          margin: 0;
        }

        .cap-desc {
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          font-size: 13px;
          font-weight: 300;
          line-height: 1.65;
          color: #8E8F94;
          margin: 0;
        }

        .engine-footer-meta {
          margin-top: auto;
          padding-top: 18px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #71717A;
        }

        /* Bottom Synthesis Callout */
        .dual-synthesis-callout {
          background: #08080C;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          padding: 24px 32px;
          display: flex;
          align-items: center;
          gap: 24px;
          box-sizing: border-box;
        }

        .synthesis-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #FFFFFF;
          background: rgba(255, 255, 255, 0.08);
          padding: 6px 14px;
          border-radius: 100px;
          white-space: nowrap;
          border: 1px solid rgba(255, 255, 255, 0.15);
        }

        .synthesis-text {
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          font-size: 14px;
          font-weight: 300;
          line-height: 1.65;
          color: #D1D1D6;
          margin: 0;
        }

        .synthesis-text strong {
          color: #FFFFFF;
        }

        @media (max-width: 960px) {
          .dual-engine-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .engine-card {
            padding: 32px 28px;
          }

          .dual-synthesis-callout {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
        }
      `}} />
    </section>
  );
}
