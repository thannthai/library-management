import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Books, CircleNotch, X } from '@phosphor-icons/react';
import toast from 'react-hot-toast';

import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';

import DashboardLayout from '../../layouts/DashboardLayout';
import CheckoutModal from '../../components/CheckoutModal';
import { getMyFavorites, removeFavorite } from '../../api/favoritesApi';
import { borrowBook } from '../../api/loansApi';
import type { BookResponse } from '../../types/books.types';
import type { SePayCheckout } from '../../types/subscription.types';



export default function FavoritesPage() {
  const [books, setBooks] = useState<BookResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<BookResponse | null>(null);
  const [borrowing, setBorrowing] = useState(false);

  // States for CheckoutModal
  const [checkoutLoanId, setCheckoutLoanId] = useState<number | null>(null);
  const [checkoutSePayData, setCheckoutSePayData] = useState<SePayCheckout | null>(null);
  const [checkoutBookTitle, setCheckoutBookTitle] = useState<string>('');

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const data = await getMyFavorites();
      setBooks(data);
    } catch (e) {
      toast.error('Error loading favorites');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const handleRemoveFavorite = async (bookId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await removeFavorite(bookId);
      toast.success('Removed from favorites');
      setBooks(prev => prev.filter(b => b.id !== bookId));
      if (selected?.id === bookId) setSelected(null);
    } catch (err) {
      toast.error('Could not remove from favorites.');
    }
  };

  const handleBorrow = async () => {
    if (!selected) return;
    setBorrowing(true);
    try {
      const loanData = await borrowBook(selected.id);
      if (loanData.sePayCheckout === null || loanData.sePayCheckout === undefined) {
        toast.success('Book borrowed successfully under your membership plan!');
        setSelected(null);
      } else {
        setSelected(null);
        setCheckoutLoanId(loanData.id);
        setCheckoutSePayData(loanData.sePayCheckout);
        setCheckoutBookTitle(selected.title);
      }
    } catch (err: any) {
      toast.error(err.message || 'Borrowing failed! The book might be out of copies or reserved by someone else.');
    } finally {
      setBorrowing(false);
    }
  };

  return (
    <DashboardLayout pageTitle="My Favorites">
      <div className="w-full px-6 py-6 md:px-8 md:py-8 flex flex-col gap-6 max-w-[1200px] mx-auto">
        
        {/* Checkout Modal for paid loans */}
        {checkoutLoanId !== null && checkoutSePayData !== null && (
          <CheckoutModal
            loanId={checkoutLoanId}
            sePayCheckout={checkoutSePayData}
            bookTitle={checkoutBookTitle}
            onSuccess={() => {
              setCheckoutLoanId(null);
              setCheckoutSePayData(null);
              toast.success('Payment successful! The book is ready for pickup at the counter.');
            }}
            onClose={() => {
              setCheckoutLoanId(null);
              setCheckoutSePayData(null);
            }}
          />
        )}

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="text-2xl font-extrabold text-slate-800">
            My <span className="text-rose-500">Favorites</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Your saved books to borrow later.
          </p>
        </motion.div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <CircleNotch size={32} className="animate-spin text-indigo-600 mb-3" />
            <p className="text-sm text-slate-400">Loading favorites...</p>
          </div>
        ) : books.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-3xl border border-slate-100 shadow-sm text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 mb-4 animate-pulse">
              <Heart size={28} weight="fill" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">No favorites yet</h3>
            <p className="text-sm text-slate-500 mt-1.5 max-w-sm leading-relaxed">
              You haven't saved any favorite books yet. Click the Heart icon on book cards to save them here.
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
            <AnimatePresence>
              {books.map((book) => {
                const genreName = book.genres && book.genres.length > 0 ? book.genres[0].name : 'Other';
                const authorName = book.authors && book.authors.length > 0 ? book.authors.map(a => a.name).join(', ') : 'Unknown';

                return (
                  <motion.div
                    key={book.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={() => setSelected(book)}
                    className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg hover:shadow-slate-200/60 hover:-translate-y-0.5 transition-all duration-300 ease-in-out cursor-pointer flex flex-col relative group"
                  >
                    {/* Cover Aspect Ratio 2:3 */}
                    <div className="relative w-full aspect-[2/3] overflow-hidden bg-slate-100">
                      {book.coverImageUrl ? (
                        <img src={book.coverImageUrl} alt={book.title} className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 flex flex-col justify-between p-3 text-white">
                          <span className="text-[8px] font-bold tracking-widest uppercase opacity-75">Collection</span>
                          <h4 className="font-bold text-xs leading-tight line-clamp-3">{book.title}</h4>
                          <span className="text-[9px] line-clamp-1 opacity-95">{authorName}</span>
                        </div>
                      )}
                      
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                      
                      {/* Remove Favorite Bookmark button */}
                      <button
                        type="button"
                        onClick={(e) => handleRemoveFavorite(book.id, e)}
                        className="absolute top-2.5 right-2.5 w-7 h-7 rounded-lg bg-rose-500 flex items-center justify-center text-white shadow shadow-rose-200 hover:bg-rose-600 transition-colors cursor-pointer"
                        title="Remove from favorites"
                      >
                        <Heart size={14} weight="fill" />
                      </button>
                    </div>

                    {/* Description info */}
                    <div className="flex flex-col flex-1 p-3.5">
                      <span className="self-start text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 mb-1.5">
                        {genreName}
                      </span>
                      <h3 className="font-bold text-slate-800 text-xs leading-snug line-clamp-2 mb-1">
                        {book.title}
                      </h3>
                      <p className="text-[10px] text-slate-500 truncate mb-1">
                        {authorName}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Available: {book.availableCopies}/{book.totalCopies}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Selected Book Detail Dialog */}
        <Dialog
          open={selected !== null}
          onClose={() => setSelected(null)}
          maxWidth="sm"
          fullWidth
          slotProps={{
            paper: {
              sx: {
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: '0 32px 80px rgba(99,102,241,0.18)',
              },
            },
          }}
        >
          <DialogContent sx={{ padding: 0 }}>
            {selected && (
              <div className="relative">
                <IconButton
                  onClick={() => setSelected(null)}
                  size="small"
                  sx={{
                    position: 'absolute', top: 10, right: 10, zIndex: 10,
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    backdropFilter: 'blur(4px)',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,1)' },
                  }}
                >
                  <X size={16} />
                </IconButton>

                <div className="flex gap-5 p-5 pb-4 bg-gradient-to-br from-indigo-50 to-violet-50 border-b border-slate-100">
                  <div className="w-20 h-28 rounded-lg overflow-hidden shrink-0 shadow bg-slate-100">
                    {selected.coverImageUrl ? (
                      <img src={selected.coverImageUrl} alt={selected.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold text-center p-1">{selected.title}</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <span className="text-[10px] font-semibold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                      {selected.genres?.[0]?.name || 'Other'}
                    </span>
                    <h2 className="text-base font-bold text-slate-800 mt-2 leading-tight">{selected.title}</h2>
                    <p className="text-xs text-slate-500 mt-1">
                      {selected.authors?.map(a => a.name).join(', ') || 'Unknown'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">ISBN: {selected.isbn}</p>
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Description</h3>
                  <p className="text-xs text-slate-600 leading-relaxed max-h-40 overflow-y-auto pr-1">
                    {selected.description || 'No description available.'}
                  </p>

                  <div className="flex gap-3 mt-6">
                    <button
                      type="button"
                      onClick={handleBorrow}
                      disabled={borrowing || selected.availableCopies === 0}
                      className="flex-1 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {borrowing ? <CircleNotch size={14} className="animate-spin" /> : <Books size={14} />}
                      {selected.availableCopies > 0 ? 'Borrow Now' : 'Out of Copies'}
                    </button>
                    
                    <button
                      type="button"
                      onClick={(e) => { handleRemoveFavorite(selected.id, e); }}
                      className="h-10 px-4 rounded-xl border border-rose-200 text-rose-500 hover:bg-rose-50 text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      Remove Favorite
                    </button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
