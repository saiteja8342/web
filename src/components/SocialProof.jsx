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
    initials: 'SR',
    author: 'Sudhakar Reddy',
    role: 'CEO • Deepkil',
    text: '“MotionNodeEdits transformed our raw footage into professional, high-impact content that truly captivated our audience. Their speed, quality, and creativity are unparalleled. Highly recommended!”',
    stars: 5,
  },
  {
    initials: 'PR',
    author: 'Prasad',
    role: 'YouTube Creator • Creator Studio',
    text: '“They transformed our raw footage with edits that stopped people scrolling. Engagement tripled.”',
    stars: 5,
  },
  {
    initials: 'SK',
    author: 'Srinivas',
    role: 'Brand Founder • Apex Media',
    text: '“Outstanding editing quality with fast turnaround. Every revision was handled perfectly and delivered on time.”',
    stars: 5,
  },
  {
    initials: 'AR',
    author: 'Aravind',
    role: 'Content Creator • Studio Flow',
    text: '“Creative edits that kept viewers watching till the end. Retention went from 35% to 68%.”',
    stars: 5,
  },
  {
    initials: 'RK',
    author: 'Rakesh',
    role: 'Head of Growth • ScaleAI',
    text: '“The speed, precision, and editing finesse completely exceeded our expectations. Conversions doubled.”',
    stars: 5,
  }
];

export default function SocialProof() {
  const sectionRef = useRef(null);
  const carouselRef = useRef(null);
  const cardRefs = useRef([]);
  const [activeMobileIndex, setActiveMobileIndex] = useState(0);

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
          const rawFeedback = (item.feedback || '').replace(/^["'“]+|["'”]+$/g, '').trim();
          const text = `“${rawFeedback}”`;
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

  const handleMobileScroll = () => {
    const el = carouselRef.current;
    if (!el) return;
    const scrollLeft = el.scrollLeft;
    const cardEl = cardRefs.current[0];
    const cardWidth = cardEl ? cardEl.offsetWidth + 16 : el.offsetWidth * 0.85;
    const index = Math.round(scrollLeft / cardWidth);
    const clamped = Math.max(0, Math.min(testimonials.length - 1, index));
    if (clamped !== activeMobileIndex) {
      setActiveMobileIndex(clamped);
    }
  };

  const scrollToIndex = (index) => {
    const target = cardRefs.current[index];
    if (target && carouselRef.current) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
      setActiveMobileIndex(index);
    }
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
    
    // GSAP Scroll reveal with lifecycle cleanup
    const ctx = gsap.context(() => {
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
    }, sectionRef);

    return () => ctx.revert();
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

        {/* DESKTOP 3-CARD EDITORIAL GRID (Screens > 768px) */}
        <div className="trust-desktop-only">
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
                    <div className="trust-editorial-stars" aria-label={`${item.stars || 5} stars`}>
                      {"★".repeat(Math.max(1, Math.min(5, Math.round(Number(item.stars) || 5))))}
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

          {/* Bottom Slider Navigation */}
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

        {/* MOBILE HORIZONTAL SNAP CAROUSEL (Screens <= 768px matching Reference Design) */}
        <div className="trust-mobile-only reveal-element">
          <div 
            className="trust-mobile-carousel"
            ref={carouselRef}
            onScroll={handleMobileScroll}
          >
            {testimonials.map((item, idx) => (
              <div 
                key={`${item.author}-${idx}`} 
                className="trust-mobile-card"
                ref={(el) => { cardRefs.current[idx] = el; }}
              >
                {/* Top Stars Row */}
                <div className="trust-editorial-stars" aria-label={`${item.stars || 5} stars`}>
                  {"★".repeat(Math.max(1, Math.min(5, Math.round(Number(item.stars) || 5))))}
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
          </div>

          {/* Minimal Centered Dot Indicators */}
          <div className="trust-mobile-dots" aria-label="Testimonial pagination">
            {testimonials.map((_, idx) => (
              <button
                key={idx}
                type="button"
                className={`trust-mobile-dot ${activeMobileIndex === idx ? 'active' : ''}`}
                onClick={() => scrollToIndex(idx)}
                aria-label={`Go to testimonial ${idx + 1}`}
              />
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
