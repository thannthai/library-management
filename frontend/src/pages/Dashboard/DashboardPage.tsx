/**
 * DashboardPage.tsx
 * ──────────────────────────────────────────────────────────────
 * Main dashboard for BookNest members.
 * All data fetched from real APIs:
 *   - GET /loans/my   → Current Loans + Reading History (RETURNED)
 *   - GET /reservations/me → Reservations
 *   - PUT /loans/{id}/rate → Submit book rating
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Books,
  CalendarCheck,
  CheckCircle,
  Clock,
  ArrowRight,
  CircleNotch,
  Sparkle,
  Star,
  Trash,
  Warning,
  ArrowCounterClockwise,
  BookOpen,
  ClockCounterClockwise,
  X,
} from '@phosphor-icons/react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { getMyLoans, renewBookLoan, rateBookLoan } from '../../api/loansApi';
import { getMyReservations, cancelReservation, type BookReservationResponse } from '../../api/reservationsApi';
import type { BookLoanResponse } from '../../types/loans.types';
import { toast } from 'react-hot-toast';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDateVi = (dateStr: string | null | undefined) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const getDaysRemaining = (dueDateStr: string | null | undefined): number => {
  if (!dueDateStr) return 0;
  const due = new Date(dueDateStr);
  const now = new Date();
  due.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

function getDueBadge(daysRemaining: number, isOverdue: boolean) {
  if (isOverdue || daysRemaining < 0)
    return { bg: 'bg-rose-50', text: 'text-rose-600', dot: 'bg-rose-500', label: `Quá hạn ${Math.abs(daysRemaining)} ngày` };
  if (daysRemaining <= 3)
    return { bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-500', label: `Còn ${daysRemaining} ngày` };
  return { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500', label: `Còn ${daysRemaining} ngày` };
}

// ─── Book Cover ───────────────────────────────────────────────────────────────

function BookCoverImg({
  src,
  title,
  size = 52,
}: {
  src: string | null | undefined;
  title: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);

  const colors = [
    'from-violet-600 to-indigo-700',
    'from-orange-500 to-rose-600',
    'from-blue-600 to-cyan-700',
    'from-amber-500 to-orange-600',
    'from-emerald-600 to-teal-700',
    'from-rose-600 to-pink-700',
  ];
  let hash = 0;
  for (let i = 0; i < title.length; i++) hash = title.charCodeAt(i) + ((hash << 5) - hash);
  const gradient = colors[Math.abs(hash) % colors.length];

  const w = size;
  const h = Math.round(size * 1.42);

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={title}
        onError={() => setFailed(true)}
        className="object-cover w-full h-full"
        style={{ width: w, height: h }}
        loading="lazy"
      />
    );
  }

  return (
    <div
      className={`bg-gradient-to-br ${gradient} flex items-end p-1.5 select-none`}
      style={{ width: w, height: h }}
    >
      <span className="text-[8px] font-bold text-white/90 leading-tight line-clamp-3">{title}</span>
    </div>
  );
}

// ─── Rating Stars (static display) ───────────────────────────────────────────

function StarDisplay({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          weight={i < rating ? 'fill' : 'regular'}
          className={i < rating ? 'text-amber-400' : 'text-slate-200'}
        />
      ))}
    </div>
  );
}

// ─── Rating Modal ─────────────────────────────────────────────────────────────

function RatingModal({
  loan,
  onClose,
  onSubmit,
}: {
  loan: BookLoanResponse;
  onClose: () => void;
  onSubmit: (loanId: number, rating: number, comment: string) => Promise<void>;
}) {
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedStar, setSelectedStar] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const starLabels = ['', 'Rất tệ', 'Tệ', 'Bình thường', 'Tốt', 'Xuất sắc'];

  const handleSubmit = async () => {
    if (selectedStar === 0) {
      toast.error('Vui lòng chọn số sao để đánh giá!');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(loan.id, selectedStar, comment);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white rounded-2xl shadow-2xl shadow-black/20 w-full max-w-sm overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 text-base">Đánh giá sách</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
          >
            <X size={14} weight="bold" />
          </button>
        </div>

        {/* Book info */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-50">
          <div className="w-10 h-14 rounded-lg overflow-hidden shrink-0 shadow-sm border border-slate-100">
            <BookCoverImg src={loan.coverImageUrl} title={loan.bookTitle} size={40} />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-800 text-sm truncate leading-snug">{loan.bookTitle}</p>
            <p className="text-xs text-slate-500 mt-0.5 truncate">{loan.authorName || 'Chưa rõ tác giả'}</p>
          </div>
        </div>

        {/* Star selector */}
        <div className="px-5 py-5">
          <p className="text-xs font-semibold text-slate-600 mb-3 uppercase tracking-wider">Chọn số sao</p>
          <div className="flex items-center gap-2 mb-2">
            {Array.from({ length: 5 }).map((_, i) => {
              const val = i + 1;
              const filled = hoveredStar >= val || (hoveredStar === 0 && selectedStar >= val);
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => setSelectedStar(val)}
                  onMouseEnter={() => setHoveredStar(val)}
                  onMouseLeave={() => setHoveredStar(0)}
                  className="cursor-pointer transition-transform hover:scale-110 active:scale-95"
                >
                  <Star
                    size={36}
                    weight={filled ? 'fill' : 'regular'}
                    className={filled ? 'text-amber-400' : 'text-slate-200'}
                  />
                </button>
              );
            })}
          </div>
          {(hoveredStar > 0 || selectedStar > 0) && (
            <p className="text-xs font-semibold text-amber-600 h-4 transition-all">
              {starLabels[hoveredStar || selectedStar]}
            </p>
          )}

          {/* Comment input */}
          <div className="mt-4">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-2">
              Nhận xét (tuỳ chọn)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Chia sẻ cảm nhận của bạn về cuốn sách này..."
              rows={3}
              maxLength={500}
              className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-300/50 focus:border-indigo-400 resize-none text-slate-700 placeholder:text-slate-400 transition-all"
            />
            <p className="text-[11px] text-slate-400 text-right mt-1">{comment.length}/500</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-5 pb-5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-10 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || selectedStar === 0}
            className="flex-1 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            {submitting ? (
              <CircleNotch size={14} className="animate-spin" />
            ) : (
              <>
                <Star size={14} weight="fill" />
                Gửi đánh giá
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Current Loans Tab ────────────────────────────────────────────────────────

function CurrentLoansTab({
  loans,
  loading,
  onRenew,
  actionId,
}: {
  loans: BookLoanResponse[];
  loading: boolean;
  onRenew: (id: number) => void;
  actionId: number | null;
}) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-14 gap-2 text-slate-400 text-sm">
        <CircleNotch size={18} className="animate-spin text-indigo-500" />
        Đang tải...
      </div>
    );
  }

  const active = loans.filter(
    (l) => l.status === 'CHECKED_OUT' || l.status === 'PENDING_PICKUP'
  );

  if (active.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center">
          <BookOpen size={26} className="text-indigo-400" weight="fill" />
        </div>
        <div>
          <p className="font-semibold text-slate-700 text-sm">Bạn chưa mượn sách nào</p>
          <p className="text-xs text-slate-400 mt-1">Duyệt danh mục sách và bắt đầu đọc ngay!</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/dashboard/books')}
          className="mt-1 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-indigo-600 border border-indigo-200 rounded-xl hover:bg-indigo-50 transition-colors cursor-pointer"
        >
          Duyệt sách <ArrowRight size={12} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {active.map((loan, i) => {
        const days = getDaysRemaining(loan.dueDate);
        const { bg, text, dot, label } = getDueBadge(days, loan.isOverdue);
        const canRenew =
          loan.paymentStatus === 'PAID' &&
          loan.status === 'CHECKED_OUT' &&
          loan.renewalCount < loan.maxRenewals;

        return (
          <motion.div
            key={loan.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-4 bg-slate-50 hover:bg-white rounded-2xl p-3.5 border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all duration-150 group"
          >
            {/* Cover */}
            <div className="w-[42px] h-[60px] rounded-xl overflow-hidden shrink-0 shadow-sm border border-slate-100">
              <BookCoverImg src={loan.coverImageUrl} title={loan.bookTitle} size={42} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800 text-sm truncate leading-snug">{loan.bookTitle}</p>
              <p className="text-xs text-slate-500 mt-0.5 truncate">{loan.authorName || 'Chưa rõ tác giả'}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <Clock size={11} className="text-slate-400 shrink-0" />
                <span className="text-[11px] text-slate-400">
                  Hạn: {formatDateVi(loan.dueDate)}
                </span>
                {loan.status === 'PENDING_PICKUP' && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">
                    Chờ nhận
                  </span>
                )}
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2 shrink-0">
              {loan.status === 'CHECKED_OUT' && (
                <span className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${bg} ${text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                  {label}
                </span>
              )}
              {canRenew && (
                <button
                  type="button"
                  onClick={() => onRenew(loan.id)}
                  disabled={actionId !== null}
                  className="hidden group-hover:flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {actionId === loan.id ? (
                    <CircleNotch size={11} className="animate-spin" />
                  ) : (
                    <ArrowCounterClockwise size={11} weight="bold" />
                  )}
                  Gia hạn
                </button>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Reservations Tab ─────────────────────────────────────────────────────────

function ReservationsTab({
  reservations,
  loading,
  onCancel,
  cancellingId,
}: {
  reservations: BookReservationResponse[];
  loading: boolean;
  onCancel: (id: number) => void;
  cancellingId: number | null;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-14 gap-2 text-slate-400 text-sm">
        <CircleNotch size={18} className="animate-spin text-indigo-500" />
        Đang tải...
      </div>
    );
  }

  const active = reservations.filter((r) => r.status === 'PENDING' || r.status === 'FULFILLED');

  if (active.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center">
          <CalendarCheck size={26} className="text-violet-400" weight="fill" />
        </div>
        <div>
          <p className="font-semibold text-slate-700 text-sm">Không có đặt trước nào</p>
          <p className="text-xs text-slate-400 mt-1">
            Khi sách bạn muốn hết bản sao, hãy dùng nút "Reserve" để vào hàng đợi.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {active.map((res, i) => (
        <motion.div
          key={res.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-4 bg-slate-50 hover:bg-white rounded-2xl p-3.5 border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all duration-150 group"
        >
          {/* Cover */}
          <div className="w-[42px] h-[60px] rounded-xl overflow-hidden shrink-0 shadow-sm border border-slate-100">
            {res.coverImageUrl ? (
              <img src={res.coverImageUrl} alt={res.bookTitle} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-end p-1.5">
                <span className="text-[8px] font-bold text-white/90 leading-tight line-clamp-3">{res.bookTitle}</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-800 text-sm truncate leading-snug">{res.bookTitle}</p>
            <p className="text-xs text-slate-500 mt-0.5 truncate">{res.authorName || 'Chưa rõ tác giả'}</p>
            <p className="text-[11px] text-slate-400 mt-2">
              Đặt ngày: {new Date(res.reservedDate).toLocaleDateString('vi-VN')}
            </p>
          </div>

          {/* Queue + Cancel */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            {res.status === 'FULFILLED' ? (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                Sách đã sẵn sàng
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-violet-50 text-violet-600 border border-violet-100">
                #{res.priorityPosition} trong hàng
              </span>
            )}
            <button
              type="button"
              onClick={() => onCancel(res.id)}
              disabled={cancellingId !== null}
              className="hidden group-hover:flex items-center gap-1 px-2.5 py-1 rounded-lg border border-rose-200 text-rose-500 text-[11px] font-semibold hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              {cancellingId === res.id ? (
                <CircleNotch size={11} className="animate-spin" />
              ) : (
                <Trash size={11} />
              )}
              Hủy
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Reading History Tab ──────────────────────────────────────────────────────

function ReadingHistoryTab({
  loans,
  loading,
  onRateClick,
}: {
  loans: BookLoanResponse[];
  loading: boolean;
  onRateClick: (loan: BookLoanResponse) => void;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-14 gap-2 text-slate-400 text-sm">
        <CircleNotch size={18} className="animate-spin text-indigo-500" />
        Đang tải...
      </div>
    );
  }

  const returned = loans.filter((l) => l.status === 'RETURNED');

  if (returned.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center">
          <ClockCounterClockwise size={26} className="text-emerald-400" weight="fill" />
        </div>
        <div>
          <p className="font-semibold text-slate-700 text-sm">Chưa có lịch sử đọc sách</p>
          <p className="text-xs text-slate-400 mt-1">Các sách đã trả sẽ xuất hiện tại đây.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {returned.map((loan, i) => (
        <motion.div
          key={loan.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-4 bg-slate-50 hover:bg-white rounded-2xl p-3.5 border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all duration-150"
        >
          {/* Cover */}
          <div className="w-[42px] h-[60px] rounded-xl overflow-hidden shrink-0 shadow-sm border border-slate-100">
            <BookCoverImg src={loan.coverImageUrl} title={loan.bookTitle} size={42} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-800 text-sm truncate leading-snug">{loan.bookTitle}</p>
            <p className="text-xs text-slate-500 mt-0.5 truncate">{loan.authorName || 'Chưa rõ tác giả'}</p>
            <div className="flex items-center gap-1.5 mt-2">
              <CheckCircle size={11} className="text-emerald-500 shrink-0" weight="fill" />
              <span className="text-[11px] text-slate-400">
                Trả {formatDateVi(loan.returnDate || loan.updatedAt)}
              </span>
            </div>
          </div>

          {/* Right: badge + rating */}
          <div className="shrink-0 flex flex-col items-end gap-2">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
              Đã trả
            </span>

            {/* Rating: show stars if rated, show button if not */}
            {loan.rating !== null && loan.rating !== undefined ? (
              <StarDisplay rating={loan.rating} />
            ) : (
              <button
                type="button"
                onClick={() => onRateClick(loan)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 text-[11px] font-semibold hover:bg-amber-100 transition-colors cursor-pointer"
              >
                <Star size={11} weight="fill" />
                Đánh giá
              </button>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Stats Row ─────────────────────────────────────────────────────────────────

function StatsRow({
  activeLoans,
  reservationCount,
  returnedCount,
}: {
  activeLoans: number;
  reservationCount: number;
  returnedCount: number;
}) {
  const stats = [
    {
      label: 'Đang mượn',
      sub: 'Sách đang giữ',
      value: activeLoans,
      icon: Books,
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
      valueColor: 'text-indigo-600',
    },
    {
      label: 'Đặt trước',
      sub: 'Trong hàng đợi',
      value: reservationCount,
      icon: CalendarCheck,
      iconBg: 'bg-violet-100',
      iconColor: 'text-violet-600',
      valueColor: 'text-violet-600',
    },
    {
      label: 'Đã đọc',
      sub: 'Sách đã trả',
      value: returnedCount,
      icon: CheckCircle,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      valueColor: 'text-emerald-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {stats.map(({ label, sub, value, icon: Icon, iconBg, iconColor, valueColor }, i) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4 hover:shadow-md hover:shadow-slate-200/60 transition-shadow duration-200"
        >
          <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
            <Icon size={22} weight="fill" className={iconColor} />
          </div>
          <div>
            <p className={`text-2xl font-bold ${valueColor} leading-none`}>{value}</p>
            <p className="text-sm font-semibold text-slate-700 mt-1 leading-none">{label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Reading Goal Widget ───────────────────────────────────────────────────────

function ReadingGoalWidget({ returnedCount }: { returnedCount: number }) {
  const target = 30;
  const pct = Math.min(Math.round((returnedCount / target) * 100), 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.22, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white rounded-2xl border border-slate-100 p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-[15px] font-bold text-slate-800">Mục tiêu đọc sách 2026</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {returnedCount} / {target} cuốn đã đọc
          </p>
        </div>
        <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
          <Sparkle size={18} weight="fill" className="text-indigo-500" />
        </div>
      </div>
      <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)' }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ delay: 0.5, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <p className="text-xs text-slate-400 mt-2">{pct}% hoàn thành</p>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

type TabId = 'loans' | 'reservations' | 'history';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'loans',        label: 'Đang Mượn',     icon: Books },
  { id: 'reservations', label: 'Đặt Trước',     icon: CalendarCheck },
  { id: 'history',      label: 'Lịch Sử Đọc',  icon: ClockCounterClockwise },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const firstName = user?.fullName?.split(' ').pop() || 'bạn';

  const [activeTab, setActiveTab] = useState<TabId>('loans');

  // Data
  const [loans, setLoans] = useState<BookLoanResponse[]>([]);
  const [reservations, setReservations] = useState<BookReservationResponse[]>([]);
  const [loansLoading, setLoansLoading] = useState(true);
  const [reservationsLoading, setReservationsLoading] = useState(true);

  // Actions
  const [renewingId, setRenewingId] = useState<number | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  // Rating modal
  const [ratingLoan, setRatingLoan] = useState<BookLoanResponse | null>(null);

  // Load all loans
  const fetchLoans = async () => {
    if (!user) return;
    setLoansLoading(true);
    try {
      const res = await getMyLoans(undefined, 0, 200);
      setLoans(res.content.filter((l) => l.status !== 'CANCELED'));
    } catch {
      toast.error('Không thể tải danh sách sách mượn');
    } finally {
      setLoansLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Load reservations
  useEffect(() => {
    if (!user) return;
    setReservationsLoading(true);
    getMyReservations()
      .then(setReservations)
      .catch(() => toast.error('Không thể tải danh sách đặt trước'))
      .finally(() => setReservationsLoading(false));
  }, [user]);

  const handleRenew = async (loanId: number) => {
    if (renewingId !== null) return;
    setRenewingId(loanId);
    try {
      await renewBookLoan(loanId);
      toast.success('Gia hạn sách thành công!');
      await fetchLoans();
    } catch (err: any) {
      toast.error(err.message || 'Không thể gia hạn sách.');
    } finally {
      setRenewingId(null);
    }
  };

  const handleCancelReservation = async (id: number) => {
    if (cancellingId !== null) return;
    setCancellingId(id);
    try {
      await cancelReservation(id);
      toast.success('Hủy đặt trước thành công!');
      setReservations((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      toast.error(err.message || 'Không thể hủy đặt trước.');
    } finally {
      setCancellingId(null);
    }
  };

  const handleSubmitRating = async (loanId: number, rating: number, comment: string) => {
    try {
      const updated = await rateBookLoan(loanId, rating, comment);
      // Update local state to immediately reflect new rating
      setLoans((prev) =>
        prev.map((l) =>
          l.id === loanId
            ? { ...l, rating: updated.rating, comment: updated.comment, ratedAt: updated.ratedAt }
            : l
        )
      );
      toast.success('Cảm ơn bạn đã đánh giá sách! ⭐');
    } catch (err: any) {
      toast.error(err.message || 'Không thể lưu đánh giá. Vui lòng thử lại.');
      throw err; // propagate so modal stays open on error
    }
  };

  // Computed counts
  const activeLoans = loans.filter(
    (l) => l.status === 'CHECKED_OUT' || l.status === 'PENDING_PICKUP'
  ).length;
  const activeReservations = reservations.filter(
    (r) => r.status === 'PENDING' || r.status === 'FULFILLED'
  ).length;
  const returnedCount = loans.filter((l) => l.status === 'RETURNED').length;

  // Overdue warning
  const overdueLoans = loans.filter(
    (l) => l.status === 'OVERDUE' || (l.status === 'CHECKED_OUT' && l.isOverdue)
  );

  return (
    <DashboardLayout pageTitle="Dashboard">
      {/* Rating Modal */}
      <AnimatePresence>
        {ratingLoan && (
          <RatingModal
            loan={ratingLoan}
            onClose={() => setRatingLoan(null)}
            onSubmit={handleSubmitRating}
          />
        )}
      </AnimatePresence>

      <div className="w-full px-5 py-6 md:px-8 md:py-8 flex flex-col gap-6 max-w-[1100px] mx-auto">

        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="text-2xl font-extrabold text-slate-800">
            Xin chào, <span className="text-indigo-600">{firstName}</span> 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Theo dõi hành trình đọc sách và quản lý thư viện của bạn.
          </p>
        </motion.div>

        {/* Overdue warning banner */}
        {overdueLoans.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3 flex items-start gap-3"
          >
            <Warning size={18} weight="fill" className="text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-rose-700">
                Bạn có {overdueLoans.length} cuốn sách quá hạn!
              </p>
              <p className="text-xs text-rose-500 mt-0.5">
                Vui lòng trả sách sớm để tránh phí phạt phát sinh.
              </p>
            </div>
          </motion.div>
        )}

        {/* Stats */}
        <StatsRow
          activeLoans={activeLoans}
          reservationCount={activeReservations}
          returnedCount={returnedCount}
        />

        {/* Reading Goal */}
        <ReadingGoalWidget returnedCount={returnedCount} />

        {/* Tabbed Book List */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white rounded-2xl border border-slate-100"
        >
          {/* Tab bar */}
          <div className="flex border-b border-slate-100 px-5 pt-4 gap-1 overflow-x-auto scrollbar-none">
            {TABS.map(({ id, label, icon: Icon }) => {
              const isActive = id === activeTab;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={[
                    'relative pb-3 px-3 text-sm font-medium cursor-pointer transition-colors duration-150 whitespace-nowrap flex items-center gap-1.5',
                    isActive ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700',
                  ].join(' ')}
                >
                  <Icon size={14} weight={isActive ? 'fill' : 'regular'} />
                  {label}
                  {/* Count badge */}
                  {id === 'loans' && activeLoans > 0 && (
                    <span className="ml-1 min-w-[18px] h-[18px] px-1 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                      {activeLoans}
                    </span>
                  )}
                  {id === 'reservations' && activeReservations > 0 && (
                    <span className="ml-1 min-w-[18px] h-[18px] px-1 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center">
                      {activeReservations}
                    </span>
                  )}
                  {isActive && (
                    <motion.span
                      layoutId="tab-underline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div className="p-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
              >
                {activeTab === 'loans' && (
                  <CurrentLoansTab
                    loans={loans}
                    loading={loansLoading}
                    onRenew={handleRenew}
                    actionId={renewingId}
                  />
                )}
                {activeTab === 'reservations' && (
                  <ReservationsTab
                    reservations={reservations}
                    loading={reservationsLoading}
                    onCancel={handleCancelReservation}
                    cancellingId={cancellingId}
                  />
                )}
                {activeTab === 'history' && (
                  <ReadingHistoryTab
                    loans={loans}
                    loading={loansLoading}
                    onRateClick={(loan) => setRatingLoan(loan)}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
