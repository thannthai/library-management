import { motion, useReducedMotion } from 'motion/react';
import { BookOpen, Users, Star, BookBookmark } from '@phosphor-icons/react';

const ABOUT_FEATURES = [
  {
    icon: BookOpen,
    title: 'Curated Collection',
    body: 'Over 12,000 titles across fiction, science, history, and more — carefully selected by our librarians.',
  },
  {
    icon: Users,
    title: 'Vibrant Community',
    body: 'Join 5,800+ active members. Share reviews, reading lists, and connect with fellow book lovers.',
  },
  {
    icon: BookBookmark,
    title: 'Seamless Borrowing',
    body: 'Borrow, extend, and return books digitally. Track your reading history anytime, anywhere.',
  },
  {
    icon: Star,
    title: 'Top-Rated Service',
    body: 'Rated 4.8 out of 5 by our members for ease of use, book availability, and support responsiveness.',
  },
];

export default function AboutSection() {
  const reduce = useReducedMotion();

  return (
    <section id="about" className="bg-white">
      <div className="max-w-7xl mx-auto px-6 py-24 lg:py-28">

        {/* Header */}
        <div className="max-w-lg mb-14">
          <motion.h2
            initial={reduce ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="text-[1.75rem] font-extrabold text-slate-900 tracking-tight"
          >
            The BookNest Mission
          </motion.h2>
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="text-[0.95rem] text-slate-500 leading-[1.75] mt-3 max-w-[50ch]"
          >
            BookNest was founded with the desire to bring knowledge closer to everyone. We believe reading is a lifelong journey, and each book is a gateway to a new world.
          </motion.p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {ABOUT_FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={reduce ? false : { opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col gap-3.5 p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all duration-300 group"
              >
                <div className="w-10 h-10 rounded-[10px] bg-indigo-100 flex items-center justify-center shrink-0 group-hover:bg-indigo-200 transition-colors duration-200">
                  <Icon size={18} weight="bold" className="text-indigo-600" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <h3 className="font-bold text-[0.9rem] text-slate-900 leading-snug">
                    {feature.title}
                  </h3>
                  <p className="text-[0.82rem] text-slate-500 leading-relaxed">
                    {feature.body}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom stat strip */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 grid grid-cols-3 rounded-2xl border border-slate-100 overflow-hidden bg-slate-50"
        >
          {[
            { value: '2018', label: 'Founded' },
            { value: '12,000+', label: 'Books' },
            { value: '5,800+', label: 'Members' },
          ].map((stat, i, arr) => (
            <div
              key={stat.label}
              className={[
                'flex flex-col items-center gap-1 py-7 px-4',
                i < arr.length - 1 ? 'border-r border-slate-100' : '',
              ].join(' ')}
            >
              <span
                className="font-extrabold text-indigo-600 leading-none tracking-tight tabular-nums"
                style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)' }}
              >
                {stat.value}
              </span>
              <span className="text-[0.75rem] font-medium text-slate-400 text-center mt-0.5">
                {stat.label}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
