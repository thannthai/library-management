/**
 * App.tsx
 * ─────────────────────────────────────────────────────────────
 * Root component.
 * - Wraps the app in AuthProvider (handles session bootstrap & global state).
 * - Shows a branded loading screen while the initial /auth/me check runs.
 * - Declares all client-side routes.
 * ─────────────────────────────────────────────────────────────
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BookOpen } from '@phosphor-icons/react';
import { Toaster } from 'react-hot-toast';
import './index.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute           from './components/ProtectedRoute';
import AdminRoute               from './components/AdminRoute';

import LandingPage              from './pages/LandingPage/LandingPage';
import BrowseBooksPage          from './pages/BrowseBooks/BrowseBooksPage';
import DashboardBrowseBooksPage from './pages/BrowseBooks/DashboardBrowseBooksPage';
import SubscriptionPlansPage    from './pages/Subscription/SubscriptionPlansPage';
import MyLoansPage              from './pages/Loans/MyLoansPage';
import LoginPage                from './pages/Login/LoginPage';
import RegisterPage             from './pages/Register/RegisterPage';
import ForgotPasswordPage       from './pages/ForgotPassword/ForgotPasswordPage';
import ResetPasswordPage        from './pages/ResetPassword/ResetPasswordPage';
import DashboardPage            from './pages/Dashboard/DashboardPage';
import ReservationsPage         from './pages/Dashboard/ReservationsPage';
import FavoritesPage            from './pages/Dashboard/FavoritesPage';
import ProfilePage              from './pages/Dashboard/ProfilePage';
import SettingsPage             from './pages/Dashboard/SettingsPage';

// Admin pages
import AdminDashboardPage       from './pages/Admin/AdminDashboardPage';
import AdminFulfillmentPage     from './pages/Admin/AdminFulfillmentPage';
import AdminLoansPage           from './pages/Admin/AdminLoansPage';
import AdminBooksPage           from './pages/Admin/AdminBooksPage';
import AdminFinesPage           from './pages/Admin/AdminFinesPage';
import AdminUsersPage           from './pages/Admin/AdminUsersPage';

// ─── Loading Screen ───────────────────────────────────────────────────────────
function AppLoadingScreen() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-[9999]">
      <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-300/50 animate-pulse">
        <BookOpen size={28} weight="bold" color="white" />
      </div>
      <p className="mt-5 text-sm font-medium text-slate-400 tracking-wide">
        Đang khởi động BookNest…
      </p>
    </div>
  );
}

// ─── Router Tree (needs access to AuthContext for loading gate) ───────────────
function AppRoutes() {
  const { isLoading } = useAuth();

  if (isLoading) return <AppLoadingScreen />;

  return (
    <Routes>
      {/* Public */}
      <Route path="/"                element={<LandingPage />} />
      <Route path="/books"           element={<BrowseBooksPage />} />
      <Route path="/login"           element={<LoginPage />} />
      <Route path="/register"        element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password"  element={<ResetPasswordPage />} />
      {/* Authenticated */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/books"
        element={
          <ProtectedRoute>
            <DashboardBrowseBooksPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/loans"
        element={
          <ProtectedRoute>
            <MyLoansPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/subscriptions"
        element={
          <ProtectedRoute>
            <SubscriptionPlansPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/reservations"
        element={
          <ProtectedRoute>
            <ReservationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/favorites"
        element={
          <ProtectedRoute>
            <FavoritesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      {/* ── Admin Routes ─────────────────────────────────────────────── */}
      <Route
        path="/admin/dashboard"
        element={
          <AdminRoute>
            <AdminDashboardPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/fulfillment"
        element={
          <AdminRoute>
            <AdminFulfillmentPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/loans"
        element={
          <AdminRoute>
            <AdminLoansPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/books"
        element={
          <AdminRoute>
            <AdminBooksPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/fines"
        element={
          <AdminRoute>
            <AdminFinesPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <AdminRoute>
            <AdminUsersPage />
          </AdminRoute>
        }
      />
    </Routes>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
