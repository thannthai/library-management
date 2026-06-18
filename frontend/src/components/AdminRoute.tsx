/**
 * AdminRoute.tsx
 * ─────────────────────────────────────────────────────────────
 * Bảo vệ tất cả route /admin/* — chỉ cho phép ROLE_ADMIN.
 *
 * Logic:
 *   - Đang load → hiện spinner
 *   - Chưa đăng nhập → redirect /login
 *   - Đã đăng nhập nhưng KHÔNG phải ADMIN → redirect /dashboard (403 mềm)
 *   - ADMIN → render children
 */

import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Lock } from '@phosphor-icons/react';

interface AdminRouteProps {
  children: ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-[9999]">
        <div className="w-14 h-14 rounded-2xl bg-red-600 flex items-center justify-center shadow-xl shadow-red-300/50 animate-pulse">
          <BookOpen size={28} weight="bold" color="white" />
        </div>
        <p className="mt-5 text-sm font-medium text-slate-400 tracking-wide">
          Verifying Admin access...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const isAdmin = user?.roles?.includes('ROLE_ADMIN') || user?.role === 'ADMIN';

  if (!isAdmin) {
    // User đã đăng nhập nhưng không phải admin → 403 mềm, redirect dashboard user
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-50">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 flex items-center justify-center shadow mb-4">
          <Lock size={32} weight="fill" className="text-rose-500" />
        </div>
        <h1 className="text-xl font-bold text-slate-800 mb-2">Access Denied</h1>
        <p className="text-sm text-slate-500 mb-6 text-center max-w-xs">
          This section is restricted to administrators. Your account does not have permission to access this page.
        </p>
        <a
          href="/dashboard"
          className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          Back to Dashboard
        </a>
      </div>
    );
  }

  return <>{children}</>;
}
