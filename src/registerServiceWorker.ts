/**
 * Robust Service Worker Registration for PWA
 */
export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  // During local development and iframe preview, do not register SW to avoid stale caching
  if (import.meta.env.DEV) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
      }
    });
    return;
  }

  const register = () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('[PWA] Service Worker registered successfully with scope:', registration.scope);

        // Check for updates periodically
        setInterval(() => {
          registration.update().catch((err) => console.debug('[PWA] Auto update check:', err));
        }, 60 * 60 * 1000); // every 1 hour

        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;

          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                console.log('[PWA] New version available; will activate on reload.');
              } else {
                console.log('[PWA] App is ready for offline usage.');
              }
            }
          };
        };
      })
      .catch((error) => {
        console.warn('[PWA] Service Worker registration failed:', error);
      });
  };

  if (document.readyState === 'complete') {
    register();
  } else {
    window.addEventListener('load', register);
  }
}

