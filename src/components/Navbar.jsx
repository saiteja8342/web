import React, { useState, useEffect, useCallback } from 'react';
import NoiseBackground from './NoiseBackground';
import MobileSidebar from './MobileSidebar';
import { supabase } from '../supabaseClient';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);

  // Authentication state
  const [sessionUser, setSessionUser] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && isMounted) {
          setSessionUser(session.user);
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .maybeSingle();
          if (isMounted && profile?.role) {
            setUserRole(profile.role.toLowerCase().trim());
          }
        } else if (isMounted) {
          setSessionUser(null);
          setUserRole(null);
        }
      } catch (err) {
        console.warn('[Navbar] Session lookup error:', err);
      }
    }

    loadAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user && isMounted) {
        setSessionUser(session.user);
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle();
        if (isMounted && profile?.role) {
          setUserRole(profile.role.toLowerCase().trim());
        }
      } else if (isMounted) {
        setSessionUser(null);
        setUserRole(null);
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const getDashboardUrl = useCallback((role) => {
    const r = (role || userRole || '').toLowerCase().trim();
    if (r === 'admin') return '/dashboard/admin';
    if (r === 'editor') return '/dashboard/editor';
    return '/dashboard/client';
  }, [userRole]);

  const handleStartProjectClick = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();

    // 1. Instant navigation if user session is already verified in state
    if (sessionUser) {
      window.location.href = getDashboardUrl(userRole);
      return;
    }

    // 2. Fresh session check from Supabase storage
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        let role = userRole;
        if (!role) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .maybeSingle();
          role = (profile?.role || '').toLowerCase().trim();
        }
        window.location.href = getDashboardUrl(role);
      } else {
        window.location.href = '/login';
      }
    } catch (err) {
      console.warn('[Navbar] Start project auth check failed:', err);
      window.location.href = '/login';
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 80) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const isAboutPage = typeof window !== 'undefined' && window.location.pathname.includes('about');
  const isWorkPage = typeof window !== 'undefined' && window.location.pathname.includes('work');
  const isTermsPage = typeof window !== 'undefined' && window.location.pathname.includes('terms');
  const isPrivacyPage = typeof window !== 'undefined' && window.location.pathname.includes('privacy');
  const isSecondaryPage = isAboutPage || isWorkPage || isTermsPage || isPrivacyPage;

  return (
    <>
      <nav className={`nav ${scrolled ? 'scrolled' : ''}`} id="nav">
        <div className="container nav-inner">
          <a href={isSecondaryPage ? "/" : "#"} className="nav-logo" data-hover-type="link" style={{ textDecoration: 'none' }}>
            <span className="logo-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img 
                src="/image/mne_logo.png" 
                alt="MotionNodeEdits AI Video Production Studio Logo"
                className="logo-img-circular"
                width="40"
                height="40"
                loading="eager"
                fetchPriority="high"
                onLoad={() => setLogoLoaded(true)}
                style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '50%', 
                  objectFit: 'cover', 
                  border: '1px solid rgba(255,255,255,0.08)',
                  visibility: logoLoaded ? 'visible' : 'hidden' 
                }}
              />
              {!logoLoaded && (
                <div className="skeleton-loader logo-skeleton" aria-hidden="true" style={{ width: 40, height: 40, borderRadius: '50%' }}></div>
              )}
              <div className="nav-logo-text-wrap" style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                <span className="nav-logo-brand" style={{ fontFamily: 'var(--font-sans)', fontSize: '0.95rem', fontWeight: '700', color: '#FFFFFF', letterSpacing: '0.01em', lineHeight: '1.2' }}>MotionNodeEdits</span>
                <span className="nav-logo-subtitle" style={{ fontFamily: 'var(--font-sans)', fontSize: '0.62rem', color: 'var(--text-secondary)', letterSpacing: '0.01em', marginTop: '2px', fontWeight: '400', textTransform: 'none' }}>AI Video & Avatar Production Studio</span>
              </div>
            </span>
          </a>

          <div className="nav-links">
            <a href={isSecondaryPage ? "/" : "#"} data-hover-type="link">Home</a>
            <a href={isSecondaryPage ? "/#services" : "#services"} data-hover-type="link">Services</a>
            <a href="/work" className={isWorkPage ? "active" : ""} data-hover-type="link">Our Work</a>
            <a href="/about" className={isAboutPage ? "active" : ""} data-hover-type="link">About Us</a>
            <a href={isSecondaryPage ? "/#testimonials" : "#testimonials"} data-hover-type="link">Client Reviews</a>
            <a href={isSecondaryPage ? "/#contact" : "#contact"} data-hover-type="link">Contact</a>
          </div>

          <div className="nav-right-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>


            {/* DASHBOARD TAB (Only visible when user is logged in) */}
            {sessionUser && (
              <a
                href={getDashboardUrl(userRole)}
                className="nav-login-btn logged-in"
                data-hover-type="link"
                title="Go to your dashboard"
              >
                <span className="nav-login-status-dot" aria-hidden="true"></span>
                <span>Dashboard</span>
              </a>
            )}

            {/* START A PROJECT CTA BUTTON */}
            <div
              onClick={handleStartProjectClick}
              style={{ display: 'inline-flex', cursor: 'pointer' }}
            >
              <NoiseBackground
                containerClassName="nav-cta-custom-wrapper"
                gradientColors={[
                  "rgb(255, 100, 150)",
                  "rgb(100, 150, 255)",
                  "rgb(255, 200, 100)",
                ]}
              >
                <a
                  href={sessionUser ? getDashboardUrl(userRole) : "/login"}
                  onClick={handleStartProjectClick}
                  className="nav-cta-custom-noise"
                  data-hover-type="link"
                >
                  Start a project
                </a>
              </NoiseBackground>
            </div>
          </div>

          <button 
            className="hamburger" 
            id="hamburger" 
            onClick={toggleMobileMenu}
            aria-label="Toggle Menu"
            data-hover-type="link"
          >
            <span style={{ transform: mobileMenuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }}></span>
            <span style={{ opacity: mobileMenuOpen ? 0 : 1 }}></span>
            <span style={{ transform: mobileMenuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }}></span>
          </button>
        </div>
      </nav>

      {/* ANIMATED MOBILE SIDEBAR DRAWER */}
      <MobileSidebar
        isOpen={mobileMenuOpen}
        onClose={closeMobileMenu}
        sessionUser={sessionUser}
        userRole={userRole}
        onStartProject={handleStartProjectClick}
      />
    </>
  );
}
