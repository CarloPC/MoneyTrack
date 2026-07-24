import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import styles from './OfflineBanner.module.css';

// Shows a red banner across the top of the app whenever the browser loses
// its internet connection, and a brief green "back online" confirmation
// when it reconnects.
export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 2500);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showReconnected) return null;

  return (
    <div className={`${styles.banner} ${isOnline ? styles.online : styles.offline}`}>
      <WifiOff size={14} />
      <span>{isOnline ? 'Back online' : 'No internet connection — some features may not work.'}</span>
    </div>
  );
}
