import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Sparkles, 
  Film, 
  Star, 
  Mail, 
  X, 
  MessageSquare,
  ArrowRight
} from 'lucide-react';

export default function MobileSidebar({ isOpen, onClose }) {
  const links = [
    { label: 'Home', href: '#', icon: <Home className="h-5 w-5 shrink-0 text-white/80" /> },
    { label: 'Services', href: '#services', icon: <Sparkles className="h-5 w-5 shrink-0 text-white/80" /> },
    { label: 'Work', href: '#work', icon: <Film className="h-5 w-5 shrink-0 text-white/80" /> },
    { label: 'Testimonials', href: '#testimonials', icon: <Star className="h-5 w-5 shrink-0 text-white/80" /> },
    { label: 'Contact', href: '#contact', icon: <Mail className="h-5 w-5 shrink-0 text-white/80" /> },
  ];

  const sidebarVariants = {
    closed: {
      x: '100%',
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 40
      }
    },
    open: {
      x: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
        staggerChildren: 0.08,
        delayChildren: 0.1
      }
    }
  };

  const linkVariants = {
    closed: { opacity: 0, x: 30 },
    open: { opacity: 1, x: 0 }
  };

  const backdropVariants = {
    closed: { opacity: 0 },
    open: { opacity: 1 }
  };

  const handleLinkClick = (e, href) => {
    onClose();
    if (href.startsWith('#')) {
      const targetEl = document.querySelector(href === '#' ? 'body' : href);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="mobile-sidebar-root">
          {/* Backdrop Blur Overlay */}
          <motion.div
            className="mobile-sidebar-backdrop"
            initial="closed"
            animate="open"
            exit="closed"
            variants={backdropVariants}
            onClick={onClose}
          />

          {/* Slide-out Sidebar Drawer */}
          <motion.aside
            className="mobile-sidebar-drawer"
            initial="closed"
            animate="open"
            exit="closed"
            variants={sidebarVariants}
          >
            {/* Header */}
            <div className="mobile-sidebar-header">
              <div className="mobile-sidebar-brand">
                <img
                  src="/image/mne_logo.png"
                  alt="MotionNodeEdits AI Video Production Studio Logo"
                  className="mobile-sidebar-logo"
                  width="40"
                  height="40"
                  loading="lazy"
                />
                <div className="mobile-sidebar-title-wrap">
                  <span className="mobile-sidebar-name">MotionNodeEdits</span>
                  <span className="mobile-sidebar-tagline">AI Video & Avatar Studio</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="mobile-sidebar-close-btn"
                aria-label="Close Menu"
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="mobile-sidebar-nav">
              {links.map((link, idx) => (
                <motion.a
                  key={idx}
                  href={link.href}
                  variants={linkVariants}
                  onClick={(e) => handleLinkClick(e, link.href)}
                  className="mobile-sidebar-link"
                >
                  <div className="mobile-sidebar-link-icon">
                    {link.icon}
                  </div>
                  <span className="mobile-sidebar-link-label">{link.label}</span>
                  <ArrowRight className="h-4 w-4 text-white/30 mobile-sidebar-arrow" />
                </motion.a>
              ))}
            </nav>

            {/* Bottom Actions */}
            <div className="mobile-sidebar-footer">
              <a
                href="#contact"
                onClick={(e) => handleLinkClick(e, '#contact')}
                className="mobile-sidebar-cta-btn"
              >
                <span>Start a Project</span>
                <ArrowRight className="h-4 w-4" />
              </a>

              <a
                href="https://wa.me/918985351756?text=Hi%20MotionNodeEdits,%20I'd%20like%20to%20discuss%20a%20video%20project."
                target="_blank"
                rel="noopener noreferrer"
                className="mobile-sidebar-wa-btn"
              >
                <MessageSquare className="h-4 w-4 text-emerald-400" />
                <span>WhatsApp Support</span>
              </a>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
