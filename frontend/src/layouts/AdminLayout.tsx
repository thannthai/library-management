/**
 * AdminLayout.tsx
 * ─────────────────────────────────────────────────────────────
 * Shell cho tất cả trang Admin/Thủ thư.
 * Dark slate sidebar + topbar.
 */

import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  House,
  Books,
  ClipboardText,
  Users,
  CurrencyCircleDollar,
  BookOpen,
  SignOut,
  Warning,
  List,
  X,
  Bell,
  ShieldCheck,
} from '@phosphor-icons/react';
import Dialog        from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import { useAuth } from '../context/AuthContext';

// ─── Nav config ───────────────────────────────────────────────────────────────
const ADMIN_NAV_ITEMS = [
  { label: 'Dashboard',      href: '/admin/dashboard',     icon: House },
  { label: 'Fulfillment',    href: '/admin/fulfillment',   icon: ClipboardText },
  { label: 'Books',          href: '/admin/books',         icon: BookOpen },
  { label: 'All Loans',      href: '/admin/loans',         icon: Books },
  { label: 'Fines',          href: '/admin/fines',         icon: CurrencyCircleDollar },
  { label: 'Users',          href: '/admin/users',         icon: Users },
];

// ─── Active check ─────────────────────────────────────────────────────────────
function useIsActive() {
  const location = useLocation();
  return (href: string) => {
    if (href === '/admin/dashboard') return location.pathname === '/admin/dashboard';
    return location.pathname.startsWith(href);
  };
}

// ─── Logout Dialog ────────────────────────────────────────────────────────────
function LogoutDialog({ open, onCancel, onConfirm }: {
  open: boolean; onCancel: () => void; onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth
      slotProps={{ paper: { sx: { borderRadius: '20px', boxShadow: '0 24px 60px rgba(0,0,0,0.15)' } } }}>
      <DialogContent sx={{ padding: 0 }}>
        <div className="p-6">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center">
              <Warning size={28} weight="fill" className="text-rose-500" />
            </div>
          </div>
          <h2 className="text-center text-lg font-bold text-slate-800 mb-2">Confirm Logout</h2>
          <p className="text-center text-sm text-slate-500 leading-relaxed">
            Are you sure you want to log out of the Admin Portal?
          </p>
          <div className="flex gap-3 mt-6">
            <button type="button" onClick={onCancel}
              className="flex-1 h-10 rounded-xl border-2 border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer">
              Cancel
            </button>
            <button type="button" onClick={onConfirm}
              className="flex-1 h-10 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold transition-colors cursor-pointer">
              Logout
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
function AdminSidebar({ onNavClick, onLogout }: { onNavClick?: () => void; onLogout: () => void }) {
  const isActive = useIsActive();
  const { user } = useAuth();

  return (
    <div className="flex flex-col h-full" style={{
      background: 'linear-gradient(175deg, #0f172a 0%, #1e293b 55%, #0f172a 100%)',
    }}>
      {/* Logo */}
      <Link to="/admin/dashboard" className="flex items-center gap-3 px-5 py-5 shrink-0" onClick={onNavClick}>
        <div className="w-9 h-9 bg-red-500/20 backdrop-blur rounded-xl flex items-center justify-center shrink-0">
          <BookOpen size={18} weight="bold" color="#f87171" />
        </div>
        <div>
          <span className="text-white font-bold text-[15px] leading-none">BookNest</span>
          <p className="text-red-400 text-[10px] mt-0.5 font-medium uppercase tracking-widest">Admin Portal</p>
        </div>
      </Link>

      <div className="mx-4 mb-2 h-px bg-white/10" />

      {/* Admin badge */}
      <div className="mx-4 mb-3 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
        <ShieldCheck size={14} weight="fill" className="text-red-400 shrink-0" />
        <span className="text-red-300 text-xs font-semibold truncate">{user?.email || 'Admin'}</span>
      </div>

      {/* Portal Switcher */}
      <div className="mx-4 mb-3">
        <Link to="/dashboard" onClick={onNavClick}
          className="w-full h-9 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer">
          Switch to User View
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-1 flex flex-col gap-0.5 overflow-y-auto">
        {ADMIN_NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link key={href} to={href} onClick={onNavClick}
              className={[
                'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
                active ? 'bg-white/15 text-white' : 'text-slate-400 hover:bg-white/10 hover:text-white',
              ].join(' ')}>
              {active && (
                <motion.span layoutId="admin-sidebar-active"
                  className="absolute inset-0 bg-red-500/20 rounded-xl"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }} />
              )}
              <Icon size={18} weight={active ? 'fill' : 'regular'}
                className={['relative z-10 shrink-0', active ? 'text-red-400' : 'text-slate-500 group-hover:text-white'].join(' ')} />
              <span className="relative z-10 truncate">{label}</span>
              {active && <span className="relative z-10 ml-auto w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-4 mt-1">
        <div className="mx-1 mb-2 h-px bg-white/10" />
        <button type="button" onClick={onLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition-all duration-150 w-full cursor-pointer">
          <SignOut size={18} className="shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

// ─── Topbar ───────────────────────────────────────────────────────────────────
function AdminTopbar({ pageTitle, onMenuClick }: { pageTitle: string; onMenuClick: () => void }) {
  const { user } = useAuth();
  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center px-4 md:px-6 gap-3 shrink-0">
      <button type="button" onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer">
        <List size={20} weight="bold" />
      </button>

      {/* Admin badge pill */}
      <div className="hidden sm:flex items-center gap-2 bg-red-50 border border-red-100 rounded-full px-3 py-1 shrink-0">
        <ShieldCheck size={14} weight="fill" className="text-red-500" />
        <span className="text-red-700 text-xs font-bold uppercase tracking-wide">Admin</span>
      </div>

      <span className="text-slate-700 font-semibold text-[15px] shrink-0 hidden sm:block">{pageTitle}</span>

      <div className="ml-auto flex items-center gap-2">
        <button type="button"
          className="relative w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors cursor-pointer">
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-rose-500" />
        </button>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
          {(user?.email?.[0] ?? 'A').toUpperCase()}
        </div>
      </div>
    </header>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────
interface AdminLayoutProps {
  children: ReactNode;
  pageTitle?: string;
}

export default function AdminLayout({ children, pageTitle = 'Admin Dashboard' }: AdminLayoutProps) {
  const [mobileOpen,       setMobileOpen]       = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const { logout } = useAuth();

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <LogoutDialog
        open={logoutDialogOpen}
        onCancel={() => setLogoutDialogOpen(false)}
        onConfirm={async () => { setLogoutDialogOpen(false); await logout(); }}
      />

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:shrink-0 lg:w-[240px] h-full">
        <AdminSidebar onLogout={() => setLogoutDialogOpen(true)} />
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div key="backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
              onClick={() => setMobileOpen(false)} />
            <motion.div key="drawer"
              initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed top-0 left-0 h-full w-[240px] z-50 lg:hidden flex flex-col">
              <button type="button" onClick={() => setMobileOpen(false)}
                className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer">
                <X size={16} weight="bold" />
              </button>
              <AdminSidebar
                onNavClick={() => setMobileOpen(false)}
                onLogout={() => { setMobileOpen(false); setLogoutDialogOpen(true); }} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminTopbar pageTitle={pageTitle} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
