/**
 * AdminFinesPage.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Quản lý phí phạt quá hạn dành cho Admin.
 * Admin xác nhận thanh toán tiền mặt tại quầy — không có online payment.
 *
 * Cột hiển thị: Fine ID | Reader | Book Title | Reason | Overdue Days | Fine Amount | Created | Status | Action
 */

import { useState, useEffect } from 'react';
import { CurrencyCircleDollar, CheckCircle, Warning, Clock } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';
import AdminLayout from '../../layouts/AdminLayout';
import axiosClient from '../../api/axiosClient';

interface FineItem {
  id: number;
  userEmail: string;
  userName: string | null;
  bookTitle: string | null;
  reason: string;
  type: string;
  amount: number;
  amountPaid: number;
  status: 'PENDING' | 'PAID' | 'WAIVED';
  createdAt: string;
  overdueDays?: number;
}

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

export default function AdminFinesPage() {
  const [fines, setFines] = useState<FineItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFines = async () => {
    setLoading(true);
    try {
      const { data } = await axiosClient.get('/fines', { params: { page: 0, size: 100 } });
      setFines(data.data.content);
    } catch {
      toast.error('Error loading fines list');
    } finally {
      setLoading(false);
    }
  };

  // Xác nhận thanh toán tiền mặt tại quầy — cập nhật status → PAID
  const confirmPayment = async (fineId: number) => {
    try {
      await axiosClient.post(`/fines/${fineId}/confirm`);
      toast.success('✅ Cash payment confirmed successfully');
      fetchFines();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error confirming payment');
    }
  };

  useEffect(() => {
    fetchFines();
  }, []);

  // Tổng hợp số liệu
  const pendingCount = fines.filter((f) => f.status === 'PENDING').length;
  const totalPendingAmount = fines
    .filter((f) => f.status === 'PENDING')
    .reduce((sum, f) => sum + f.amount, 0);
  const totalCollected = fines
    .filter((f) => f.status === 'PAID')
    .reduce((sum, f) => sum + f.amount, 0);

  return (
    <AdminLayout pageTitle="Fines">
      <div className="p-6 max-w-7xl mx-auto space-y-6">

        {/* ─── Header ──────────────────────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <CurrencyCircleDollar size={26} weight="fill" className="text-amber-500" />
            Manage Fines
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Settle and confirm cash payments for overdue fines. All payments must be collected at the counter.
          </p>
        </div>

        {/* ─── Summary Stats ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Unpaid Fines */}
          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
              <Warning size={18} weight="fill" className="text-rose-600" />
            </div>
            <div>
              <p className="text-xs text-rose-500 font-medium">Pending Fines</p>
              <p className="text-xl font-bold text-rose-700">{pendingCount}</p>
            </div>
          </div>

          {/* Total Pending Amount */}
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Clock size={18} weight="fill" className="text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-amber-600 font-medium">Outstanding Amount</p>
              <p className="text-xl font-bold text-amber-700">{totalPendingAmount.toLocaleString('vi-VN')} VND</p>
            </div>
          </div>

          {/* Total Collected */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <CheckCircle size={18} weight="fill" className="text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-emerald-600 font-medium">Total Collected</p>
              <p className="text-xl font-bold text-emerald-700">{totalCollected.toLocaleString('vi-VN')} VND</p>
            </div>
          </div>
        </div>

        {/* ─── Fines Table ─────────────────────────────────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-medium uppercase text-xs">
                <tr>
                  <th className="px-5 py-4">Fine ID</th>
                  <th className="px-5 py-4">Reader</th>
                  <th className="px-5 py-4">Book</th>
                  <th className="px-5 py-4">Reason</th>
                  <th className="px-5 py-4 text-center">Days</th>
                  <th className="px-5 py-4 text-right">Amount</th>
                  <th className="px-5 py-4">Created</th>
                  <th className="px-5 py-4 text-center">Status</th>
                  <th className="px-5 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-10 text-center text-slate-400">Loading data...</td>
                  </tr>
                ) : fines.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-10 text-center text-slate-400">No fines data found.</td>
                  </tr>
                ) : (
                  fines.map((fine) => (
                    <motion.tr
                      key={fine.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-5 py-3.5 font-medium text-slate-700">#{fine.id}</td>
                      <td className="px-5 py-3.5 text-xs">
                        <div className="font-medium text-slate-700">{fine.userName || '—'}</div>
                        <div className="text-slate-400">{fine.userEmail}</div>
                      </td>
                      {/* Tên sách liên quan tới fine */}
                      <td className="px-5 py-3.5 text-xs text-slate-600 max-w-[140px] truncate">
                        {fine.bookTitle || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500 max-w-[180px]">
                        <span className="line-clamp-2">{fine.reason}</span>
                      </td>
                      {/* Số ngày quá hạn */}
                      <td className="px-5 py-3.5 text-center">
                        {fine.overdueDays != null ? (
                          <span className="text-xs font-bold text-rose-600">{fine.overdueDays}d</span>
                        ) : '—'}
                      </td>
                      {/* Số tiền phạt */}
                      <td className="px-5 py-3.5 text-right font-bold text-rose-600">
                        {fine.amount.toLocaleString('vi-VN')} VND
                      </td>
                      {/* Ngày tạo fine */}
                      <td className="px-5 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                        {formatDate(fine.createdAt)}
                      </td>
                      {/* Status badge — chỉ PENDING hoặc PAID, không có PARTIALLY_PAID */}
                      <td className="px-5 py-3.5 text-center">
                        {fine.status === 'PAID' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                            <CheckCircle weight="fill" size={10} /> Paid
                          </span>
                        ) : fine.status === 'WAIVED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                            Waived
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                            <Warning weight="fill" size={10} /> Pending
                          </span>
                        )}
                      </td>
                      {/* Nút "Collect Cash" — chỉ hiện khi PENDING, tức là chưa thanh toán */}
                      <td className="px-5 py-3.5 text-right">
                        {fine.status === 'PENDING' && (
                          <button
                            type="button"
                            onClick={() => confirmPayment(fine.id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
                          >
                            Collect Cash
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
