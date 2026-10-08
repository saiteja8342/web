/**
 * PWA & Chrome Shortcut App Installer Utility
 * Manages service worker registration, Chrome beforeinstallprompt event,
 * standalone mode detection, and installation prompts.
 */

let deferredPrompt = null;
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

// Register Service Worker
export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        // console.log('[PWA] Service Worker registered:', reg.scope);
      })
      .catch((err) => {
        console.warn('[PWA] Service Worker registration skipped:', err);
      });
  });
}

// Auto-register service worker on load
if (typeof window !== 'undefined') {
  registerServiceWorker();
  isInstalled = isStandaloneApp();

  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    deferredPrompt = e;
    notifyListeners({ isInstallable: true, isInstalled: false });
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
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
  callback({
    isInstallable: Boolean(deferredPrompt),
    isInstalled: isInstalled || isStandaloneApp(),
  });
  return () => {
    listeners.delete(callback);
  };
}

/**
 * Trigger Chrome Shortcut / PWA install prompt.
 * Returns: { outcome: 'accepted' | 'dismissed' | 'manual_required', method: string }
 */
export async function triggerInstallApp() {
  if (isStandaloneApp()) {
    return { outcome: 'already_installed', message: 'Already running as standalone app.' };
  }

  if (deferredPrompt) {
    try {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      deferredPrompt = null;
      notifyListeners({ isInstallable: false, isInstalled: choiceResult.outcome === 'accepted' });
      return { outcome: choiceResult.outcome, method: 'native' };
    } catch (err) {
      console.warn('[PWA] Install prompt failed:', err);
    }
  }

  // If deferredPrompt is not available (e.g. desktop Chrome already dismissed, or Safari/iOS)
  return { outcome: 'manual_required', method: 'instructions' };
}
