/**
 * AdminLoansPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Trang xem toàn bộ đơn mượn cho Admin — có filter theo status,
 * phân trang, và hiển thị dạng bảng.
 */

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Books,
  MagnifyingGlass,
  ArrowLeft,
  ArrowRight,
  BookOpen,
} from '@phosphor-icons/react';
import AdminLayout from '../../layouts/AdminLayout';
import { getAdminLoans, type AdminLoanItem, type LoanStatus, type PageResponse } from '../../api/adminApi';

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_OPTIONS: { value: LoanStatus | 'ALL'; label: string; color: string }[] = [
  { value: 'ALL',             label: 'Tất cả',          color: 'text-slate-600' },
  { value: 'PENDING_PAYMENT', label: 'Chờ thanh toán',  color: 'text-amber-600' },
  { value: 'PENDING_PICKUP',  label: 'Chờ nhận sách',   color: 'text-blue-600' },
  { value: 'CHECKED_OUT',     label: 'Đang mượn',       color: 'text-green-600' },
  { value: 'OVERDUE',         label: 'Quá hạn',         color: 'text-rose-600' },
  { value: 'RETURNED',        label: 'Đã trả',          color: 'text-slate-400' },
  { value: 'CANCELED',        label: 'Đã hủy',          color: 'text-slate-400' },
];

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  PENDING_PAYMENT: { label: 'Chờ thanh toán',  className: 'bg-amber-50  text-amber-700  border-amber-200' },
  PENDING_PICKUP:  { label: 'Chờ nhận sách',   className: 'bg-blue-50   text-blue-700   border-blue-200' },
  CHECKED_OUT:     { label: 'Đang mượn',        className: 'bg-green-50  text-green-700  border-green-200' },
  OVERDUE:         { label: 'Quá hạn',          className: 'bg-rose-50   text-rose-700   border-rose-200' },
  RETURNED:        { label: 'Đã trả',           className: 'bg-slate-50  text-slate-500  border-slate-200' },
  CANCELED:        { label: 'Đã hủy',           className: 'bg-slate-50  text-slate-400  border-slate-200' },
};

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ─── Row ──────────────────────────────────────────────────────────────────────
function LoanRow({ loan }: { loan: AdminLoanItem }) {
  const badge = STATUS_BADGE[loan.status] ?? { label: loan.status, className: 'bg-slate-50 text-slate-500 border-slate-200' };

  return (
    <tr className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors">
      <td className="py-3 px-4 text-sm font-mono text-slate-400">#{loan.id}</td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-12 rounded-lg overflow-hidden bg-slate-100 shrink-0">
            {loan.coverImageUrl
              ? <img src={loan.coverImageUrl} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center"><BookOpen size={14} className="text-slate-300" /></div>}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 leading-snug max-w-[200px] truncate">{loan.bookTitle}</p>
            <p className="text-xs text-slate-400 truncate max-w-[200px]">{loan.authorName}</p>
          </div>
        </div>
      </td>
      <td className="py-3 px-4 text-sm text-slate-600 max-w-[180px]">
        <span className="truncate block">{loan.userEmail}</span>
      </td>
      <td className="py-3 px-4">
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${badge.className}`}>
          {badge.label}
        </span>
      </td>
      <td className="py-3 px-4 text-sm text-slate-600">{formatDate(loan.dueDate)}</td>
      <td className="py-3 px-4 text-sm text-slate-600">{formatDate(loan.createdAt)}</td>
      <td className="py-3 px-4">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          loan.paymentStatus === 'PAID' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
        }`}>
          {loan.paymentStatus ?? '—'}
        </span>
      </td>
    </tr>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminLoansPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const statusParam = (searchParams.get('status') as LoanStatus | null) ?? 'ALL';

  const [selectedStatus, setSelectedStatus] = useState<LoanStatus | 'ALL'>(statusParam);
  const [page,      setPage]      = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [response,  setResponse]  = useState<PageResponse<AdminLoanItem> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminLoans(
        selectedStatus === 'ALL' ? null : selectedStatus,
        page,
        20,
      );
      setResponse(res);
    } catch {
      // ignore — user sees empty table
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, page]);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = (s: LoanStatus | 'ALL') => {
    setSelectedStatus(s);
    setPage(0);
    setSearchParams(s !== 'ALL' ? { status: s } : {});
  };

  return (
    <AdminLayout pageTitle="Tất Cả Đơn Mượn">
      <div className="p-6 space-y-5">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Books size={26} weight="fill" className="text-indigo-500" />
            Quản lý đơn mượn
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Tổng cộng {response?.totalElements ?? '…'} đơn
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleStatusChange(opt.value)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                selectedStatus === opt.value
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
              }`}
            >
              {opt.label}
            </button>
          ))}

          <button type="button" onClick={load}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer">
            <MagnifyingGlass size={13} />
            Làm mới
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="py-3 px-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wide">ID</th>
                  <th className="py-3 px-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wide">Sách</th>
                  <th className="py-3 px-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wide">Người mượn</th>
                  <th className="py-3 px-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wide">Trạng thái</th>
                  <th className="py-3 px-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wide">Hạn trả</th>
                  <th className="py-3 px-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wide">Tạo lúc</th>
                  <th className="py-3 px-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wide">Thanh toán</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-50">
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="py-3 px-4">
                          <div className="h-4 bg-slate-100 rounded animate-pulse" style={{ width: `${60 + (i + j) * 7}%` }} />
                        </td>
                      ))}
                    </tr>
                  ))
                  : response?.content.length === 0
                    ? (
                      <tr>
                        <td colSpan={7} className="py-16 text-center text-slate-400 text-sm">
                          Không có đơn mượn nào
                        </td>
                      </tr>
                    )
                    : response?.content.map((loan) => (
                      <motion.tr
                        key={loan.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors"
                        // Using custom LoanRow inline to satisfy motion.tr
                        // (we can't use a component directly with motion.tr)
                        // Fields are rendered inline here
                        {...{}}
                      >
                        {/* Reuse LoanRow logic inline */}
                        {(() => {
                          const badge = STATUS_BADGE[loan.status] ?? { label: loan.status, className: 'bg-slate-50 text-slate-500 border-slate-200' };
                          return (
                            <>
                              <td className="py-3 px-4 text-sm font-mono text-slate-400">#{loan.id}</td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-12 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                                    {loan.coverImageUrl
                                      ? <img src={loan.coverImageUrl} alt="" className="w-full h-full object-cover" />
                                      : <div className="w-full h-full flex items-center justify-center"><BookOpen size={14} className="text-slate-300" /></div>}
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-slate-800 leading-snug max-w-[200px] truncate">{loan.bookTitle}</p>
                                    <p className="text-xs text-slate-400 truncate max-w-[200px]">{loan.authorName}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-sm text-slate-600 max-w-[180px]"><span className="truncate block">{loan.userEmail}</span></td>
                              <td className="py-3 px-4">
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${badge.className}`}>{badge.label}</span>
                              </td>
                              <td className="py-3 px-4 text-sm text-slate-600">{formatDate(loan.dueDate)}</td>
                              <td className="py-3 px-4 text-sm text-slate-600">{formatDate(loan.createdAt)}</td>
                              <td className="py-3 px-4">
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                  loan.paymentStatus === 'PAID' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                                }`}>{loan.paymentStatus ?? '—'}</span>
                              </td>
                            </>
                          );
                        })()}
                      </motion.tr>
                    ))
                }
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {response && response.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
              <span className="text-xs text-slate-400">
                Trang {response.page + 1} / {response.totalPages}
              </span>
              <div className="flex gap-2">
                <button type="button"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={response.first}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer">
                  <ArrowLeft size={13} /> Trước
                </button>
                <button type="button"
                  onClick={() => setPage(p => p + 1)}
                  disabled={response.last}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer">
                  Tiếp <ArrowRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

// Keep LoanRow if needed separately
export { LoanRow };
