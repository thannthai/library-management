/**
 * ForgotPasswordPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Route: /forgot-password
 *
 * Allows unauthenticated users to request a password-reset email.
 * On submit, calls POST /auth/forgot-password with the user's email.
 * Backend sends a reset link; frontend shows a confirmation message.
 * ─────────────────────────────────────────────────────────────
 */

import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  Alert,
  CircularProgress,
  TextField,
} from '@mui/material';
import { BookOpen, ArrowLeft, PaperPlaneRight, CheckCircle } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'motion/react';

import { forgotPasswordRequest } from '../../api/axiosClient';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ForgotPasswordFormState {
  email: string;
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function ForgotPasswordPage() {
  const [form, setForm]             = useState<ForgotPasswordFormState>({ email: '' });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg]     = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    setForm({ email: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const trimmedEmail = form.email.trim();
    if (!trimmedEmail) {
      setErrorMsg('Vui lòng nhập địa chỉ email.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMsg('Địa chỉ email không hợp lệ.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      const response = await forgotPasswordRequest({ email: trimmedEmail });
      setSuccessMsg(
        response.message ??
        'Chúng tôi đã gửi liên kết đặt lại mật khẩu đến email của bạn. Vui lòng kiểm tra hộp thư (kể cả thư mục spam).',
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex">

      {/* ── Left decorative panel ─────────────────────────────────────────── */}
      <motion.aside
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="hidden lg:flex flex-col w-1/2 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #312e81 0%, #4338ca 40%, #6366f1 75%, #818cf8 100%)',
        }}
      >
        {/* Background decoration — non-interactive */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-80px] right-[-80px] w-72 h-72 bg-white/5 rounded-full" />
          <div className="absolute bottom-[-60px] left-[-60px] w-96 h-96 bg-white/5 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/5 rounded-full" />
        </div>

        {/* Logo — top row, always clickable */}
        <div className="relative z-10 px-12 pt-10">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <BookOpen size={22} weight="bold" color="white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight select-none">BookNest</span>
          </Link>
        </div>

        {/* Content — vertically centered in remaining space */}
        <div className="relative z-10 flex-1 flex items-center px-12">
          <div className="w-full max-w-sm">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mb-6">
                <PaperPlaneRight size={28} weight="duotone" color="white" />
              </div>
              <h1 className="text-4xl font-extrabold text-white leading-tight mb-4">
                Quên mật khẩu?<br />
                <span className="text-indigo-200">Không sao cả.</span>
              </h1>
              <p className="text-indigo-200 text-base leading-relaxed">
                Nhập địa chỉ email đã đăng ký. Chúng tôi sẽ gửi ngay liên kết an toàn để bạn đặt lại mật khẩu.
              </p>
            </motion.div>
          </div>
        </div>
      </motion.aside>

      {/* ── Right form panel ──────────────────────────────────────────────── */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full lg:w-1/2 flex items-center justify-center px-8 py-12 bg-slate-50"
      >
        <div className="w-full max-w-[420px]">

          {/* Mobile logo */}
          <Link to="/" className="flex lg:hidden items-center gap-2.5 mb-10">
            <div className="w-8 h-8 rounded-[9px] bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-300/50">
              <BookOpen size={17} weight="bold" color="white" />
            </div>
            <span className="font-bold text-[17px] text-slate-800 tracking-tight select-none">
              Book<span className="text-indigo-600">Nest</span>
            </span>
          </Link>

          {/* Back link */}
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 transition-colors mb-8"
          >
            <ArrowLeft size={15} weight="bold" />
            Quay lại đăng nhập
          </Link>

          {/* Heading */}
          <div className="mb-7">
            <h2 className="text-2xl font-extrabold text-slate-800">Khôi phục mật khẩu</h2>
            <p className="text-sm text-slate-500 mt-1.5">
              Nhập email tài khoản và chúng tôi sẽ gửi liên kết đặt lại.
            </p>
          </div>

          {/* Status alerts */}
          <AnimatePresence mode="wait">
            {errorMsg && (
              <motion.div
                key="err"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-5"
              >
                <Alert severity="error" onClose={() => setErrorMsg(null)} sx={{ borderRadius: '10px' }}>
                  {errorMsg}
                </Alert>
              </motion.div>
            )}
            {successMsg && (
              <motion.div
                key="ok"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-5"
              >
                <Alert
                  severity="success"
                  icon={<CheckCircle size={20} weight="fill" />}
                  sx={{ borderRadius: '10px' }}
                >
                  {successMsg}
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form — hidden after success */}
          {!successMsg && (
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
              <TextField
                id="forgot-email"
                label="Địa chỉ email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                disabled={submitting}
                fullWidth
                sx={textFieldSx}
              />

              <button
                id="forgot-submit-btn"
                type="submit"
                disabled={submitting}
                className={[
                  'mt-1 w-full h-12 rounded-xl text-sm font-bold text-white',
                  'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]',
                  'transition-all duration-200 shadow-lg shadow-indigo-300/50',
                  'flex items-center justify-center gap-2 cursor-pointer',
                  submitting ? 'opacity-70 cursor-not-allowed' : '',
                ].join(' ')}
              >
                {submitting ? (
                  <CircularProgress size={20} sx={{ color: 'white' }} />
                ) : (
                  <>
                    Gửi liên kết khôi phục
                    <PaperPlaneRight size={17} weight="bold" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer */}
          <p className="mt-10 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} BookNest. Mọi quyền được bảo lưu.
          </p>
        </div>
      </motion.main>
    </div>
  );
}

// ─── MUI TextField overrides ──────────────────────────────────────────────────
const textFieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px',
    backgroundColor: '#fff',
    fontSize: '0.875rem',
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#6366f1' },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: '#6366f1',
      borderWidth: '2px',
    },
  },
  '& .MuiInputLabel-root.Mui-focused': { color: '#6366f1' },
};
