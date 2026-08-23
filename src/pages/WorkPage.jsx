import React, { useEffect } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import CustomCursor from '../components/CustomCursor';
import Navbar from '../components/Navbar';
import VideoPortfolio from '../components/VideoPortfolio';
import WhatsAppWidget from '../components/WhatsAppWidget';
import Footer from '../components/Footer';

gsap.registerPlugin(ScrollTrigger);

export default function WorkPage() {
  useEffect(() => {
    // Initialize Lenis smooth scroll
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    });

    lenis.on('scroll', ScrollTrigger.update);

    const tickerCallback = (time) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      gsap.ticker.remove(tickerCallback);
    };
  }, []);

  return (
    <>
      {/* CUSTOM CURSOR */}
      <CustomCursor />

      {/* NAVBAR */}
      <Navbar />

      {/* WORK PAGE MAIN WRAPPER */}
      <main 
        className="work-page-wrapper"
        style={{
          minHeight: '80vh',
          paddingTop: '100px',
          paddingBottom: '40px',
          position: 'relative'
        }}
      >
        {/* CINEMATIC VIDEO PORTFOLIO CAROUSEL */}
        <VideoPortfolio />
      </main>

      {/* FLOATING WHATSAPP DRAWERS */}
      <WhatsAppWidget />

      {/* FOOTER */}
      <Footer />
    </>
  );
}
