import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

// Global singleton for Google Maps API loading
// Prevents multiple script injections even with React.StrictMode
declare global {
  interface Window {
    __mapsApiLoader?: {
      loading: boolean;
      loaded: boolean;
      promise?: Promise<void>;
    };
    google?: any;
    isMapsApiBlocked?: boolean;
  }
}

// Initialize global loader state
if (!window.__mapsApiLoader) {
  window.__mapsApiLoader = {
    loading: false,
    loaded: false,
  };
}

const loadGoogleMapsAPI = (): Promise<void> => {
  const loader = window.__mapsApiLoader!;
  
  // Return existing promise if already loading
  if (loader.promise) {
    return loader.promise;
  }
  
  // Return resolved promise if already loaded
  if (loader.loaded) {
    return Promise.resolve();
  }
  
  // Check if script already exists in DOM (from previous load or hot reload)
  const existingScript = document.querySelector('script#google-maps-api-script') || 
                         document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
  if (existingScript) {
    // Check if Maps API is actually available
    if (window.google?.maps?.places) {
      loader.loaded = true;
      return Promise.resolve();
    }
    // Script exists but API not ready yet - wait for it (max 10 seconds)
    loader.promise = new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 100; // 10 seconds max
      const checkReady = () => {
        attempts++;
        if (window.google?.maps?.places) {
          loader.loaded = true;
          loader.promise = undefined;
          resolve();
        } else if (attempts >= maxAttempts) {
          // Timeout - Maps API failed to load (silent failure)
          window.isMapsApiBlocked = true;
          window.dispatchEvent(new Event('maps-api-blocked'));
          loader.promise = undefined;
          resolve(); // Resolve to prevent hanging
        } else {
          setTimeout(checkReady, 100);
        }
      };
      checkReady();
    });
    return loader.promise;
  }

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  
  // If no API key, disable Maps features gracefully (silent)
  if (!apiKey) {
    window.isMapsApiBlocked = true;
    window.dispatchEvent(new Event('maps-api-blocked'));
    loader.loaded = false;
    return Promise.resolve();
  }

  loader.loading = true;

  // Create promise that resolves when Maps API is loaded
  loader.promise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    script.id = 'google-maps-api-script'; // Add ID to prevent duplicates
    
    script.onload = () => {
      // Wait for google.maps.places to be available (max 10 seconds)
      let attempts = 0;
      const maxAttempts = 200; // 10 seconds max
      const checkPlaces = () => {
        attempts++;
        if (window.google?.maps?.places) {
          loader.loaded = true;
          loader.loading = false;
          loader.promise = undefined;
          resolve();
        } else if (attempts >= maxAttempts) {
          // Timeout - Maps API loaded but places not available (silent failure)
          window.isMapsApiBlocked = true;
          window.dispatchEvent(new Event('maps-api-blocked'));
          loader.loading = false;
          loader.promise = undefined;
          resolve(); // Resolve to prevent hanging
        } else {
          setTimeout(checkPlaces, 50);
        }
      };
      checkPlaces();
    };
    
    script.onerror = () => {
      // Silent failure - user will see manual input fallback
      window.isMapsApiBlocked = true;
      window.dispatchEvent(new Event('maps-api-blocked'));
      loader.loading = false;
      loader.promise = undefined;
      // Resolve (not reject) to prevent unhandled promise rejection
      resolve();
    };
    
    document.head.appendChild(script);
  });

  return loader.promise;
};

// Load Maps API when DOM is ready (only once, even with hot reload)
// Note: This runs before React renders, so components will check for Maps availability in useEffect
// Components have retry logic (MAX_RETRIES) to wait for Maps to load, with graceful degradation
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => loadGoogleMapsAPI().catch(() => {}));
} else {
  loadGoogleMapsAPI().catch(() => {});
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <App />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </HashRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
