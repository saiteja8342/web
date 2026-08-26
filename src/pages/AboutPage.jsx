import React, { useEffect } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import CustomCursor from '../components/CustomCursor';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import WhatsAppWidget from '../components/WhatsAppWidget';

// Import themed About components
import './about.css';
import AboutHero from '../components/About/AboutHero';
import AboutWhoWeAre from '../components/About/AboutWhoWeAre';
import AboutWhyUs from '../components/About/AboutWhyUs';
import AboutQualityStandard from '../components/About/AboutQualityStandard';
import AboutTeam from '../components/About/AboutTeam';
import AboutGlobalPresence from '../components/About/AboutGlobalPresence';
import AboutFinalCTA from '../components/About/AboutFinalCTA';
import AboutFAQ from '../components/About/AboutFAQ';

gsap.registerPlugin(ScrollTrigger);

export default function AboutPage() {
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

    // Fade up animations for sections
    const fadeElements = gsap.utils.toArray('.about-fade-up');
    fadeElements.forEach((el) => {
      gsap.fromTo(el,
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            toggleActions: 'play none none none'
          }
        }
      );
    });

    return () => {
      lenis.destroy();
      gsap.ticker.remove(tickerCallback);
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <>
      <CustomCursor />
      
      {/* Official Site Navigation */}
      <Navbar />

      <main className="about-page-wrapper">
        <AboutHero />
        <AboutWhoWeAre />
        <AboutWhyUs />
        <AboutQualityStandard />
        <AboutTeam />
        <AboutGlobalPresence />
        <AboutFinalCTA />
        <AboutFAQ />
      </main>

      <WhatsAppWidget />
      
      {/* Official Site Footer */}
      <Footer />
    </>
  );
}
