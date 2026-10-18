import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function AboutLeadership() {
  const sectionRef = useRef(null);
  const portraitRef = useRef(null);
  const narrativeRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        portraitRef.current,
        { opacity: 0, x: -30 },
        {
          opacity: 1,
          x: 0,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            toggleActions: 'play none none none'
          }
        }
      );

      gsap.fromTo(
        narrativeRef.current,
        { opacity: 0, x: 30 },
        {
          opacity: 1,
          x: 0,
          duration: 0.9,
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

  return (
    <section 
      ref={sectionRef} 
      className="about-leadership-section" 
      id="leadership"
      aria-label="Directorial Leadership and Founder"
    >
      <div className="about-container">
        
        {/* CHAPTER TAG */}
        <div className="leadership-chapter-tag">
          <span className="lead-tag-num">CHAPTER 03</span>
          <span className="lead-tag-sep">/</span>
          <span className="lead-tag-title">DIRECTORIAL LEADERSHIP</span>
        </div>

        <div className="about-leadership-grid">
          
          {/* LEFT: STUDIO MONOGRAM & CREDENTIALS CARD */}
          <div ref={portraitRef} className="leadership-card-col">
            <div className="leadership-portrait-card">
              
              <div className="leadership-emblem-wrap">
                <div className="leadership-halo-ring" />
                <img 
                  src="/image/mne_logo.png" 
                  alt="Vutukuri Sai Teja — Founder and Creative Director at MotionNodeEdits" 
                  className="leadership-emblem-img"
                  width="72"
                  height="72"
                  loading="lazy"
                />
              </div>

              <div className="leadership-card-meta">
                <span className="founder-tag-dot" />
                <span className="founder-tag-text">FOUNDER & CREATIVE DIRECTOR</span>
              </div>

              <h3 className="founder-card-name">
                VUTUKURI SAI TEJA
              </h3>

              <div className="founder-card-specs">
                <div className="spec-item">
                  <span className="spec-k">DIRECTORIAL FOCUS</span>
                  <span className="spec-v">Post-Production & AI Video</span>
                </div>
                <div className="spec-item">
                  <span className="spec-k">STUDIO HQ</span>
                  <span className="spec-v">Hyderabad, Telangana · Global Delivery</span>
                </div>
              </div>

            </div>
          </div>

          {/* RIGHT: DIRECTORIAL ESSAY & MANIFESTO QUOTE */}
          <div ref={narrativeRef} className="leadership-narrative-col">
            <div className="leadership-quote-box">
              <p className="leadership-pullquote">
                “Our creative standard is uncompromising: if a viewer can immediately tell an ad was made with AI, we haven't done our job. It must arrest attention as cinema first.”
              </p>
            </div>

            <div className="leadership-essay-text">
              <p>
                MotionNodeEdits was founded by Vutukuri Sai Teja with a singular vision: to dismantle the cumbersome, bloated workflows of legacy production agencies without sacrificing an ounce of visual elegance or editorial mastery.
              </p>
              <p>
                Having spent years mastering the craft of narrative pacing, rhythm, sound engineering, and color spaces, Sai Teja recognized that generative AI is not a gimmick to produce disposable clips — it is a revolutionary camera system that rewards those with genuine directorial discipline.
              </p>
              <p>
                Under his creative direction, MotionNodeEdits works directly with ambitious brands worldwide to turn raw concepts into master commercial campaigns in days, not months.
              </p>
            </div>

            <div className="leadership-signature-strip">
              <span className="signature-title">MOTIONNODEEDITS STUDIO DIRECTION</span>
              <span className="signature-location">HYDERABAD, INDIA</span>
            </div>
          </div>

        </div>

      </div>

      {/* COMPONENT STYLES */}
      <style dangerouslySetInnerHTML={{__html: `
        .about-leadership-section {
          position: relative;
          width: 100%;
          background-color: var(--about-bg-primary, #050507);
          color: var(--about-text-primary, #FFFFFF);
          padding: 130px 0 120px 0;
          box-sizing: border-box;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .leadership-chapter-tag {
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #8E8F94;
          margin-bottom: 48px;
        }

        .lead-tag-num { color: #FFFFFF; }
        .lead-tag-sep { color: rgba(255, 255, 255, 0.18); }

        .about-leadership-grid {
          display: grid;
          grid-template-columns: 420px 1fr;
          gap: 64px;
          align-items: center;
        }

        .leadership-portrait-card {
          background: #09090D;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 48px 36px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          position: relative;
          box-sizing: border-box;
          box-shadow: 0 20px 48px rgba(0, 0, 0, 0.8);
        }

        .leadership-emblem-wrap {
          position: relative;
          width: 96px;
          height: 96px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
        }

        .leadership-halo-ring {
          position: absolute;
          inset: -8px;
          border-radius: 50%;
          border: 1px dashed rgba(255, 255, 255, 0.2);
          animation: haloRotate 30s linear infinite;
        }

        @keyframes haloRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .leadership-emblem-img {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          object-fit: cover;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 0 24px rgba(255, 255, 255, 0.1);
        }

        .leadership-card-meta {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .founder-tag-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #FFFFFF;
          box-shadow: 0 0 8px #FFFFFF;
        }

        .founder-tag-text {
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #D1D1D6;
        }

        .founder-card-name {
          font-family: var(--about-font-heading, 'Cormorant Garamond', serif);
          font-size: 26px;
          font-weight: 400;
          letter-spacing: 0.08em;
          color: #FFFFFF;
          margin: 0 0 28px 0;
          text-transform: uppercase;
        }

        .founder-card-specs {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 14px;
          padding-top: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          text-align: left;
        }

        .spec-item {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .spec-k {
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.16em;
          color: #71717A;
          text-transform: uppercase;
        }

        .spec-v {
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          font-size: 12.5px;
          font-weight: 400;
          color: #D1D1D6;
        }

        /* Narrative Column */
        .leadership-narrative-col {
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        .leadership-quote-box {
          border-left: 2px solid #FFFFFF;
          padding-left: 28px;
        }

        .leadership-pullquote {
          font-family: var(--about-font-heading, 'Cormorant Garamond', serif);
          font-size: clamp(24px, 2.6vw, 36px);
          font-weight: 300;
          font-style: italic;
          line-height: 1.25;
          color: #FFFFFF;
          margin: 0;
        }

        .leadership-essay-text {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .leadership-essay-text p {
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          font-size: 15.5px;
          font-weight: 300;
          line-height: 1.85;
          color: var(--about-text-secondary, #8E8F94);
          margin: 0;
        }

        .leadership-signature-strip {
          display: flex;
          align-items: center;
          gap: 16px;
          padding-top: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.14em;
          color: #71717A;
        }

        .signature-title { color: #FFFFFF; }

        @media (max-width: 960px) {
          .about-leadership-grid {
            grid-template-columns: 1fr;
            gap: 40px;
          }

          .leadership-portrait-card {
            max-width: 480px;
            margin: 0 auto;
            width: 100%;
          }

          .leadership-quote-box {
            padding-left: 18px;
          }
        }
      `}} />
    </section>
  );
}
