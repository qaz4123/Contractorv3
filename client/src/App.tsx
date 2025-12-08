import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import { Layout, ErrorBoundary } from './components';
import { Loader2 } from 'lucide-react';

// Eager load critical pages - faster initial load
import { 
  Login, 
  Register, 
  ForgotPassword, 
  Dashboard,
  Leads,
  Projects,
  Tasks,
  Quotes,
  Invoices,
  Materials,
  MaterialOrders,
  Settings
} from './pages';
import LandingPage from './pages/LandingPage';

// Lazy load only heavy pages
const LeadDetail = lazy(() => import('./pages/LeadDetail').then(m => ({ default: m.LeadDetail })));
const QuoteDetail = lazy(() => import('./pages/QuoteDetail').then(m => ({ default: m.QuoteDetail })));
const Analytics = lazy(() => import('./pages/Analytics').then(m => ({ default: m.Analytics })));
const Subcontractors = lazy(() => import('./pages/Subcontractors').then(m => ({ default: m.Subcontractors })));
const SubcontractorProfile = lazy(() => import('./pages/SubcontractorProfile').then(m => ({ default: m.SubcontractorProfile })));
const Financing = lazy(() => import('./pages/Financing').then(m => ({ default: m.Financing })));
const Commissions = lazy(() => import('./pages/Commissions').then(m => ({ default: m.Commissions })));
const Notifications = lazy(() => import('./pages/Notifications').then(m => ({ default: m.Notifications })));

// Loading fallback component
function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
    </div>
  );
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  if (!isAuthenticated) {
    // Redirect to login
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <Navigate to="/" /> : <>{children}</>;
}

function App() {
  const { isAuthenticated, token } = useAuthStore();
  const [isVerifying, setIsVerifying] = useState(true);

  // On app load, verify token is still valid
  useEffect(() => {
    const verifyAuth = async () => {
      if (token && isAuthenticated) {
        try {
          // Import authService dynamically to avoid circular deps
          const { authService } = await import('./services');
          await authService.me();
        } catch (error) {
          // Token is invalid, logout
          console.error('Token verification failed:', error);
          useAuthStore.getState().logout();
        }
      }
      setIsVerifying(false);
    };
    
    verifyAuth();
  }, [token, isAuthenticated]);

  // Show loading screen while verifying auth
  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <Routes>
      {/* Landing page at root */}
      <Route path="/" element={<LandingPage />} />
      
      {/* Public Routes */}
      <Route path="/welcome" element={<PublicRoute><LandingPage /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/auth" element={<PublicRoute><Login /></PublicRoute>} />
      
      {/* Protected Routes */}
      <Route
        path="/*"
        element={
          <PrivateRoute>
            <Layout>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/leads" element={<Leads />} />
                  <Route path="/leads/:id" element={<LeadDetail />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/tasks" element={<Tasks />} />
                  <Route path="/quotes" element={<Quotes />} />
                  <Route path="/quotes/:id" element={<QuoteDetail />} />
                  <Route path="/invoices" element={<Invoices />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/subcontractors" element={<Subcontractors />} />
                  <Route path="/subcontractor-profile" element={<SubcontractorProfile />} />
                  <Route path="/materials" element={<Materials />} />
                  <Route path="/material-orders" element={<MaterialOrders />} />
                  <Route path="/financing" element={<Financing />} />
                  <Route path="/commissions" element={<Commissions />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </Suspense>
            </Layout>
          </PrivateRoute>
        }
      />
    </Routes>
    </ErrorBoundary>
  );
}

export default App;
