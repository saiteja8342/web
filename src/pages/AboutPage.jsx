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
import AboutTestimonials from '../components/About/AboutTestimonials';
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

      <main id="main" className="about-page-wrapper">
        {/* Section 1: Cinematic Studio Hero */}
        <AboutHero />

        {/* Section 2: Agency Introduction */}
        <AboutWhoWeAre />

        {/* Section 3: Why MotionNodeEdits */}
        <AboutWhyUs />

        {/* Section 4: Our Quality Benchmark */}
        <AboutQualityStandard />

        {/* Section 5: Directorial Leadership */}
        <AboutTeam />

        {/* Section 6: Verified Client Endorsements */}
        <AboutTestimonials />

        {/* Section 7: Frequently Asked Questions */}
        <AboutFAQ />
      </main>

      <WhatsAppWidget />
      
      {/* Official Site Footer */}
      <Footer />
    </>
  );
}
