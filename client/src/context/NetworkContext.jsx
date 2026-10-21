import React, { createContext, useContext, useState, useEffect } from 'react';

const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const healthUrl = `${apiBaseUrl.replace(/\/api\/?$/, '')}/api/health`;

const NetworkContext = createContext();

export function NetworkProvider({ children }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const [lastCheck, setLastCheck] = useState(new Date());

  // Ping backend to confirm real internet connectivity vs false-positive WiFi connection
  const checkRealConnectivity = async () => {
    if (!navigator.onLine) {
      setIsOnline(false);
      return false;
    }
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(healthUrl, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const online = res.status === 200;
      setIsOnline(online);
      setLastCheck(new Date());
      return online;
    } catch (e) {
      setIsOnline(false);
      return false;
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      checkRealConnectivity().then((online) => {
        if (online) {
          setWasOffline(true);
        }
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    checkRealConnectivity();

    // Check periodically every 15 seconds
    const interval = setInterval(checkRealConnectivity, 15000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  return (
    <NetworkContext.Provider value={{ isOnline, wasOffline, setWasOffline, checkRealConnectivity, lastCheck }}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}
