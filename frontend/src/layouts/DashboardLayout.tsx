/**
 * DashboardLayout.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Shell for all authenticated dashboard pages.
 * Responsive:
 *   - lg+  : fixed sidebar (240px) + content area
 *   - < lg : sidebar hidden, topbar has hamburger → drawer overlay
 *
 * Changes:
 *   - Removed global search bar (only in BrowseBooksPage)
 *   - Added NotificationBell with real API data + dropdown
 */

import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  House,
  Books,
  ClockCounterClockwise,
  CalendarCheck,
  Heart,
  CreditCard,
  SignOut,
  User,
  GearSix,
  Bell,
  BookOpen,
  CaretDown,
  List,
  X,
  Warning,
  ShieldCheck,
  CheckCircle,
  Clock,
  Star,
  CurrencyCircleDollar,
  BookBookmark,
} from '@phosphor-icons/react';
import Dialog        from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import { useAuth } from '../context/AuthContext';
import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type NotificationItem,
} from '../api/notificationsApi';

// ─── Nav config ───────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { label: 'Dashboard',       href: '/dashboard',              icon: House },
  { label: 'Browse Books',    href: '/dashboard/books',        icon: Books },
  { label: 'My Loans',        href: '/dashboard/loans',        icon: ClockCounterClockwise },
  { label: 'My Reservations', href: '/dashboard/reservations', icon: CalendarCheck },
  { label: 'My Favorites',    href: '/dashboard/favorites',    icon: Heart },
  { label: 'Subscriptions',   href: '/dashboard/subscriptions',icon: CreditCard },
];

// ─── Shared active-check ──────────────────────────────────────────────────────
function useIsActive() {
  const location = useLocation();
  return (href: string) => {
    if (href === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(href);
  };
}

// ─── Notification type → icon + color ────────────────────────────────────────
function notifConfig(type: NotificationItem['type']) {
  switch (type) {
    case 'VIP_EXPIRY':
      return { icon: Star, bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-500' };
    case 'RESERVATION_READY':
      return { icon: BookBookmark, bg: 'bg-indigo-50', text: 'text-indigo-600', dot: 'bg-indigo-500' };
    case 'LOAN_EXPIRING':
      return { icon: Clock, bg: 'bg-orange-50', text: 'text-orange-600', dot: 'bg-orange-500' };
    case 'FINE_ISSUED':
      return { icon: CurrencyCircleDollar, bg: 'bg-rose-50', text: 'text-rose-600', dot: 'bg-rose-500' };
    default:
      return { icon: Bell, bg: 'bg-slate-50', text: 'text-slate-600', dot: 'bg-slate-400' };
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// ─── Notification Bell ────────────────────────────────────────────────────────
function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyNotifications();
      setNotifications(data);
    } catch {
      // silently fail — bell just shows empty
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on mount + poll every 60s
  useEffect(() => {
    fetchNotifications();
    const timer = setInterval(fetchNotifications, 60000);
    return () => clearInterval(timer);
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMarkRead = async (id: number) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch { /* ignore */ }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch { /* ignore */ }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-0.5 rounded-full bg-rose-500 text-[9px] font-bold text-white flex items-center justify-center leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/60 overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Bell size={15} weight="fill" className="text-indigo-500" />
                <span className="text-sm font-bold text-slate-800">Notifications</span>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                    {unreadCount}
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-[11px] text-indigo-500 hover:text-indigo-700 font-semibold cursor-pointer transition-colors"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto">
              {loading && notifications.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="py-10 text-center">
                  <CheckCircle size={28} className="text-slate-200 mx-auto mb-2" weight="fill" />
                  <p className="text-sm text-slate-400">No notifications</p>
                </div>
              ) : (
                notifications.slice(0, 20).map((notif) => {
                  const cfg = notifConfig(notif.type);
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={notif.id}
                      type="button"
                      onClick={() => handleMarkRead(notif.id)}
                      className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 cursor-pointer ${
                        !notif.isRead ? 'bg-indigo-50/30' : ''
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                        <Icon size={15} weight="fill" className={cfg.text} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-xs font-semibold leading-snug ${notif.isRead ? 'text-slate-600' : 'text-slate-800'}`}>
                            {notif.title}
                          </p>
                          {!notif.isRead && (
                            <span className={`w-2 h-2 rounded-full ${cfg.dot} shrink-0 mt-1`} />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                          {notif.message}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">{timeAgo(notif.createdAt)}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Logout Confirm Dialog ────────────────────────────────────────────────────
function LogoutConfirmDialog({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: '20px',
            boxShadow: '0 24px 60px rgba(0,0,0,0.15)',
          },
        },
      }}
    >
      <DialogContent sx={{ padding: 0 }}>
        <div className="p-6">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center">
              <Warning size={28} weight="fill" className="text-rose-500" />
            </div>
          </div>
          {/* Text */}
          <h2 className="text-center text-lg font-bold text-slate-800 mb-2">
            Confirm Logout
          </h2>
          <p className="text-center text-sm text-slate-500 leading-relaxed">
            Are you sure you want to log out of BookNest?
          </p>
          {/* Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 h-10 rounded-xl border-2 border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="flex-1 h-10 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Sidebar inner ────────────────────────────────────────────────────────────
function SidebarContent({
  onNavClick,
  onLogoutClick,
}: {
  onNavClick?: () => void;
  onLogoutClick: () => void;
}) {
  const isActive = useIsActive();

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: 'linear-gradient(175deg, #1e1b4b 0%, #312e81 55%, #1e1b4b 100%)' }}
    >
      {/* Logo → public homepage */}
      <Link to="/" className="flex items-center gap-3 px-5 py-5 shrink-0" onClick={onNavClick}>
        <div className="w-9 h-9 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center shrink-0">
          <BookOpen size={18} weight="bold" color="white" />
        </div>
        <div>
          <span className="text-white font-bold text-[15px] leading-none">BookNest</span>
          <p className="text-indigo-300 text-[10px] mt-0.5 font-medium uppercase tracking-widest">Library Hub</p>
        </div>
      </Link>

      <div className="mx-4 mb-2 h-px bg-white/10" />

      {/* Main nav */}
      <nav className="flex-1 px-3 py-1 flex flex-col gap-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              to={href}
              onClick={onNavClick}
              className={[
                'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
                active
                  ? 'bg-white/15 text-white'
                  : 'text-indigo-200 hover:bg-white/10 hover:text-white',
              ].join(' ')}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-white/15 rounded-xl"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <Icon
                size={18}
                weight={active ? 'fill' : 'regular'}
                className={[
                  'relative z-10 shrink-0',
                  active ? 'text-white' : 'text-indigo-300 group-hover:text-white',
                ].join(' ')}
              />
              <span className="relative z-10 truncate">{label}</span>
              {active && (
                <span className="relative z-10 ml-auto w-1.5 h-1.5 rounded-full bg-white/70 shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-3 pb-4 mt-1 flex flex-col gap-0.5">
        <div className="mx-1 mb-2 h-px bg-white/10" />
        {/* Logout — opens confirm dialog */}
        <button
          type="button"
          onClick={onLogoutClick}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-300 hover:bg-rose-500/20 hover:text-rose-200 transition-all duration-150 w-full cursor-pointer"
        >
          <SignOut size={18} className="shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

// ─── Topbar ───────────────────────────────────────────────────────────────────
function Topbar({
  pageTitle,
  onMenuClick,
  onLogoutClick,
}: {
  pageTitle: string;
  onMenuClick: () => void;
  onLogoutClick: () => void;
}) {
  const { user } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const displayName = user?.fullName || user?.email || 'Guest';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center px-4 md:px-6 gap-3 shrink-0 z-30">
      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
        aria-label="Open menu"
      >
        <List size={20} weight="bold" />
      </button>

      {/* Page title */}
      <span className="text-slate-700 font-semibold text-[15px] truncate">{pageTitle}</span>

      {/* Right actions */}
      <div className="ml-auto flex items-center gap-1.5">
        {/* Notification Bell with real data */}
        <NotificationBell />

        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex items-center gap-2 pl-1 pr-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
              {initials}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-semibold text-slate-800 leading-none truncate max-w-[110px]">
                {displayName}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Member</p>
            </div>
            <CaretDown size={12} className="text-slate-400 hidden md:block" weight="bold" />
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.96 }}
                transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
                className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/60 overflow-hidden z-50"
              >
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-800 truncate">{displayName}</p>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{user?.email}</p>
                </div>
                <div className="p-2">
                  {user?.roles && (user.roles.includes('ROLE_ADMIN') || user.role === 'ADMIN') && (
                    <Link
                      to="/admin/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl transition-colors font-semibold"
                    >
                      <ShieldCheck size={15} />
                      Admin Portal
                    </Link>
                  )}
                  <Link
                    to="/dashboard/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl transition-colors"
                  >
                    <User size={15} />
                    Profile
                  </Link>
                  <Link
                    to="/dashboard/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl transition-colors"
                  >
                    <GearSix size={15} />
                    Settings
                  </Link>
                  <div className="my-1.5 h-px bg-slate-100" />
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      onLogoutClick();
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-colors w-full cursor-pointer"
                  >
                    <SignOut size={15} />
                    Logout
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────
interface DashboardLayoutProps {
  children: ReactNode;
  pageTitle?: string;
}

export default function DashboardLayout({
  children,
  pageTitle = 'Dashboard',
}: DashboardLayoutProps) {
  const [mobileOpen,        setMobileOpen]        = useState(false);
  const [logoutDialogOpen,  setLogoutDialogOpen]  = useState(false);
  const { logout } = useAuth();

  const handleLogoutConfirm = async () => {
    setLogoutDialogOpen(false);
    await logout();
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">

      {/* ── Logout Confirm Dialog ─────────────────────────────────────────── */}
      <LogoutConfirmDialog
        open={logoutDialogOpen}
        onCancel={() => setLogoutDialogOpen(false)}
        onConfirm={handleLogoutConfirm}
      />

      {/* ── Desktop Sidebar (lg+) ─────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:flex-col lg:shrink-0 lg:w-[240px] h-full">
        <SidebarContent onLogoutClick={() => setLogoutDialogOpen(true)} />
      </div>

      {/* ── Mobile Drawer ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            {/* Drawer */}
            <motion.div
              key="drawer"
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed top-0 left-0 h-full w-[240px] z-50 lg:hidden flex flex-col"
            >
              {/* Close button */}
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                <X size={16} weight="bold" />
              </button>
              <SidebarContent
                onNavClick={() => setMobileOpen(false)}
                onLogoutClick={() => { setMobileOpen(false); setLogoutDialogOpen(true); }}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Main area ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar
          pageTitle={pageTitle}
          onMenuClick={() => setMobileOpen(true)}
          onLogoutClick={() => setLogoutDialogOpen(true)}
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
