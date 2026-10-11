/**
 * PWA & Chrome Shortcut App Installer Utility
 * Manages service worker registration, Chrome beforeinstallprompt event,
 * standalone mode detection, and installation prompts.
 */

let deferredPrompt = typeof window !== 'undefined' ? (window.__deferredPrompt || null) : null;
const listeners = new Set();
let isInstalled = false;

// Check if app is running as standalone windowed app
export function isStandaloneApp() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://')
  );
}

// Check platform
export function getClientPlatform() {
  if (typeof navigator === 'undefined') return { isChrome: false, isMobile: false, isIOS: false };
  const ua = navigator.userAgent.toLowerCase();
  const isChrome = ua.includes('chrome') && !ua.includes('edg') && !ua.includes('opr');
  const isMobile = /android|iphone|ipad|ipod|mobile/.test(ua);
  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isMac = ua.includes('macintosh');
  const isWindows = ua.includes('windows');
  return { isChrome, isMobile, isIOS, isMac, isWindows };
}

// Register Service Worker immediately without waiting for missed 'load' event
export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  const doRegister = () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        // console.log('[PWA] Service Worker registered:', reg.scope);
      })
      .catch((err) => {
        console.warn('[PWA] Service Worker registration skipped:', err);
      });
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    doRegister();
  } else {
    window.addEventListener('load', doRegister);
  }
}

// Auto-register service worker on load & capture prompt
if (typeof window !== 'undefined') {
  registerServiceWorker();
  isInstalled = isStandaloneApp();

  if (window.__deferredPrompt) {
    deferredPrompt = window.__deferredPrompt;
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent default mini-infobar on Android
    e.preventDefault();
    deferredPrompt = e;
    window.__deferredPrompt = e;
    notifyListeners({ isInstallable: true, isInstalled: false });
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    window.__deferredPrompt = null;
    isInstalled = true;
    notifyListeners({ isInstallable: false, isInstalled: true });
    console.log('[PWA] MotionNodeEdits Chrome Shortcut App was installed!');
  });
}

function notifyListeners(state) {
  listeners.forEach((fn) => {
    try {
      fn(state);
    } catch (_) {}
  });
}

export function subscribePwaState(callback) {
  listeners.add(callback);
  const promptAvailable = Boolean(deferredPrompt || (typeof window !== 'undefined' && window.__deferredPrompt));
  callback({
    isInstallable: promptAvailable,
    isInstalled: isInstalled || isStandaloneApp(),
  });
  return () => {
    listeners.delete(callback);
  };
}

/**
 * Trigger Chrome Shortcut / PWA install prompt.
 * Directly triggers native Chrome / Android install popup if available!
 * Returns: { outcome: 'accepted' | 'dismissed' | 'manual_required', method: string }
 */
export async function triggerInstallApp() {
  if (isStandaloneApp()) {
    return { outcome: 'already_installed', message: 'Already running as standalone app.' };
  }

  const promptToUse = deferredPrompt || (typeof window !== 'undefined' ? window.__deferredPrompt : null);

  if (promptToUse) {
    try {
      // Trigger Chrome's native bottom-sheet installation dialog on Android / Desktop
      await promptToUse.prompt();
      const choiceResult = await promptToUse.userChoice;
      deferredPrompt = null;
      if (typeof window !== 'undefined') window.__deferredPrompt = null;
      notifyListeners({ isInstallable: false, isInstalled: choiceResult.outcome === 'accepted' });
      return { outcome: choiceResult.outcome, method: 'native' };
    } catch (err) {
      console.warn('[PWA] Native install prompt error:', err);
    }
  }

  // If deferredPrompt is not available (e.g. iOS Safari, or insecure HTTP origin)
  return { outcome: 'manual_required', method: 'instructions' };
}

