import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export default function CustomCursor() {
  const ringRef = useRef(null);
  const dotRef = useRef(null);
  const labelRef = useRef(null);
  const [isTouchDevice, setIsTouchDevice] = useState(true);

  useEffect(() => {
    // Check if touch device or small screen
    const isTouch = (('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || window.innerWidth < 768);
    setIsTouchDevice(isTouch);
    
    if (isTouch) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;

    const onMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      gsap.set(dotRef.current, { x: mouseX, y: mouseY });
    };

    window.addEventListener('mousemove', onMouseMove);

    let animationFrameId;
    const renderCursor = () => {
      ringX += (mouseX - ringX) * 0.15;
      ringY += (mouseY - ringY) * 0.15;
      gsap.set(ringRef.current, { x: ringX, y: ringY });
      animationFrameId = requestAnimationFrame(renderCursor);
    };
    animationFrameId = requestAnimationFrame(renderCursor);

    // Dynamic hover handling via event delegation
    const onMouseOver = (e) => {
      const hoverEl = e.target.closest('[data-hover-type]');
      if (hoverEl) {
        const type = hoverEl.getAttribute('data-hover-type');
        if (dotRef.current) dotRef.current.classList.add('hidden');
        if (ringRef.current) {
          if (type === 'link') {
            ringRef.current.classList.add('hover-active');
          } else if (type === 'card') {
            ringRef.current.classList.add('video-hover');
            const labelText = hoverEl.getAttribute('data-hover-label') || 'VIEW';
            if (labelRef.current) labelRef.current.textContent = labelText;
          }
        }
      }
    };

    const onMouseOut = (e) => {
      const hoverEl = e.target.closest('[data-hover-type]');
      if (hoverEl) {
        if (dotRef.current) dotRef.current.classList.remove('hidden');
        if (ringRef.current) {
          ringRef.current.classList.remove('hover-active');
          ringRef.current.classList.remove('video-hover');
        }
        if (labelRef.current) labelRef.current.textContent = '';
      }
    };

    window.addEventListener('mouseover', onMouseOver);
    window.addEventListener('mouseout', onMouseOut);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseover', onMouseOver);
      window.removeEventListener('mouseout', onMouseOut);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  if (isTouchDevice) return null;

  return (
    <>
      <div className="cursor-ring" ref={ringRef} id="cursorRing" aria-hidden="true">
        <span className="cursor-label" ref={labelRef} id="cursorLabel"></span>
      </div>
      <div className="cursor-dot" ref={dotRef} id="cursorDot" aria-hidden="true"></div>
    </>
  );
}
