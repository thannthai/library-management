import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useSearchParams } from 'react-router-dom';
import { GearSix, Check, CircleNotch, Info, Lock, User } from '@phosphor-icons/react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import axiosClient from '../../api/axiosClient';

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Tab state: 'profile' | 'security'
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  // Read tab parameter from URL search query
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'security') {
      setActiveTab('security');
    } else {
      setActiveTab('profile');
    }
  }, [searchParams]);

  // Profile Form States
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Change Password Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [pwdSubmitting, setPwdSubmitting] = useState(false);

  // Initialize fields
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error('Full name cannot be empty.');
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
      toast.success('Profile updated successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Update failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validations
    if (!currentPassword) {
      toast.error('Current password is required.');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setPwdSubmitting(true);
    try {
      await axiosClient.post('/users/change-password', {
        currentPassword,
        newPassword
      });
      toast.success('Password changed successfully!');
      // Reset inputs
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to change password. Please try again.');
    } finally {
      setPwdSubmitting(false);
    }
  };

  // Real-time validations for display
  const isPasswordTooShort = newPassword.length > 0 && newPassword.length < 6;
  const isPasswordMismatch = confirmNewPassword.length > 0 && newPassword !== confirmNewPassword;
  const canSubmitPassword = currentPassword && newPassword.length >= 6 && newPassword === confirmNewPassword;

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
            Account <span className="text-indigo-600">Settings</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your personal information and security settings.
          </p>
        </motion.div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-100 pb-1.5 gap-2">
          <button
            type="button"
            onClick={() => setSearchParams({})}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <User size={15} />
            Profile Settings
          </button>
          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'security' })}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'security'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Lock size={15} />
            Change Password
          </button>
        </div>

        {/* Form rendering */}
        <AnimatePresence mode="wait">
          {activeTab === 'profile' ? (
            <motion.div
              key="profile-tab"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm"
            >
              <form onSubmit={handleProfileSubmit} className="flex flex-col gap-5">
                {/* Email (Readonly) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                    Email Address (Cannot be changed)
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
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name..."
                    className="w-full h-10 px-4 text-slate-700 bg-white border border-slate-200 rounded-xl focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300/40 text-sm transition-all"
                    required
                  />
                </div>

                {/* Phone */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="phone" className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter your phone number..."
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
                  Save Changes
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="security-tab"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm"
            >
              <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-5">
                {/* Current Password */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="currentPassword" className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Current Password
                  </label>
                  <input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password..."
                    className="w-full h-10 px-4 text-slate-700 bg-white border border-slate-200 rounded-xl focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300/40 text-sm transition-all"
                    required
                  />
                </div>

                {/* New Password */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="newPassword" className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 characters)..."
                    className={`w-full h-10 px-4 text-slate-700 bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300/40 text-sm transition-all ${
                      isPasswordTooShort
                        ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-200/50'
                        : 'border-slate-200 focus:border-indigo-400'
                    }`}
                    required
                  />
                  {isPasswordTooShort && (
                    <p className="text-xs text-rose-500 font-semibold mt-0.5">
                      New password must be at least 6 characters.
                    </p>
                  )}
                </div>

                {/* Confirm New Password */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="confirmNewPassword" className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Confirm New Password
                  </label>
                  <input
                    id="confirmNewPassword"
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Confirm your new password..."
                    className={`w-full h-10 px-4 text-slate-700 bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300/40 text-sm transition-all ${
                      isPasswordMismatch
                        ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-200/50'
                        : 'border-slate-200 focus:border-indigo-400'
                    }`}
                    required
                  />
                  {isPasswordMismatch && (
                    <p className="text-xs text-rose-500 font-semibold mt-0.5">
                      Passwords do not match.
                    </p>
                  )}
                </div>

                {/* Action button */}
                <button
                  type="submit"
                  disabled={!canSubmitPassword || pwdSubmitting}
                  className="mt-2 w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-indigo-100 disabled:cursor-not-allowed"
                >
                  {pwdSubmitting ? (
                    <CircleNotch size={14} className="animate-spin" />
                  ) : (
                    <Check size={14} weight="bold" />
                  )}
                  Change Password
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings Help note */}
        <div className="flex items-start gap-2 text-slate-400 text-xs bg-slate-50 border border-slate-100 rounded-2xl p-4 mt-2 leading-relaxed">
          <Info size={16} className="shrink-0 text-indigo-500 mt-0.5" />
          <p>
            {activeTab === 'profile'
              ? 'This information is used for contact or verification when you perform book fulfillments at the library counter. Please make sure the entered details are accurate.'
              : 'Keep your credentials secure. Make sure to choose a strong password with a mix of characters and do not share it with others.'}
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
