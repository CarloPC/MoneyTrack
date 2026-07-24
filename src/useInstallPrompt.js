import { useEffect, useState } from 'react';

// Captures the browser's `beforeinstallprompt` event so we can trigger the
// native "Install app" dialog from our own UI.
//
// IMPORTANT: `beforeinstallprompt` is unreliable by design — Chrome only
// fires it after its own internal "engagement" heuristics are satisfied
// (varies by visit count/time on site), and only over HTTPS or localhost.
// It NEVER fires on iOS Safari, and it never fires again once the app is
// installed. That means we can't just hide the button until the event
// shows up — most first-time visitors would never see it. Instead we
// always show the button (unless already installed) and fall back to
// platform-specific manual instructions when no native prompt is available.
export default function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState('other'); // 'ios' | 'android' | 'desktop' | 'other'

  useEffect(() => {
    const ua = window.navigator.userAgent;
    if (/iphone|ipad|ipod/i.test(ua)) {
      setPlatform('ios');
    } else if (/android/i.test(ua)) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    setIsInstalled(standalone);

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Dev helper: if you're testing and the button click keeps falling back
    // to instructions, open devtools console — this tells you whether
    // Chrome ever actually fired the event.
    const timer = setTimeout(() => {
      if (!deferredPrompt) {
        console.info(
          '[PWA] beforeinstallprompt has not fired yet. This is normal on ' +
          'first visits / over plain http — it will not fire at all on iOS ' +
          'Safari, or if the manifest/service worker requirements are not ' +
          'met, or once the app is already installed.'
        );
      }
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    return outcome === 'accepted';
  };

  // A real one-tap native install is available right now.
  const canInstall = Boolean(deferredPrompt) && !isInstalled;

  return { canInstall, promptInstall, isInstalled, platform };
}
