import React, { useState, useEffect } from 'react';
import { getPublicTestimonials } from '../../lib/db/cms';

const DEFAULT_ABOUT_TESTIMONIALS = [
  { 
    quote: "MotionNodeEdits completely transformed our visual identity. The AI-generated campaigns they built were delivered in half the time of our usual production schedule.", 
    name: "Sarah Jenkins", 
    role: "CMO, Nexus Tech" 
  },
  { 
    quote: "The quality and cinematic detail in the AI storytelling blew us away. We didn't expect this level of emotional depth from an AI production.", 
    name: "Marcus Thorne", 
    role: "Creative Director, Studio 9" 
  },
  { 
    quote: "Fast, incredibly creative, and the communication was seamless. They are defining what the future of video production looks like.", 
    name: "Elena Rodriguez", 
    role: "Founder, Elevate Brands" 
  }
];

export default function AboutTestimonials() {
  const [testimonials, setTestimonials] = useState(DEFAULT_ABOUT_TESTIMONIALS);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;
    getPublicTestimonials().then((dbData) => {
      if (isMounted && dbData && dbData.length > 0) {
        const transformed = dbData.map((item) => {
          const roleParts = [];
          if (item.role) roleParts.push(item.role);
          if (item.company) roleParts.push(item.company);
          const role = roleParts.length > 0 ? roleParts.join(', ') : 'Client';
          return {
            name: item.name || 'Client',
            role,
            quote: item.feedback || '',
          };
        });
        setTestimonials(transformed);
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const safeIndex = activeIndex >= testimonials.length ? 0 : activeIndex;

  return (
    <section 
      style={{
        backgroundColor: 'var(--about-bg-secondary)',
        padding: '130px 0',
        borderTop: '1px solid var(--about-border)',
        borderBottom: '1px solid var(--about-border)'
      }}
    >
      <div className="about-container">
        
        <div className="about-fade-up about-section-header">
          <div className="chrome-badge">CLIENT ENDORSEMENTS</div>
          <h2 className="about-section-title">
            What Our Clients Say.
          </h2>
        </div>

        <div className="about-fade-up saas-card" style={{ position: 'relative', maxWidth: '840px', margin: '0 auto', textAlign: 'center', padding: '56px 40px' }}>
          
          <div style={{ 
            position: 'absolute', 
            top: '-40px', 
            left: '50%', 
            transform: 'translateX(-50%)', 
            fontSize: '120px', 
            color: 'rgba(255,255,255,0.06)', 
            fontFamily: 'var(--about-font-heading)', 
            lineHeight: 1, 
            userSelect: 'none' 
          }}>
            "
          </div>

          <div style={{ position: 'relative', zIndex: 1, minHeight: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <p style={{ 
              fontFamily: 'var(--about-font-heading)',
              fontSize: 'clamp(22px, 2.5vw, 28px)', 
              fontWeight: 300, 
              color: 'var(--about-text-primary)', 
              lineHeight: 1.5, 
              margin: '0 0 28px 0',
              letterSpacing: '-0.01em',
              fontStyle: 'italic'
            }}>
              "{testimonials[safeIndex]?.quote}"
            </p>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '16px', color: '#FFFFFF' }}>
              <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
            </div>

            <h4 style={{ 
              fontFamily: 'var(--about-font-sans)',
              fontSize: '15px', 
              fontWeight: 600, 
              color: '#FFFFFF', 
              margin: '0 0 4px 0' 
            }}>
              {testimonials[safeIndex]?.name}
            </h4>
            <div style={{ fontSize: '13px', color: 'var(--about-text-secondary)', fontWeight: 300 }}>
              {testimonials[safeIndex]?.role}
            </div>
          </div>

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginTop: '36px' }}>
             <button 
               onClick={() => setActiveIndex(prev => (prev === 0 ? testimonials.length - 1 : prev - 1))}
               style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.3s' }}
               className="about-test-nav"
               aria-label="Previous Testimonial"
             >
               ←
             </button>
             
             <div style={{ display: 'flex', gap: '8px' }}>
               {testimonials.map((_, idx) => (
                 <button
                   key={idx}
                   onClick={() => setActiveIndex(idx)}
                   style={{
                     width: '6px',
                     height: '6px',
                     borderRadius: '50%',
                     backgroundColor: idx === safeIndex ? '#FFFFFF' : 'rgba(255,255,255,0.2)',
                     border: 'none',
                     padding: 0,
                     cursor: 'pointer',
                     transition: 'all 0.3s'
                   }}
                   aria-label={`Go to slide ${idx + 1}`}
                 />
               ))}
             </div>

             <button 
               onClick={() => setActiveIndex(prev => (prev === testimonials.length - 1 ? 0 : prev + 1))}
               style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.3s' }}
               className="about-test-nav"
               aria-label="Next Testimonial"
             >
               →
             </button>
          </div>

        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .about-test-nav:hover {
          background-color: #FFFFFF !important;
          color: #050507 !important;
          border-color: #FFFFFF !important;
        }
      `}} />
    </section>
  );
}
