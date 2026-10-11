import React, { useState } from 'react';
import { ChevronDown, Mail, Phone, Clock, MessageSquare, Send, Globe } from 'lucide-react';

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
      q: 'I have a big project and it\'s a bit complex.',
      a: 'We specialize in complex, high-scale productions. Whether you need multi-lingual AI localization in 30+ languages, custom digital twin avatars, full 3D environment generation, or 50+ ad variations per month, we build a dedicated workflow and assign specialized editors to your brand.'
    },
    {
      q: 'What if I don\'t like my video and how do revisions work?',
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
    <section className="about-section" id="faq" style={{ borderTop: '1px solid var(--about-border)', position: 'relative' }}>
      <div className="about-container">
        
        {/* TOP TAGLINE / BANNER MATCHING REFERENCE */}
        <div className="about-fade-up" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '36px' }}>
          <span style={{ 
            fontFamily: 'var(--about-font-heading)', 
            fontSize: 'clamp(26px, 3.2vw, 42px)', 
            fontWeight: 300, 
            color: 'var(--about-text-primary)',
            letterSpacing: '-0.02em',
            textTransform: 'uppercase',
            textAlign: 'right'
          }}>
            You have questions. We have answers.
          </span>
        </div>

        {/* TWO COLUMN GRID */}
        <div className="faq-website-theme-grid">
          
          {/* LEFT COLUMN: TITLE, DESCRIPTION & BRAND DETAILS CARD */}
          <div className="about-fade-up faq-theme-left-col">
            <div className="chrome-badge" style={{ marginBottom: '20px' }}>
              FREQUENTLY ASKED QUESTIONS
            </div>

            <h2 style={{ 
              fontFamily: 'var(--about-font-heading)',
              fontSize: 'clamp(38px, 4.5vw, 62px)',
              fontWeight: 300,
              lineHeight: 1.05,
              color: 'var(--about-text-primary)',
              textTransform: 'uppercase',
              letterSpacing: '-0.03em',
              margin: '0 0 20px 0'
            }}>
              Frequently<br />
              asked <span className="chrome-text" style={{ fontWeight: 400 }}>questions</span>
            </h2>

            <p style={{
              fontFamily: 'var(--about-font-sans)',
              fontSize: '14.5px',
              lineHeight: 1.75,
              color: 'var(--about-text-secondary)',
              fontWeight: 300,
              margin: '0 0 32px 0',
              maxWidth: '480px'
            }}>
              (Find answers to frequently asked questions about MotionNodeEdits, our range of AI video production services, how we operate, and insights on maximizing the benefits of our agency services.)
            </p>

            {/* BRAND DETAILS CARD (NO ADDRESS AS REQUESTED) */}
            <div className="saas-card faq-theme-info-card">
              {/* Card Header with Logo */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--about-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img 
                    src="/image/mne_logo.png" 
                    alt="MotionNodeEdits Logo" 
                    style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '50%', 
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.5)'
                    }} 
                  />
                  <div>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.16em', color: 'var(--about-silver-bright)', fontWeight: 600 }}>
                      MOTIONNODEEDITS
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--about-text-tertiary)', letterSpacing: '0.08em' }}>
                      AI VIDEO PRODUCTION
                    </div>
                  </div>
                </div>

                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  fontSize: '10px', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.12em', 
                  color: '#FFFFFF',
                  background: 'rgba(255, 255, 255, 0.06)',
                  padding: '4px 10px',
                  borderRadius: '100px',
                  border: '1px solid rgba(255, 255, 255, 0.12)'
                }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#FFFFFF', boxShadow: '0 0 6px #FFFFFF' }}></span>
                  ACTIVE
                </div>
              </div>

              {/* Contact Details List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <Mail size={16} style={{ color: 'var(--about-silver-mid)', marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--about-text-tertiary)', marginBottom: '2px' }}>
                      EMAIL
                    </div>
                    <a 
                      href="mailto:hello@motionnodeedits.com" 
                      style={{ 
                        fontFamily: 'var(--about-font-sans)', 
                        fontSize: '13.5px', 
                        color: 'var(--about-silver-bright)', 
                        textDecoration: 'none',
                        transition: 'color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#FFFFFF'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--about-silver-bright)'}
                    >
                      hello@motionnodeedits.com
                    </a>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <Phone size={16} style={{ color: 'var(--about-silver-mid)', marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--about-text-tertiary)', marginBottom: '2px' }}>
                      PHONE & WHATSAPP
                    </div>
                    <a 
                      href="tel:+918985351756" 
                      style={{ 
                        fontFamily: 'var(--about-font-sans)', 
                        fontSize: '13.5px', 
                        color: 'var(--about-silver-bright)', 
                        textDecoration: 'none',
                        transition: 'color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#FFFFFF'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--about-silver-bright)'}
                    >
                      +91 89853 51756
                    </a>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <Clock size={16} style={{ color: 'var(--about-silver-mid)', marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--about-text-tertiary)', marginBottom: '2px' }}>
                      BUSINESS HOURS
                    </div>
                    <div style={{ fontFamily: 'var(--about-font-sans)', fontSize: '13px', color: 'var(--about-text-secondary)', fontWeight: 300 }}>
                      Monday – Saturday : 9:00 AM – 7:00 PM IST
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons using Website Theme Tokens */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', paddingTop: '16px', borderTop: '1px solid var(--about-border)' }}>
                <a 
                  href="https://wa.me/918985351756?text=Hi%20MotionNodeEdits,%20I%20have%20a%20question%20about%20your%20services" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="about-btn-primary"
                  style={{ height: '42px', fontSize: '11px', padding: '0 16px', gap: '6px' }}
                >
                  <MessageSquare size={13} />
                  <span>WhatsApp</span>
                </a>
                <a 
                  href="mailto:hello@motionnodeedits.com?subject=Project%20Inquiry%20-%20MotionNodeEdits" 
                  className="about-btn-secondary"
                  style={{ height: '42px', fontSize: '11px', padding: '0 16px', gap: '6px' }}
                >
                  <Send size={13} />
                  <span>Email Us</span>
                </a>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: ACCORDION PILLS (WEBSITE THEME OBSIDIAN CAPSULES) */}
          <div className="about-fade-up faq-theme-right-col">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {faqs.map((faq, idx) => {
                const isOpen = openIndex === idx;
                return (
                  <div 
                    key={idx} 
                    className={`faq-theme-pill-card ${isOpen ? 'is-open' : ''}`}
                    style={{
                      background: isOpen ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.025)',
                      border: isOpen ? '1px solid rgba(255, 255, 255, 0.35)' : '1px solid var(--about-border)',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                      boxShadow: isOpen 
                        ? '0 12px 30px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.15)' 
                        : '0 4px 16px rgba(0, 0, 0, 0.3)'
                    }}
                  >
                    <button 
                      onClick={() => toggleFAQ(idx)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '22px 26px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontFamily: 'var(--about-font-sans)',
                        gap: '16px'
                      }}
                      className="faq-theme-btn"
                      aria-expanded={isOpen}
                    >
                      <span style={{
                        fontSize: '15.5px',
                        fontWeight: 500,
                        color: isOpen ? '#FFFFFF' : 'var(--about-silver-bright)',
                        letterSpacing: '-0.01em',
                        transition: 'color 0.2s ease',
                        lineHeight: 1.4
                      }}>
                        {faq.q}
                      </span>
                      <div style={{
                        color: isOpen ? '#FFFFFF' : 'var(--about-silver-dark)',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), color 0.2s'
                      }}>
                        <ChevronDown size={18} />
                      </div>
                    </button>
                    
                    <div 
                      style={{
                        maxHeight: isOpen ? '360px' : '0px',
                        opacity: isOpen ? 1 : 0,
                        transition: 'max-height 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease',
                        overflow: 'hidden'
                      }}
                    >
                      <div style={{
                        padding: '0 26px 22px 26px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                        paddingTop: '14px'
                      }}>
                        <p style={{
                          fontFamily: 'var(--about-font-sans)',
                          fontSize: '14px',
                          lineHeight: 1.8,
                          color: 'var(--about-text-secondary)',
                          margin: 0,
                          fontWeight: 300
                        }}>
                          {faq.a}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .faq-website-theme-grid {
          display: grid;
          grid-template-columns: 1fr 1.35fr;
          gap: 56px;
          align-items: start;
        }

        .faq-theme-left-col {
          position: sticky;
          top: 100px;
        }

        .faq-theme-info-card {
          padding: 24px 26px;
        }

        .faq-theme-pill-card:hover {
          background: rgba(255, 255, 255, 0.05) !important;
          border-color: rgba(255, 255, 255, 0.25) !important;
          transform: translateY(-2px);
        }

        .faq-theme-btn:hover span {
          color: #FFFFFF !important;
        }

        @media (max-width: 960px) {
          .faq-website-theme-grid {
            grid-template-columns: 1fr;
            gap: 48px;
          }

          .faq-theme-left-col {
            position: static;
          }
        }

        @media (max-width: 600px) {
          .faq-theme-pill-card button {
            padding: 16px 18px !important;
          }

          .faq-theme-pill-card div[style*="padding: 0 26px"] {
            padding: 0 18px 18px 18px !important;
          }

          .faq-theme-info-card {
            padding: 20px 18px !important;
          }
        }
      `}} />
    </section>
  );
}
