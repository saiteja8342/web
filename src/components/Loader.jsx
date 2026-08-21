import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function Loader({ onComplete }) {
  const loaderRef = useRef(null);
  const barRef = useRef(null);
  const topRef = useRef(null);
  const bottomRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline({
      onComplete: () => {
        if (onComplete) onComplete();
      }
    });

    // Animate loader bar scale
    tl.to(barRef.current, {
      scaleX: 1,
      duration: 0.6,
      ease: 'power3.inOut'
    })
    // Split screens top and bottom
    .to(topRef.current, {
      yPercent: -100,
      duration: 0.5,
      ease: 'power3.inOut'
    }, '+=0.1')
    .to(bottomRef.current, {
      yPercent: 100,
      duration: 0.5,
      ease: 'power3.inOut'
    }, '<')
    .to(contentRef.current, {
      opacity: 0,
      duration: 0.3,
      ease: 'power2.out'
    }, '<')
    // Hide loader overlay
    .set(loaderRef.current, { display: 'none' });

    return () => {
      tl.kill();
    };
  }, [onComplete]);

  return (
    <div className="loader" ref={loaderRef} id="loader">
      <div className="loader-bg-top" ref={topRef} id="loaderTop"></div>
      <div className="loader-bg-bottom" ref={bottomRef} id="loaderBottom"></div>
      <div className="loader-content" ref={contentRef} id="loaderContent">
        <div className="loader-logo">MNE</div>
        <div className="loader-bar-wrap">
          <div className="loader-bar" ref={barRef} id="loaderBar"></div>
        </div>
      </div>
    </div>
  );
}
