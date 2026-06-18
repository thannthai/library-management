import { useState, useEffect } from 'react';
import { Users, ShieldCheck, User as UserIcon, Crown, ArrowClockwise, CircleNotch } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';
import AdminLayout from '../../layouts/AdminLayout';
import axiosClient from '../../api/axiosClient';
import { getAllSubscriptions } from '../../api/subscriptionApi';
import type { Subscription } from '../../types/subscription.types';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, subsData] = await Promise.all([
        axiosClient.get('/users/list'),
        getAllSubscriptions()
      ]);
      setUsers(usersRes.data.data || []);
      setSubscriptions(subsData || []);
    } catch (e) {
      toast.error('Error loading users / subscriptions data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getActivePlan = (userId: number) => {
    const activeSub = subscriptions.find(s => s.userId === userId && s.isActive);
    if (activeSub) {
      return {
        name: activeSub.planName,
        code: activeSub.planCode,
        endDate: activeSub.endDate
      };
    }
    return null;
  };

  return (
    <AdminLayout pageTitle="User Management">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-5">
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <Users size={26} weight="fill" className="text-emerald-500" />
              Members Directory
            </h1>
            <p className="text-sm text-slate-400 mt-1">Manage accounts, contact info, and system permissions.</p>
          </div>
          <button
            onClick={loadData}
            className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl cursor-pointer transition-colors"
            title="Refresh"
          >
            <ArrowClockwise size={16} />
          </button>
        </div>

        {/* User Table container */}
        <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-6 py-4">Member</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">Login Method</th>
                  <th className="px-6 py-4 text-center">Active Plan</th>
                  <th className="px-6 py-4 text-center">Role</th>
                  <th className="px-6 py-4">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <CircleNotch size={16} className="animate-spin text-indigo-500" />
                        Loading members directory...
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">No users found.</td>
                  </tr>
                ) : (
                  users.map((user, i) => {
                    const activePlan = getActivePlan(user.id);
                    const joinedDate = user.createdAt 
                      ? new Date(user.createdAt).toLocaleDateString('en-US') 
                      : 'N/A';

                    return (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03, duration: 0.3 }}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        {/* Member Identity details */}
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[11px] shrink-0 border border-slate-200">
                              {(user.fullName?.[0] || user.email?.[0] || 'U').toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-extrabold text-slate-800 text-[13px]">{user.fullName || 'Not updated'}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[180px]">{user.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Phone */}
                        <td className="px-6 py-3.5 text-slate-500 font-semibold">
                          {user.phone || '—'}
                        </td>

                        {/* Auth Provider */}
                        <td className="px-6 py-3.5">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wide ${
                            user.authProvider === 'GOOGLE' 
                              ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                              : 'bg-slate-50 text-slate-500 border border-slate-100'
                          }`}>
                            {user.authProvider || 'LOCAL'}
                          </span>
                        </td>

                        {/* Subscription Tier */}
                        <td className="px-6 py-3.5 text-center">
                          {activePlan ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <Crown size={12} weight="fill" className="text-amber-500" />
                              {activePlan.name}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 text-slate-400 border border-slate-150">
                              FREE
                            </span>
                          )}
                        </td>

                        {/* Role */}
                        <td className="px-6 py-3.5 text-center">
                          {user.roles && user.roles.some((r: any) => r === 'ROLE_ADMIN' || r === 'ADMIN' || r.name === 'ROLE_ADMIN') ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-purple-100 text-purple-700">
                              <ShieldCheck weight="fill" /> Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-slate-100 text-slate-600">
                              <UserIcon weight="fill" /> User
                            </span>
                          )}
                        </td>

                        {/* Joined Date */}
                        <td className="px-6 py-3.5 text-slate-400">
                          {joinedDate}
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
