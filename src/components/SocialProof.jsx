import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ShimmerText from './ShimmerText';
import { getPublicTestimonials } from '../lib/db/cms';

gsap.registerPlugin(ScrollTrigger);

const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction) => ({
    x: direction < 0 ? 80 : -80,
    opacity: 0,
  }),
};

const DEFAULT_TESTIMONIALS = [
  {
    initials: 'PR',
    author: 'Prasad',
    role: 'YouTube Creator',
    text: '"They transformed our raw footage into something that stopped people scrolling. Engagement tripled."',
    stars: 5,
  },
  {
    initials: 'SR',
    author: 'Srinivas',
    role: 'Brand Founder',
    text: '"Outstanding editing quality with fast turnaround. Every revision was handled perfectly."',
    stars: 5,
  },
  {
    initials: 'AR',
    author: 'Aravind',
    role: 'Content Creator',
    text: '"Creative edits that kept viewers watching till the end. Retention went from 35% to 68%."',
    stars: 5,
  },
  {
    initials: 'RK',
    author: 'Rakesh',
    role: 'Head of Growth',
    text: '"The speed, precision, and editing finesse completely exceeded our expectations. Conversions doubled."',
    stars: 5,
  }
];

export default function SocialProof() {
  const sectionRef = useRef(null);
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState(0);
  const [testimonials, setTestimonials] = useState(DEFAULT_TESTIMONIALS);

  useEffect(() => {
    let isMounted = true;
    getPublicTestimonials().then((dbData) => {
      if (isMounted && dbData && dbData.length > 0) {
        const transformed = dbData.map((item) => {
          const author = item.name || 'Client';
          const initials = author
            .split(' ')
            .filter(Boolean)
            .map(w => w[0])
            .join('')
            .slice(0, 2)
            .toUpperCase() || 'CL';
          const roleParts = [];
          if (item.role) roleParts.push(item.role);
          if (item.company) roleParts.push(item.company);
          const role = roleParts.length > 0 ? roleParts.join(' • ') : 'Client';
          const text = item.feedback?.startsWith('"') ? item.feedback : `"${item.feedback}"`;
          return {
            initials,
            author,
            role,
            text,
            stars: item.rating || 5,
          };
        });
        setTestimonials(transformed);
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const paginate = (newDirection) => {
    setDirection(newDirection);
    setPage((prev) => (prev + newDirection + testimonials.length) % testimonials.length);
  };

  // Compute up to 3 visible cards starting from page
  const visibleTestimonials = testimonials.length <= 3
    ? testimonials
    : [
        testimonials[page % testimonials.length],
        testimonials[(page + 1) % testimonials.length],
        testimonials[(page + 2) % testimonials.length],
      ];

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    
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
    <section className="social-proof-exact-style" id="testimonials" ref={sectionRef}>
      <div className="container">
        
        {/* THEMED HEADER WITH SHIMMER ANIMATION */}
        <div className="testimonials-site-header reveal-element">
          <span className="testimonials-site-eyebrow">CLIENT REVIEWS</span>
          
          <div className="testimonials-shimmer-wrapper">
            <ShimmerText
              text="What our Clients are Saying"
              className="testimonials-shimmer-title"
            />
          </div>

          <p className="testimonials-site-subtitle">
            Discover real stories from clients who've unlocked growth, efficiency, and success with our solution.
          </p>
        </div>

        {/* 3-CARD EDITORIAL GRID WITH HORIZONTAL SLIDE ANIMATION */}
        <div className="trust-slider-overflow-container reveal-element">
          <AnimatePresence custom={direction} mode="popLayout" initial={false}>
            <motion.div 
              key={page}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: 'spring', stiffness: 280, damping: 28 },
                opacity: { duration: 0.25 }
              }}
              className="trust-editorial-grid"
            >
              {visibleTestimonials.map((item, idx) => (
                <div key={`${item.author}-${idx}`} className="trust-editorial-card">
                  {/* Top Stars Row */}
                  <div className="trust-editorial-stars" aria-label={`${item.stars} stars`}>
                    {"★".repeat(item.stars)}
                  </div>

                  {/* Review Quote Text (Italic Serif) */}
                  <p className="trust-editorial-text">
                    {item.text}
                  </p>

                  {/* Thin Divider Line */}
                  <div className="trust-editorial-divider" />

                  {/* Bottom Profile Row */}
                  <div className="trust-editorial-profile">
                    <div className="trust-editorial-avatar">
                      {item.initials}
                    </div>
                    <div className="trust-editorial-meta">
                      <span className="trust-editorial-name">{item.author}</span>
                      <span className="trust-editorial-role">{item.role}</span>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* BOTTOM SLIDER NAVIGATION */}
        <div className="trust-editorial-nav reveal-element">
          <button 
            type="button"
            className="trust-nav-btn" 
            onClick={() => paginate(-1)}
            aria-label="Previous testimonial"
            data-hover-type="link"
          >
            <ChevronLeft size={18} />
          </button>
          <button 
            type="button"
            className="trust-nav-btn" 
            onClick={() => paginate(1)}
            aria-label="Next testimonial"
            data-hover-type="link"
          >
            <ChevronRight size={18} />
          </button>
        </div>

      </div>
    </section>
  );
}
