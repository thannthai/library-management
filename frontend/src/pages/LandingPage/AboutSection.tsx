import { motion, useReducedMotion } from 'motion/react';
import { ABOUT_STATS } from '../../data/landingMockData';

export default function AboutSection() {
  const reduce = useReducedMotion();

  return (
    <section id="about" className="bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-24 lg:py-28">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-5 max-w-xl mx-auto">
          <motion.h2
            initial={reduce ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="text-[1.75rem] font-extrabold text-slate-900 tracking-tight"
          >
            Sứ mệnh của BookNest
          </motion.h2>

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="text-[0.95rem] text-slate-500 leading-[1.75] max-w-[50ch]"
          >
            BookNest được thành lập với khao khát mang tri thức đến gần hơn với mọi người. Chúng tôi tin rằng việc đọc sách là hành trình trọn đời, và mỗi cuốn sách là một cánh cửa mở ra thế giới mới.
          </motion.p>

          <motion.div
            initial={reduce ? false : { scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.16 }}
            className="w-12 h-[3px] bg-indigo-600 rounded-full origin-center"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 max-w-2xl mx-auto mt-14 bg-white rounded-[18px] border border-slate-200 overflow-hidden">
          {ABOUT_STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={reduce ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: 0.08 + i * 0.09, ease: [0.16, 1, 0.3, 1] }}
              className={[
                'flex flex-col items-center gap-1.5 py-9 px-5',
                i < ABOUT_STATS.length - 1 ? 'border-r border-slate-100' : '',
              ].join(' ')}
            >
              <span
                className="font-extrabold text-indigo-600 leading-none tracking-tight tabular-nums"
                style={{ fontSize: 'clamp(2rem, 3.5vw, 2.8rem)' }}
              >
                {stat.value}
              </span>
              <span className="text-[0.78rem] font-medium text-slate-400 text-center">
                {stat.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
