import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

// Load Google Maps API dynamically
const loadGoogleMapsAPI = () => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyA83NhFFyPif5Fj1vlBJawzr2AUdznrhPQ';
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
  script.async = true;
  script.defer = true;
  script.onerror = () => {
    window.isMapsApiBlocked = true;
    window.dispatchEvent(new Event('maps-api-blocked'));
  };
  document.head.appendChild(script);
};

// Load Maps API when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadGoogleMapsAPI);
} else {
  loadGoogleMapsAPI();
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
