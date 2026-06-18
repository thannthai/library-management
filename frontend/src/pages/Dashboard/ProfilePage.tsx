import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Envelope, Phone, Crown, Books, CircleNotch } from '@phosphor-icons/react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { getActiveSubscription } from '../../api/subscriptionApi';
import { getMyLoans } from '../../api/loansApi';
import type { Subscription } from '../../types/subscription.types';

export default function ProfilePage() {
  const { user } = useAuth();
  const [activeSub, setActiveSub] = useState<Subscription | null>(null);
  const [loadingSub, setLoadingSub] = useState(true);
  
  // Dynamic stats derived from real API queries
  const [stats, setStats] = useState({
    totalBorrowed: 0,
    currentlyReading: 0,
    pendingPickup: 0,
    overdueCount: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    // Fetch active subscription details
    getActiveSubscription(user.id)
      .then((sub) => {
        if (sub && sub.isActive) {
          setActiveSub(sub);
        } else {
          setActiveSub(null);
        }
      })
      .catch(() => setActiveSub(null))
      .finally(() => setLoadingSub(false));

    // Fetch loan statistics
    getMyLoans('all', 0, 100)
      .then((response) => {
        const content = response.content || [];
        const currentlyReading = content.filter(l => l.status === 'CHECKED_OUT').length;
        const pendingPickup = content.filter(l => l.status === 'PENDING_PICKUP').length;
        const overdueCount = content.filter(l => l.status === 'OVERDUE').length;
        setStats({
          totalBorrowed: content.length,
          currentlyReading,
          pendingPickup,
          overdueCount
        });
      })
      .catch((err) => console.error('Error fetching dynamic profile stats:', err))
      .finally(() => setLoadingStats(false));
  }, [user]);

  const displayPlanName = activeSub ? activeSub.planName : 'Default Plan (FREE)';
  const displayPlanDesc = activeSub 
    ? `${activeSub.daysRemaining} days remaining (Expires: ${activeSub.endDate})`
    : 'Pay-per-book 15k/book, max 2 books concurrently.';

  return (
    <DashboardLayout pageTitle="Profile">
      <div className="w-full px-6 py-6 md:px-8 md:py-8 flex flex-col gap-8 max-w-[900px] mx-auto">
        
        {/* Header Title */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="text-2xl font-extrabold text-slate-800">
            My <span className="text-indigo-600">Profile</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            View your account details and membership benefits.
          </p>
        </motion.div>

        {/* Profile Card & Membership Split */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          
          {/* User Details card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="md:col-span-2 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex flex-col gap-6"
          >
            {/* Header Identity */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xl font-bold shadow-md shadow-indigo-100">
                {user?.fullName ? user.fullName[0].toUpperCase() : 'U'}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-slate-800 text-lg">{user?.fullName || 'BookNest User'}</h3>
                  {user?.isVerified && (
                    <span title="Verified" className="inline-flex items-center">
                      <ShieldCheck size={18} weight="fill" className="text-emerald-500" />
                    </span>
                  )}
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-600 uppercase tracking-wide mt-1">
                  {user?.role === 'ADMIN' ? 'Administrator' : 'Reader'}
                </span>
              </div>
            </div>

            <div className="h-px bg-slate-100" />

            {/* Info Grid details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
                  <Envelope size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Email</p>
                  <p className="text-xs font-bold text-slate-700 truncate">{user?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
                  <Phone size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Phone number</p>
                  <p className="text-xs font-bold text-slate-700 truncate">{user?.phone || 'Not updated'}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Membership tier details */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.18, duration: 0.4 }}
            className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden"
          >
            {/* VIP background details */}
            <div className="absolute right-0 top-0 w-20 h-20 bg-indigo-500/5 rounded-full -mr-6 -mt-6 blur-md" />
            
            <div className="flex items-center gap-3.5 relative z-10">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${activeSub ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 'bg-slate-300'}`}>
                <Crown size={20} weight="fill" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm leading-tight">Membership Tier</h4>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Membership Tier</p>
              </div>
            </div>

            <div className="mt-2">
              {loadingSub ? (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <CircleNotch size={14} className="animate-spin text-indigo-600" />
                  Loading membership details...
                </div>
              ) : (
                <>
                  <p className="font-extrabold text-slate-800 text-sm">{displayPlanName}</p>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{displayPlanDesc}</p>
                </>
              )}
            </div>
          </motion.div>
        </div>

        {/* Dynamic reading statistics dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm"
        >
          <h2 className="font-extrabold text-slate-800 text-base mb-5 flex items-center gap-2">
            <Books size={20} weight="fill" className="text-indigo-500" />
            Personal Reading Statistics
          </h2>

          {loadingStats ? (
            <div className="flex items-center justify-center py-6 gap-2 text-xs text-slate-400">
              <CircleNotch size={16} className="animate-spin text-indigo-600" />
              Calculating stats...
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-center">
                <span className="block text-2xl font-black text-indigo-600">{stats.totalBorrowed}</span>
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5">Total Borrowed</span>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-center">
                <span className="block text-2xl font-black text-emerald-600">{stats.currentlyReading}</span>
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5">Currently Borrowing</span>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-center">
                <span className="block text-2xl font-black text-blue-600">{stats.pendingPickup}</span>
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5">Pending Pickup</span>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-center">
                <span className={`block text-2xl font-black ${stats.overdueCount > 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                  {stats.overdueCount}
                </span>
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5">Overdue Loans</span>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
