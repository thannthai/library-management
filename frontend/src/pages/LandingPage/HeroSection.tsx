import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, BookOpen, Users, Star } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { BOOK_SPINES } from '../../data/landingMockData';
import { useAuth } from '../../context/AuthContext';

const SPINE_H: Record<string, string> = {
  'h-56': '196px', 'h-52': '182px', 'h-48': '168px',
  'h-44': '154px', 'h-40': '140px', 'h-36': '126px',
};

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] as const },
});

const HERO_STATS = [
  { value: '12,000+', label: 'Books',   icon: BookOpen },
  { value: '5,800+',  label: 'Members', icon: Users },
  { value: '4.8',     label: 'Rating',  icon: Star },
];

export default function HeroSection() {
  const reduce  = useReducedMotion();
  const { user } = useAuth();
  const isLoggedIn = Boolean(user);

  return (
    <section
      id="home"
      className="w-full pt-16"
      style={{ background: 'linear-gradient(135deg, #f5f7ff 0%, #eef2ff 55%, #f3f0ff 100%)' }}
    >
      <div className="max-w-7xl mx-auto px-6 py-20 lg:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

        {/* ── Left ──────────────────────────────────────────────── */}
        <div className="flex flex-col gap-6 min-w-0">
          {/* Badge */}
          <motion.span
            {...(reduce ? {} : fadeUp(0.05))}
            className="inline-flex items-center gap-2 w-fit px-3.5 py-1.5 rounded-full text-xs font-semibold text-indigo-700 border border-indigo-200 bg-indigo-50/80"
          >
            <BookOpen size={12} weight="bold" />
            Welcome to BookNest
          </motion.span>

          {/* Heading */}
          <motion.div {...(reduce ? {} : fadeUp(0.12))}>
            <h1
              className="font-extrabold tracking-tight text-slate-900"
              style={{ fontSize: 'clamp(2.1rem, 4vw, 3.25rem)', lineHeight: 1.13 }}
            >
              Gateway to
            </h1>
            <h1
              className="font-extrabold tracking-tight text-indigo-600"
              style={{ fontSize: 'clamp(2.1rem, 4vw, 3.25rem)', lineHeight: 1.13 }}
            >
              Infinite Knowledge
            </h1>
          </motion.div>

          {/* Desc */}
          <motion.p
            {...(reduce ? {} : fadeUp(0.19))}
            className="text-[0.975rem] text-slate-500 leading-relaxed max-w-[42ch]"
          >
            Discover, borrow, and enjoy thousands of books. Join our community of readers and experience a modern digital library.
          </motion.p>

          {/* CTAs — dynamic based on auth state */}
          <motion.div {...(reduce ? {} : fadeUp(0.26))} className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('featured');
                if (el) {
                  const elementPosition = el.getBoundingClientRect().top + window.scrollY;
                  window.scrollTo({ top: elementPosition - 80, behavior: 'smooth' });
                }
              }}
              className="cursor-pointer inline-flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-indigo-300/40 hover:shadow-indigo-400/50 active:scale-[0.97] group"
            >
              Explore Now
              <ArrowRight size={14} weight="bold" className="group-hover:translate-x-0.5 transition-transform duration-200" />
            </button>

            {isLoggedIn ? (
              <Link
                to="/dashboard"
                className="cursor-pointer inline-flex items-center gap-2 px-5 py-3 bg-white hover:bg-slate-50 text-indigo-700 text-sm font-semibold rounded-xl border border-indigo-200 hover:border-indigo-400 transition-all duration-200 active:scale-[0.97] group"
              >
                Go to Dashboard
                <ArrowRight size={14} weight="bold" className="group-hover:translate-x-0.5 transition-transform duration-200" />
              </Link>
            ) : (
              <Link
                to="/login"
                className="cursor-pointer inline-flex items-center gap-2 px-5 py-3 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl border border-slate-200 hover:border-indigo-200 transition-all duration-200 active:scale-[0.97] group"
              >
                <BookOpen size={14} />
                Sign In
              </Link>
            )}
          </motion.div>

          {/* Stats */}
          <motion.div {...(reduce ? {} : fadeUp(0.33))} className="flex items-center gap-5 flex-wrap pt-1">
            {HERO_STATS.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600/10 flex items-center justify-center shrink-0">
                    <Icon size={13} weight="bold" className="text-indigo-600" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-bold text-slate-800">{stat.value}</span>
                    <span className="text-xs text-slate-400">{stat.label}</span>
                  </div>
                  {i < HERO_STATS.length - 1 && (
                    <div className="w-px h-4 bg-slate-200 ml-2" />
                  )}
                </div>
              );
            })}
          </motion.div>
        </div>

        {/* ── Right — Book Spine Card ────────────────────────────── */}
        <motion.div
          className="flex justify-center lg:justify-end min-w-0"
          initial={reduce ? false : { opacity: 0, x: 32, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.65, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
        >
          <div
            className="relative w-full max-w-[400px] min-w-0 rounded-2xl p-5 sm:p-8"
            style={{
              background: 'white',
              boxShadow: '0 20px 56px rgba(99,102,241,0.15), 0 4px 12px rgba(0,0,0,0.04)',
              border: '1px solid rgba(99,102,241,0.1)',
            }}
          >
            {/* Badge */}
            <span
              className="absolute top-4 right-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold"
              style={{ background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' }}
            >
              <svg width="9" height="9" viewBox="0 0 9 9" fill="currentColor" aria-hidden="true">
                <path d="M4.5 0l1 3.1H8.6L6.1 5l1 3.1L4.5 6.4 2 8.1 3 5 .4 3.1H3.5z" />
              </svg>
              New Releases
            </span>

            {/* Spines */}
            <div className="flex items-end justify-center gap-2 sm:gap-3" style={{ height: '220px' }}>
              {BOOK_SPINES.map((spine, i) => (
                <motion.div
                  key={spine.id}
                  title={spine.title}
                  className="relative rounded-[5px] shrink-0 cursor-default"
                  style={{
                    width: 'clamp(30px, 8vw, 40px)',
                    height: SPINE_H[spine.heightClass] ?? '140px',
                    backgroundColor: spine.color,
                    boxShadow: `2px 4px 14px ${spine.color}55`,
                  }}
                  initial={reduce ? false : { opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={reduce ? {} : { y: -8 }}
                >
                  {/* Edge */}
                  <div
                    className="absolute top-0 bottom-0 left-0 w-[5px] rounded-l-[5px]"
                    style={{ backgroundColor: spine.accentColor, opacity: 0.6 }}
                  />
                  {/* Lines */}
                  <div className="absolute bottom-3 left-2 right-2 flex flex-col gap-1" style={{ opacity: 0.5 }}>
                    <div className="h-0.5 bg-white/70 rounded-full" />
                    <div className="h-0.5 bg-white/40 rounded-full w-3/4" />
                  </div>
                </motion.div>
              ))}
            </div>

            <p className="text-center text-[11px] text-slate-400 font-medium mt-4 tracking-wider">
              Featured Collections
            </p>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
