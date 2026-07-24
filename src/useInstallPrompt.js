import { useEffect, useState } from 'react';

// Captures the browser's `beforeinstallprompt` event so we can trigger the
// native "Install app" dialog from our own UI (the sidebar button), instead
// of relying on the browser's built-in address-bar icon.
//
// Notes on platform support:
// - Android Chrome / Edge: fires `beforeinstallprompt`, `promptInstall()` works.
// - Desktop Chrome / Edge: same as above.
// - iOS Safari: does NOT support `beforeinstallprompt` at all. There is no
//   programmatic install API on iOS — the user has to use
//   Share -> "Add to Home Screen" manually. We detect this case separately
//   so the UI can show instructions instead of a broken button.
export default function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent;
    const iosDevice = /iphone|ipad|ipod/i.test(ua);
    setIsIos(iosDevice);

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
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  // canInstall: a real one-tap install is available right now.
  const canInstall = Boolean(deferredPrompt) && !isInstalled;

  return { canInstall, promptInstall, isInstalled, isIos };
}
