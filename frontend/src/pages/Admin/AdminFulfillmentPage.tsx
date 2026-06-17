/**
 * AdminFulfillmentPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Quầy giao nhận sách O2O (Online-to-Offline) dành cho Thủ thư.
 *
 * Tabs:
 *   1. Chờ giao sách (PENDING_PICKUP) — Admin bấm "Xác nhận giao sách"
 *   2. Đang mượn (CHECKED_OUT + OVERDUE) — Admin bấm "Nhận trả sách"
 *
 * Mỗi thẻ hiển thị: Cover, Tên sách, Email user, Loại mượn, Trạng thái,
 *                    Hạn trả (nếu có), và nút action.
 */

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ClipboardText,
  CheckCircle,
  Warning,
  Package,
  BookOpen,
  Clock,
  User,
  ArrowCounterClockwise,
  X,
  CurrencyCircleDollar,
} from '@phosphor-icons/react';
import toast from 'react-hot-toast';
import AdminLayout from '../../layouts/AdminLayout';
import {
  getAdminLoans,
  pickupLoan,
  returnLoan,
  type AdminLoanItem,
} from '../../api/adminApi';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  PENDING_PICKUP: { label: 'Chờ nhận', className: 'bg-blue-100 text-blue-700' },
  CHECKED_OUT:    { label: 'Đang mượn', className: 'bg-green-100 text-green-700' },
  OVERDUE:        { label: 'Quá hạn!', className: 'bg-rose-100 text-rose-700' },
};

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function isOverdueNow(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

// ─── Return Confirm Modal ─────────────────────────────────────────────────────
function ReturnConfirmModal({
  loan,
  onCancel,
  onConfirm,
  loading,
}: {
  loan: AdminLoanItem;
  onCancel: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  const overdue = isOverdueNow(loan.dueDate);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/50"
        onClick={!loading ? onCancel : undefined}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
      >
        <button type="button" onClick={onCancel} disabled={loading}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
          <X size={18} weight="bold" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${overdue ? 'bg-rose-50' : 'bg-green-50'}`}>
            {overdue
              ? <Warning size={24} weight="fill" className="text-rose-500" />
              : <CheckCircle size={24} weight="fill" className="text-green-500" />}
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base">Xác nhận nhận trả sách</h3>
            <p className="text-xs text-slate-400 mt-0.5">#{loan.id}</p>
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-3 mb-4 space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Sách:</span>
            <span className="font-semibold text-slate-800 text-right max-w-[60%] truncate">{loan.bookTitle}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Người mượn:</span>
            <span className="font-medium text-slate-700">{loan.userEmail}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Hạn trả:</span>
            <span className={`font-medium ${overdue ? 'text-rose-600' : 'text-slate-700'}`}>
              {formatDate(loan.dueDate)}
            </span>
          </div>
          {overdue && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Tiền phạt dự kiến:</span>
              <span className="font-bold text-rose-600">
                {/* Tính thô: số ngày x 5000 */}
                {(() => {
                  const days = Math.ceil((Date.now() - new Date(loan.dueDate!).getTime()) / 86_400_000);
                  return (days * 5000).toLocaleString('vi-VN') + ' VND';
                })()}
              </span>
            </div>
          )}
        </div>

        {overdue && (
          <div className="flex items-start gap-2 bg-rose-50 border border-rose-100 rounded-xl p-3 mb-4">
            <CurrencyCircleDollar size={16} weight="fill" className="text-rose-500 mt-0.5 shrink-0" />
            <p className="text-xs text-rose-700 leading-relaxed">
              Đơn này quá hạn. Tiền phạt sẽ được tạo tự động sau khi xác nhận trả sách.
              <br />Thu tiền mặt tại quầy theo số tiền hiển thị.
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button type="button" onClick={onCancel} disabled={loading}
            className="flex-1 h-10 rounded-xl border-2 border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50">
            Hủy
          </button>
          <button type="button" onClick={onConfirm} disabled={loading}
            className={`flex-1 h-10 rounded-xl text-white text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 ${
              overdue ? 'bg-rose-500 hover:bg-rose-600' : 'bg-green-500 hover:bg-green-600'
            }`}>
            {loading ? 'Đang xử lý…' : 'Xác nhận trả sách'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Loan Card ────────────────────────────────────────────────────────────────
function LoanCard({
  loan,
  onPickup,
  onReturn,
}: {
  loan: AdminLoanItem;
  onPickup?: (loan: AdminLoanItem) => void;
  onReturn?: (loan: AdminLoanItem) => void;
}) {
  const badge     = STATUS_BADGE[loan.status];
  const isOverdue = isOverdueNow(loan.dueDate);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.25 }}
      className={`bg-white rounded-2xl border shadow-sm p-4 flex gap-4 ${
        isOverdue && loan.status !== 'PENDING_PICKUP' ? 'border-rose-200' : 'border-slate-100'
      }`}
    >
      {/* Cover */}
      <div className="w-14 h-20 rounded-lg overflow-hidden shrink-0 bg-slate-100">
        {loan.coverImageUrl
          ? <img src={loan.coverImageUrl} alt={loan.bookTitle} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><BookOpen size={20} className="text-slate-300" /></div>}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="font-semibold text-slate-800 text-sm leading-snug truncate">{loan.bookTitle}</p>
          {badge && (
            <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.className}`}>
              {badge.label}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400 truncate">{loan.authorName}</p>

        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <User size={12} /> {loan.userEmail}
          </span>
          <span className="flex items-center gap-1">
            <Package size={12} /> #{loan.id}
          </span>
          {loan.dueDate && (
            <span className={`flex items-center gap-1 ${isOverdue ? 'text-rose-500 font-semibold' : ''}`}>
              <Clock size={12} /> {isOverdue ? 'Quá hạn: ' : 'Hạn: '}{formatDate(loan.dueDate)}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Tạo: {formatDate(loan.createdAt)} · {loan.type === 'SHORT_TERM' ? '3 ngày' : '14 ngày'}
        </p>
      </div>

      {/* Action button */}
      <div className="flex flex-col items-end justify-center shrink-0">
        {loan.status === 'PENDING_PICKUP' && onPickup && (
          <button type="button"
            onClick={() => onPickup(loan)}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap">
            <CheckCircle size={14} weight="fill" />
            Giao sách
          </button>
        )}
        {(loan.status === 'CHECKED_OUT' || loan.status === 'OVERDUE') && onReturn && (
          <button type="button"
            onClick={() => onReturn(loan)}
            className={`px-3 py-2 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              isOverdue ? 'bg-rose-500 hover:bg-rose-600' : 'bg-green-500 hover:bg-green-600'
            }`}>
            <ArrowCounterClockwise size={14} weight="fill" />
            Nhận trả
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Tab Button ───────────────────────────────────────────────────────────────
function TabBtn({ active, label, count, onClick }: {
  active: boolean; label: string; count: number; onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick}
      className={`relative flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
        active ? 'text-white' : 'text-slate-500 hover:bg-slate-100'
      }`}>
      {active && (
        <motion.span layoutId="fulfillment-tab" className="absolute inset-0 bg-slate-800 rounded-xl"
          transition={{ type: 'spring', stiffness: 350, damping: 30 }} />
      )}
      <span className="relative z-10">{label}</span>
      {count > 0 && (
        <span className={`relative z-10 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
          active ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
        }`}>{count}</span>
      )}
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
type TabId = 'pickup' | 'checkedout';

export default function AdminFulfillmentPage() {
  const [activeTab,       setActiveTab]       = useState<TabId>('pickup');
  const [pickupLoans,     setPickupLoans]     = useState<AdminLoanItem[]>([]);
  const [activeLoans,     setActiveLoans]     = useState<AdminLoanItem[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [actionLoading,   setActionLoading]   = useState<number | null>(null);
  const [returnTarget,    setReturnTarget]    = useState<AdminLoanItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pendingRes, checkedRes, overdueRes] = await Promise.all([
        getAdminLoans('PENDING_PICKUP', 0, 50),
        getAdminLoans('CHECKED_OUT',    0, 50),
        getAdminLoans('OVERDUE',        0, 50),
      ]);
      setPickupLoans(pendingRes.content);
      setActiveLoans([...checkedRes.content, ...overdueRes.content]);
    } catch {
      toast.error('Không thể tải danh sách đơn mượn');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Pickup handler ─────────────────────────────────────────────────────────
  const handlePickup = async (loan: AdminLoanItem) => {
    setActionLoading(loan.id);
    try {
      await pickupLoan(loan.id);
      toast.success(`✅ Đã xác nhận giao sách cho đơn #${loan.id}`);
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi xác nhận giao sách');
    } finally {
      setActionLoading(null);
    }
  };

  // ── Return handler ─────────────────────────────────────────────────────────
  const handleReturnConfirm = async () => {
    if (!returnTarget) return;
    setActionLoading(returnTarget.id);
    try {
      const result = await returnLoan(returnTarget.id);
      if (result.hasFinePending) {
        toast.success(
          `📚 Đã nhận trả sách #${returnTarget.id}. Phạt quá hạn: ${result.fineAmount.toLocaleString('vi-VN')} VND`,
          { duration: 6000 }
        );
      } else {
        toast.success(`✅ Đã nhận trả sách thành công — đơn #${returnTarget.id}`);
      }
      setReturnTarget(null);
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi nhận trả sách');
    } finally {
      setActionLoading(null);
    }
  };

  const visibleLoans = activeTab === 'pickup' ? pickupLoans : activeLoans;

  return (
    <AdminLayout pageTitle="Quầy Giao Nhận">
      <div className="p-6 max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ClipboardText size={26} weight="fill" className="text-blue-500" />
            Quầy Giao Nhận Sách
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Xác nhận giao sách và nhận trả sách tại quầy thư viện
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-2xl p-1.5 w-fit">
          <TabBtn
            active={activeTab === 'pickup'}
            label="Chờ giao sách"
            count={pickupLoans.length}
            onClick={() => setActiveTab('pickup')}
          />
          <TabBtn
            active={activeTab === 'checkedout'}
            label="Đang mượn / Quá hạn"
            count={activeLoans.length}
            onClick={() => setActiveTab('checkedout')}
          />
        </div>

        {/* 24h warning for PENDING_PICKUP tab */}
        {activeTab === 'pickup' && pickupLoans.length > 0 && (
          <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3">
            <Warning size={16} weight="fill" className="text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-800 leading-relaxed">
              Các đơn <strong>PENDING_PICKUP</strong> sẽ tự động bị hủy và sách được nhả về kho nếu không có ai đến nhận sau <strong>24 giờ</strong>.
            </p>
          </div>
        )}

        {/* Loan list */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 h-28 animate-pulse" />
            ))}
          </div>
        ) : visibleLoans.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 text-slate-400"
          >
            <CheckCircle size={48} weight="light" className="mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">
              {activeTab === 'pickup' ? 'Không có đơn nào chờ giao sách' : 'Không có đơn nào đang hoạt động'}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {visibleLoans.map((loan) => (
                <LoanCard
                  key={loan.id}
                  loan={loan}
                  onPickup={activeTab === 'pickup' ? handlePickup : undefined}
                  onReturn={activeTab === 'checkedout' ? (l) => setReturnTarget(l) : undefined}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Return Confirm Modal */}
      <AnimatePresence>
        {returnTarget && (
          <ReturnConfirmModal
            loan={returnTarget}
            onCancel={() => !actionLoading && setReturnTarget(null)}
            onConfirm={handleReturnConfirm}
            loading={actionLoading === returnTarget.id}
          />
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
