import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export default function CustomCursor() {
  const ringRef = useRef(null);
  const dotRef = useRef(null);
  const labelRef = useRef(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // If pure touch without fine pointer, disable
    const isPureTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    if (isPureTouch) {
      setIsVisible(false);
      return;
    }

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;
    let hasMoved = false;

    const onMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!hasMoved) {
        hasMoved = true;
        ringX = mouseX;
        ringY = mouseY;
        if (ringRef.current) gsap.set(ringRef.current, { opacity: 0.6, scale: 1 });
        if (dotRef.current) gsap.set(dotRef.current, { opacity: 1 });
      }
      if (dotRef.current) {
        gsap.set(dotRef.current, { x: mouseX, y: mouseY });
      }
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });

    let animationFrameId;
    const renderCursor = () => {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      if (ringRef.current) {
        gsap.set(ringRef.current, { x: ringX, y: ringY });
      }
      animationFrameId = requestAnimationFrame(renderCursor);
    };
    animationFrameId = requestAnimationFrame(renderCursor);

    // Dynamic hover handling for all buttons, links, inputs, and interactive cards
    const onMouseOver = (e) => {
      const target = e.target;
      if (!target) return;

      const hoverEl = target.closest('[data-hover-type], button, a, input, textarea, select, [role="button"], .cp-link-card, .vel-order-row, .cp-history-item, .vel-nav-item, .ed-nav-item, .cp-nav-item, .vel-metric-card, .ed-metric-card');
      
      if (hoverEl) {
        const type = hoverEl.getAttribute('data-hover-type') || 'link';
        if (dotRef.current) dotRef.current.classList.add('hidden');
        if (ringRef.current) {
          if (type === 'card' || hoverEl.classList.contains('video-card')) {
            ringRef.current.classList.add('video-hover');
            const labelText = hoverEl.getAttribute('data-hover-label') || 'VIEW';
            if (labelRef.current) labelRef.current.textContent = labelText;
          } else {
            ringRef.current.classList.add('hover-active');
            if (labelRef.current) labelRef.current.textContent = '';
          }
        }
      }
    };

    const onMouseOut = (e) => {
      const target = e.target;
      if (!target) return;

      const hoverEl = target.closest('[data-hover-type], button, a, input, textarea, select, [role="button"], .cp-link-card, .vel-order-row, .cp-history-item, .vel-nav-item, .ed-nav-item, .cp-nav-item, .vel-metric-card, .ed-metric-card');
      
      if (hoverEl) {
        if (dotRef.current) dotRef.current.classList.remove('hidden');
        if (ringRef.current) {
          ringRef.current.classList.remove('hover-active');
          ringRef.current.classList.remove('video-hover');
        }
        if (labelRef.current) labelRef.current.textContent = '';
      }
    };

    window.addEventListener('mouseover', onMouseOver, { passive: true });
    window.addEventListener('mouseout', onMouseOut, { passive: true });

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseover', onMouseOver);
      window.removeEventListener('mouseout', onMouseOut);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <>
      <div className="cursor-ring" ref={ringRef} id="cursorRing" aria-hidden="true">
        <span className="cursor-label" ref={labelRef} id="cursorLabel"></span>
      </div>
      <div className="cursor-dot" ref={dotRef} id="cursorDot" aria-hidden="true"></div>
    </>
  );
}
