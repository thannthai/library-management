/**
 * ResetPasswordPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Route: /reset-password?token=<one-time-token>
 *
 * Reads the `token` query parameter from the URL (placed there by the
 * backend's reset email link). Shows a form with two password fields,
 * validates them, then calls POST /auth/reset-password.
 *
 * Password policy enforced client-side:
 *   ✔ Minimum 8 characters
 *   ✔ At least one uppercase letter
 *   ✔ At least one lowercase letter
 *   ✔ At least one digit
 *   ✔ At least one special character
 *   ✔ Both fields must match
 * ─────────────────────────────────────────────────────────────
 */

import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
  LinearProgress,
  TextField,
} from '@mui/material';
import {
  BookOpen,
  Eye,
  EyeSlash,
  LockKey,
  CheckCircle,
  ArrowRight,
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'motion/react';

import { resetPasswordRequest } from '../../api/axiosClient';

// ─── Password Strength ────────────────────────────────────────────────────────

interface PasswordStrength {
  score: number;          // 0–4
  label: string;
  color: string;          // Tailwind color token used for LinearProgress
}

function evaluatePasswordStrength(password: string): PasswordStrength {
  let score = 0;
  if (password.length >= 8)             score++;
  if (/[A-Z]/.test(password))           score++;
  if (/[a-z]/.test(password))           score++;
  if (/[0-9]/.test(password))           score++;
  if (/[^A-Za-z0-9]/.test(password))   score++;

  const levels: PasswordStrength[] = [
    { score: 0, label: '',         color: '#e2e8f0' },
    { score: 1, label: 'Rất yếu',  color: '#ef4444' },
    { score: 2, label: 'Yếu',      color: '#f97316' },
    { score: 3, label: 'Trung bình', color: '#eab308' },
    { score: 4, label: 'Mạnh',     color: '#22c55e' },
    { score: 5, label: 'Rất mạnh', color: '#6366f1' },
  ];
  return levels[score];
}

// ─── Validation ───────────────────────────────────────────────────────────────

const PASSWORD_POLICY = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

interface FormErrors {
  newPassword?: string;
  confirmPassword?: string;
}

function validateForm(newPassword: string, confirmPassword: string): FormErrors {
  const errors: FormErrors = {};

  if (!newPassword) {
    errors.newPassword = 'Vui lòng nhập mật khẩu mới.';
  } else if (!PASSWORD_POLICY.test(newPassword)) {
    errors.newPassword =
      'Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt.';
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Vui lòng nhập lại mật khẩu.';
  } else if (newPassword !== confirmPassword) {
    errors.confirmPassword = 'Hai mật khẩu không khớp nhau.';
  }

  return errors;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ResetPasswordPage() {
  const navigate                    = useNavigate();
  const [searchParams]              = useSearchParams();

  // Extract the one-time token from ?token=...
  const tokenFromUrl                = searchParams.get('token') ?? '';

  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew]                 = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [fieldErrors, setFieldErrors]         = useState<FormErrors>({});
  const [submitting, setSubmitting]           = useState(false);
  const [errorMsg, setErrorMsg]               = useState<string | null>(null);
  const [successMsg, setSuccessMsg]           = useState<string | null>(null);

  const strength = evaluatePasswordStrength(newPassword);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFieldErrors((prev) => ({ ...prev, newPassword: undefined }));
    setErrorMsg(null);
    setNewPassword(e.target.value);
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
    setErrorMsg(null);
    setConfirmPassword(e.target.value);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Guard: if no token in URL the link is invalid
    if (!tokenFromUrl) {
      setErrorMsg('Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu liên kết mới.');
      return;
    }

    const errors = validateForm(newPassword, confirmPassword);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      const response = await resetPasswordRequest({
        token:       tokenFromUrl,
        newPassword: newPassword,
      });
      setSuccessMsg(
        response.message ?? 'Đặt lại mật khẩu thành công! Đang chuyển về trang đăng nhập…',
      );
      // Redirect to login after 2.5 s
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Đã xảy ra lỗi. Liên kết có thể đã hết hạn. Vui lòng thử lại.',
      );
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
        className="hidden lg:flex w-1/2 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 75%, #6366f1 100%)',
        }}
      >
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-80px] right-[-80px] w-72 h-72 bg-white/5 rounded-full" />
          <div className="absolute bottom-[-60px] left-[-60px] w-96 h-96 bg-white/5 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/5 rounded-full" />
        </div>

        {/* Logo — pinned top-left */}
        <div className="absolute top-10 left-12 z-10">
          <Link to="/" className="flex items-center gap-3 w-fit">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <BookOpen size={22} weight="bold" color="white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight select-none">BookNest</span>
          </Link>
        </div>

        {/* Content — absolutely centered */}
        <div className="absolute inset-0 flex items-center justify-center z-10 px-12">
          <div className="w-full max-w-sm">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mb-6">
                <LockKey size={28} weight="duotone" color="white" />
              </div>
              <h1 className="text-4xl font-extrabold text-white leading-tight mb-4">
                Đặt lại<br />
                <span className="text-indigo-200">mật khẩu mới.</span>
              </h1>
              <p className="text-indigo-200 text-base leading-relaxed">
                Tạo một mật khẩu mạnh với ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt.
              </p>

              {/* Policy checklist */}
              <ul className="flex flex-col gap-2.5 mt-8">
                {[
                  'Ít nhất 8 ký tự',
                  'Chứa chữ hoa (A–Z)',
                  'Chứa chữ thường (a–z)',
                  'Chứa chữ số (0–9)',
                  'Chứa ký tự đặc biệt (!@#$…)',
                ].map((rule) => (
                  <li key={rule} className="flex items-center gap-3 text-sm text-indigo-100">
                    <CheckCircle size={16} weight="fill" className="text-indigo-300 shrink-0" />
                    {rule}
                  </li>
                ))}
              </ul>
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

          {/* Heading */}
          <div className="mb-7">
            <h2 className="text-2xl font-extrabold text-slate-800">Đặt lại mật khẩu</h2>
            <p className="text-sm text-slate-500 mt-1.5">
              Nhập mật khẩu mới cho tài khoản của bạn.
            </p>
          </div>

          {/* Invalid token warning */}
          {!tokenFromUrl && (
            <Alert severity="warning" sx={{ borderRadius: '10px', mb: 3 }}>
              Liên kết không hợp lệ. Vui lòng kiểm tra lại email hoặc{' '}
              <Link to="/forgot-password" className="font-semibold underline text-amber-700">
                yêu cầu liên kết mới
              </Link>.
            </Alert>
          )}

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

              {/* New password field */}
              <div>
                <TextField
                  id="reset-new-password"
                  label="Mật khẩu mới"
                  type={showNew ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={handleNewPasswordChange}
                  disabled={submitting || !tokenFromUrl}
                  error={Boolean(fieldErrors.newPassword)}
                  helperText={fieldErrors.newPassword}
                  fullWidth
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowNew((v) => !v)}
                            edge="end"
                            size="small"
                            aria-label={showNew ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                          >
                            {showNew ? <EyeSlash size={18} /> : <Eye size={18} />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={textFieldSx}
                />

                {/* Password strength indicator */}
                {newPassword.length > 0 && (
                  <div className="mt-2 flex items-center gap-3">
                    <LinearProgress
                      variant="determinate"
                      value={(strength.score / 5) * 100}
                      sx={{
                        flex: 1,
                        height: 5,
                        borderRadius: 99,
                        backgroundColor: '#e2e8f0',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: strength.color,
                          borderRadius: 99,
                          transition: 'all 0.3s ease',
                        },
                      }}
                    />
                    <span className="text-xs font-medium shrink-0" style={{ color: strength.color }}>
                      {strength.label}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm password field */}
              <TextField
                id="reset-confirm-password"
                label="Xác nhận mật khẩu mới"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                disabled={submitting || !tokenFromUrl}
                error={Boolean(fieldErrors.confirmPassword)}
                helperText={fieldErrors.confirmPassword}
                fullWidth
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirm((v) => !v)}
                          edge="end"
                          size="small"
                          aria-label={showConfirm ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                        >
                          {showConfirm ? <EyeSlash size={18} /> : <Eye size={18} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
                sx={textFieldSx}
              />

              {/* Submit */}
              <button
                id="reset-submit-btn"
                type="submit"
                disabled={submitting || !tokenFromUrl}
                className={[
                  'mt-1 w-full h-12 rounded-xl text-sm font-bold text-white',
                  'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]',
                  'transition-all duration-200 shadow-lg shadow-indigo-300/50',
                  'flex items-center justify-center gap-2 cursor-pointer',
                  (submitting || !tokenFromUrl) ? 'opacity-70 cursor-not-allowed' : '',
                ].join(' ')}
              >
                {submitting ? (
                  <CircularProgress size={20} sx={{ color: 'white' }} />
                ) : (
                  <>
                    Xác nhận đặt lại mật khẩu
                    <ArrowRight size={17} weight="bold" />
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
