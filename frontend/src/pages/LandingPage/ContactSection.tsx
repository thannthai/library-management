import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { MapPin, Phone, Envelope, Clock, BookOpen, ArrowRight } from '@phosphor-icons/react';
import { CONTACT_INFO } from '../../data/landingMockData';

type PhosphorIcon = React.ComponentType<{ size: number; weight?: 'bold'; className?: string }>;
const ICON_MAP: Record<string, PhosphorIcon> = { MapPin, Phone, Envelope, Clock };

interface FormState { name: string; email: string; message: string }

export default function ContactSection() {
  const reduce = useReducedMotion();
  const [form, setForm] = useState<FormState>({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => { setSubmitted(false); setForm({ name: '', email: '', message: '' }); }, 3000);
  };

  const inputCls = 'w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-[10px] text-sm text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/12 focus:bg-white';

  return (
    <section id="contact" className="bg-white">
      <div className="max-w-7xl mx-auto px-6 py-24 lg:py-28">

        {/* Header */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mb-12"
        >
          <h2 className="text-[1.75rem] font-extrabold text-slate-900 tracking-tight">
            Liên hệ với chúng tôi
          </h2>
          <p className="text-sm text-slate-400 mt-1.5">
            Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Left — Contact Info */}
          <motion.div
            initial={reduce ? false : { opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col"
          >
            {CONTACT_INFO.map((info) => {
              const Icon = ICON_MAP[info.icon];
              return (
                <div key={info.label} className="flex items-start gap-4 py-5 border-b border-slate-50 last:border-0">
                  <div className="w-10 h-10 rounded-[10px] bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                    {Icon && <Icon size={16} weight="bold" className="text-indigo-600" />}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-widest">
                      {info.label}
                    </span>
                    <span className="text-sm font-medium text-slate-700 leading-relaxed">
                      {info.value}
                    </span>
                  </div>
                </div>
              );
            })}
          </motion.div>

          {/* Right — Form */}
          <motion.div
            initial={reduce ? false : { opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          >
            {submitted ? (
              <div className="flex flex-col items-center justify-center gap-4 min-h-[280px] text-center bg-indigo-50 rounded-2xl border border-indigo-100 p-8">
                <div className="w-14 h-14 rounded-full bg-indigo-600 flex items-center justify-center">
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                    <path d="M4 11l5 5L18 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-slate-900">Đã gửi thành công!</p>
                  <p className="text-sm text-slate-500 mt-1">Cảm ơn bạn. Chúng tôi sẽ phản hồi sớm nhất có thể.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
                {[
                  { id: 'cn', field: 'name' as const, label: 'Họ và tên', type: 'text', placeholder: 'Nguyễn Văn A' },
                  { id: 'ce', field: 'email' as const, label: 'Địa chỉ email', type: 'email', placeholder: 'example@email.com' },
                ].map(({ id, field, label, type, placeholder }) => (
                  <div key={id} className="flex flex-col gap-1.5">
                    <label htmlFor={id} className="text-sm font-semibold text-slate-700">{label}</label>
                    <input
                      id={id} type={type} required
                      value={form[field]}
                      onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                      placeholder={placeholder}
                      className={inputCls}
                    />
                  </div>
                ))}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="cm" className="text-sm font-semibold text-slate-700">Nội dung</label>
                  <textarea
                    id="cm" required rows={5}
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    placeholder="Nhập tin nhắn của bạn..."
                    className={`${inputCls} resize-none`}
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-[10px] transition-colors duration-200 shadow-lg shadow-indigo-300/35 active:scale-[0.97]"
                >
                  Gửi tin nhắn <ArrowRight size={14} weight="bold" />
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-[8px] bg-indigo-600 flex items-center justify-center">
                <BookOpen size={14} weight="bold" color="white" />
              </div>
              <span className="font-bold text-[15px] text-slate-800">
                Book<span className="text-indigo-600">Nest</span>
              </span>
            </Link>
            <span className="text-slate-200 text-sm">|</span>
            <span className="text-xs text-slate-400">© 2026 BookNest. Mọi quyền được bảo lưu.</span>
          </div>
          <p className="text-xs text-slate-400 italic">"Mỗi cuốn sách là một hành trình."</p>
        </div>
      </footer>
    </section>
  );
}
