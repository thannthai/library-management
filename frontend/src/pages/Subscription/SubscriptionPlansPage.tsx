import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Crown,
  CheckCircle,
  Books,
  Clock,
  CircleNotch,
  ArrowRight,
  Info,
  ShieldCheck,
  Warning,
  X,
} from '@phosphor-icons/react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';

import DashboardLayout from '../../layouts/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import {
  getSubscriptionPlans,
  subscribeToPlan,
  getActiveSubscription,
  cancelSubscription,
} from '../../api/subscriptionApi';
import type { SubscriptionPlan, Subscription } from '../../types/subscription.types';
import { simulatePayment } from '../../api/paymentsApi';
import { toast } from 'react-hot-toast';



export default function SubscriptionPlansPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [activeSub, setActiveSub] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Loading/submitting state for purchases
  const [purchasingPlanId, setPurchasingPlanId] = useState<number | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const [checkoutData, setCheckoutData] = useState<any | null>(null);
  const [simulating, setSimulating] = useState(false);

  // Cancellation modal state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Fetch plans and active subscription
  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const plansData = await getSubscriptionPlans();
      // Keep only VIP 1 Week and VIP 1 Month
      const vipPlans = plansData.filter(p => p.planCode === 'VIP_1W' || p.planCode === 'VIP_1M');
      // Sort by display order
      const sortedPlans = [...vipPlans].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
      setPlans(sortedPlans);

      try {
        const activeData = await getActiveSubscription(user.id);
        setActiveSub(activeData);
      } catch (err) {
        // 404/No active subscription is expected for new users, ignore error
        setActiveSub(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load membership plans.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Handle plan purchase / switch
  const handleChoosePlan = async (plan: SubscriptionPlan) => {
    if (purchasingPlanId !== null) return;
    setPurchasingPlanId(plan.id);

    try {
      const response = await subscribeToPlan({
        subscriptionPlanId: plan.id,
        autoRenew: false,
      });

      if (response.sePayCheckout) {
        // Redirection needed for payment
        setCheckoutData(response);
        setRedirecting(true);
      } else {
        // Free plan or direct activation
        await loadData();
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred while choosing the membership plan.');
      setPurchasingPlanId(null);
    }
  };

  const handleSimulatePayment = async () => {
    if (!checkoutData || simulating) return;
    setSimulating(true);
    try {
      const txnRef = checkoutData.txnRef;
      await simulatePayment(txnRef);
      toast.success('🎉 VIP Membership activated successfully!');
      setRedirecting(false);
      setCheckoutData(null);
      setPurchasingPlanId(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'VIP membership payment simulation failed.');
    } finally {
      setSimulating(false);
    }
  };

  // Handle plan cancellation
  const handleCancelSubscription = async () => {
    if (!activeSub || cancelling) return;
    setCancelling(true);
    try {
      await cancelSubscription(activeSub.id, cancelReason || 'Cancel membership plan');
      setCancelDialogOpen(false);
      setCancelReason('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel VIP membership.');
    } finally {
      setCancelling(false);
    }
  };

  // Helper to check if a plan is the active plan
  const isActivePlan = (planCode: string) => {
    return activeSub !== null && activeSub.planCode === planCode && activeSub.isActive;
  };

  // Formatter for Currency
  const formatVND = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Formatter for duration label
  const getDurationLabel = (days: number) => {
    if (days === 30) return '/ month';
    if (days === 90) return '/ 3 months';
    if (days === 365) return '/ year';
    return `/ ${days} days`;
  };

  // Fallback helper to retrieve plan features
  const getPlanFeatures = (plan: SubscriptionPlan) => {
    if (plan.features && plan.features.length > 0) {
      return plan.features;
    }
    if (plan.planCode === 'SILVER') {
      return [
        "Borrow up to 3 books concurrently",
        "Hold duration: 14 days per book",
        "Quick physical book checkout at the counter"
      ];
    }
    if (plan.planCode === 'GOLD') {
      return [
        "Borrow up to 10 books concurrently",
        "Hold duration: 21 days per book",
        "Renew books online up to 2 times",
        "Priority reservation for popular books"
      ];
    }
    if (plan.planCode === 'PLATINUM') {
      return [
        "Borrow up to 20 books concurrently",
        "Hold duration: 30 days per book",
        "Online renewal & reservation of popular books",
        "Priority 24/7 support & book processing",
        "Includes exclusive BookNest bookmark"
      ];
    }
    return [];
  };

  return (
    <DashboardLayout pageTitle="Subscriptions">
      {/* Redirection / Checkout Loading Overlay */}
      <AnimatePresence>
        {redirecting && checkoutData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4 text-white"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-slate-900 border border-indigo-500/35 rounded-3xl p-6 shadow-2xl relative"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => {
                  setRedirecting(false);
                  setCheckoutData(null);
                  setPurchasingPlanId(null);
                }}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-all cursor-pointer text-slate-400 hover:text-white"
              >
                <X size={15} weight="bold" />
              </button>

              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-4 border border-indigo-500/20">
                  <Crown size={28} className="text-indigo-400" />
                </div>
                
                <h3 className="text-lg font-bold text-white mb-1">Membership Subscription Payment</h3>
                <p className="text-xs text-indigo-300 tracking-wider uppercase font-semibold mb-6">
                  Transaction: {checkoutData.txnRef}
                </p>

                {/* Info Card */}
                <div className="w-full bg-slate-950/60 border border-slate-800 rounded-2xl p-4 mb-6 text-sm text-slate-300 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Subscription Plan:</span>
                    <span className="font-semibold text-white">{checkoutData.planName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment Amount:</span>
                    <span className="font-bold text-indigo-300">{formatVND(checkoutData.paymentAmount)}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 mb-6 max-w-xs">
                  You can simulate a successful transaction directly to activate your package immediately.
                </p>

                {/* Actions */}
                <div className="w-full space-y-3">


                  <button
                    type="button"
                    onClick={handleSimulatePayment}
                    disabled={simulating}
                    className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {simulating ? (
                      <CircleNotch size={14} className="animate-spin" />
                    ) : (
                      <CheckCircle size={14} weight="bold" />
                    )}
                    <span>Simulate Payment Success (Testing)</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subscription Cancellation Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => !cancelling && setCancelDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 24px 60px rgba(0,0,0,0.15)',
            },
          },
        }}
      >
        <DialogContent sx={{ padding: 0 }}>
          <div className="p-6 relative">
            <IconButton
              onClick={() => setCancelDialogOpen(false)}
              disabled={cancelling}
              size="small"
              sx={{ position: 'absolute', top: 12, right: 12 }}
            >
              <X size={16} />
            </IconButton>

            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center">
                <Warning size={24} weight="fill" className="text-rose-500" />
              </div>
            </div>

            <h3 className="text-center font-bold text-slate-800 text-lg mb-2">
              Cancel Membership Plan
            </h3>
            <p className="text-center text-xs text-slate-500 leading-relaxed mb-4">
              Are you sure you want to cancel your current membership plan? You will lose extended borrowing benefits after expiry.
            </p>

            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation (optional)..."
              disabled={cancelling}
              className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 h-20 resize-none mb-5"
            />

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setCancelDialogOpen(false)}
                disabled={cancelling}
                className="flex-1 h-10 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleCancelSubscription}
                disabled={cancelling}
                className="flex-1 h-10 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                {cancelling ? (
                  <CircleNotch size={14} className="animate-spin" />
                ) : (
                  'Confirm Cancel'
                )}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="max-w-6xl mx-auto px-6 py-8 md:px-8">
        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm mb-4">
            <Crown size={28} weight="fill" />
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
            Subscription Plans
          </h1>
          <p className="text-sm text-slate-500 mt-2 max-w-lg leading-relaxed">
            Choose the perfect plan for your reading journey. Upgrade, downgrade, or cancel anytime.
          </p>
        </div>

        {/* ── Active Subscription Info Banner ────────────────────────────── */}
        {activeSub && activeSub.isActive && (
          <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-5 mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-200">
                <ShieldCheck size={20} weight="fill" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-800 text-sm">
                    Active Plan: {activeSub.planName}
                  </h3>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500 text-white">
                    Active
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Price: <span className="font-medium text-slate-700">{formatVND(activeSub.price)}</span> •
                  Remaining: <span className="font-medium text-slate-700">{activeSub.daysRemaining} days</span> (Expires: {activeSub.endDate})
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCancelDialogOpen(true)}
              className="text-xs font-semibold text-rose-500 hover:text-rose-600 cursor-pointer self-start sm:self-center transition-colors hover:underline underline-offset-2"
            >
              Cancel Subscription
            </button>
          </div>
        )}

        {/* ── Plans Section Header ────────────────────────────────────────── */}
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-slate-800">Choose Your Plan</h2>
          <p className="text-xs text-slate-400 mt-1">Select a plan that fits your reading habits</p>
        </div>

        {/* ── Loading / Error ─────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <CircleNotch size={32} className="animate-spin text-indigo-600 mb-3" />
            <p className="text-sm text-slate-400">Loading plans...</p>
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 text-center max-w-md mx-auto">
            <p className="text-sm text-rose-600 font-semibold mb-3">An error occurred</p>
            <p className="text-xs text-rose-500 mb-4">{error}</p>
            <button
              onClick={loadData}
              className="px-4 py-2 text-xs font-semibold text-indigo-600 bg-white border border-indigo-200 rounded-xl hover:bg-indigo-50 transition-all cursor-pointer"
            >
              Try again
            </button>
          </div>
        ) : (
          /* ── Pricing Cards Grid ─────────────────────────────────────────── */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-4xl mx-auto">
            {plans.map((plan) => {
              const active = isActivePlan(plan.planCode);
              const choosing = purchasingPlanId === plan.id;

              // Assign gradient and decoration color based on plan code
              let gradientClass = 'from-indigo-500 to-violet-600';
              let badgeColor = 'bg-slate-500/25';
              if (plan.planCode === 'VIP_1W') {
                gradientClass = 'from-indigo-500 via-indigo-600 to-indigo-700';
                badgeColor = 'bg-indigo-400/30 text-indigo-100';
              } else if (plan.planCode === 'VIP_1M') {
                gradientClass = 'from-violet-600 via-purple-700 to-indigo-800';
                badgeColor = 'bg-amber-400/30 text-amber-100';
              }

              return (
                <div
                  key={plan.id}
                  className={`bg-white rounded-3xl border border-slate-100 overflow-hidden flex flex-col transition-all duration-300 relative shadow-sm hover:shadow-xl hover:-translate-y-1 ${
                    active ? 'ring-2 ring-emerald-500 ring-offset-2' : ''
                  }`}
                >
                  {/* Card Header with Gradient */}
                  <div className={`p-6 bg-gradient-to-r ${gradientClass} text-white flex flex-col justify-between aspect-[3.2/1] sm:aspect-[3.6/1] md:aspect-[3.2/1] relative overflow-hidden`}>
                    {/* Decorative geometric details */}
                    <div className="absolute right-0 top-0 w-24 h-24 rounded-full bg-white/10 -mr-6 -mt-6 blur-lg" />
                    <div className="absolute left-0 bottom-0 w-16 h-16 rounded-full bg-black/10 -ml-4 -mb-4 blur-md" />

                    <div className="flex items-center justify-between relative z-10">
                      {/* Badge (Featured or Active) */}
                      {active ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/90 text-white shadow-sm animate-pulse">
                          <CheckCircle size={10} weight="fill" />
                          Active
                        </span>
                      ) : plan.isFeatured || plan.badgeText ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold ${badgeColor} backdrop-blur-sm`}>
                          {plan.badgeText || 'Most Popular'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-white/15 backdrop-blur-sm">
                          {plan.durationInDays <= 7 ? 'Weekly' : 'Monthly'}
                        </span>
                      )}

                      <Crown size={20} weight={plan.planCode === 'PLATINUM' ? 'fill' : 'regular'} className="opacity-90" />
                    </div>

                    <div className="relative z-10 mt-auto">
                      <h3 className="font-extrabold text-base tracking-wide leading-none">{plan.name}</h3>
                      <p className="text-[10px] text-white/70 font-medium mt-1 leading-none">Standard Access</p>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="flex flex-col flex-1 p-6">
                    <p className="text-xs text-slate-500 leading-relaxed text-center mb-6 min-h-[36px]">
                      {plan.description}
                    </p>

                    {/* Price Tag */}
                    <div className="flex items-baseline justify-center gap-1 mb-8">
                      <span className="text-2xl md:text-3xl font-extrabold text-slate-800">
                        {formatVND(plan.price)}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">
                        {getDurationLabel(plan.durationInDays)}
                      </span>
                    </div>

                    {/* KPI Blocks (Borrow Limit & Loan Duration) */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl flex flex-col gap-1.5 items-center justify-center text-center">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                          <Books size={16} weight="fill" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Borrow Limit</span>
                          <span className="text-xs font-bold text-slate-700 mt-0.5">{plan.maxBooksAllowed} Books</span>
                        </div>
                      </div>

                      <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl flex flex-col gap-1.5 items-center justify-center text-center">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                          <Clock size={16} weight="fill" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Loan Duration</span>
                          <span className="text-xs font-bold text-slate-700 mt-0.5">{plan.maxDaysPerBook} Days/Book</span>
                        </div>
                      </div>
                    </div>

                    {/* Features List */}
                    <ul className="flex flex-col gap-3.5 mb-8 flex-1">
                      {getPlanFeatures(plan).map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <CheckCircle size={14} weight="fill" className="text-emerald-500 mt-0.5 shrink-0" />
                          <span className="text-xs text-slate-600 leading-snug">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Action Button */}
                    {active ? (
                      <button
                        type="button"
                        disabled
                        className="w-full h-11 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm font-bold flex items-center justify-center gap-1.5 cursor-not-allowed shadow-inner"
                      >
                        <CheckCircle size={16} weight="fill" />
                        Current Plan
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleChoosePlan(plan)}
                        disabled={purchasingPlanId !== null}
                        className={`w-full h-11 rounded-2xl text-white text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md ${
                          plan.planCode === 'GOLD'
                            ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
                            : 'bg-indigo-500 hover:bg-indigo-600 shadow-indigo-100'
                        }`}
                      >
                        {choosing ? (
                          <CircleNotch size={16} className="animate-spin" />
                        ) : (
                          <>
                            Switch Plan
                            <ArrowRight size={14} weight="bold" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Secure Note Footer ──────────────────────────────────────────── */}
        <div className="flex items-center justify-center gap-2 mt-12 text-slate-400 text-xs text-center leading-relaxed max-w-md mx-auto">
          <Info size={14} className="shrink-0" />
          <p>
            Payments are securely processed. Your plan will activate automatically after successful payment.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
