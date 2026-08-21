import React, { useState, useEffect } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Import Components
import CustomCursor from './components/CustomCursor';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import SocialProof from './components/SocialProof';
import VideoPortfolio from './components/VideoPortfolio';
import Services from './components/Services';
import Contact from './components/Contact';
import WhatsAppWidget from './components/WhatsAppWidget';
import Footer from './components/Footer';

gsap.registerPlugin(ScrollTrigger);

export default function App() {
  const [isLoaded, setIsLoaded] = useState(true);

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

  return (
    <>
      {/* CUSTOM CURSOR */}
      <CustomCursor />

      {/* NAVBAR */}
      <Navbar />

      {/* HERO SECTION */}
      <Hero isLoaded={isLoaded} />

      {/* SOCIAL PROOF */}
      <SocialProof />

      {/* CINEMATIC VIDEO PORTFOLIO CAROUSEL */}
      <VideoPortfolio />

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
