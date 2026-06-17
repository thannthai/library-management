import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { GearSix, Check, CircleNotch, Info } from '@phosphor-icons/react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import axiosClient from '../../api/axiosClient';

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Initialize fields
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error('Họ tên không được để trống.');
      return;
    }

    setSubmitting(true);
    try {
      await axiosClient.put('/users/profile', {
        fullName: fullName.trim(),
        phone: phone.trim()
      });
      
      // Refresh Auth Context
      await refreshUser();
      toast.success('Cập nhật thông tin thành công!');
    } catch (err: any) {
      toast.error(err.message || 'Cập nhật thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout pageTitle="Settings">
      <div className="w-full px-6 py-6 md:px-8 md:py-8 flex flex-col gap-6 max-w-[600px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            <GearSix size={26} className="text-indigo-600 animate-spin-slow" />
            Cài Đặt <span className="text-indigo-600">Tài Khoản</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Thay đổi họ tên và số điện thoại của bạn trong hệ thống.
          </p>
        </motion.div>

        {/* Settings Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm"
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Email (Readonly) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                Địa chỉ Email (Không thể thay đổi)
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full h-10 px-4 text-slate-400 bg-slate-50 border border-slate-100 rounded-xl cursor-not-allowed select-none text-sm outline-none"
              />
            </div>

            {/* Full Name */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="fullName" className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Họ và Tên
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nhập họ tên của bạn..."
                className="w-full h-10 px-4 text-slate-700 bg-white border border-slate-200 rounded-xl focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300/40 text-sm transition-all"
                required
              />
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="phone" className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Số Điện Thoại
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Nhập số điện thoại..."
                className="w-full h-10 px-4 text-slate-700 bg-white border border-slate-200 rounded-xl focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300/40 text-sm transition-all"
              />
            </div>

            {/* Action button */}
            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-md shadow-indigo-100 disabled:opacity-50"
            >
              {submitting ? (
                <CircleNotch size={14} className="animate-spin" />
              ) : (
                <Check size={14} weight="bold" />
              )}
              Lưu thay đổi
            </button>
          </form>
        </motion.div>

        {/* Settings Help note */}
        <div className="flex items-start gap-2 text-slate-400 text-xs bg-slate-50 border border-slate-100 rounded-2xl p-4 mt-2 leading-relaxed">
          <Info size={16} className="shrink-0 text-indigo-500 mt-0.5" />
          <p>
            Các thông tin này được dùng để liên lạc hoặc xác thực khi bạn đến giao nhận sách trực tiếp tại quầy của thư viện. Hãy chắc chắn rằng thông tin bạn nhập là chính xác.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
