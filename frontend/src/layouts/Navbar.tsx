import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, List, X, UserCircle, SignOut, Warning } from '@phosphor-icons/react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import { NAV_LINKS, LANDING_SECTION_IDS } from '../data/landingMockData';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const [scrolled, setScrolled]     = useState(false);
  const [activeSection, setActive]  = useState('home');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<number | null>(null);
  const { user, logout } = useAuth();

  const handleLogoutClick = () => {
    setMobileOpen(false);
    setLogoutConfirmOpen(true);
  };

  const handleConfirmLogout = async () => {
    setLogoutConfirmOpen(false);
    await logout();
  };

  const location  = useLocation();
  const navigate  = useNavigate();
  const isLanding = location.pathname === '/';

  // ── Scroll shadow ──────────────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ── Active section tracking (only on landing) ──────────────────────────────
  useEffect(() => {
    if (!isLanding) return;

    const handleScroll = () => {
      if (isScrollingRef.current) return;

      const scrollPos = window.scrollY + 120; // 120px offset for active section threshold (64px header + some margin)

      // Handle bottom of page
      const isBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 50;
      if (isBottom) {
        setActive(LANDING_SECTION_IDS[LANDING_SECTION_IDS.length - 1]);
        return;
      }

      for (const id of LANDING_SECTION_IDS) {
        const el = document.getElementById(id);
        if (el) {
          const top = el.offsetTop - 80; // 80px scroll margin top offset
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActive(id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Run once on mount to set initial section
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [isLanding]);

  // Handle scroll to state when navigating from another page
  useEffect(() => {
    if (isLanding && location.state?.scrollTo) {
      const target = location.state.scrollTo;
      setActive(target);
      isScrollingRef.current = true;
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      
      const el = document.getElementById(target);
      if (el) {
        const timer = setTimeout(() => {
          const elementPosition = el.getBoundingClientRect().top + window.scrollY;
          window.scrollTo({
            top: elementPosition - 80,
            behavior: 'smooth'
          });
        }, 120);
        
        scrollTimeoutRef.current = window.setTimeout(() => {
          isScrollingRef.current = false;
        }, 1000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [isLanding, location.state]);

  // ── Navigation logic ───────────────────────────────────────────────────────
  /**
   * Handles hash-section links:
   * - On landing page (/) → smooth scroll to section with 80px offset
   * - On other pages    → navigate to / carrying `scrollTo` state, then LandingPage
   *   picks it up and scrolls after mount
   */
  const handleSectionClick = (sectionId: string) => {
    setMobileOpen(false);
    setActive(sectionId); // Immediately set active section to make underline jump directly
    isScrollingRef.current = true;
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);

    if (isLanding) {
      const el = document.getElementById(sectionId);
      if (el) {
        const elementPosition = el.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({
          top: elementPosition - 80, // Offset 80px scroll-margin-top
          behavior: 'smooth'
        });
      }
      scrollTimeoutRef.current = window.setTimeout(() => {
        isScrollingRef.current = false;
      }, 800); // Lock scroll spy for 800ms
    } else {
      navigate('/', { state: { scrollTo: sectionId } });
    }
  };

  // ── Nav item renderer ─────────────────────────────────────────────────────
  const baseCls = 'relative cursor-pointer px-3.5 py-2 text-sm font-medium rounded-lg transition-colors duration-200 whitespace-nowrap';
  const activeCls  = 'text-indigo-600';
  const idleCls    = 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/60 hover:font-semibold';

  const renderDesktopLink = (link: typeof NAV_LINKS[0]) => {
    if (link.isPage) {
      const isCurrent = location.pathname === link.href;
      return (
        <li key={link.href}>
          <Link
            to={link.href}
            className={`${baseCls} ${isCurrent ? activeCls : idleCls}`}
          >
            {link.label}
            {isCurrent && (
              <motion.span
                layoutId="nav-underline"
                className="absolute bottom-0.5 left-2.5 right-2.5 h-0.5 bg-indigo-600 rounded-full"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </Link>
        </li>
      );
    }

    const sectionId = link.href.startsWith('#') ? link.href.slice(1) : '';
    const isActive  = isLanding && sectionId === activeSection;
    return (
      <li key={link.href}>
        <button
          type="button"
          onClick={() => handleSectionClick(sectionId)}
          className={`${baseCls} ${isActive ? activeCls : idleCls}`}
        >
          {link.label}
          {isActive && (
            <motion.span
              layoutId="nav-underline"
              className="absolute bottom-0.5 left-2.5 right-2.5 h-0.5 bg-indigo-600 rounded-full"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}
        </button>
      </li>
    );
  };

  const renderMobileLink = (link: typeof NAV_LINKS[0]) => {
    const sectionId = link.href.startsWith('#') ? link.href.slice(1) : '';
    const isActive  = isLanding && sectionId === activeSection;
    const mobileCls = 'cursor-pointer text-left px-3 py-2.5 text-sm font-medium rounded-xl transition-colors w-full';

    if (link.isPage) {
      return (
        <Link
          key={link.href}
          to={link.href}
          onClick={() => setMobileOpen(false)}
          className={`${mobileCls} text-slate-600 hover:text-indigo-600 hover:bg-indigo-50`}
        >
          {link.label}
        </Link>
      );
    }
    return (
      <button
        key={link.href}
        type="button"
        onClick={() => handleSectionClick(sectionId)}
        className={`${mobileCls} ${
          isActive
            ? 'text-indigo-600 bg-indigo-50 font-semibold'
            : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50'
        }`}
      >
        {link.label}
      </button>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <header
        className={[
          'fixed top-0 left-0 right-0 z-50 h-16 transition-all duration-300',
          scrolled
            ? 'bg-white/95 backdrop-blur-md shadow-[0_1px_20px_rgba(99,102,241,0.10)] border-b border-slate-100'
            : 'bg-white/80 backdrop-blur-sm',
        ].join(' ')}
      >
        <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

          {/* ── Logo ──────────────────────────────────────────────────────── */}
          <Link to="/" className="flex items-center gap-2.5 group shrink-0 cursor-pointer">
            <div className="w-8 h-8 rounded-[9px] bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-300/50 group-hover:scale-105 transition-transform duration-200">
              <BookOpen size={17} weight="bold" color="white" />
            </div>
            <span className="font-bold text-[17px] text-slate-800 tracking-tight select-none">
              Book<span className="text-indigo-600">Nest</span>
            </span>
          </Link>

          {/* ── Desktop Nav ────────────────────────────────────────────────── */}
          <ul className="hidden md:flex items-center gap-1 list-none">
            {NAV_LINKS.map(renderDesktopLink)}
          </ul>

          {/* ── Auth Buttons ───────────────────────────────────────────────── */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            {user ? (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50">
                  <UserCircle size={20} weight="fill" className="text-indigo-500" />
                  <span className="text-sm font-medium text-slate-700 max-w-[120px] truncate">
                    {user.fullName || user.username}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLogoutClick}
                  title="Logout"
                  className="cursor-pointer p-2 text-slate-400 hover:text-red-500 hover:bg-red-50/60 rounded-lg transition-colors duration-200"
                >
                  <SignOut size={18} />
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="cursor-pointer px-3.5 py-2 text-sm font-medium text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/60 rounded-lg transition-colors duration-200"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="cursor-pointer px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-200 shadow-md shadow-indigo-300/40 active:scale-[0.97]"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* ── Hamburger ─────────────────────────────────────────────────── */}
          <button
            type="button"
            className="md:hidden cursor-pointer p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/60 transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={21} weight="bold" /> : <List size={21} weight="bold" />}
          </button>
        </nav>
      </header>

      {/* ── Mobile Menu ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-x-0 top-16 z-40 bg-white border-b border-slate-100 shadow-xl md:hidden"
          >
            <div className="max-w-7xl mx-auto px-5 py-4 flex flex-col gap-1">
              {NAV_LINKS.map(renderMobileLink)}
              <div className="border-t border-slate-100 mt-2 pt-4 flex flex-col gap-2">
                {user ? (
                  <>
                    <div className="flex items-center gap-2 px-2 py-1.5">
                      <UserCircle size={20} weight="fill" className="text-indigo-500" />
                      <span className="text-sm font-medium text-slate-700 truncate">
                        {user.fullName || user.username}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleLogoutClick}
                      className="cursor-pointer text-left text-sm font-medium text-red-500 py-2 hover:text-red-600 transition-colors"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMobileOpen(false)}
                      className="cursor-pointer text-left text-sm font-medium text-slate-600 py-2 hover:text-indigo-600 transition-colors"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileOpen(false)}
                      className="cursor-pointer text-sm font-semibold bg-indigo-600 text-white py-2.5 rounded-xl hover:bg-indigo-700 transition-colors active:scale-[0.97] text-center"
                    >
                      Register
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Logout Confirm Dialog */}
      <Dialog
        open={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
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
                onClick={() => setLogoutConfirmOpen(false)}
                className="flex-1 h-10 rounded-xl border-2 border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="flex-1 h-10 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                Logout
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
