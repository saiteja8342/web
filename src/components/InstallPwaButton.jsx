import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  Monitor, 
  Smartphone, 
  X, 
  Check, 
  Share,
  Layers,
  Zap
} from 'lucide-react';
import { 
  triggerInstallApp, 
  subscribePwaState, 
  isStandaloneApp, 
  getClientPlatform 
} from '../utils/pwaInstaller';

export default function InstallPwaButton({ 
  variant = 'vel-btn', 
  className = '',
  buttonLabel
}) {
  const [pwaState, setPwaState] = useState({ isInstallable: false, isInstalled: false });
  const [showModal, setShowModal] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);
  const [deviceTab, setDeviceTab] = useState('android'); // 'android' | 'ios' | 'desktop'
  const platform = getClientPlatform();

  useEffect(() => {
    if (platform.isIOS) {
      setDeviceTab('ios');
    } else if (platform.isMobile) {
      setDeviceTab('android');
    } else {
      setDeviceTab('desktop');
    }

    const unsubscribe = subscribePwaState((state) => {
      setPwaState(state);
    });
    return () => unsubscribe();
  }, []);

  const standalone = isStandaloneApp();

  if (standalone && variant === 'navbar') {
    return null;
  }

  const handleInstallClick = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();

    const result = await triggerInstallApp();
    if (result.outcome === 'accepted') {
      setInstallSuccess(true);
      setTimeout(() => setInstallSuccess(false), 4000);
    } else {
      setShowModal(true);
    }
  };

  const label = buttonLabel || (standalone ? 'Add to Other Devices' : 'Install / Add Web App');

  return (
    <>
      {/* 1. ADMIN STUDIO NATIVE BUTTON (.vel-btn-solid) */}
      {variant === 'vel-btn' && (
        <button
          type="button"
          onClick={handleInstallClick}
          className={`vel-btn-solid ${className}`}
          style={{ cursor: 'pointer' }}
        >
          {installSuccess ? (
            <>
              <Check style={{ width: '15px', height: '15px', color: '#16a34a' }} />
              <span>Installed!</span>
            </>
          ) : (
            <>
              <Download style={{ width: '15px', height: '15px' }} />
              <span>{label}</span>
            </>
          )}
        </button>
      )}

      {/* 2. CLIENT / EDITOR NATIVE BUTTON (.cp-btn-primary-action) */}
      {variant === 'cp-btn' && (
        <button
          type="button"
          onClick={handleInstallClick}
          className={`cp-btn-primary-action ${className}`}
          style={{ cursor: 'pointer' }}
        >
          {installSuccess ? (
            <>
              <Check className="h-4 w-4" style={{ color: '#16a34a' }} />
              <span>Installed!</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              <span>{label}</span>
            </>
          )}
        </button>
      )}

      {/* 3. SETTINGS CARD (Fully responsive, stacked, obsidian cinema theme) */}
      {variant === 'settings-card' && (
        <div 
          className={className}
          style={{
            background: 'rgba(18, 19, 29, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            width: '100%',
            boxSizing: 'border-box'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <div 
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Smartphone style={{ width: '20px', height: '20px', color: '#FFFFFF' }} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#FFFFFF' }}>
                  MotionNode Web App
                </span>
                <span 
                  style={{
                    fontSize: '0.68rem',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    color: '#94A3B8',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    fontWeight: 600
                  }}
                >
                  PWA
                </span>
                {standalone && (
                  <span 
                    style={{
                      fontSize: '0.68rem',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      background: 'rgba(34, 197, 94, 0.1)',
                      color: '#4ade80',
                      border: '1px solid rgba(34, 197, 94, 0.25)',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Check style={{ width: '11px', height: '11px' }} /> Active on this device
                  </span>
                )}
              </div>

              <p style={{ fontSize: '0.82rem', color: '#94A3B8', margin: '6px 0 0 0', lineHeight: 1.5 }}>
                Add to your phone or computer home screen. Runs borderless in full screen with offline caching and instant launch.
              </p>
            </div>
          </div>

          <div style={{ alignSelf: 'flex-start', paddingTop: '2px' }}>
            <button
              type="button"
              onClick={handleInstallClick}
              className="vel-btn-solid"
              style={{ cursor: 'pointer' }}
            >
              {installSuccess ? (
                <>
                  <Check style={{ width: '15px', height: '15px', color: '#16a34a' }} />
                  <span>Installed!</span>
                </>
              ) : (
                <>
                  <Download style={{ width: '15px', height: '15px' }} />
                  <span>{label}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 4. NAVBAR BUTTON */}
      {variant === 'navbar' && (
        <button
          type="button"
          onClick={handleInstallClick}
          className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-neutral-200 hover:text-white text-xs font-medium transition-all duration-200 group"
          title="Install MotionNodeEdits as Web App"
        >
          <Smartphone className="w-3.5 h-3.5 text-neutral-300" />
          <span className="hidden sm:inline">Add App</span>
          <span className="sm:hidden">Install</span>
        </button>
      )}

      {/* 5. MOBILE DRAWER VARIANT */}
      {variant === 'mobile' && (
        <button
          type="button"
          onClick={handleInstallClick}
          className="w-full flex items-center justify-between p-3 rounded-xl bg-white/[0.05] border border-white/10 text-white text-xs font-semibold hover:border-white/20 transition-all"
        >
          <div className="flex items-center gap-2.5">
            <Smartphone className="w-4 h-4 text-neutral-300" />
            <span>Install Mobile Web App</span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-neutral-300">
            PWA
          </span>
        </button>
      )}

      {/* MULTI-DEVICE INSTALL INSTRUCTIONS MODAL (Cinema Obsidian Architecture) */}
      <AnimatePresence>
        {showModal && (
          <div 
            className="vel-modal-backdrop" 
            onClick={() => setShowModal(false)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.85)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              zIndex: 99999,
              boxSizing: 'border-box'
            }}
          >
            {/* Modal Dialog Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="vel-modal-dialog"
              style={{
                background: '#12131D',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '540px',
                maxHeight: '88vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 24px 60px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.04)',
                boxSizing: 'border-box',
                overflow: 'hidden'
              }}
            >
              {/* Modal Head */}
              <div 
                className="vel-modal-head"
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  background: '#161724',
                  boxSizing: 'border-box'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div 
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: '#07080C',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4px',
                      flexShrink: 0
                    }}
                  >
                    <img
                      src="/image/mne_logo.png"
                      alt="MotionNode"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px' }}
                    />
                  </div>
                  <div>
                    <h3 
                      style={{ 
                        fontSize: '1rem', 
                        fontWeight: 700, 
                        color: '#FFFFFF', 
                        margin: 0,
                        fontFamily: "'Space Grotesk', sans-serif",
                        lineHeight: 1.2
                      }}
                    >
                      Install MotionNode Web App
                    </h3>
                    <p style={{ fontSize: '0.74rem', color: '#94A3B8', margin: '3px 0 0 0' }}>
                      Fast full-screen standalone application
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#94A3B8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  title="Close modal"
                >
                  <X style={{ width: '16px', height: '16px' }} />
                </button>
              </div>

              {/* Modal Body (Scrollable & Responsive) */}
              <div 
                className="vel-modal-body"
                style={{
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  overflowY: 'auto',
                  boxSizing: 'border-box'
                }}
              >
                {/* Highlights telemetry row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                  <div 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 14px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '10px',
                      fontSize: '0.76rem',
                      color: '#E2E8F0'
                    }}
                  >
                    <Zap style={{ width: '15px', height: '15px', color: '#EAB308', flexShrink: 0 }} />
                    <span style={{ fontWeight: 600 }}>1-Tap Instant Launch</span>
                  </div>
                  <div 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 14px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '10px',
                      fontSize: '0.76rem',
                      color: '#E2E8F0'
                    }}
                  >
                    <Monitor style={{ width: '15px', height: '15px', color: '#22C55E', flexShrink: 0 }} />
                    <span style={{ fontWeight: 600 }}>Borderless Window</span>
                  </div>
                </div>

                {/* Device Selector Tabs */}
                <div 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    boxSizing: 'border-box'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setDeviceTab('android')}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: deviceTab === 'android' ? 700 : 500,
                      background: deviceTab === 'android' ? '#FFFFFF' : 'transparent',
                      color: deviceTab === 'android' ? '#050508' : '#94A3B8',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Smartphone style={{ width: '14px', height: '14px' }} />
                    <span>Android</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeviceTab('ios')}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: deviceTab === 'ios' ? 700 : 500,
                      background: deviceTab === 'ios' ? '#FFFFFF' : 'transparent',
                      color: deviceTab === 'ios' ? '#050508' : '#94A3B8',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>🍏</span>
                    <span>iPhone / iPad</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeviceTab('desktop')}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: deviceTab === 'desktop' ? 700 : 500,
                      background: deviceTab === 'desktop' ? '#FFFFFF' : 'transparent',
                      color: deviceTab === 'desktop' ? '#050508' : '#94A3B8',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Monitor style={{ width: '14px', height: '14px' }} />
                    <span>Computer</span>
                  </button>
                </div>

                {/* Step-by-Step Instructions Container */}
                <div 
                  style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '16px 18px',
                    boxSizing: 'border-box'
                  }}
                >
                  {deviceTab === 'android' && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                        <Smartphone style={{ width: '15px', height: '15px', color: '#94A3B8' }} />
                        <h4 style={{ fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#FFFFFF', margin: 0 }}>
                          Android (Chrome / Samsung Internet):
                        </h4>
                      </div>
                      <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '0.82rem', color: '#CBD5E1', display: 'flex', flexDirection: 'column', gap: '8px', lineHeight: 1.55 }}>
                        <li>Tap the <strong style={{ color: '#FFFFFF' }}>Three Dots Menu (⋮)</strong> at the top-right corner of Chrome.</li>
                        <li>Tap <strong style={{ color: '#FFFFFF', textDecoration: 'underline' }}>"Install app"</strong> or <strong style={{ color: '#FFFFFF', textDecoration: 'underline' }}>"Add to Home screen"</strong>.</li>
                        <li>Tap <strong style={{ color: '#FFFFFF' }}>Install</strong> when prompted. The MotionNode icon will be added to your home screen!</li>
                      </ol>
                    </div>
                  )}

                  {deviceTab === 'ios' && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                        <Share style={{ width: '15px', height: '15px', color: '#94A3B8' }} />
                        <h4 style={{ fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#FFFFFF', margin: 0 }}>
                          iPhone / iPad (Safari):
                        </h4>
                      </div>
                      <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '0.82rem', color: '#CBD5E1', display: 'flex', flexDirection: 'column', gap: '8px', lineHeight: 1.55 }}>
                        <li>Open this page in <strong style={{ color: '#FFFFFF' }}>Safari</strong>.</li>
                        <li>Tap the <strong style={{ color: '#FFFFFF' }}>Share button (⎋)</strong> on the bottom bar of your screen.</li>
                        <li>Scroll down and tap <strong style={{ color: '#FFFFFF', textDecoration: 'underline' }}>"Add to Home Screen" (➕)</strong>.</li>
                        <li>Tap <strong style={{ color: '#FFFFFF' }}>Add</strong> in the top-right. It opens in borderless full screen like a native iOS app!</li>
                      </ol>
                    </div>
                  )}

                  {deviceTab === 'desktop' && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                        <Monitor style={{ width: '15px', height: '15px', color: '#94A3B8' }} />
                        <h4 style={{ fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#FFFFFF', margin: 0 }}>
                          Desktop PC / Mac (Chrome, Edge, Brave):
                        </h4>
                      </div>
                      <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '0.82rem', color: '#CBD5E1', display: 'flex', flexDirection: 'column', gap: '8px', lineHeight: 1.55 }}>
                        <li>Look at the browser address bar (top-right) for the <strong style={{ color: '#FFFFFF' }}>Install icon (⊕)</strong>.</li>
                        <li>Or click the <strong style={{ color: '#FFFFFF' }}>Three Dots Menu (⋮)</strong> &rarr; Save and share &rarr; <strong style={{ color: '#FFFFFF', textDecoration: 'underline' }}>"Install MotionNodeEdits..."</strong></li>
                        <li>Click <strong style={{ color: '#FFFFFF' }}>Install</strong> to launch MotionNode in its own standalone desktop window.</li>
                      </ol>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer (Pinned Actions with Standard Padding) */}
              <div 
                className="vel-modal-foot"
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  background: '#14141E',
                  boxSizing: 'border-box'
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '9px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    color: '#FFFFFF',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const res = await triggerInstallApp();
                    if (res.outcome === 'accepted') {
                      setShowModal(false);
                      setInstallSuccess(true);
                      setTimeout(() => setInstallSuccess(false), 4000);
                    }
                  }}
                  style={{
                    padding: '9px 20px',
                    borderRadius: '9px',
                    background: 'linear-gradient(135deg, #FFFFFF 0%, #E2E8F0 100%)',
                    color: '#050508',
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(255, 255, 255, 0.15)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Download style={{ width: '15px', height: '15px' }} />
                  <span>Prompt Direct Install</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
