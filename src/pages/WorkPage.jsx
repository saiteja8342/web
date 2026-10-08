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
        id="main"
        className="work-page-wrapper"
        style={{
          minHeight: '80vh',
          paddingTop: '100px',
          paddingBottom: '40px',
          position: 'relative'
        }}
      >
        {/* CINEMATIC VIDEO PORTFOLIO CAROUSEL */}
        <VideoPortfolio isHeadingH1={true} />

        {/* EDITORIAL CAPABILITIES & CASE STUDY HIGHLIGHTS */}
        <section className="work-editorial-overview" style={{ padding: '60px 0 20px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <div className="container">
            <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
              <span className="caption eyebrow" style={{ color: 'var(--text-secondary)', letterSpacing: '0.15em' }}>
                PRODUCTION STANDARDS
              </span>
              <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 600, color: '#FFFFFF', margin: '12px 0 20px' }}>
                Engineering High-Retention Visuals For Visionary Brands
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: '1.7', marginBottom: '32px' }}>
                Every reel, commercial, and avatar production is crafted with precision pacing, studio color mastering, and bespoke sound engineering. From short-form social campaigns that stop the scroll to 4K cinematic commercials that drive conversion, MotionNodeEdits merges the frontier of generative AI with meticulous post-production direction.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', textAlign: 'left' }}>
                <div style={{ padding: '24px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '12px' }}>
                  <h3 style={{ fontSize: '1.1rem', color: '#FFFFFF', fontWeight: 600, marginBottom: '8px' }}>AI Commercial Ads</h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>High-converting brand films and product visuals generated with state-of-the-art AI workflows and commercial color grading.</p>
                </div>
                <div style={{ padding: '24px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '12px' }}>
                  <h3 style={{ fontSize: '1.1rem', color: '#FFFFFF', fontWeight: 600, marginBottom: '8px' }}>High-Retention Reels</h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>Social-first vertical edits engineered for TikTok, Instagram Reels, and YouTube Shorts to maximize viewer watch time and engagement.</p>
                </div>
                <div style={{ padding: '24px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '12px' }}>
                  <h3 style={{ fontSize: '1.1rem', color: '#FFFFFF', fontWeight: 600, marginBottom: '8px' }}>Talking Avatars & UGC</h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>Photorealistic digital human avatars and multi-language localized videos for brands scaling their creator content globally.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FLOATING WHATSAPP DRAWERS */}
      <WhatsAppWidget />

      {/* FOOTER */}
      <Footer />
    </>
  );
}
