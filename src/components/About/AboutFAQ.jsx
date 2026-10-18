import React, { useState } from 'react';
import { ChevronDown, MessageSquare, Mail } from 'lucide-react';

export default function AboutFAQ() {
  const faqs = [
    {
      q: 'Which package is best for me?',
      a: 'We offer flexible production tiers customized for your specific brand objectives — including High-Converting AI Commercial Ads, AI Talking Avatar Videos, 3D Product Showcases, and Ongoing Monthly Social Media Retainers. If you are unsure, reach out for a consultation and we will tailor the optimal workflow for your goals.'
    },
    {
      q: 'Why should we choose your service?',
      a: 'MotionNodeEdits bridges state-of-the-art generative AI technologies with high-end cinema-grade post-production, sound engineering, color grading, and editorial direction. You receive studio-quality commercial video assets delivered 10x faster and at a fraction of traditional production budgets.'
    },
    {
      q: 'Can I cancel at any time?',
      a: 'Yes, absolutely. For our monthly retainer workflows, there are no lock-in contracts or long-term obligations—you can pause or cancel anytime with zero friction. For one-off custom projects, payments are transparently structured on milestone deliverables.'
    },
    {
      q: 'How long does the video process take?',
      a: 'Standard AI commercial ads, short-form reels, and talking avatar videos are typically delivered within 48 to 72 hours. Comprehensive campaigns, custom 3D animations, and cinematic brand films take 5 to 7 business days. Rush delivery is always available upon request.'
    },
    {
      q: 'How can I send big files to you?',
      a: 'You can easily share your brand assets, logo vectors, product guidelines, and footage through Google Drive, Dropbox, WeTransfer, or Frame.io. Upon project initiation, we set up a dedicated cloud folder for seamless asset management.'
    },
    {
      q: "I have a big project and it's a bit complex.",
      a: 'We specialize in complex, high-scale productions. Whether you need multi-lingual AI localization in 30+ languages, custom digital twin avatars, full 3D environment generation, or 50+ ad variations per month, we build a dedicated workflow and assign specialized editors to your brand.'
    },
    {
      q: "What if I don't like my video and how do revisions work?",
      a: 'Every project includes dedicated revision rounds. You can leave precise timestamped notes, and our creative team will refine the visuals, pacing, audio, color grading, and animations until the video perfectly aligns with your creative vision.'
    },
    {
      q: 'Can you create videos completely from just an idea?',
      a: 'Yes! You only need to share your vision, product link, or campaign goal. We manage the entire end-to-end creative workflow: scriptwriting, storyboard generation, generative AI asset creation, voice synthesis, sound design, and final 4K master delivery.'
    }
  ];

  const [openIndex, setOpenIndex] = useState(0);

  const toggleFAQ = (idx) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="about-section about-faq-section" id="faq" aria-label="Frequently Asked Questions">
      <div className="about-container">
        
        {/* Top Tagline */}
        <div className="about-faq-top-banner">
          <span className="about-faq-top-quote">
            YOU HAVE QUESTIONS. WE HAVE ANSWERS.
          </span>
        </div>

        {/* Two Column Grid */}
        <div className="about-faq-grid">
          
          {/* Left Column: Heading & Contact Details Card */}
          <div className="about-faq-left-col">
            <div className="chrome-badge" style={{ marginBottom: '22px' }}>
              <span style={{ fontSize: '8px' }}>●</span> FREQUENTLY ASKED QUESTIONS
            </div>

            <h2 className="about-faq-main-title">
              FREQUENTLY<br />
              ASKED<br />
              QUESTIONS
            </h2>

            <p className="about-faq-lead-desc">
              (Find answers to frequently asked questions about MotionNodeEdits, our range of AI video production services, how we operate, and insights on maximizing the benefits of our agency services.)
            </p>

            {/* Direct Contact Card */}
            <div className="about-faq-contact-card">
              <div className="faq-contact-phone">
                +91 89853 51756
              </div>

              <div className="faq-contact-hours">
                <div className="faq-hours-label">
                  <span className="faq-clock-icon">🕒</span> BUSINESS HOURS
                </div>
                <div className="faq-hours-val">
                  Monday – Saturday : 9:00 AM – 7:00 PM IST
                </div>
              </div>

              <div className="faq-contact-buttons">
                <a 
                  href="https://wa.me/918985351756?text=Hi%20MotionNodeEdits,%20I%20have%20a%20question%20about%20your%20services" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="faq-btn-whatsapp"
                  data-hover-type="link"
                >
                  <MessageSquare size={14} />
                  <span>WHATSAPP</span>
                </a>

                <a 
                  href="mailto:hello@motionnodeedits.com" 
                  className="faq-btn-email"
                  data-hover-type="link"
                >
                  <Mail size={14} />
                  <span>EMAIL US</span>
                </a>
              </div>
            </div>

          </div>

          {/* Right Column: Accordion */}
          <div className="about-faq-right-col">
            <div className="about-accordion-list">
              {faqs.map((faq, idx) => {
                const isOpen = openIndex === idx;
                return (
                  <div 
                    key={idx} 
                    className={`about-accordion-item ${isOpen ? 'is-open' : ''}`}
                  >
                    <button 
                      className="about-accordion-header"
                      onClick={() => toggleFAQ(idx)}
                      aria-expanded={isOpen}
                      data-hover-type="link"
                    >
                      <span className="about-accordion-question">
                        {faq.q}
                      </span>
                      <div className={`about-accordion-icon ${isOpen ? 'rotated' : ''}`}>
                        <ChevronDown size={18} />
                      </div>
                    </button>

                    {isOpen && (
                      <div className="about-accordion-collapse">
                        <p className="about-accordion-answer">
                          {faq.a}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* COMPONENT STYLES */}
      <style dangerouslySetInnerHTML={{__html: `
        .about-faq-section {
          padding: 120px 0 140px 0;
          background-color: #050507;
          border-top: 1px solid rgba(255, 255, 255, 0.07);
          position: relative;
        }

        .about-faq-top-banner {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 44px;
        }

        .about-faq-top-quote {
          font-family: var(--about-font-heading, 'Cormorant Garamond', serif) !important;
          font-size: clamp(26px, 3.2vw, 42px) !important;
          font-weight: 300 !important;
          color: #FFFFFF !important;
          letter-spacing: -0.015em;
          text-transform: uppercase;
          text-align: right;
        }

        .about-faq-grid {
          display: grid;
          grid-template-columns: 1fr 1.35fr;
          gap: 72px;
          align-items: flex-start;
        }

        .about-faq-left-col {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          position: sticky;
          top: 110px;
        }

        .about-faq-main-title {
          font-family: var(--about-font-heading, 'Cormorant Garamond', serif) !important;
          font-size: clamp(38px, 4.2vw, 54px) !important;
          font-weight: 300 !important;
          line-height: 1.08;
          color: #FFFFFF !important;
          text-transform: uppercase;
          letter-spacing: -0.015em;
          margin: 0 0 20px 0;
        }

        .about-faq-lead-desc {
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          font-size: 14px;
          line-height: 1.7;
          color: rgba(255, 255, 255, 0.55);
          font-weight: 300;
          margin: 0 0 32px 0;
          max-width: 440px;
        }

        .about-faq-contact-card {
          width: 100%;
          background: rgba(14, 14, 22, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 18px;
          padding: 30px 26px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          gap: 22px;
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1),
                      border-color 0.4s cubic-bezier(0.16, 1, 0.3, 1),
                      box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.45);
        }

        .about-faq-contact-card:hover {
          transform: translateY(-4px);
          border-color: rgba(255, 255, 255, 0.22);
          box-shadow: 0 18px 48px rgba(0, 0, 0, 0.6), 0 0 25px rgba(255, 255, 255, 0.05);
        }

        .faq-contact-phone {
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          font-size: 16px;
          font-weight: 500;
          color: #FFFFFF;
          letter-spacing: 0.02em;
        }

        .faq-contact-hours {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .faq-hours-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.14em;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
        }

        .faq-clock-icon {
          font-size: 12px;
        }

        .faq-hours-val {
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          font-size: 13.5px;
          color: rgba(255, 255, 255, 0.75);
          font-weight: 400;
        }

        .faq-contact-buttons {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 4px;
        }

        .faq-btn-whatsapp {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 18px;
          background: #E5E5EA;
          color: #0A0A0E;
          border-radius: 100px;
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          text-decoration: none;
          transition: background 0.2s ease, transform 0.2s ease;
        }

        .faq-btn-whatsapp:hover {
          background: #FFFFFF;
          transform: translateY(-1px);
        }

        .faq-btn-email {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 18px;
          background: rgba(255, 255, 255, 0.04);
          color: #FFFFFF;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 100px;
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          text-decoration: none;
          transition: background 0.2s ease, border-color 0.2s ease;
        }

        .faq-btn-email:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.25);
        }

        /* Right Column Accordion */
        .about-faq-right-col {
          width: 100%;
        }

        .about-accordion-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .about-accordion-item {
          background: rgba(14, 14, 22, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          overflow: hidden;
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }

        .about-accordion-item:hover {
          border-color: rgba(255, 255, 255, 0.22);
          background: rgba(18, 18, 28, 0.75);
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(0, 0, 0, 0.45);
        }

        .about-accordion-item.is-open {
          border-color: rgba(255, 255, 255, 0.25);
          background: rgba(20, 20, 32, 0.85);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.55), 0 0 24px rgba(255, 255, 255, 0.04);
        }

        .about-accordion-header {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 22px 24px;
          background: transparent;
          border: none;
          color: #FFFFFF;
          cursor: pointer;
          text-align: left;
          gap: 20px;
          box-sizing: border-box;
        }

        .about-accordion-question {
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          font-size: 16px;
          font-weight: 500;
          color: #FFFFFF;
          line-height: 1.4;
        }

        .about-accordion-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255, 255, 255, 0.6);
          transition: transform 0.3s ease;
          flex-shrink: 0;
        }

        .about-accordion-icon.rotated {
          transform: rotate(180deg);
          color: #FFFFFF;
        }

        .about-accordion-collapse {
          padding: 0 24px 22px 24px;
          box-sizing: border-box;
        }

        .about-accordion-answer {
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          font-size: 14.5px;
          line-height: 1.7;
          color: rgba(255, 255, 255, 0.65);
          margin: 0;
          font-weight: 300;
        }

        @media (max-width: 900px) {
          .about-faq-grid {
            grid-template-columns: 1fr;
            gap: 48px;
          }
          .about-faq-left-col {
            position: static;
          }
          .about-faq-section {
            padding: 80px 0 100px 0;
          }
          .about-faq-top-banner {
            justify-content: flex-start;
          }
          .about-faq-top-quote {
            text-align: left;
          }
        }
      `}} />
    </section>
  );
}
