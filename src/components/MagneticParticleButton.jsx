import React, { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';

export default function MagneticParticleButton({ children, className = '', disabled = false, type = 'button', onClick, ...props }) {
  const buttonRef = useRef(null);
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animationFrameRef = useRef(null);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // Initialize Canvas Particles Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const updateCanvasSize = () => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        canvas.width = rect.width * 2; // High DPI
        canvas.height = rect.height * 2;
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        p.radius *= 0.96;

        if (p.alpha <= 0 || p.radius <= 0.2) {
          particlesRef.current.splice(index, 1);
        } else {
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fillStyle = p.color;
          ctx.shadowBlur = 8;
          ctx.shadowColor = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Spawn Particle Helper
  const spawnParticles = (x, y, count = 2, isClick = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const colors = [
      '#FFFFFF',
      '#E2E8F0',
      '#A855F7',
      '#3B82F6',
      '#60A5FA',
      '#EC4899'
    ];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = isClick ? Math.random() * 6 + 2 : Math.random() * 2 + 0.5;
      const color = colors[Math.floor(Math.random() * colors.length)];

      particlesRef.current.push({
        x: x * 2, // Scale for high DPI canvas
        y: y * 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (isClick ? 0 : 0.5), // Upward drift on hover
        radius: isClick ? Math.random() * 4 + 2 : Math.random() * 2.5 + 1,
        alpha: 1,
        decay: isClick ? Math.random() * 0.03 + 0.015 : Math.random() * 0.04 + 0.02,
        color
      });
    }
  };

  // Magnetic Mouse Move Handler
  const handleMouseMove = (e) => {
    const btn = buttonRef.current;
    if (!btn || disabled) return;

    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Calculate displacement distance from center
    const deltaX = (x - centerX) * 0.35; // Magnetic pull strength
    const deltaY = (y - centerY) * 0.35;

    setMousePos({ x, y });

    // Smooth magnetic move via GSAP
    gsap.to(btn, {
      x: deltaX,
      y: deltaY,
      duration: 0.3,
      ease: 'power2.out',
      overwrite: 'auto'
    });

    // Spawn subtle floating particles on hover move
    if (Math.random() > 0.4) {
      spawnParticles(x, y, 2, false);
    }
  };

  // Mouse Enter
  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  // Mouse Leave Reset
  const handleMouseLeave = () => {
    setIsHovered(false);
    const btn = buttonRef.current;
    if (!btn) return;

    // Spring snap back to center position
    gsap.to(btn, {
      x: 0,
      y: 0,
      duration: 0.6,
      ease: 'elastic.out(1, 0.4)',
      overwrite: 'auto'
    });
  };

  // Click Handler with Particle Burst
  const handleClick = (e) => {
    if (disabled) return;
    const btn = buttonRef.current;
    if (btn) {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      spawnParticles(x, y, 25, true); // Explosive burst on click
    }

    if (onClick) onClick(e);
  };

  return (
    <div className="magnetic-particle-wrapper" style={{ display: 'block', position: 'relative', width: '100%' }}>
      <button
        ref={buttonRef}
        type={type}
        disabled={disabled}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`magnetic-particle-btn ${className}`}
        style={{
          '--mouse-x': `${mousePos.x}px`,
          '--mouse-y': `${mousePos.y}px`
        }}
        {...props}
      >
        {/* Canvas Particle Layer */}
        <canvas
          ref={canvasRef}
          className="particle-canvas"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 1,
            borderRadius: 'inherit'
          }}
        />

        {/* Cursor Following Radial Glow */}
        <div
          className="magnetic-glow-overlay"
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(120px circle at var(--mouse-x) var(--mouse-y), rgba(255, 255, 255, 0.2), transparent 70%)`,
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 0.3s ease',
            pointerEvents: 'none',
            zIndex: 2,
            borderRadius: 'inherit'
          }}
        />

        {/* Inner Content Container */}
        <span className="magnetic-btn-content" style={{ position: 'relative', zIndex: 3 }}>
          {children}
        </span>
      </button>
    </div>
  );
}
