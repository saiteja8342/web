import React, { useState, useEffect, useRef } from 'react';
import { Mail, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import MagneticParticleButton from './MagneticParticleButton';
import { createContactRequest } from '../lib/db/contactRequests';

gsap.registerPlugin(ScrollTrigger);

export default function Contact() {
  const sectionRef = useRef(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    project_type: '',
    message: '',
    _gotcha: '',
  });

  const [status, setStatus] = useState({
    submitting: false,
    success: false,
    error: false,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Anti-spam honeypot check
    if (formData._gotcha) {
      // Silently discard spam bot submission
      setStatus({ submitting: false, success: true, error: false });
      return;
    }

    setStatus({ submitting: true, success: false, error: false });

    const clearedFormData = {
      name: '',
      email: '',
      phone: '',
      project_type: '',
      message: '',
      _gotcha: ''
    };

    // Track conversion event in Google Analytics
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', 'generate_lead', {
        event_category: 'Contact',
        event_label: formData.project_type || 'General Quote',
        value: 1
      });
    }

    try {
      // 1. Save contact request to Supabase
      const dbPromise = createContactRequest({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        project_type: formData.project_type,
        message: formData.message,
      });

      // 2. Also send via Formspree
      const formspreePromise = fetch('https://formspree.io/f/mzdokokr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          project_type: formData.project_type,
          message: formData.message,
        }),
      }).catch((err) => {
        console.warn('Formspree submission warning:', err);
        return { ok: false };
      });

      const [dbResult, formspreeResponse] = await Promise.allSettled([dbPromise, formspreePromise]);
      const dbSuccess = dbResult.status === 'fulfilled' && !dbResult.value?.error;
      const formspreeSuccess = formspreeResponse.status === 'fulfilled' && formspreeResponse.value?.ok;

      // If either Supabase or Formspree succeeded, consider submission a success
      if (dbSuccess || formspreeSuccess) {
        setStatus({ submitting: false, success: true, error: false });
        setFormData(clearedFormData);
      } else {
        setStatus({ submitting: false, success: false, error: true });
      }
    } catch {
      setStatus({ submitting: false, success: false, error: true });
    }
  };

  useEffect(() => {
    const el = sectionRef.current;
    
    // GSAP Scroll reveals
    const reveals = el.querySelectorAll('.reveal-element');
    reveals.forEach((element) => {
      gsap.fromTo(element,
        { opacity: 0, y: 35 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: element,
            start: 'top 85%',
            toggleActions: 'play none none none',
            once: true
          }
        }
      );
    });
  }, []);

  const openWhatsApp = () => {
    const url = `https://wa.me/918985351756?text=Hi%20MotionNodeEdits,%20I'd%20like%20to%20request%20a%20quote%20for%20a%20video%20editing%20project.`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="contact-section" id="contact" ref={sectionRef}>
      <div className="container">
        
        {/* Section Header */}
        <div className="contact-header reveal-element" style={{ marginBottom: 48 }}>
          <span className="caption contact-eyebrow">LET'S BUILD SOMETHING GREAT</span>
          <h2 className="contact-main-title" style={{ fontSize: '2.5rem', color: '#FFFFFF', marginTop: 8 }}>Request a Quote</h2>
          <p className="contact-sub-title" style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
            Have a project in mind? Fill out the form below or reach out via WhatsApp for a quick consultation.
          </p>
        </div>

        <div className="contact-layout-custom">
          
          {/* Left Panel: Form Card */}
          <div className="contact-form-card reveal-element">
            <AnimatePresence mode="wait">
              {status.success ? (
                <motion.div 
                  key="success-card"
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="contact-success-container"
                >
                  {/* Animated Tick Mark Icon with Pulse Glow */}
                  <div className="success-checkmark-wrapper">
                    <div className="success-aura-glow"></div>
                    <svg className="success-checkmark-svg" viewBox="0 0 52 52">
                      <circle className="checkmark-circle" cx="26" cy="26" r="23" fill="none"/>
                      <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                    </svg>
                  </div>

                  {/* Animated Success Message */}
                  <motion.h3 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="success-title"
                  >
                    Thank You!
                  </motion.h3>

                  <motion.p 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="success-text"
                  >
                    Thanks for reaching out! We’ve received your message and will get back to you within 24 hours.
                  </motion.p>

                  <motion.button
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    onClick={() => setStatus({ submitting: false, success: false, error: false })}
                    className="success-reset-btn"
                  >
                    Send Another Message
                  </motion.button>
                </motion.div>
              ) : (
                <div key="form-container">
                  <h3 className="contact-form-card-title">Send a Message</h3>
                  <form id="contactForm" onSubmit={handleSubmit}>
                    {/* Anti-spam honeypot field */}
                    <input 
                      type="text" 
                      name="_gotcha" 
                      value={formData._gotcha || ''} 
                      onChange={handleChange} 
                      style={{ display: 'none' }} 
                      tabIndex={-1} 
                      autoComplete="off" 
                      aria-hidden="true"
                    />
                    
                    <div className="contact-form-row">
                      <div className="contact-form-group">
                        <label htmlFor="contactName" className="contact-label-custom">
                          Name <span>*</span>
                        </label>
                        <input 
                          id="contactName" 
                          type="text" 
                          name="name" 
                          className="contact-input-custom" 
                          placeholder="Your full name" 
                          required 
                          value={formData.name}
                          onChange={handleChange}
                        />
                      </div>
                      
                      <div className="contact-form-group">
                        <label htmlFor="contactEmail" className="contact-label-custom">
                          Email <span>*</span>
                        </label>
                        <input 
                          id="contactEmail" 
                          type="email" 
                          name="email" 
                          className="contact-input-custom" 
                          placeholder="your@email.com" 
                          required 
                          value={formData.email}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="contact-form-group">
                      <label htmlFor="contactPhone" className="contact-label-custom">
                        Phone (Optional)
                      </label>
                      <input 
                        id="contactPhone" 
                        type="text" 
                        name="phone" 
                        className="contact-input-custom" 
                        placeholder="+91 xxxxxxxxxx" 
                        value={formData.phone}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="contact-form-group">
                      <label htmlFor="contactProjectType" className="contact-label-custom">
                        Project Type <span>*</span>
                      </label>
                      <select 
                        id="contactProjectType" 
                        name="project_type" 
                        className="contact-input-custom" 
                        required 
                        value={formData.project_type}
                        onChange={handleChange}
                      >
                        <option value="" disabled>Select project type</option>
                        <option value="video_editing">Video Editing</option>
                        <option value="ai_production">AI Video Production</option>
                        <option value="ai_ads">AI Advertisements</option>
                        <option value="social_reels">Social Media Reels</option>
                        <option value="ugc_ads">UGC Ads</option>
                        <option value="product_videos">Product Videos</option>
                      </select>
                    </div>

                    <div className="contact-form-group">
                      <label htmlFor="contactMessage" className="contact-label-custom">
                        Project Details <span>*</span>
                      </label>
                      <textarea 
                        id="contactMessage" 
                        name="message" 
                        className="contact-input-custom" 
                        placeholder="Tell me about your project, goals, timeline..." 
                        required 
                        value={formData.message}
                        onChange={handleChange}
                      ></textarea>
                    </div>

                    <MagneticParticleButton type="submit" className="contact-submit-btn" disabled={status.submitting}>
                      {status.submitting ? (
                        <>
                          <svg className="btn-spinner" viewBox="0 0 50 50" aria-hidden="true" style={{ display: 'inline-block', width: 16, height: 16, marginRight: 8, verticalAlign: 'middle' }}>
                            <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" strokeWidth="4" stroke-dasharray="90 150" stroke-linecap="round"></circle>
                          </svg>
                          Sending...
                        </>
                      ) : (
                        <span>Send Message</span>
                      )}
                    </MagneticParticleButton>

                    {status.error && (
                      <div className="form-error" style={{ display: 'block' }}>
                        Something went wrong. Please try again or contact us directly.
                      </div>
                    )}
                  </form>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Panel: Side Info Cards */}
          <div className="contact-right-panel reveal-element">
            
            {/* Card 1: Get in Touch */}
            <div className="contact-info-card">
              <h4 className="contact-info-card-title">Get in Touch</h4>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <Mail size={18} style={{ color: 'var(--text-secondary)', marginTop: 2 }} />
                <div>
                  <span style={{ fontSize: '0.85rem', color: '#FFFFFF', fontWeight: 500, display: 'block' }}>Email</span>
                  <a href="mailto:hello@motionnodeedits.com" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>
                    hello@motionnodeedits.com
                  </a>
                </div>
              </div>
            </div>

            {/* Card 2: Quick Actions */}
            <div className="contact-info-card">
              <h4 className="contact-info-card-title">Quick Actions</h4>
              <button onClick={openWhatsApp} className="whatsapp-action-btn">
                <MessageSquare size={16} />
                <span>Start a WhatsApp chat</span>
              </button>
            </div>

            {/* Card 3: Response Time */}
            <div className="contact-info-card" style={{ alignItems: 'center', textAlign: 'center' }}>
              <span className="caption" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Response Time</span>
              <span style={{ fontSize: '2rem', color: '#FFFFFF', fontWeight: 700, margin: '8px 0 4px' }}>24 Hours</span>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4', margin: 0 }}>
                We typically respond to all inquiries within 24 hours.
              </p>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
