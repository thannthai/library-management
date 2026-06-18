import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';

import {
  MagnifyingGlass, SquaresFour, Rows, BookOpen, X,
  CaretLeft, CaretRight, BookmarkSimple, Warning, CheckCircle,
  CircleNotch,
} from '@phosphor-icons/react';

// MUI Dialog
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';

import Navbar from '../../layouts/Navbar';
import { useAuth } from '../../context/AuthContext';
import { borrowBook, getMyLoans, cancelPendingLoan, getLoanPaymentUrl } from '../../api/loansApi';
import { getBooks, getGenres, getAuthors } from '../../api/booksApi';
import type { BookResponse, GenreResponse } from '../../types/books.types';
import type { BookLoanResponse } from '../../types/loans.types';
import CheckoutModal from '../../components/CheckoutModal';
import { toast } from 'react-hot-toast';

// ─── Cover URL helper ────────────────────────────────────────────────────────
const getGoogleBooksUrl = (url: string | undefined, zoom: number): string | undefined => {
  if (!url) return undefined;
  if (url.includes('google.com/books') || url.includes('books.google.com')) {
    const cleanUrl = url.replace('http://', 'https://');
    if (/zoom=\d+/.test(cleanUrl)) {
      return cleanUrl.replace(/zoom=\d+/, `zoom=${zoom}`);
    } else {
      const separator = cleanUrl.includes('?') ? '&' : '?';
      return `${cleanUrl}${separator}zoom=${zoom}`;
    }
  }
  return url;
};

// ─── Premium CSS Book Cover Placeholder ──────────────────────────────────────
function CSSBookCover({ title, author }: { title: string; author: string }) {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-700 p-4 flex flex-col justify-between text-white select-none">
      <div className="flex flex-col gap-1.5">
        <span className="text-[8px] font-bold tracking-widest uppercase opacity-75">BookNest Collection</span>
        <h4 className="font-bold text-xs leading-snug line-clamp-3 text-white">
          {title}
        </h4>
      </div>
      <p className="text-[9px] font-semibold opacity-90 line-clamp-1 border-t border-white/20 pt-2 text-white">{author}</p>
    </div>
  );
}

// ─── Book Detail Dialog (MUI) ─────────────────────────────────────────────────
interface BookDialogProps {
  book: BookResponse | null;
  onClose: (needRefresh?: boolean) => void;
  onPaidCheckout: (loan: BookLoanResponse) => void;
  activeLoan?: BookLoanResponse;
}

function BookDetailDialog({ book, onClose, onPaidCheckout, activeLoan }: BookDialogProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [borrowing, setBorrowing] = useState(false);
  const [paying, setPaying] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setShowLogin(false);
    setErrorMsg(null);
    setBorrowing(false);
    setPaying(false);
    setCancelling(false);
  }, [book]);

  // ── All hooks must be called BEFORE any early returns ──
  const handleBorrow = useCallback(async () => {
    if (!book) return;
    if (!isAuthenticated) {
      setShowLogin(true);
      setTimeout(() => {
        onClose();
        navigate('/login');
      }, 2000);
      return;
    }
    setBorrowing(true);
    setErrorMsg(null);
    try {
      const loanResponse = await borrowBook(book.id);
      if (loanResponse.sePayCheckout !== null) {
        onClose();
        onPaidCheckout(loanResponse);
      } else {
        onClose();
        navigate('/dashboard/loans');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while processing your borrow request.');
    } finally {
      setBorrowing(false);
    }
  }, [book, isAuthenticated, navigate, onClose, onPaidCheckout]);

  const handlePayPending = useCallback(async () => {
    if (!activeLoan) return;
    setPaying(true);
    setErrorMsg(null);
    try {
      const sePayCheckout = await getLoanPaymentUrl(activeLoan.id);
      onClose();
      onPaidCheckout({ ...activeLoan, sePayCheckout });
    } catch (err: any) {
      setErrorMsg(err.message || 'Error loading payment information.');
    } finally {
      setPaying(false);
    }
  }, [activeLoan, onClose, onPaidCheckout]);

  const handleCancelLoan = useCallback(async () => {
    if (!activeLoan) return;
    if (!window.confirm('Are you sure you want to cancel this borrow request?')) return;
    setCancelling(true);
    setErrorMsg(null);
    try {
      await cancelPendingLoan(activeLoan.id);
      toast.success('Borrow request cancelled successfully.');
      onClose(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to cancel borrow request.');
    } finally {
      setCancelling(false);
    }
  }, [activeLoan, onClose]);

  // Early return AFTER all hooks
  if (!book) return null;

  const authorStr = book.authors && book.authors.length > 0
    ? book.authors.map(a => a.name).join(', ')
    : 'Unknown Author';

  const genreName = book.genres && book.genres.length > 0
    ? book.genres[0].name
    : 'General';

  const imgUrl = getGoogleBooksUrl(book.coverImageUrl, 2);

  return (
    <Dialog
      open={Boolean(book)}
      onClose={() => onClose()}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: '18px',
            overflow: 'hidden',
            boxShadow: '0 32px 80px rgba(99,102,241,0.18)',
          },
        },
      }}
    >
      <DialogContent sx={{ padding: 0 }}>
        <div className="relative">
          {/* Close button */}
          <IconButton
            onClick={() => onClose()}
            sx={{
              position: 'absolute', right: 12, top: 12, zIndex: 10,
              backgroundColor: 'rgba(255,255,255,0.85)',
              '&:hover': { backgroundColor: 'white' },
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}
          >
            <X size={16} weight="bold" />
          </IconButton>

          {/* Error banner */}
          {errorMsg && (
            <div className="bg-rose-50 border-b border-rose-100 px-6 py-3.5 flex items-start gap-2.5 text-rose-600 text-xs font-semibold">
              <Warning size={15} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Main layout */}
          <div className="p-6 sm:p-8 flex flex-col sm:flex-row gap-6">
            {/* Left — Cover */}
            <div className="w-full sm:w-[180px] aspect-[3/4] rounded-xl overflow-hidden shadow-md shrink-0 border border-slate-100 relative bg-slate-50">
              {imgUrl ? (
                <img src={imgUrl} alt={book.title} className="w-full h-full object-cover" />
              ) : (
                <CSSBookCover title={book.title} author={authorStr} />
              )}
            </div>

            {/* Right — Details */}
            <div className="flex-1 flex flex-col justify-between min-w-0">
              <div className="flex flex-col gap-2.5">
                <span className="w-fit text-[10.5px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
                  {genreName}
                </span>
                <h2 className="font-extrabold text-slate-800 text-lg leading-snug tracking-tight">
                  {book.title}
                </h2>
                <div className="text-xs text-slate-400 font-medium">
                  Author: <span className="text-slate-600 font-semibold">{authorStr}</span>
                </div>
                {book.description && (
                  <p className="text-xs text-slate-500 leading-relaxed max-h-[140px] overflow-y-auto pr-1">
                    {book.description}
                  </p>
                )}
                <div className="flex items-center gap-1 text-[11px] text-slate-400 pt-0.5">
                  <BookmarkSimple size={12} />
                  {book.availableCopies}/{book.totalCopies} copies available
                </div>
              </div>

              {/* Actions */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col gap-3">
                {showLogin ? (
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-center gap-2 text-amber-700 text-xs font-medium">
                    <Warning size={14} />
                    Please sign in to borrow books. Redirecting...
                  </div>
                ) : activeLoan ? (
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-2 p-3 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl">
                      <CheckCircle size={15} />
                      <span>Loan status: <strong>{activeLoan.status.replace(/_/g, ' ')}</strong></span>
                    </div>
                    {activeLoan.status === 'PENDING_PAYMENT' && (
                      <div className="flex gap-2">
                        <button
                          onClick={handlePayPending}
                          disabled={paying}
                          className="flex-1 cursor-pointer h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                        >
                          {paying ? <CircleNotch className="animate-spin" size={14} /> : null}
                          Pay Now ({activeLoan.paymentAmount?.toLocaleString()}₫)
                        </button>
                        <button
                          onClick={handleCancelLoan}
                          disabled={cancelling}
                          className="px-3 cursor-pointer h-10 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-500 text-xs font-semibold flex items-center justify-center transition-colors"
                        >
                          {cancelling ? <CircleNotch className="animate-spin" size={14} /> : 'Cancel'}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={handleBorrow}
                    disabled={borrowing || book.availableCopies === 0}
                    className="w-full cursor-pointer h-11 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-indigo-200/50 transition-all duration-200 active:scale-[0.98]"
                  >
                    {borrowing && <CircleNotch className="animate-spin" size={14} />}
                    {book.availableCopies > 0 ? 'Borrow Now' : 'Out of Copies'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── BookCard ─────────────────────────────────────────────────────────────────
interface BookCardProps {
  book: BookResponse;
  view: 'grid' | 'list';
  onClick: (b: BookResponse) => void;
  activeLoan?: BookLoanResponse;
}

function BookCard({ book, view, onClick, activeLoan }: BookCardProps) {
  const authorStr = book.authors && book.authors.length > 0
    ? book.authors.map(a => a.name).join(', ')
    : 'Unknown Author';

  const genreName = book.genres && book.genres.length > 0
    ? book.genres[0].name
    : 'General';

  const imgUrl = getGoogleBooksUrl(book.coverImageUrl, 2);

  if (view === 'list') {
    return (
      <article
        onClick={() => onClick(book)}
        className="group cursor-pointer flex bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-indigo-200 hover:shadow-md transition-all duration-200"
        style={{ minHeight: '88px' }}
      >
        {/* Cover */}
        <div className="w-[72px] sm:w-24 shrink-0 relative overflow-hidden bg-slate-50">
          {imgUrl ? (
            <img
              src={imgUrl}
              alt={book.title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
            />
          ) : (
            <CSSBookCover title={book.title} author={authorStr} />
          )}
        </div>
        {/* Info */}
        <div className="flex-1 px-4 py-3 flex flex-col justify-between min-w-0">
          <div className="flex flex-col gap-0.5">
            <h3 className="font-bold text-slate-800 text-sm sm:text-[0.9rem] group-hover:text-indigo-600 transition-colors line-clamp-1 leading-snug">
              {book.title}
            </h3>
            <p className="text-[11.5px] text-slate-400 line-clamp-1">{authorStr}</p>
          </div>
          <div className="flex items-center justify-between gap-3 mt-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                {genreName}
              </span>
              <span className="text-[10.5px] text-slate-400 flex items-center gap-1">
                <BookmarkSimple size={11} /> {book.availableCopies}/{book.totalCopies} available
              </span>
            </div>
            {activeLoan && (
              <span className={`shrink-0 text-[9.5px] font-bold px-2 py-0.5 rounded ${
                activeLoan.status === 'PENDING_PAYMENT' ? 'bg-amber-100 text-amber-800' :
                activeLoan.status === 'PENDING_PICKUP' ? 'bg-blue-100 text-blue-800' :
                activeLoan.status === 'CHECKED_OUT' ? 'bg-indigo-600 text-white' :
                'bg-rose-100 text-rose-800'
              }`}>
                {activeLoan.status.replace('_', ' ')}
              </span>
            )}
          </div>
        </div>
        {/* Chevron hint */}
        <div className="flex items-center pr-4 text-slate-300 group-hover:text-indigo-400 transition-colors shrink-0">
          <CaretRight size={14} weight="bold" />
        </div>
      </article>
    );
  }

  // Grid view
  return (
    <article
      onClick={() => onClick(book)}
      className="group cursor-pointer flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-indigo-200 hover:shadow-md transition-all duration-200"
    >
      {/* Cover */}
      <div className="relative overflow-hidden aspect-[3/4] bg-slate-50">
        {imgUrl ? (
          <img
            src={imgUrl}
            alt={book.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
          />
        ) : (
          <CSSBookCover title={book.title} author={authorStr} />
        )}
        {activeLoan && (
          <span className={`absolute top-2 right-2 text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow ${
            activeLoan.status === 'PENDING_PAYMENT' ? 'bg-amber-500 text-white' :
            activeLoan.status === 'PENDING_PICKUP' ? 'bg-blue-500 text-white' :
            activeLoan.status === 'CHECKED_OUT' ? 'bg-indigo-600 text-white' :
            'bg-rose-500 text-white'
          }`}>
            {activeLoan.status.replace('_', ' ')}
          </span>
        )}
      </div>
      {/* Info */}
      <div className="p-4 flex flex-col gap-1.5 flex-1 min-w-0">
        <h3 className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors line-clamp-1">
          {book.title}
        </h3>
        <p className="text-xs text-slate-400 line-clamp-1">{authorStr}</p>
        <div className="flex items-center justify-between gap-2 flex-wrap mt-auto pt-2">
          <span className="text-[10.5px] font-semibold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
            {genreName}
          </span>
          <span className="text-[10.5px] text-slate-400 flex items-center gap-1">
            <BookmarkSimple size={11} /> {book.availableCopies}/{book.totalCopies}
          </span>
        </div>
      </div>
    </article>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
interface SidebarProps {
  genres: GenreResponse[];
  authors: any[];
  selectedGenreId: number | null;
  setSelectedGenreId: (id: number | null) => void;
  selectedAuthorId: number | null;
  setSelectedAuthorId: (id: number | null) => void;
  showAll: boolean;
  setShowAll: (v: boolean) => void;
  onReset: () => void;
}

function Sidebar({
  genres,
  authors,
  selectedGenreId,
  setSelectedGenreId,
  selectedAuthorId,
  setSelectedAuthorId,
  showAll,
  setShowAll,
  onReset,
}: SidebarProps) {
  const visibleGenres = showAll ? genres : genres.slice(0, 5);

  return (
    <aside className="w-60 shrink-0 bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-6 shadow-sm">
      {/* Genre Section */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Genre</h3>
        <ul className="flex flex-col gap-0.5 list-none">
          {visibleGenres.map((g) => {
            const isActive = selectedGenreId === g.id;
            return (
              <li key={g.id}>
                <button
                  type="button"
                  onClick={() => setSelectedGenreId(isActive ? null : g.id)}
                  className={[
                    'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all cursor-pointer text-left',
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-semibold border-l-2 border-indigo-600'
                      : 'text-slate-600 hover:bg-indigo-50/50 hover:text-indigo-600',
                  ].join(' ')}
                >
                  <span>{g.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
        {genres.length > 5 && (
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="cursor-pointer text-xs font-bold text-indigo-600 hover:text-indigo-700 mt-2 ml-3"
          >
            {showAll ? 'Show less' : 'Show more +'}
          </button>
        )}
      </div>

      <div className="h-px bg-slate-100" />

      {/* Author Section */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Author</h3>
        <select
          value={selectedAuthorId || ''}
          onChange={(e) => setSelectedAuthorId(e.target.value ? Number(e.target.value) : null)}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-all cursor-pointer"
        >
          <option value="">All Authors</option>
          {authors.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      <div className="h-px bg-slate-100" />

      {/* Reset Filter Button */}
      <button
        type="button"
        onClick={onReset}
        className="cursor-pointer w-full py-2.5 border-2 border-slate-200 hover:border-indigo-600 hover:text-indigo-600 text-slate-500 font-semibold text-sm rounded-xl transition-all"
      >
        Reset Filters
      </button>
    </aside>
  );
}

// ─── Pagination ──────────────────────────────────────────────────────────────
interface PaginationProps {
  current: number;
  total: number;
  onChange: (p: number) => void;
}

function Pagination({ current, total, onChange }: PaginationProps) {
  const btnCls = (act: boolean, dis?: boolean) => [
    'cursor-pointer w-9 h-9 rounded-xl flex items-center justify-center text-sm font-semibold transition-all border',
    act ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200/60' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300',
    dis ? 'opacity-40 cursor-not-allowed pointer-events-none' : '',
  ].join(' ');

  if (total <= 1) return null;

  // Build page number list with ellipsis markers
  const pages: (number | '...')[] = [];
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    if (current > 3) pages.push('...');
    const start = Math.max(2, current - 1);
    const end   = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (current < total - 2) pages.push('...');
    pages.push(total);
  }

  return (
    <div className="flex items-center justify-center gap-1.5 mt-8 select-none">
      <button
        className={btnCls(false, current === 1)}
        onClick={() => onChange(current - 1)}
        disabled={current === 1}
        aria-label="Previous page"
      >
        <CaretLeft size={13} weight="bold" />
      </button>

      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} className="w-9 h-9 flex items-center justify-center text-slate-400 text-sm select-none">
            …
          </span>
        ) : (
          <button
            key={p}
            className={btnCls(p === current)}
            onClick={() => onChange(p as number)}
          >
            {p}
          </button>
        )
      )}

      <button
        className={btnCls(false, current === total)}
        onClick={() => onChange(current + 1)}
        disabled={current === total}
        aria-label="Next page"
      >
        <CaretRight size={13} weight="bold" />
      </button>
    </div>
  );
}

// ─── Browse Books Page ────────────────────────────────────────────────────────
export default function BrowseBooksPage() {
  const [searchParams] = useSearchParams();

  // Filters State
  const [query, setQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedGenreId, setSelectedGenreId] = useState<number | null>(null);
  const [selectedAuthorId, setSelectedAuthorId] = useState<number | null>(null);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [showAll, setShowAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Books and Metadata list
  const [books, setBooks] = useState<BookResponse[]>([]);
  const [genres, setGenres] = useState<GenreResponse[]>([]);
  const [authors, setAuthors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Book dialog state
  const [selectedBook, setSelectedBook] = useState<BookResponse | null>(null);

  // CheckoutModal state
  const [checkoutLoan, setCheckoutLoan] = useState<BookLoanResponse | null>(null);
  const { isAuthenticated } = useAuth();
  const [activeLoansMap, setActiveLoansMap] = useState<Record<number, BookLoanResponse>>({});
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(query);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  // Load genres and authors once
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [genresList, authorsList] = await Promise.all([
          getGenres(),
          getAuthors(),
        ]);
        setGenres(genresList);
        setAuthors(authorsList);

        // Handle category from URL search params
        const categoryParam = searchParams.get('category');
        if (categoryParam) {
          const matched = genresList.find(g => g.name.toLowerCase() === categoryParam.toLowerCase());
          if (matched) {
            setSelectedGenreId(matched.id);
          }
        }
      } catch (err) {
        console.error('Failed to load filter parameters:', err);
      }
    };
    loadMetadata();
  }, [searchParams]);

  // Load books from backend when filters change
  useEffect(() => {
    const fetchBooks = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getBooks({
          searchTerm: debouncedSearch || undefined,
          genreId: selectedGenreId || undefined,
          authorId: selectedAuthorId || undefined,
          page: currentPage - 1,
          size: 12,
          sortBy: 'createdAt',
          sortDirection: 'DESC',
        });
        setBooks(data.content);
        setTotalPages(data.totalPages);
        setTotalElements(data.totalElements);
      } catch (err: any) {
        setError(err.message || 'Không thể tải danh sách sách từ máy chủ.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchBooks();
  }, [debouncedSearch, selectedGenreId, selectedAuthorId, currentPage, refreshTrigger]);

  // Fetch active borrowing book IDs for logged-in user
  useEffect(() => {
    if (!isAuthenticated) {
      setActiveLoansMap({});
      return;
    }
    const fetchActiveLoans = async () => {
      try {
        const response = await getMyLoans(undefined, 0, 100);
        const activeLoans = response.content.filter(loan =>
          loan.status === 'PENDING_PAYMENT' ||
          loan.status === 'PENDING_PICKUP' ||
          loan.status === 'CHECKED_OUT' ||
          loan.status === 'OVERDUE'
        );
        const map: Record<number, BookLoanResponse> = {};
        activeLoans.forEach((loan) => {
          map[loan.bookId] = loan;
        });
        setActiveLoansMap(map);
      } catch (err) {
        console.error('Failed to load active loans:', err);
      }
    };
    fetchActiveLoans();
  }, [isAuthenticated, refreshTrigger]);

  const handlePaidCheckout = useCallback((loan: BookLoanResponse) => {
    setCheckoutLoan(loan);
  }, []);

  const handleCheckoutSuccess = useCallback(() => {
    setCheckoutLoan(null);
  }, []);

  const handleReset = () => {
    setSelectedGenreId(null);
    setSelectedAuthorId(null);
    setQuery('');
    setDebouncedSearch('');
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-6 py-9">

          {/* Page Header */}
          <div className="mb-5">
            <h1 className="text-[1.65rem] font-extrabold text-slate-900 tracking-tight">Book Library</h1>
            <p className="text-sm text-slate-500 mt-1">
              Search and explore books by genre, author, or topic.
            </p>
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-2.5 mb-7 shadow-sm">
            <MagnifyingGlass size={18} className="text-slate-400 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search books, authors, genres..."
              className="flex-1 bg-transparent border-none outline-none text-sm text-slate-800 placeholder:text-slate-400"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} className="cursor-pointer text-slate-400 hover:text-slate-600 transition-colors">
                <X size={15} />
              </button>
            )}
            <div className="w-px h-6 bg-slate-100 shrink-0" />
            <div className="flex gap-1">
              {(['grid', 'list'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  className={[
                    'cursor-pointer w-8 h-8 rounded-lg flex items-center justify-center border transition-all duration-150',
                    view === v
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                      : 'bg-transparent border-transparent text-slate-400 hover:text-slate-600',
                  ].join(' ')}
                >
                  {v === 'grid' ? <SquaresFour size={16} weight="bold" /> : <Rows size={16} weight="bold" />}
                </button>
              ))}
            </div>
          </div>

          {/* Content Layout */}
          <div className="flex gap-6 items-start">
            {/* Sidebar */}
            <div className="hidden lg:block">
              <Sidebar
                genres={genres}
                authors={authors}
                selectedGenreId={selectedGenreId}
                setSelectedGenreId={setSelectedGenreId}
                selectedAuthorId={selectedAuthorId}
                setSelectedAuthorId={setSelectedAuthorId}
                showAll={showAll}
                setShowAll={setShowAll}
                onReset={handleReset}
              />
            </div>

            {/* Books */}
            <div className="flex-1 min-w-0">
              <p className="text-[0.9rem] font-bold text-slate-900 mb-5">
                All Books{' '}
                <span className="font-normal text-slate-400">({totalElements.toLocaleString()})</span>
              </p>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <CircleNotch size={32} className="animate-spin text-indigo-600" />
                  <p className="text-sm text-slate-400">Loading books...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12 text-sm text-rose-500 bg-rose-50 border border-rose-100 rounded-2xl p-6">
                  {error}
                </div>
              ) : books.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                  <BookOpen size={40} className="text-slate-300" />
                  <p className="font-semibold text-slate-600">No results found</p>
                  <p className="text-sm text-slate-400">Try adjusting your filters or search term</p>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="cursor-pointer mt-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className={view === 'grid'
                  ? 'grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-6'
                  : 'flex flex-col gap-3'
                }>
                  {books.map((book) => (
                    <BookCard
                      key={book.id}
                      book={book}
                      view={view}
                      onClick={setSelectedBook}
                      activeLoan={activeLoansMap[book.id]}
                    />
                  ))}
                </div>
              )}

              {!isLoading && !error && books.length > 0 && (
                <Pagination current={currentPage} total={totalPages} onChange={setCurrentPage} />
              )}
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="bg-slate-100 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                <BookOpen size={22} weight="bold" className="text-indigo-600" />
              </div>
              <div>
                <p className="font-bold text-slate-900 text-[0.95rem]">Can't find the book you're looking for?</p>
                <p className="text-sm text-slate-500 mt-0.5">Send us a request and we'll add it to the library</p>
              </div>
            </div>
            <button
              type="button"
              className="cursor-pointer shrink-0 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-md shadow-indigo-300/30 active:scale-[0.97]"
            >
              Request a Book
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-slate-100 bg-white">
          <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-[8px] bg-indigo-600 flex items-center justify-center">
                  <BookOpen size={14} weight="bold" color="white" />
                </div>
                <span className="font-bold text-[15px] text-slate-800">
                  Book<span className="text-indigo-600">Nest</span>
                </span>
              </Link>
              <span className="text-slate-200">|</span>
              <span className="text-xs text-slate-400">© 2026 BookNest.</span>
            </div>
            <p className="text-xs text-slate-400 italic">"Every book is a journey."</p>
          </div>
        </footer>
      </main>

      {/* ── Book Detail Dialog (MUI) ─────────────────────────────────────── */}
      <BookDetailDialog
        book={selectedBook}
        onClose={(needRefresh) => {
          setSelectedBook(null);
          if (needRefresh) setRefreshTrigger((prev) => prev + 1);
        }}
        onPaidCheckout={handlePaidCheckout}
        activeLoan={selectedBook ? activeLoansMap[selectedBook.id] : undefined}
      />

      {checkoutLoan && checkoutLoan.sePayCheckout && (
        <CheckoutModal
          loanId={checkoutLoan.id}
          bookTitle={checkoutLoan.bookTitle}
          sePayCheckout={checkoutLoan.sePayCheckout}
          onClose={(reason) => {
            setCheckoutLoan(null);
            if (reason === 'expired') {
              toast.error('Reservation time expired. Borrow request automatically cancelled.');
            }
            setRefreshTrigger((prev) => prev + 1);
          }}
          onSuccess={() => {
            handleCheckoutSuccess();
            setRefreshTrigger((prev) => prev + 1);
          }}
        />
      )}
    </div>
  );
}
