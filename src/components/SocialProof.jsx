import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function SocialProof() {
  const sectionRef = useRef(null);

  const list = [
    {
      stars: 5,
      text: '"They transformed our raw footage into something that stopped people scrolling. Engagement tripled."',
      author: 'Sarah K.',
      initials: 'SK',
      role: 'YouTube Creator'
    },
    {
      stars: 5,
      text: '"Outstanding editing quality with fast turnaround. Every revision was handled perfectly."',
      author: 'Marcus R.',
      initials: 'MR',
      role: 'Brand Founder'
    },
    {
      stars: 5,
      text: '"Creative edits that kept viewers watching till the end. Retention went from 35% to 68%."',
      author: 'Aisha T.',
      initials: 'AT',
      role: 'Content Creator'
    }
  ];

  useEffect(() => {
    const el = sectionRef.current;
    
    // GSAP Scroll reveal
    const reveals = el.querySelectorAll('.reveal-element');
    reveals.forEach((element) => {
      gsap.fromTo(element,
        { opacity: 0, y: 30 },
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

  return (
    <section className="social-proof" id="testimonials" ref={sectionRef}>
      <div className="container">
        <span className="caption social-proof-title reveal-element">
          TRUSTED BY CREATORS AND BRANDS WORLDWIDE
        </span>
        
        <div className="trust-layout">
          {list.map((item, index) => (
            <div key={index} className="trust-review-card reveal-element">
              <div className="trust-stars">{"★".repeat(item.stars)}</div>
              <p className="trust-review-text">{item.text}</p>
              <div className="trust-divider" />
              <div className="trust-profile">
                <div className="trust-avatar">{item.initials}</div>
                <div className="trust-meta">
                  <span className="trust-review-name">{item.author}</span>
                  <span className="caption trust-review-author">{item.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
