import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

export default function AboutNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
        }
      } catch (err) {
        console.warn('[AboutNavbar] Auth error:', err);
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

  const getDashboardUrl = (role) => {
    const r = (role || userRole || '').toLowerCase().trim();
    if (r === 'admin') return '/dashboard/admin';
    if (r === 'editor') return '/dashboard/editor';
    return '/dashboard/client';
  };

  const handleStartProjectClick = async (e) => {
    if (e) e.preventDefault();
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
    } catch {
      window.location.href = '/login';
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <nav 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '64px',
          backgroundColor: scrolled ? 'rgba(5,5,7,0.85)' : 'transparent',
          backdropFilter: scrolled ? 'blur(16px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(16px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
          zIndex: 100,
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <div className="about-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          
          {/* Left: Logo */}
          <a href="/" style={{ color: 'var(--about-white)', textDecoration: 'none', fontWeight: 800, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* SVG Placeholder */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
            MotionNodeEdits
          </a>

          {/* Center: Desktop Nav */}
          <div className="about-nav-desktop" style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
            <a href="/" style={{ color: 'var(--about-text-secondary)', textDecoration: 'none', fontSize: '13px', fontWeight: 500, transition: 'color 0.2s' }}>Home</a>
            <a href="/about" style={{ color: 'var(--about-white)', textDecoration: 'none', fontSize: '13px', fontWeight: 500, transition: 'color 0.2s' }}>About</a>
            <a href="/work" style={{ color: 'var(--about-text-secondary)', textDecoration: 'none', fontSize: '13px', fontWeight: 500, transition: 'color 0.2s' }}>Services</a>
            <a href="/work" style={{ color: 'var(--about-text-secondary)', textDecoration: 'none', fontSize: '13px', fontWeight: 500, transition: 'color 0.2s' }}>Our Work</a>
            <a href="/#contact" style={{ color: 'var(--about-text-secondary)', textDecoration: 'none', fontSize: '13px', fontWeight: 500, transition: 'color 0.2s' }}>Contact</a>
          </div>

          {/* Right: CTA & Mobile Hamburger */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Dashboard Tab (Only visible when user is logged in) */}
            {sessionUser && (
              <a
                href={getDashboardUrl(userRole)}
                className="about-nav-login"
                style={{
                  color: '#4ade80',
                  textDecoration: 'none',
                  fontSize: '12px',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  border: '1px solid rgba(74, 222, 128, 0.35)',
                  background: 'rgba(74, 222, 128, 0.06)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 8px rgba(74, 222, 128, 0.7)' }}></span>
                Dashboard
              </a>
            )}

            <a 
              href={sessionUser ? getDashboardUrl(userRole) : "/login"} 
              onClick={handleStartProjectClick}
              className="about-nav-cta about-btn-primary" 
              style={{ height: '36px', padding: '0 16px', fontSize: '12px' }}
            >
              START A PROJECT
            </a>
            
            <button 
              className="about-hamburger"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                display: 'none',
                padding: '4px'
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          </div>

        </div>
      </nav>

      {/* Mobile Menu Slide-in */}
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(5,5,7,0.98)',
          backdropFilter: 'blur(20px)',
          zIndex: 99,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '32px',
          transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.4s cubic-bezier(0.77, 0, 0.175, 1)'
        }}
      >
        <button 
          onClick={() => setMobileMenuOpen(false)}
          style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'white', fontSize: '32px', cursor: 'pointer' }}
        >
          ×
        </button>
        <a href="/" onClick={() => setMobileMenuOpen(false)} style={{ color: 'white', textDecoration: 'none', fontSize: '24px', fontWeight: 700 }}>Home</a>
        <a href="/about" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--about-accent)', textDecoration: 'none', fontSize: '24px', fontWeight: 700 }}>About</a>
        <a href="/work" onClick={() => setMobileMenuOpen(false)} style={{ color: 'white', textDecoration: 'none', fontSize: '24px', fontWeight: 700 }}>Services</a>
        <a href="/work" onClick={() => setMobileMenuOpen(false)} style={{ color: 'white', textDecoration: 'none', fontSize: '24px', fontWeight: 700 }}>Our Work</a>
        <a href="/#contact" onClick={() => setMobileMenuOpen(false)} style={{ color: 'white', textDecoration: 'none', fontSize: '24px', fontWeight: 700 }}>Contact</a>
        <a href={sessionUser ? getDashboardUrl(userRole) : "/login"} onClick={() => setMobileMenuOpen(false)} style={{ color: sessionUser ? '#4ade80' : 'white', textDecoration: 'none', fontSize: '24px', fontWeight: 700 }}>
          {sessionUser ? 'Dashboard' : 'Login'}
        </a>
        <a 
          href={sessionUser ? getDashboardUrl(userRole) : "/login"} 
          onClick={(e) => {
            setMobileMenuOpen(false);
            handleStartProjectClick(e);
          }} 
          className="about-btn-primary" 
          style={{ marginTop: '24px' }}
        >
          START A PROJECT
        </a>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .about-nav-desktop a:hover {
          color: var(--about-white) !important;
        }
        @media (max-width: 768px) {
          nav { height: 56px !important; }
          .about-nav-desktop, .about-nav-cta { display: none !important; }
          .about-hamburger { display: block !important; }
        }
      `}} />
    </>
  );
}
