import { useState, useEffect } from 'react';
import { CurrencyCircleDollar, CheckCircle, Warning } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';
import AdminLayout from '../../layouts/AdminLayout';
import axiosClient from '../../api/axiosClient';

export default function AdminFinesPage() {
  const [fines, setFines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFines = async () => {
    setLoading(true);
    try {
      const { data } = await axiosClient.get('/fines', { params: { page: 0, size: 50 } });
      setFines(data.data.content);
    } catch (e) {
      toast.error('Lỗi khi tải danh sách tiền phạt');
    } finally {
      setLoading(false);
    }
  };

  const confirmPayment = async (fineId: number) => {
    try {
      await axiosClient.post(`/fines/${fineId}/confirm`);
      toast.success('Đã xác nhận thanh toán tiền mặt thành công');
      fetchFines();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Lỗi khi xác nhận thanh toán');
    }
  };

  useEffect(() => {
    fetchFines();
  }, []);

  return (
    <AdminLayout pageTitle="Thu Phạt">
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <CurrencyCircleDollar size={26} weight="fill" className="text-amber-500" />
            Quản Lý Tiền Phạt
          </h1>
          <p className="text-sm text-slate-500 mt-1">Xác nhận thanh toán tiền mặt cho các khoản phạt quá hạn.</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-medium uppercase text-xs">
                <tr>
                  <th className="px-6 py-4">Mã Phạt</th>
                  <th className="px-6 py-4">Độc giả</th>
                  <th className="px-6 py-4">Lý do</th>
                  <th className="px-6 py-4 text-right">Số tiền</th>
                  <th className="px-6 py-4 text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">Đang tải dữ liệu...</td>
                  </tr>
                ) : fines.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">Không có dữ liệu tiền phạt.</td>
                  </tr>
                ) : (
                  fines.map((fine) => (
                    <motion.tr key={fine.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium">#{fine.id}</td>
                      <td className="px-6 py-4">{fine.userEmail}</td>
                      <td className="px-6 py-4 text-xs">{fine.reason}</td>
                      <td className="px-6 py-4 text-right font-bold text-rose-600">
                        {fine.amount.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="px-6 py-4 text-center">
                        {fine.status === 'PAID' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-700">
                            <CheckCircle weight="fill" /> Đã thu
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                            <Warning weight="fill" /> Chưa thu
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {fine.status === 'PENDING' && (
                          <button onClick={() => confirmPayment(fine.id)} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap">
                            Thu tiền mặt
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
