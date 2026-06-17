/**
 * CheckoutModal.tsx
 * ─────────────────────────────────────────────────────────────
 * Modal thanh toán SePay hiện ra khi user mượn lẻ (không có Subscription).
 *
 * Props:
 *   - loanId: ID đơn mượn đang chờ thanh toán
 *   - bookTitle: tên sách để hiển thị
 *   - sePayCheckout: object trả về từ API borrow (chứa checkoutFormUrl)
 *   - onClose: gọi khi đồng hồ hết giờ (xử lý toast.error và cleanup ở page cha)
 *   - onSuccess: gọi khi SePay xác nhận thanh toán (xử lý toast.success và navigate ở page cha)
 *
 * Tính năng:
 *   1. Hiển thị QR code SePay (iframe embed từ checkoutFormUrl)
 *   2. Countdown 5 phút (300 giây) — khi về 0 tự đóng + gọi onClose
 *   3. Short-polling mỗi 3 giây — gọi GET /api/loans/{loanId}
 *      Khi status === "CHECKED_OUT" → dừng hết timer, gọi onSuccess() rồi onClose()
 * ─────────────────────────────────────────────────────────────
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Clock,
  QrCode,
  CheckCircle,
  WarningCircle,
  ArrowClockwise,
  ArrowRight,
  CircleNotch,
} from '@phosphor-icons/react';
import { getBookLoanById } from '../api/loansApi';
import { simulatePayment } from '../api/paymentsApi';
import type { SePayCheckout } from '../types/subscription.types';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface CheckoutModalProps {
  /** ID của đơn mượn đang chờ thanh toán */
  loanId: number;
  /** Tên sách hiển thị trong modal */
  bookTitle: string;
  /** SePay checkout data trả về từ API borrow */
  sePayCheckout: SePayCheckout;
  /**
   * Callback khi đóng modal.
   * reason: 'expired' (hết giờ) hoặc 'closed' (user chủ động đóng)
   */
  onClose: (reason?: 'expired' | 'closed') => void;
  /**
   * Callback khi thanh toán xác nhận thành công (polling thấy CHECKED_OUT).
   * Page cha chịu trách nhiệm gọi toast.success và navigate.
   */
  onSuccess: () => void;
  /** Thời điểm tạo đơn mượn (để tính countdown còn lại khi mở từ My Loans) */
  createdAt?: string;
}

// ─── Hằng số ──────────────────────────────────────────────────────────────────

const COUNTDOWN_SECONDS = 300; // 5 phút, khớp với Redis TTL
const POLLING_INTERVAL_MS = 3000; // 3 giây

// ─── Helper: định dạng mm:ss ──────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ─── Helper: tính % còn lại cho progress ring ─────────────────────────────────

function getProgressPercent(remaining: number): number {
  return (remaining / COUNTDOWN_SECONDS) * 100;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CheckoutModal({
  loanId,
  bookTitle,
  sePayCheckout,
  onClose,
  onSuccess,
  createdAt,
}: CheckoutModalProps) {
  const [secondsLeft, setSecondsLeft] = useState(() => {
    if (!createdAt) return COUNTDOWN_SECONDS;
    try {
      const createdTime = new Date(createdAt).getTime();
      const nowTime = new Date().getTime();
      if (isNaN(createdTime)) return COUNTDOWN_SECONDS;
      const diffSeconds = Math.floor((nowTime - createdTime) / 1000);
      const remaining = COUNTDOWN_SECONDS - diffSeconds;
      return remaining > 0 ? remaining : 0;
    } catch (err) {
      console.error("Lỗi khi parse createdAt trong CheckoutModal:", err);
      return COUNTDOWN_SECONDS;
    }
  });
  const [pollState, setPollState] = useState<'idle' | 'success' | 'expired'>('idle');
  const [simulating, setSimulating] = useState(false);

  // Refs để clean up interval/timeout đúng cách ngay cả khi component unmount
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopAll = useCallback(() => {
    console.log("stopAll() triggered, clearing all intervals");
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (pollRef.current) clearInterval(pollRef.current);
  }, []);

  // ── Short-polling: kiểm tra trạng thái đơn mỗi 3 giây ──────────────────────
  useEffect(() => {
    console.log("Setting up short-polling interval for loan ID:", loanId);
    pollRef.current = setInterval(async () => {
      try {
        console.log("Polling status for loan ID:", loanId);
        const loan = await getBookLoanById(loanId);
        console.log("Loan status result:", loan.status);
        // Thanh toán thành công khi đơn chuyển sang PENDING_PICKUP (O2O flow)
        // hoặc CHECKED_OUT (VIP borrow trực tiếp không qua payment)
        if (loan.status === 'PENDING_PICKUP' || loan.status === 'CHECKED_OUT') {
          console.log("Payment confirmed, loan status:", loan.status);
          stopAll();
          setPollState('success');
          // Hiển thị animation success 1.5s rồi thông báo page cha xử lý toast + navigate
          setTimeout(() => {
            onSuccess();
          }, 1500);
        }
      } catch (err) {
        console.error("Short-polling error for loan:", loanId, err);
      }
    }, POLLING_INTERVAL_MS);

    return () => {
      if (pollRef.current) {
        console.log("Cleaning up polling interval for loan ID:", loanId);
        clearInterval(pollRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loanId]);

  // ── Countdown: đếm ngược từ 300 → 0 ──────────────────────────────────────
  useEffect(() => {
    countdownRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          console.log("Countdown reached 0, canceling reservation");
          if (pollRef.current) clearInterval(pollRef.current);
          if (countdownRef.current) clearInterval(countdownRef.current);
          setPollState('expired');
          // Đóng modal sau 2.5s để user đọc thông báo
          setTimeout(() => {
            onClose('expired');
          }, 2500);
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Cleanup khi unmount (phòng memory leak) ───────────────────────────────
  useEffect(() => {
    return () => stopAll();
  }, [stopAll]);

  const progress = getProgressPercent(secondsLeft);
  const isUrgent = secondsLeft <= 60;

  // ── Circumference của SVG progress ring ───────────────────────────────────
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // ── Redirect to SePay fallback function ─────────────────────────────────────
  const handleRedirectToSePay = () => {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = sePayCheckout.checkoutFormUrl;
    form.target = '_blank'; // Open in a new tab

    Object.entries(sePayCheckout.params).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value;
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  };

  const handleSimulatePayment = async () => {
    if (simulating) return;
    setSimulating(true);
    try {
      const txnRef = sePayCheckout.description || sePayCheckout.params?.order_description || '';
      await simulatePayment(txnRef);
    } catch (err: any) {
      alert(err.message || 'Giả lập thanh toán thất bại.');
    } finally {
      setSimulating(false);
    }
  };

  return (
    <AnimatePresence>
      {/* Overlay */}
      <motion.div
        key="checkout-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(15, 23, 42, 0.72)', backdropFilter: 'blur(8px)' }}
        onClick={(e) => {
          // Chỉ đóng khi click vào overlay, không phải modal
          if (e.target === e.currentTarget && pollState === 'idle') onClose('closed');
        }}
      >
        {/* Modal Card */}
        <motion.div
          key="checkout-card"
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
          style={{
            background: 'linear-gradient(145deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
            border: '1px solid rgba(99,102,241,0.25)',
          }}
        >
          {/* Header gradient strip */}
          <div
            className="h-1 w-full"
            style={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4)' }}
          />

          {/* Close button — chỉ hiện khi còn đang idle */}
          {pollState === 'idle' && (
            <button
              type="button"
              onClick={() => onClose('closed')}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150 cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            >
              <X size={15} color="rgba(255,255,255,0.7)" weight="bold" />
            </button>
          )}

          <div className="p-6">
            {/* ─── STATE: SUCCESS ──────────────────────────────────── */}
            {pollState === 'success' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-4 py-6 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
                >
                  <CheckCircle size={72} weight="fill" className="text-emerald-400" />
                </motion.div>
                <div>
                  <p className="text-xl font-extrabold text-white">Thanh toán thành công!</p>
                  <p className="text-sm text-slate-400 mt-1">
                    Đơn mượn đã xác nhận.<br/>
                    <span className="text-emerald-400 font-medium">Ra quầy thư viện để nhận sách nhé!</span>
                  </p>
                </div>
              </motion.div>
            )}

            {/* ─── STATE: EXPIRED ──────────────────────────────────── */}
            {pollState === 'expired' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-4 py-6 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
                >
                  <WarningCircle size={72} weight="fill" className="text-rose-400" />
                </motion.div>
                <div>
                  <p className="text-xl font-extrabold text-white">Hết thời gian giữ chỗ</p>
                  <p className="text-sm text-slate-400 mt-1">
                    Đơn mượn đã tự động hủy. Vui lòng thử lại.
                  </p>
                </div>
              </motion.div>
            )}

            {/* ─── STATE: IDLE (thanh toán đang chờ) ──────────────── */}
            {pollState === 'idle' && (
              <>
                {/* Title */}
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(99,102,241,0.18)' }}
                  >
                    <QrCode size={20} weight="bold" className="text-indigo-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">
                      Thanh toán qua SePay
                    </p>
                    <p
                      className="text-sm font-bold text-white truncate mt-0.5"
                      title={bookTitle}
                    >
                      {bookTitle}
                    </p>
                  </div>
                </div>

                {/* QR Code Image */}
                <div className="flex flex-col items-center mb-5">
                  <div
                    className="relative rounded-2xl overflow-hidden p-3 bg-white mb-4 flex items-center justify-center"
                    style={{
                      width: '200px',
                      height: '200px',
                      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
                    }}
                  >
                    {sePayCheckout.qrCodeUrl ? (
                      <img
                        src={sePayCheckout.qrCodeUrl}
                        alt="SePay QR Payment"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                        <CircleNotch size={32} className="animate-spin text-indigo-600 mb-2" />
                        <span className="text-[10px]">Đang tạo mã QR...</span>
                      </div>
                    )}
                  </div>

                  {/* Chi tiết chuyển khoản */}
                  <div className="w-full space-y-2 text-xs text-slate-300 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Ngân hàng:</span>
                      <span className="font-semibold text-white">{sePayCheckout.bankCode || 'Techcombank (TCB)'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Số tài khoản:</span>
                      <span className="font-semibold text-white font-mono">{sePayCheckout.bankAccount || '93767'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Số tiền:</span>
                      <span className="font-bold text-indigo-300">15.000 ₫</span>
                    </div>
                    <div className="border-t border-slate-800/80 my-2 pt-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-slate-500">Nội dung chuyển khoản:</span>
                        <button
                          type="button"
                          onClick={() => {
                            const desc = sePayCheckout.description || sePayCheckout.params?.order_description || '';
                            navigator.clipboard.writeText(desc);
                          }}
                          className="px-2 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 font-bold text-[10px] cursor-pointer transition-colors"
                        >
                          Sao chép
                        </button>
                      </div>
                      <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 text-center">
                        <code className="text-xs font-mono font-bold text-indigo-300 select-all break-all">
                          {sePayCheckout.description || sePayCheckout.params?.order_description || ''}
                        </code>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hoặc mở trang SePay */}
                <div className="mb-3">
                  <button
                    type="button"
                    onClick={handleRedirectToSePay}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-md shadow-indigo-950"
                  >
                    <span>Thanh toán qua cổng SePay (Thẻ/ATM/QR)</span>
                    <ArrowRight size={14} weight="bold" />
                  </button>
                </div>

                {/* Giả lập thanh toán thành công (Thử nghiệm) */}
                <div className="mb-5">
                  <button
                    type="button"
                    onClick={handleSimulatePayment}
                    disabled={simulating}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {simulating ? (
                      <CircleNotch size={14} className="animate-spin" />
                    ) : (
                      <CheckCircle size={14} weight="bold" />
                    )}
                    <span>Giả lập thanh toán thành công (Thử nghiệm)</span>
                  </button>
                </div>

                {/* Countdown Row */}
                <div className="flex items-center justify-between px-1">
                  {/* SVG ring + time */}
                  <div className="flex items-center gap-2.5">
                    <div className="relative w-12 h-12 shrink-0">
                      <svg
                        className="w-full h-full -rotate-90"
                        viewBox="0 0 48 48"
                      >
                        {/* Track */}
                        <circle
                          cx="24"
                          cy="24"
                          r={radius}
                          fill="none"
                          stroke="rgba(255,255,255,0.08)"
                          strokeWidth="3.5"
                        />
                        {/* Progress */}
                        <circle
                          cx="24"
                          cy="24"
                          r={radius}
                          fill="none"
                          stroke={isUrgent ? '#f87171' : '#818cf8'}
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                          style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.4s ease' }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Clock
                          size={14}
                          weight="bold"
                          className={isUrgent ? 'text-rose-400' : 'text-indigo-400'}
                        />
                      </div>
                    </div>
                    <div>
                      <p
                        className={`text-xl font-extrabold tabular-nums ${
                          isUrgent ? 'text-rose-400' : 'text-white'
                        }`}
                      >
                        {formatTime(secondsLeft)}
                      </p>
                      <p className="text-[11px] text-slate-500 leading-tight">
                        Còn lại để thanh toán
                      </p>
                    </div>
                  </div>

                  {/* Polling indicator */}
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1.5">
                      <motion.div
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-2 h-2 rounded-full bg-emerald-400"
                      />
                      <span className="text-[11px] text-slate-400">Đang kiểm tra…</span>
                    </div>
                    <span className="text-[10px] text-slate-600 flex items-center gap-1">
                      <ArrowClockwise size={10} />
                      cứ mỗi 3 giây
                    </span>
                  </div>
                </div>

                {/* Urgent warning */}
                <AnimatePresence>
                  {isUrgent && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      className="mt-4 flex items-center gap-2 px-3 py-2.5 rounded-xl"
                      style={{
                        background: 'rgba(248,113,113,0.1)',
                        border: '1px solid rgba(248,113,113,0.25)',
                      }}
                    >
                      <WarningCircle size={14} weight="fill" className="text-rose-400 shrink-0" />
                      <p className="text-xs text-rose-300">
                        Sắp hết giờ! Vui lòng quét QR ngay để tránh hủy đơn.
      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Footer hint */}
                <p className="text-center text-[11px] text-slate-600 mt-4">
                  Đơn sẽ tự động hủy nếu chưa thanh toán trong thời gian trên
                </p>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
