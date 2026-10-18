import React, { useState } from 'react';
import { Plus, Minus, ArrowUpRight, MessageSquare, Mail } from 'lucide-react';

export default function AboutEditorialFAQ() {
  const faqs = [
    {
      q: 'How long does a standard video production take from brief to master?',
      a: 'Standard AI commercial ads, short-form viral reels, and talking avatar videos are typically delivered within 48 to 72 hours. Comprehensive multi-scene campaigns, custom 3D animations, and cinematic brand films take 5 to 7 business days. Rush delivery is available upon request.'
    },
    {
      q: 'How does MotionNodeEdits differ from traditional production agencies?',
      a: 'Traditional agencies require 6 to 8 weeks, tens of thousands of dollars in physical crew and permits, and rigid sets. We bridge state-of-the-art generative neural models with Hollywood post-production, sound engineering, and directorial craft. You receive studio-quality commercial video delivered 10x faster and at a fraction of legacy agency budgets.'
    },
    {
      q: 'How do revisions work and what is your quality guarantee?',
      a: 'Every project includes dedicated revision rounds. We utilize a timestamped feedback workflow where you can pinpoint exact frames for visual refinements, pacing adjustments, audio mixing, or color grading until the master cut perfectly matches your vision.'
    },
    {
      q: 'How do we submit assets, product guidelines, and project briefs?',
      a: 'You can easily share your brand assets, logo vectors, product guidelines, and raw footage through Google Drive, Dropbox, WeTransfer, or Frame.io. Upon onboarding, we establish a dedicated cloud folder for seamless asset management.'
    },
    {
      q: 'Can you produce videos completely from just a concept or idea?',
      a: 'Yes! You only need to share your core vision, product link, or campaign goal. We manage the entire end-to-end creative workflow: scriptwriting, narrative storyboards, generative asset creation, voice synthesis, sound design, and final 4K master delivery.'
    },
    {
      q: 'Can I cancel or pause a monthly retainer at any time?',
      a: 'Yes, absolutely. For our ongoing monthly retainer workflows, there are no lock-in contracts or long-term obligations — you can pause or cancel anytime with zero friction. For one-off custom projects, payments are transparently structured on milestone deliverables.'
    }
  ];

  const [openIdx, setOpenIdx] = useState(0);

  const toggle = (idx) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section className="about-faq-editorial-section" id="faq" aria-label="Frequently Asked Questions">
      <div className="about-container">
        
        {/* CHAPTER TAG */}
        <div className="faq-chapter-tag">
          <span className="faq-tag-num">CHAPTER 04</span>
          <span className="faq-tag-sep">/</span>
          <span className="faq-tag-title">PRODUCTION INQUIRIES</span>
        </div>

        <div className="faq-layout-grid">
          
          {/* LEFT: EDITORIAL CONTEXT */}
          <div className="faq-left-col">
            <h2 className="faq-main-title">
              CLEAR ANSWERS <br />
              <span className="faq-title-italic">FOR VISIONARY BRANDS.</span>
            </h2>
            <p className="faq-lead-desc">
              Everything you need to know about commissioning an AI commercial, avatar film, or monthly retainer with our studio.
            </p>

            <div className="faq-contact-card">
              <span className="faq-card-heading">HAVE A BESPOKE INQUIRY?</span>
              <p className="faq-card-p">
                Speak directly with our creative director to discuss custom timelines, multi-market localization, or enterprise campaigns.
              </p>
              <div className="faq-card-actions">
                <a 
                  href="mailto:hello@motionnodeedits.com" 
                  className="faq-contact-link"
                  data-hover-type="link"
                >
                  <Mail size={15} />
                  <span>hello@motionnodeedits.com</span>
                </a>
              </div>
            </div>
          </div>

          {/* RIGHT: ACCORDION LIST */}
          <div className="faq-accordion-col" role="region" aria-label="Accordion Questions">
            {faqs.map((item, idx) => {
              const isOpen = openIdx === idx;
              return (
                <div 
                  key={idx} 
                  className={`faq-acc-item ${isOpen ? 'is-open' : ''}`}
                >
                  <button
                    type="button"
                    className="faq-acc-trigger"
                    onClick={() => toggle(idx)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${idx}`}
                    id={`faq-btn-${idx}`}
                  >
                    <span className="faq-acc-q">{item.q}</span>
                    <span className="faq-acc-icon-box">
                      {isOpen ? <Minus size={16} /> : <Plus size={16} />}
                    </span>
                  </button>

                  <div 
                    id={`faq-answer-${idx}`}
                    role="region"
                    aria-labelledby={`faq-btn-${idx}`}
                    className="faq-acc-content"
                    style={{
                      maxHeight: isOpen ? '400px' : '0',
                      opacity: isOpen ? 1 : 0
                    }}
                  >
                    <p className="faq-acc-text">{item.a}</p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>

      {/* COMPONENT STYLES */}
      <style dangerouslySetInnerHTML={{__html: `
        .about-faq-editorial-section {
          position: relative;
          width: 100%;
          background-color: var(--about-bg-primary, #050507);
          color: var(--about-text-primary, #FFFFFF);
          padding: 130px 0 120px 0;
          box-sizing: border-box;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .faq-chapter-tag {
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

        .faq-tag-num { color: #FFFFFF; }
        .faq-tag-sep { color: rgba(255, 255, 255, 0.18); }

        .faq-layout-grid {
          display: grid;
          grid-template-columns: 460px 1fr;
          gap: 64px;
          align-items: flex-start;
        }

        .faq-left-col {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .faq-main-title {
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif) !important;
          font-size: clamp(32px, 3.8vw, 50px) !important;
          font-weight: 700 !important;
          color: #FFFFFF !important;
          line-height: 1.1;
          letter-spacing: -0.025em;
          text-transform: uppercase;
          margin: 0;
        }

        .faq-title-italic {
          font-family: var(--about-font-heading, 'Cormorant Garamond', serif) !important;
          font-weight: 300 !important;
          font-style: italic;
          background: linear-gradient(180deg, #FFFFFF 15%, #D1D1D6 65%, #8E8F94 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .faq-lead-desc {
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          font-size: 15.5px;
          font-weight: 300;
          line-height: 1.75;
          color: var(--about-text-secondary, #8E8F94);
          margin: 0;
        }

        .faq-contact-card {
          background: #09090D;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 32px 28px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 12px;
        }

        .faq-card-heading {
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.16em;
          color: #FFFFFF;
          text-transform: uppercase;
        }

        .faq-card-p {
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          font-size: 13.5px;
          font-weight: 300;
          line-height: 1.65;
          color: #8E8F94;
          margin: 0;
        }

        .faq-card-actions {
          margin-top: 8px;
        }

        .faq-contact-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          font-size: 12.5px;
          font-weight: 600;
          color: #FFFFFF;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .faq-contact-link:hover {
          color: #D1D1D6;
          text-decoration: underline;
        }

        /* Accordion Column */
        .faq-accordion-col {
          display: flex;
          flex-direction: column;
        }

        .faq-acc-item {
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          transition: background-color 0.25s ease;
        }

        .faq-acc-item:first-child {
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .faq-acc-trigger {
          width: 100%;
          background: transparent;
          border: none;
          padding: 26px 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          text-align: left;
          cursor: pointer;
          color: #FFFFFF;
          outline: none;
        }

        .faq-acc-trigger:focus-visible {
          outline: 2px solid #FFFFFF;
          outline-offset: 4px;
        }

        .faq-acc-q {
          font-family: var(--about-font-heading, 'Cormorant Garamond', serif);
          font-size: clamp(20px, 2vw, 25px);
          font-weight: 400;
          line-height: 1.25;
          letter-spacing: -0.01em;
          color: #FFFFFF;
          transition: color 0.2s ease;
        }

        .faq-acc-item:hover .faq-acc-q {
          color: #F0F0F5;
        }

        .faq-acc-icon-box {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFFFFF;
          flex-shrink: 0;
          transition: all 0.25s ease;
        }

        .faq-acc-item.is-open .faq-acc-icon-box {
          border-color: rgba(255, 255, 255, 0.35);
          background: rgba(255, 255, 255, 0.08);
        }

        .faq-acc-content {
          overflow: hidden;
          transition: max-height 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease;
        }

        .faq-acc-text {
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          font-size: 14.5px;
          font-weight: 300;
          line-height: 1.8;
          color: var(--about-text-secondary, #8E8F94);
          margin: 0;
          padding-bottom: 28px;
        }

        @media (max-width: 960px) {
          .faq-layout-grid {
            grid-template-columns: 1fr;
            gap: 40px;
          }
        }
      `}} />
    </section>
  );
}
