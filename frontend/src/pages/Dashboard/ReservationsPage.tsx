import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CalendarCheck, Clock, Trash, CircleNotch, Info } from '@phosphor-icons/react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getMyReservations, cancelReservation, type BookReservationResponse } from '../../api/reservationsApi';

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<BookReservationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const data = await getMyReservations();
      // Only keep active/pending ones for current view
      const active = data.filter(r => r.status === 'PENDING' || r.status === 'FULFILLED');
      setReservations(active);
    } catch (e) {
      toast.error('Error loading reservations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const handleCancel = async (id: number) => {
    if (cancellingId !== null) return;
    setCancellingId(id);
    try {
      await cancelReservation(id);
      toast.success('Reservation cancelled successfully!');
      setReservations(prev => prev.filter(r => r.id !== id));
    } catch (err: any) {
      toast.error(err.message || 'Could not cancel reservation.');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <DashboardLayout pageTitle="My Reservations">
      <div className="w-full px-6 py-6 md:px-8 md:py-8 flex flex-col gap-6 max-w-[1000px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="text-2xl font-extrabold text-slate-800">
            Active <span className="text-indigo-600">Reservations</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track your position in the BookNest book queues.
          </p>
        </motion.div>

        {/* List Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <CircleNotch size={32} className="animate-spin text-indigo-600 mb-3" />
            <p className="text-sm text-slate-400">Loading reservation queue...</p>
          </div>
        ) : reservations.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-3xl border border-slate-100 shadow-sm text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 mb-4">
              <CalendarCheck size={28} weight="fill" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">Queue is empty</h3>
            <p className="text-sm text-slate-500 mt-1.5 max-w-sm leading-relaxed">
              You currently have no reservations. When a book is out of copies, use the "Reserve" button to join the queue.
            </p>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-4">
            <AnimatePresence mode="popLayout">
              {reservations.map((res, i) => (
                <motion.div
                  key={res.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col sm:flex-row items-center gap-4 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-200"
                >
                  {/* Image cover fallback */}
                  <div className="w-16 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow shrink-0 overflow-hidden flex items-center justify-center text-white relative">
                    {res.coverImageUrl ? (
                      <img src={res.coverImageUrl} alt={res.bookTitle} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-[10px] font-bold text-center px-1 truncate leading-tight select-none">
                        {res.bookTitle}
                      </div>
                    )}
                  </div>

                  {/* Text details */}
                  <div className="flex-1 min-w-0 text-center sm:text-left">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-50 text-indigo-600">
                      {res.status === 'FULFILLED' ? 'Ready for Pickup' : 'In Queue'}
                    </span>
                    <h3 className="font-bold text-slate-800 text-sm mt-1.5 truncate leading-snug">
                      {res.bookTitle}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {res.authorName || 'Unknown Author'} • ISBN: {res.isbn || 'N/A'}
                    </p>
                    <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-slate-400 mt-3">
                      <Clock size={12} />
                      <span>Reserved: {new Date(res.reservedDate).toLocaleDateString('en-US')}</span>
                    </div>
                  </div>

                  {/* Status queue block */}
                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto shrink-0 border-t sm:border-t-0 pt-4 sm:pt-0 gap-3">
                    <div className="text-left sm:text-right">
                      {res.status === 'FULFILLED' ? (
                        <span className="block text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-center">
                          Ready for Pickup
                        </span>
                      ) : (
                        <>
                          <span className="block text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full text-center">
                            Queue Position: #{res.priorityPosition}
                          </span>
                          <p className="text-[11px] text-slate-400 mt-1 text-center sm:text-right">
                            Est. wait: {res.estimatedWaitDays || 7} days
                          </p>
                        </>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCancel(res.id)}
                      disabled={cancellingId !== null}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-rose-200 hover:bg-rose-50 text-slate-500 hover:text-rose-600 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {cancellingId === res.id ? (
                        <CircleNotch size={12} className="animate-spin" />
                      ) : (
                        <Trash size={12} />
                      )}
                      Cancel
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Secure Note */}
        <div className="flex items-start gap-2 text-slate-400 text-xs bg-slate-50 border border-slate-100 rounded-2xl p-4 mt-6 leading-relaxed max-w-xl mx-auto">
          <Info size={16} className="shrink-0 text-indigo-500 mt-0.5" />
          <p>
            When a book is returned, it is automatically assigned to the first person in the waitlist, creating a PENDING_PICKUP loan. You will have <strong>24 hours</strong> to pick up the book from the library counter before the reservation is automatically cancelled and offered to the next person.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
