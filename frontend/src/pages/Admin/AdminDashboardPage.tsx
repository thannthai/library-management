import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardText,
  Books,
  ClockCounterClockwise,
  Warning,
  CheckCircle,
  ArrowRight,
  ChartLineUp,
  UserGear,
  ListBullets,
  CurrencyCircleDollar,
} from '@phosphor-icons/react';
import { motion } from 'motion/react';
import AdminLayout from '../../layouts/AdminLayout';
import { getAdminStats, getAdminLoans, type AdminStats, type AdminLoanItem } from '../../api/adminApi';

function StatCard({
  label,
  value,
  icon: Icon,
  colorClass,
  delay,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  colorClass: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white rounded-3xl border border-slate-100 p-5 flex items-center gap-4.5 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${colorClass}`}>
        <Icon size={20} weight="fill" />
      </div>
      <div>
        <p className="text-xl font-black text-slate-800 leading-tight">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1">{label}</p>
      </div>
    </motion.div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentLoans, setRecentLoans] = useState<AdminLoanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const statsData = await getAdminStats();
        setStats(statsData);
        
        const loansData = await getAdminLoans(null, 0, 5);
        setRecentLoans(loansData.content || []);
      } catch (e: any) {
        setError(e.message || 'Không thể tải dữ liệu thống kê.');
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  return (
    <AdminLayout pageTitle="Admin Dashboard">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5"
        >
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <ChartLineUp size={26} className="text-red-500" />
              Tổng Quan Hệ Thống
            </h1>
            <p className="text-sm text-slate-400 font-medium mt-1">BookNest Admin Control Room • Real-time library metrics.</p>
          </div>
          <div className="flex gap-2">
            <Link to="/admin/fulfillment" className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow">
              <ClipboardText size={14} weight="bold" /> Xử lý giao nhận
            </Link>
          </div>
        </motion.div>

        {/* Info Alerts banner */}
        {stats && stats.pendingPickup > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-50/50 border border-red-100 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-red-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-red-200">
                <Warning size={20} weight="fill" />
              </div>
              <div>
                <h3 className="font-bold text-red-950 text-sm">Cần xử lý: {stats.pendingPickup} đơn đang chờ nhận sách</h3>
                <p className="text-xs text-red-700/80 mt-0.5">Độc giả đã đặt chỗ và thanh toán. Quá 24h không nhận sách sẽ tự động hủy đơn.</p>
              </div>
            </div>
            <Link to="/admin/fulfillment" className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors self-start sm:self-center">
              Giao sách ngay
            </Link>
          </motion.div>
        )}

        {/* Loading / Error states */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-3xl border border-slate-100 h-28" />
            ))}
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-100 rounded-3xl p-5 text-sm text-rose-600">{error}</div>
        ) : stats ? (
          /* Stats Grid */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4.5">
            <StatCard
              label="Tổng doanh thu"
              value={stats.totalRevenue ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(stats.totalRevenue) : '0 ₫'}
              icon={CurrencyCircleDollar}
              colorClass="bg-gradient-to-br from-amber-400 to-orange-500 text-white"
              delay={0.01}
            />
            <StatCard
              label="Doanh thu tháng"
              value={stats.monthlyRevenue ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(stats.monthlyRevenue) : '0 ₫'}
              icon={CurrencyCircleDollar}
              colorClass="bg-gradient-to-br from-rose-500 to-orange-500 text-white"
              delay={0.03}
            />
            <StatCard label="Tổng đơn mượn" value={stats.totalLoans} icon={Books} colorClass="bg-indigo-500 text-white" delay={0.05} />
            <StatCard label="Chờ nhận sách" value={stats.pendingPickup} icon={ClipboardText} colorClass="bg-red-500 text-white" delay={0.1} />
            <StatCard label="Đang mượn" value={stats.checkedOut} icon={CheckCircle} colorClass="bg-emerald-500 text-white" delay={0.15} />
            <StatCard label="Quá hạn" value={stats.overdue} icon={Warning} colorClass="bg-amber-500/90 text-white" delay={0.2} />
            <StatCard label="Chờ thanh toán" value={stats.pendingPayment} icon={ClockCounterClockwise} colorClass="bg-purple-500 text-white" delay={0.25} />
            <StatCard label="Đã hoàn thành" value={stats.returned} icon={CheckCircle} colorClass="bg-slate-400 text-white" delay={0.3} />
            <StatCard label="Tổng kho sách" value={stats.totalBooks} icon={Books} colorClass="bg-cyan-500 text-white" delay={0.35} />
          </div>
        ) : null}

        {/* Split grid layout: Recent Transactions & Quick tools */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* Recent Loans Stream */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-800 mb-4.5 flex items-center gap-2">
                <ListBullets size={20} weight="bold" className="text-indigo-600" />
                Giao Dịch Gần Đây
              </h2>
              {loading ? (
                <div className="py-10 text-center text-xs text-slate-400">Đang tải lịch sử...</div>
              ) : recentLoans.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">Chưa có giao dịch mượn sách nào.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead>
                      <tr className="text-slate-400 font-semibold border-b border-slate-100 pb-2">
                        <th className="py-2.5">Sách</th>
                        <th className="py-2.5">Độc giả</th>
                        <th className="py-2.5">Ngày mượn</th>
                        <th className="py-2.5">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {recentLoans.map((loan) => (
                        <tr key={loan.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 font-bold text-slate-800 max-w-[180px] truncate">{loan.bookTitle}</td>
                          <td className="py-3 text-slate-500">{loan.userEmail}</td>
                          <td className="py-3 text-slate-400">
                            {loan.createdAt ? new Date(loan.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                          </td>
                          <td className="py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                              loan.status === 'CHECKED_OUT' ? 'bg-emerald-50 text-emerald-600' :
                              loan.status === 'PENDING_PICKUP' ? 'bg-red-50 text-red-500' :
                              loan.status === 'OVERDUE' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {loan.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <Link to="/admin/loans" className="mt-4 text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 hover:underline">
              Xem toàn bộ đơn mượn <ArrowRight size={12} />
            </Link>
          </div>

          {/* Quick Actions Panel */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex flex-col gap-4">
            <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
              <UserGear size={20} weight="bold" className="text-red-500" />
              Công Cụ Quản Trị
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">Truy cập nhanh các phân hệ nghiệp vụ để kiểm soát thông tin.</p>
            
            <div className="flex flex-col gap-2.5 mt-2">
              <Link to="/admin/books" className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-2xl group transition-all cursor-pointer">
                <div>
                  <span className="block text-xs font-bold text-slate-800">📚 Quản Lý Sách</span>
                  <span className="block text-[10px] text-slate-400 mt-0.5">Thêm, sửa, xóa đầu sách trong kho.</span>
                </div>
                <ArrowRight size={14} className="text-slate-300 group-hover:text-slate-600 transition-colors" />
              </Link>

              <Link to="/admin/users" className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-2xl group transition-all cursor-pointer">
                <div>
                  <span className="block text-xs font-bold text-slate-800">👥 Quản Lý Người Dùng</span>
                  <span className="block text-[10px] text-slate-400 mt-0.5">Xem danh sách độc giả & gói VIP.</span>
                </div>
                <ArrowRight size={14} className="text-slate-300 group-hover:text-slate-600 transition-colors" />
              </Link>

              <Link to="/admin/fines" className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-2xl group transition-all cursor-pointer">
                <div>
                  <span className="block text-xs font-bold text-slate-800">💸 Thu Phạt & Sự Cố</span>
                  <span className="block text-[10px] text-slate-400 mt-0.5">Xử lý sách hỏng, mất và nộp phạt.</span>
                </div>
                <ArrowRight size={14} className="text-slate-300 group-hover:text-slate-600 transition-colors" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
