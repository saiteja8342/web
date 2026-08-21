import React, { useRef, useState, useEffect } from 'react';
import { Film, Cpu, Megaphone, Smartphone, Users, Box } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ShimmerText from './ShimmerText';

gsap.registerPlugin(ScrollTrigger);

const TILT_MAX = 9;
const TILT_SPRING = { stiffness: 300, damping: 28 };
const GLOW_SPRING = { stiffness: 180, damping: 22 };

const cn = (...classes) => classes.filter(Boolean).join(' ');

function Card({ item, dimmed, onHoverStart, onHoverEnd }) {
  const Icon = item.icon;
  const cardRef = useRef(null);

  const normX = useMotionValue(0.5);
  const normY = useMotionValue(0.5);

  const rawRotateX = useTransform(normY, [0, 1], [TILT_MAX, -TILT_MAX]);
  const rawRotateY = useTransform(normX, [0, 1], [-TILT_MAX, TILT_MAX]);

  const rotateX = useSpring(rawRotateX, TILT_SPRING);
  const rotateY = useSpring(rawRotateY, TILT_SPRING);
  const glowOpacity = useSpring(0, GLOW_SPRING);
  
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    normX.set((e.clientX - rect.left) / rect.width);
    normY.set((e.clientY - rect.top) / rect.height);
    
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseEnter = () => {
    glowOpacity.set(1);
    onHoverStart();
  };

  const handleMouseLeave = () => {
    normX.set(0.5);
    normY.set(0.5);
    glowOpacity.set(0);
    onHoverEnd();
  };

  return (
    <motion.div
      animate={{
        scale: dimmed ? 0.96 : 1,
        opacity: dimmed ? 0.45 : 1,
      }}
      className={cn(
        "spotlight-card reveal-element"
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      ref={cardRef}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 900,
        transition: 'opacity 0.4s ease, filter 0.4s ease, border-color 0.3s ease',
        filter: dimmed ? 'blur(1px)' : 'none'
      }}
    >
      {/* Static accent tint — always visible */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 20% 20%, ${item.color}05, transparent 65%)`,
        }}
      />

      {/* Hover glow layer */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: glowOpacity,
          background: `radial-gradient(ellipse at 20% 20%, ${item.color}15, transparent 65%)`,
        }}
      />
      
      {/* Spotlight glow layer following cursor coordinates */}
      <div
        className="spotlight-glow"
        style={{
          '--mouse-x': `${mousePos.x}px`,
          '--mouse-y': `${mousePos.y}px`
        }}
      ></div>

      {/* Shimmer sweep */}
      <div className="spotlight-shimmer" />

      {/* Icon badge */}
      <div
        className="relative z-10"
        style={{
          background: `${item.color}0c`,
          boxShadow: `inset 0 0 0 1px ${item.color}25`,
          width: 40,
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20
        }}
      >
        <Icon size={17} strokeWidth={1.9} style={{ color: item.color }} />
      </div>

      {/* Text */}
      <div className="relative z-10" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h3 className="spotlight-card-title" style={{ fontSize: '1.25rem', marginBottom: 0 }}>
          {item.title}
        </h3>
        <p className="spotlight-card-desc">
          {item.description}
        </p>
      </div>

      {/* Accent bottom line */}
      <div
        aria-hidden="true"
        className="spotlight-bottom-line"
        style={{
          background: `linear-gradient(to right, ${item.color}80, transparent)`,
        }}
      />
    </motion.div>
  );
}

export default function Services() {
  const sectionRef = useRef(null);
  const [hoveredTitle, setHoveredTitle] = useState(null);

  const items = [
    {
      icon: Film,
      title: 'Video Editing',
      description: 'Cinematic editing, professional color grading, and custom sound design to craft highly engaging narratives.',
      color: '#E5E5EA'
    },
    {
      icon: Cpu,
      title: 'AI Video Production',
      description: 'Merging cutting-edge generative tools with professional post-production for unmatched visual styling.',
      color: '#C5C6C9'
    },
    {
      icon: Megaphone,
      title: 'AI Advertisements',
      description: 'Tailored ad campaigns and commercial copy combining algorithmic precision with high-end storytelling.',
      color: '#D1D1D6'
    },
    {
      icon: Smartphone,
      title: 'Social Media Reels',
      description: 'Scroll-stopping TikToks, Instagram Reels, and Shorts engineered specifically to retain views and go viral.',
      color: '#8E8F94'
    },
    {
      icon: Users,
      title: 'UGC Ads',
      description: 'Authentic consumer-focused style editing that builds instant trust and converts viewer interest into sales.',
      color: '#A2A2A7'
    },
    {
      icon: Box,
      title: 'Product Videos',
      description: 'Sleek, atmospheric product highlights with dynamic macro shots, sound syncs, and 3D camera feel.',
      color: '#FFFFFF'
    }
  ];

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

    const clips = el.querySelectorAll('.section-heading-clip');
    clips.forEach((clip) => {
      gsap.fromTo(clip,
        { clipPath: 'inset(100% 0 0 0)', y: 40 },
        {
          clipPath: 'inset(0% 0 0 0)',
          y: 0,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: clip,
            start: 'top 85%',
            once: true
          }
        }
      );
    });
  }, []);

  return (
    <section id="services" ref={sectionRef}>
      <div className="container">
        <div className="services-layout">
          
          {/* Top text header */}
          <div className="services-header">
            <span className="caption eyebrow section-heading-clip">WHAT WE DO</span>
            <ShimmerText
              text="Every frame.<br />Intentional."
              className="h2 section-heading-clip"
            />
            <p className="body-large services-desc reveal-element" style={{ marginTop: 24 }}>
              We combine professional visual direction with cutting-edge production to deliver edits that don't just look cinematic — they capture attention.
            </p>
          </div>

          {/* Services cards grid */}
          <div className="services-grid spotlight-grid">
            {items.map((item) => (
              <Card
                key={item.title}
                item={item}
                dimmed={hoveredTitle !== null && hoveredTitle !== item.title}
                onHoverStart={() => setHoveredTitle(item.title)}
                onHoverEnd={() => setHoveredTitle(null)}
              />
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
