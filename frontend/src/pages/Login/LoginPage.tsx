/**
 * LoginPage.tsx
 * ──────────────────────────────────────────────────────────
 * Full-page Login screen for BookNest.
 * Design: split-panel layout — decorative left panel + form right panel.
 * Palette: Indigo/Navy brand colours (matching existing UI).
 */

import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
  TextField,
} from '@mui/material';
import { Eye, EyeSlash, BookOpen, ArrowRight } from '@phosphor-icons/react';
import { motion } from 'motion/react';

import { useAuth } from '../../context/AuthContext';

// ─── Types ───────────────────────────────────────────────────────────────────
interface LoginFormState {
  email: string;
  password: string;
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm]           = useState<LoginFormState>({ email: '', password: '' });
  const [showPass, setShowPass]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg]   = useState<string | null>(null);

  const handleChange = (field: keyof LoginFormState) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setErrorMsg(null);
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setErrorMsg('Vui lòng điền đầy đủ email và mật khẩu.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      await login({ email: form.email, password: form.password });
      // Đọc user từ context ngay sau khi login cập nhật state
      // Dùng getMeRequest để lấy role mới nhất (tránh closure cũ)
      const { getMeRequest } = await import('../../api/axiosClient');
      const freshUser = await getMeRequest();
      const isAdmin = freshUser.roles?.includes('ROLE_ADMIN');
      navigate(isAdmin ? '/admin/dashboard' : '/dashboard');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Đăng nhập thất bại. Vui lòng thử lại.');
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

        {/* Tagline — vertically centered in remaining space */}
        <div className="relative z-10 flex-1 flex items-center px-12">
          <div className="w-full max-w-sm">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <h1 className="text-4xl font-extrabold text-white leading-tight mb-4">
                Chào mừng trở lại,<br />
                <span className="text-indigo-200">người yêu sách.</span>
              </h1>
              <p className="text-indigo-200 text-base leading-relaxed">
                Đăng nhập để tiếp tục hành trình khám phá tri thức cùng hàng ngàn đầu sách tại BookNest.
              </p>
            </motion.div>

            {/* Stats row */}
            <div className="flex gap-8 mt-10">
              {[
                { label: 'Đầu sách', value: '12,000+' },
                { label: 'Thành viên', value: '3,500+' },
                { label: 'Lượt mượn', value: '58,000+' },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-white text-2xl font-bold">{stat.value}</p>
                  <p className="text-indigo-300 text-xs mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
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

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-extrabold text-slate-800">Đăng nhập</h2>
            <p className="text-sm text-slate-500 mt-1.5">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="text-indigo-600 font-semibold hover:underline">
                Tạo tài khoản mới
              </Link>
            </p>
          </div>

          {/* Error alert */}
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5"
            >
              <Alert severity="error" onClose={() => setErrorMsg(null)} sx={{ borderRadius: '10px' }}>
                {errorMsg}
              </Alert>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <TextField
              id="login-email"
              label="Email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange('email')}
              disabled={submitting}
              fullWidth
              slotProps={{ htmlInput: { 'aria-label': 'Email' } }}
              sx={textFieldSx}
            />

            <TextField
              id="login-password"
              label="Mật khẩu"
              type={showPass ? 'text' : 'password'}
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange('password')}
              disabled={submitting}
              fullWidth
              slotProps={{
                htmlInput: { 'aria-label': 'Mật khẩu' },
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPass((v) => !v)}
                        edge="end"
                        size="small"
                        aria-label={showPass ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      >
                        {showPass ? <EyeSlash size={18} /> : <Eye size={18} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              sx={textFieldSx}
            />

            {/* Forgot password */}
            <div className="flex justify-end -mt-1">
              <Link
                to="/forgot-password"
                className="text-xs text-indigo-600 hover:underline cursor-pointer"
              >
                Quên mật khẩu?
              </Link>
            </div>

            {/* Submit */}
            <button
              id="login-submit-btn"
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
                  Đăng nhập
                  <ArrowRight size={17} weight="bold" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-10 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} BookNest. Mọi quyền được bảo lưu.
          </p>
        </div>
      </motion.main>
    </div>
  );
}

// ─── Shared MUI TextField overrides ──────────────────────────────────────────
const textFieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px',
    backgroundColor: '#fff',
    fontSize: '0.875rem',
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: '#6366f1',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: '#6366f1',
      borderWidth: '2px',
    },
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: '#6366f1',
  },
};
