/**
 * AdminLayout.tsx
 * ─────────────────────────────────────────────────────────────
 * Shell cho tất cả trang Admin/Thủ thư.
 * Dark slate sidebar + topbar.
 */

import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
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
  CheckCircle,
  Clock,
  Star,
  CurrencyDollar,
  BookBookmark,
} from '@phosphor-icons/react';
import Dialog        from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import { useAuth } from '../context/AuthContext';
import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  createNotificationEventSource,
  type NotificationItem,
} from '../api/notificationsApi';

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

// ─── Admin Notification Bell (SSE) ───────────────────────────────────────────
// Admin cũng cần nhận thông báo real-time khi có sách quá hạn, v.v.
function notifConfig(type: NotificationItem['type']) {
  switch (type) {
    case 'VIP_EXPIRY':
      return { icon: Star, bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-500' };
    case 'RESERVATION_READY':
      return { icon: BookBookmark, bg: 'bg-indigo-50', text: 'text-indigo-600', dot: 'bg-indigo-500' };
    case 'LOAN_EXPIRING':
      return { icon: Clock, bg: 'bg-orange-50', text: 'text-orange-600', dot: 'bg-orange-500' };
    case 'FINE_ISSUED':
      return { icon: CurrencyDollar, bg: 'bg-rose-50', text: 'text-rose-600', dot: 'bg-rose-500' };
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

function AdminNotificationBell() {
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
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  // Load lần đầu
  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // ─── SSE: Admin nhận thông báo real-time ──────────────────────────────────────
  // Điều này rất quan trọng vì khi có sách quá hạn, Admin cần biết ngay lập tức
  useEffect(() => {
    const es = createNotificationEventSource();
    es.addEventListener('CONNECTED', () => console.log('[SSE-Admin] Connected'));
    es.addEventListener('NOTIFICATION', (e: MessageEvent) => {
      try {
        const newNotif: NotificationItem = JSON.parse(e.data);
        setNotifications((prev) => [newNotif, ...prev]);
      } catch { /* ignore parse errors */ }
    });
    es.onerror = () => console.warn('[SSE-Admin] Connection lost, auto-reconnecting...');
    return () => es.close();
  }, []);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMarkRead = async (id: number) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
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
        aria-label="Admin Notifications"
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
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Bell size={15} weight="fill" className="text-red-500" />
                <span className="text-sm font-bold text-slate-800">Notifications</span>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">{unreadCount}</span>
                )}
              </div>
              {unreadCount > 0 && (
                <button type="button" onClick={handleMarkAllRead}
                  className="text-[11px] text-red-500 hover:text-red-700 font-semibold cursor-pointer transition-colors">
                  Mark all as read
                </button>
              )}
            </div>
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
                        !notif.isRead ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                        <Icon size={15} weight="fill" className={cfg.text} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-xs font-semibold leading-snug ${notif.isRead ? 'text-slate-600' : 'text-slate-800'}`}>{notif.title}</p>
                          {!notif.isRead && <span className={`w-2 h-2 rounded-full ${cfg.dot} shrink-0 mt-1`} />}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{notif.message}</p>
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
        {/* Admin Notification Bell — nhận SSE real-time khi có sách quá hạn */}
        <AdminNotificationBell />
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
