import React, { useRef, useState, useEffect } from 'react';
import {
  Film,
  Cpu,
  Megaphone,
  Smartphone,
  Users,
  Box,
  Video,
  Sparkles,
  Play,
  Award,
  Zap,
  Layers,
  Globe,
  Camera,
  Scissors,
  Flame
} from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ShimmerText from './ShimmerText';
import { getServicesSettings, DEFAULT_SERVICES_SETTINGS } from '../lib/db/cms';

gsap.registerPlugin(ScrollTrigger);

const ICON_MAP = {
  Film,
  Cpu,
  Megaphone,
  Smartphone,
  Users,
  Box,
  Video,
  Sparkles,
  Play,
  Award,
  Zap,
  Layers,
  Globe,
  Camera,
  Scissors,
  Flame
};

const TILT_MAX = 9;
const TILT_SPRING = { stiffness: 300, damping: 28 };
const GLOW_SPRING = { stiffness: 180, damping: 22 };

const cn = (...classes) => classes.filter(Boolean).join(' ');

function Card({ item, dimmed, onHoverStart, onHoverEnd }) {
  const Icon = typeof item.icon === 'string'
    ? (ICON_MAP[item.icon] || Film)
    : (item.icon || Film);
  const cardColor = item.color || '#FFFFFF';
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
          background: `radial-gradient(ellipse at 20% 20%, ${cardColor}05, transparent 65%)`,
        }}
      />

      {/* Hover glow layer */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: glowOpacity,
          background: `radial-gradient(ellipse at 20% 20%, ${cardColor}15, transparent 65%)`,
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
          background: `${cardColor}0c`,
          boxShadow: `inset 0 0 0 1px ${cardColor}25`,
          width: 40,
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20
        }}
      >
        <Icon size={17} strokeWidth={1.9} style={{ color: cardColor }} />
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
          background: `linear-gradient(to right, ${cardColor}80, transparent)`,
        }}
      />
    </motion.div>
  );
}

export default function Services() {
  const sectionRef = useRef(null);
  const [hoveredTitle, setHoveredTitle] = useState(null);
  const [settings, setSettings] = useState(DEFAULT_SERVICES_SETTINGS);

  useEffect(() => {
    let isMounted = true;
    getServicesSettings().then((data) => {
      if (isMounted && data) {
        setSettings(data);
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const visibleItems = (settings.items || DEFAULT_SERVICES_SETTINGS.items).filter(
    (item) => item.is_active !== false
  );

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    
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
  }, [visibleItems.length]);

  return (
    <section id="services" ref={sectionRef}>
      <div className="container">
        <div className="services-layout">
          
          {/* Top text header */}
          <div className="services-header">
            <span className="caption eyebrow section-heading-clip">
              {settings.eyebrow || 'WHAT WE DO'}
            </span>
            <ShimmerText
              text={settings.title || 'Every frame. Intentional.'}
              className="h2 section-heading-clip"
            />
            <p className="body-large services-desc reveal-element" style={{ marginTop: 24 }}>
              {settings.subtitle || "We combine professional visual direction with cutting-edge production to deliver edits that don't just look cinematic — they capture attention."}
            </p>
          </div>

          {/* Services cards grid */}
          <div className="services-grid spotlight-grid">
            {visibleItems.map((item) => (
              <Card
                key={item.id || item.title}
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

