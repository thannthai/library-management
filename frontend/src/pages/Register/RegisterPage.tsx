/**
 * RegisterPage.tsx
 * ──────────────────────────────────────────────────────────
 * Full-page Register screen for BookNest.
 * Design mirrors LoginPage (split-panel layout) for visual consistency.
 * Fields: Email, Họ và tên, Số điện thoại, Mật khẩu.
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
import { Eye, EyeSlash, BookOpen, ArrowRight, CheckCircle } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'motion/react';

import * as authApi from '../../api/authApi';

// ─── Types ───────────────────────────────────────────────────────────────────
interface RegisterFormState {
  email: string;
  fullName: string;
  phone: string;
  password: string;
}

interface FormErrors {
  email?: string;
  fullName?: string;
  phone?: string;
  password?: string;
}

// ─── Validation ──────────────────────────────────────────────────────────────
const EMAIL_RE  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE  = /^(0[3-9]\d{8})$/;

function validateForm(form: RegisterFormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.email)                   errors.email    = 'Please enter your email.';
  else if (!EMAIL_RE.test(form.email)) errors.email  = 'Invalid email address.';

  if (!form.fullName.trim())         errors.fullName = 'Please enter your full name.';
  else if (form.fullName.trim().length < 2) errors.fullName = 'Full name must be at least 2 characters.';

  if (!form.phone)                   errors.phone    = 'Please enter your phone number.';
  else if (!PHONE_RE.test(form.phone)) errors.phone  = 'Invalid phone number (e.g. 0912345678).';

  if (!form.password)                errors.password = 'Please enter your password.';
  else if (form.password.length < 6) errors.password = 'Password must be at least 6 characters.';

  return errors;
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm]             = useState<RegisterFormState>({ email: '', fullName: '', phone: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [showPass, setShowPass]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg]     = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleChange = (field: keyof RegisterFormState) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setErrorMsg(null);
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errors = validateForm(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await authApi.register({
        email:    form.email,
        fullName: form.fullName,
        phone:    form.phone,
        password: form.password,
      });
      setSuccessMsg(res.message ?? 'Account created successfully! Redirecting...');
      setTimeout(() => navigate('/login'), 2200);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Registration failed. Please try again.');
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
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 75%, #6366f1 100%)',
        }}
      >
        {/* Background decoration — non-interactive */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-60px] right-[-60px] w-64 h-64 bg-white/5 rounded-full" />
          <div className="absolute bottom-[-40px] left-[-40px] w-80 h-80 bg-white/5 rounded-full" />
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
                Start your journey of<br />
                <span className="text-indigo-200">discovering knowledge.</span>
              </h1>
              <p className="text-indigo-200 text-base leading-relaxed">
                Create a free account and get instant access to BookNest\'s vast library.
              </p>
            </motion.div>

            {/* Feature list */}
            <ul className="flex flex-col gap-3 mt-8">
              {[
                'Borrow & return books anytime, anywhere',
                'Track your personal reading history',
                'Receive timely return notifications',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-indigo-100">
                  <CheckCircle size={18} weight="fill" className="text-indigo-300 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.aside>

      {/* ── Right form panel ──────────────────────────────────────────────── */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full lg:w-1/2 flex items-center justify-center px-8 py-12 bg-slate-50 overflow-y-auto"
      >
        <div className="w-full max-w-[460px]">

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
          <div className="mb-7">
            <h2 className="text-2xl font-extrabold text-slate-800">Create Account</h2>
            <p className="text-sm text-slate-500 mt-1.5">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-600 font-semibold hover:underline">
                Log in now
              </Link>
            </p>
          </div>

          {/* Status alerts */}
          <AnimatePresence mode="wait">
            {errorMsg && (
              <motion.div key="err" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-5">
                <Alert severity="error" onClose={() => setErrorMsg(null)} sx={{ borderRadius: '10px' }}>
                  {errorMsg}
                </Alert>
              </motion.div>
            )}
            {successMsg && (
              <motion.div key="ok" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-5">
                <Alert severity="success" icon={<CheckCircle size={20} weight="fill" />} sx={{ borderRadius: '10px' }}>
                  {successMsg}
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <TextField
              id="register-email"
              label="Email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange('email')}
              disabled={submitting}
              error={Boolean(fieldErrors.email)}
              helperText={fieldErrors.email}
              fullWidth
              sx={textFieldSx}
            />

            <TextField
              id="register-fullname"
              label="Full Name"
              type="text"
              autoComplete="name"
              value={form.fullName}
              onChange={handleChange('fullName')}
              disabled={submitting}
              error={Boolean(fieldErrors.fullName)}
              helperText={fieldErrors.fullName}
              fullWidth
              sx={textFieldSx}
            />

            <TextField
              id="register-phone"
              label="Phone Number"
              type="tel"
              autoComplete="tel"
              inputMode="numeric"
              value={form.phone}
              onChange={handleChange('phone')}
              disabled={submitting}
              error={Boolean(fieldErrors.phone)}
              helperText={fieldErrors.phone}
              fullWidth
              sx={textFieldSx}
            />

            <TextField
              id="register-password"
              label="Password"
              type={showPass ? 'text' : 'password'}
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange('password')}
              disabled={submitting}
              error={Boolean(fieldErrors.password)}
              helperText={fieldErrors.password}
              fullWidth
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPass((v) => !v)}
                        edge="end"
                        size="small"
                        aria-label={showPass ? 'Hide password' : 'Show password'}
                      >
                        {showPass ? <EyeSlash size={18} /> : <Eye size={18} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              sx={textFieldSx}
            />

            {/* Submit */}
            <button
              id="register-submit-btn"
              type="submit"
              disabled={submitting || Boolean(successMsg)}
              className={[
                'mt-2 w-full h-12 rounded-xl text-sm font-bold text-white',
                'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]',
                'transition-all duration-200 shadow-lg shadow-indigo-300/50',
                'flex items-center justify-center gap-2 cursor-pointer',
                (submitting || Boolean(successMsg)) ? 'opacity-70 cursor-not-allowed' : '',
              ].join(' ')}
            >
              {submitting ? (
                <CircularProgress size={20} sx={{ color: 'white' }} />
              ) : (
                <>
                  Create Account
                  <ArrowRight size={17} weight="bold" />
                </>
              )}
            </button>
          </form>

          {/* Terms */}
          <p className="mt-5 text-center text-xs text-slate-400 leading-relaxed">
            By registering, you agree to BookNest's{' '}
            <button type="button" className="text-indigo-500 hover:underline cursor-pointer">Terms of Service</button>{' '}
            and{' '}
            <button type="button" className="text-indigo-500 hover:underline cursor-pointer">Privacy Policy</button>.
          </p>

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} BookNest. All rights reserved.
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
