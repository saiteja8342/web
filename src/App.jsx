import React, { useState, useEffect } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Import Components
import Loader from './components/Loader';
import CustomCursor from './components/CustomCursor';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import SocialProof from './components/SocialProof';
import Portfolio from './components/Portfolio';
import Services from './components/Services';
import Contact from './components/Contact';
import WhatsAppWidget from './components/WhatsAppWidget';
import Footer from './components/Footer';

gsap.registerPlugin(ScrollTrigger);

export default function App() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Initialize Lenis smooth scroll
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // easeOutExpo
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

  const handleLoaderComplete = () => {
    setIsLoaded(true);
  };

  return (
    <>
      {/* NOISE OVERLAY */}
      <div 
        className="noise-overlay" 
        aria-hidden="true" 
        style={{
          background: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22nf%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23nf)%22/%3E%3C/svg%3E')"
        }}
      ></div>

      {/* CUSTOM CURSOR */}
      <CustomCursor />

      {/* INTRO SKELETON LOADER */}
      <Loader onComplete={handleLoaderComplete} />

      {/* NAVBAR */}
      <Navbar />

      {/* HERO SECTION */}
      <Hero isLoaded={isLoaded} />

      {/* SOCIAL PROOF */}
      <SocialProof />

      {/* PORTFOLIO SELECTED WORK */}
      <Portfolio />

      {/* SPOTLIGHT SERVICES */}
      <Services />

      {/* CONTACT */}
      <Contact />

      {/* FLOATING WHATSAPP DRAWERS */}
      <WhatsAppWidget />

      {/* FOOTER */}
      <Footer />
    </>
  );
}
