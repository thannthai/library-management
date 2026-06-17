import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  MagnifyingGlass, SquaresFour, Rows, BookOpen, X,
  CaretLeft, CaretRight, BookmarkSimple, Warning, CheckCircle,
} from '@phosphor-icons/react';

// MUI Dialog (as specified in instructions — use MUI for complex components)
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';

import Navbar from '../../layouts/Navbar';
import { MOCK_BOOKS, GENRES, AUTHORS, GENRE_COLOR_MAP } from '../../data/landingMockData';
import type { Book } from '../../types/landing.types';
import type { BookLoanResponse } from '../../types/loans.types';
import { useAuth } from '../../context/AuthContext';
import { borrowBook, getMyLoans } from '../../api/loansApi';
import CheckoutModal from '../../components/CheckoutModal';

// ─── Book Detail Dialog (MUI) ─────────────────────────────────────────────────
interface BookDialogProps {
  book: Book | null;
  onClose: () => void;
  /** Called when API returns a paid-checkout response — opens CheckoutModal */
  onPaidCheckout: (loan: BookLoanResponse) => void;
  isBorrowing?: boolean;
}

function BookDetailDialog({ book, onClose, onPaidCheckout, isBorrowing }: BookDialogProps) {
  const navigate          = useNavigate();
  const { isAuthenticated } = useAuth();
  const [showLogin,  setShowLogin]  = useState(false);
  const [borrowing,  setBorrowing]  = useState(false);
  const [errorMsg,   setErrorMsg]   = useState<string | null>(null);

  // Reset state khi đổi sách
  useEffect(() => {
    setShowLogin(false);
    setErrorMsg(null);
    setBorrowing(false);
  }, [book]);

  const pillCls  = book ? (GENRE_COLOR_MAP[book.genreColor] ?? 'bg-slate-100 text-slate-600') : '';
  const imgUrl   = book ? `https://picsum.photos/seed/${book.coverSeed}/400/540` : '';
  const borrowStr = book
    ? book.borrowCount >= 1000
      ? `${(book.borrowCount / 1000).toFixed(1)}k lượt mượn`
      : `${book.borrowCount} lượt mượn`
    : '';

  const handleBorrow = useCallback(async () => {
    if (!isAuthenticated) {
      setShowLogin(true);
      setTimeout(() => {
        onClose();
        navigate('/login');
      }, 2000);
      return;
    }

    if (!book || borrowing) return;

    setBorrowing(true);
    setErrorMsg(null);
    try {
      // Vì book.id từ MOCK_BOOKS là string (vd 'b01'), ta chuyển sang số.
      // Nếu API trả lỗi (404) vì sách mock không tồn tại trong DB, ta vẫn bắt lỗi bình thường.
      const realBookId = Number(book.id.replace(/\D/g, '')) || 1;
      const loanResponse = await borrowBook(realBookId);

      if (loanResponse.sePayCheckout !== null) {
        // Nhánh B: cần thanh toán → mở CheckoutModal
        onClose();
        onPaidCheckout(loanResponse);
      } else {
        // Nhánh A: miễn phí (có Subscription) → thành công ngay
        onClose();
        navigate('/dashboard/loans');
      }
    } catch (err: any) {
      const serverMsg = err.response?.data?.message;
      const msg = serverMsg || (err instanceof Error ? err.message : 'Không thể thực hiện yêu cầu mượn sách.');
      setErrorMsg(msg);
    } finally {
      setBorrowing(false);
    }
  }, [book, borrowing, isAuthenticated, navigate, onClose, onPaidCheckout]);

  return (
    <Dialog
      open={Boolean(book)}
      onClose={onClose}
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
        {book && (
          <div className="relative">
            {/* Close button */}
            <IconButton
              onClick={onClose}
              size="small"
              sx={{
                position: 'absolute',
                top: 10,
                right: 10,
                zIndex: 10,
                background: 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(4px)',
                '&:hover': { background: 'rgba(241,245,249,1)' },
              }}
            >
              <X size={16} weight="bold" />
            </IconButton>

            <div className="flex flex-col sm:flex-row">
              {/* Cover */}
              <div
                className="w-full sm:w-[180px] shrink-0 aspect-[3/4] sm:aspect-auto sm:h-auto overflow-hidden"
                style={{ background: book.coverBg, minHeight: '220px' }}
              >
                <img
                  src={imgUrl}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Details */}
              <div className="flex-1 p-6 flex flex-col gap-4">
                {/* Title + Author */}
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 leading-tight tracking-tight">
                    {book.title}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">{book.author}</p>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${pillCls}`}>
                    {book.genre}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <BookmarkSimple size={12} />
                    {borrowStr}
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm text-slate-600 leading-relaxed">
                  {book.description}
                </p>

                {/* Login warning */}
                <AnimatePresence>
                  {showLogin && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl"
                    >
                      <Warning size={16} weight="bold" className="text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-amber-800">
                          Yêu cầu đăng nhập tài khoản sinh viên
                        </p>
                        <p className="text-xs text-amber-600 mt-0.5">
                          Đang chuyển hướng đến trang đăng nhập…
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Error message */}
                <AnimatePresence>
                  {errorMsg && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-start gap-2.5 p-3 bg-rose-50 border border-rose-200 rounded-xl"
                    >
                      <Warning size={16} weight="bold" className="text-rose-500 shrink-0 mt-0.5" />
                      <p className="text-xs font-semibold text-rose-700">{errorMsg}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Borrow button */}
                {isBorrowing ? (
                  <button
                    type="button"
                    disabled
                    className="cursor-not-allowed mt-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm font-semibold rounded-xl w-full"
                  >
                    <CheckCircle size={16} weight="fill" className="text-indigo-600" />
                    Bạn đang mượn sách này
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleBorrow}
                    disabled={borrowing}
                    className="cursor-pointer mt-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-indigo-300/30 active:scale-[0.97] w-full"
                  >
                    {borrowing ? (
                      <>
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        Đang xử lý…
                      </>
                    ) : (
                      <>
                        <BookmarkSimple size={16} weight="bold" />
                        Đăng ký mượn sách
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Book Card ────────────────────────────────────────────────────────────────
function BookCard({
  book,
  view,
  onClick,
  isBorrowing,
}: {
  book: Book;
  view: 'grid' | 'list';
  onClick: (book: Book) => void;
  isBorrowing?: boolean;
}) {
  const pillCls  = GENRE_COLOR_MAP[book.genreColor] ?? 'bg-slate-100 text-slate-600';
  const imgUrl   = `https://picsum.photos/seed/${book.coverSeed}/200/280`;
  const borrowStr = book.borrowCount >= 1000
    ? `${(book.borrowCount / 1000).toFixed(1)}k`
    : String(book.borrowCount);

  if (view === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        onClick={() => onClick(book)}
        className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer group"
      >
        <div className="w-14 h-[80px] rounded-lg overflow-hidden shrink-0" style={{ background: book.coverBg }}>
          <img src={imgUrl} alt={book.title} className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-300" loading="lazy" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-800 text-sm truncate group-hover:text-indigo-600 transition-colors">{book.title}</p>
          <p className="text-xs text-slate-400 mt-0.5">{book.author}</p>
          <div className="flex items-center gap-2.5 mt-2 flex-wrap">
            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${pillCls}`}>{book.genre}</span>
            {isBorrowing && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">
                Borrowing
              </span>
            )}
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <BookmarkSimple size={11} />{borrowStr} lượt mượn
            </span>
          </div>
        </div>
        <span className="text-slate-300 group-hover:text-indigo-400 transition-colors shrink-0">
          <CaretRight size={14} />
        </span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      onClick={() => onClick(book)}
      className="flex flex-col gap-2.5 cursor-pointer group relative"
    >
      <div className="relative overflow-hidden rounded-xl aspect-[3/4]" style={{ background: book.coverBg }}>
        {isBorrowing && (
          <span className="absolute top-2 left-2 z-10 inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-600 text-white shadow">
            <CheckCircle size={10} weight="fill" className="text-white" />
            Borrowing
          </span>
        )}
        <img
          src={imgUrl}
          alt={book.title}
          className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-indigo-900/0 group-hover:bg-indigo-900/10 transition-colors duration-300" />
      </div>
      <div>
        <p className="font-bold text-slate-800 text-sm leading-snug group-hover:text-indigo-600 transition-colors line-clamp-2">{book.title}</p>
        <p className="text-xs text-slate-400 mt-0.5">{book.author}</p>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${pillCls}`}>{book.genre}</span>
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <BookmarkSimple size={11} />{borrowStr}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
interface SidebarProps {
  selectedGenre: string;
  setSelectedGenre: (g: string) => void;
  selectedAuthor: string;
  setSelectedAuthor: (a: string) => void;
  showAll: boolean;
  setShowAll: (v: boolean) => void;
  onReset: () => void;
}

function Sidebar({
  selectedGenre, setSelectedGenre,
  selectedAuthor, setSelectedAuthor,
  showAll, setShowAll,
  onReset,
}: SidebarProps) {
  const genres = showAll ? GENRES : GENRES.slice(0, 6);

  return (
    <aside className="w-[220px] shrink-0 bg-white border border-slate-200 rounded-2xl p-5 sticky top-20 self-start">
      <div className="flex justify-between items-center mb-4">
        <span className="font-bold text-[0.9rem] text-slate-900">Bộ lọc</span>
        <button type="button" onClick={onReset} className="cursor-pointer text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
          Xóa tất cả
        </button>
      </div>

      {/* Genre */}
      <div className="mb-5">
        <p className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Thể loại</p>
        <div className="flex flex-col gap-0.5">
          {genres.map((g) => (
            <label key={g.label} className="flex items-center gap-2 py-1 px-0.5 cursor-pointer">
              <input
                type="checkbox"
                className="accent-indigo-600 w-3.5 h-3.5 cursor-pointer"
                checked={selectedGenre === g.label}
                onChange={() => setSelectedGenre(selectedGenre === g.label ? '' : g.label)}
              />
              <span className="text-[0.8rem] text-slate-700 flex-1">{g.label}</span>
              <span className="text-[0.7rem] text-slate-400">({g.count.toLocaleString()})</span>
            </label>
          ))}
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="cursor-pointer text-[0.78rem] font-semibold text-indigo-600 hover:text-indigo-700 text-left pt-1 mt-0.5 transition-colors"
          >
            {showAll ? 'Thu gọn ▲' : 'Xem thêm ▼'}
          </button>
        </div>
      </div>

      {/* Author */}
      <div className="mb-5">
        <p className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Tác giả</p>
        <select
          value={selectedAuthor}
          onChange={(e) => setSelectedAuthor(e.target.value)}
          className="cursor-pointer w-full px-2.5 py-2 rounded-lg border border-slate-200 text-[0.8rem] text-slate-700 bg-white outline-none"
        >
          <option value="">Chọn tác giả</option>
          {AUTHORS.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {/* Year */}
      <div className="mb-5">
        <p className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Năm xuất bản</p>
        <div className="flex gap-2 items-center">
          <input type="number" placeholder="Từ năm" className="w-[78px] px-2 py-1.5 rounded-lg border border-slate-200 text-xs outline-none" />
          <span className="text-slate-300">-</span>
          <input type="number" placeholder="Đến" className="w-[78px] px-2 py-1.5 rounded-lg border border-slate-200 text-xs outline-none" />
        </div>
      </div>

      {/* Language */}
      <div className="mb-5">
        <p className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Ngôn ngữ</p>
        <select className="cursor-pointer w-full px-2.5 py-2 rounded-lg border border-slate-200 text-[0.8rem] text-slate-700 bg-white outline-none">
          <option>Tất cả ngôn ngữ</option>
          <option>Tiếng Việt</option>
          <option>Tiếng Anh</option>
        </select>
      </div>

      {/* Sort */}
      <div>
        <p className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Sắp xếp theo</p>
        <select className="cursor-pointer w-full px-2.5 py-2 rounded-lg border border-slate-200 text-[0.8rem] text-slate-700 bg-white outline-none">
          <option>Phổ biến nhất</option>
          <option>Mới nhất</option>
          <option>Tên A-Z</option>
        </select>
      </div>
    </aside>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────
function Pagination({ current, total, onChange }: { current: number; total: number; onChange: (p: number) => void }) {
  const btnCls = (active: boolean, disabled = false) => [
    'w-9 h-9 rounded-lg flex items-center justify-center text-sm font-semibold border transition-all duration-150',
    active    ? 'bg-indigo-600 border-indigo-600 text-white' : '',
    !active && !disabled ? 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 cursor-pointer' : '',
    disabled  ? 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className="flex items-center justify-center gap-1.5 mt-10">
      <button className={btnCls(false, current === 1)} onClick={() => onChange(Math.max(1, current - 1))} disabled={current === 1}>
        <CaretLeft size={13} weight="bold" />
      </button>
      {[1, 2, 3, 4, 5].map((p) => (
        <button key={p} className={btnCls(p === current)} onClick={() => onChange(p)}>{p}</button>
      ))}
      <span className="text-slate-400 text-sm px-1">…</span>
      <button className={btnCls(current === total)} onClick={() => onChange(total)}>{total}</button>
      <button className={btnCls(false, current === total)} onClick={() => onChange(Math.min(total, current + 1))} disabled={current === total}>
        <CaretRight size={13} weight="bold" />
      </button>
    </div>
  );
}

// ─── Browse Books Page ────────────────────────────────────────────────────────
export default function BrowseBooksPage() {
  const [searchParams] = useSearchParams();

  // Read URL query params to auto-apply filters on mount / URL change
  const paramCategory = decodeURIComponent(searchParams.get('category') ?? '');
  const paramSearch   = decodeURIComponent(searchParams.get('search') ?? '');

  const [query,         setQuery]        = useState(paramSearch);
  const [selectedGenre, setSelectedGenre] = useState(paramCategory || '');
  const [selectedAuthor,setSelectedAuthor]= useState('');
  const [view,          setView]          = useState<'grid' | 'list'>('grid');
  const [showAll,       setShowAll]       = useState(false);
  const [currentPage,   setCurrentPage]   = useState(1);

  // Re-sync state if URL params change (e.g. back-nav)
  useEffect(() => {
    setQuery(paramSearch);
    setSelectedGenre(paramCategory || '');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  // Book dialog state
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  // CheckoutModal state — set khi API borrow trả về sePayCheckout != null
  const [checkoutLoan, setCheckoutLoan] = useState<BookLoanResponse | null>(null);
  const { isAuthenticated } = useAuth();
  const [borrowingBookIds, setBorrowingBookIds] = useState<Set<number>>(new Set());

  // Fetch active borrowing book IDs for logged-in user
  useEffect(() => {
    if (!isAuthenticated) {
      setBorrowingBookIds(new Set());
      return;
    }
    const fetchActiveLoans = async () => {
      try {
        const response = await getMyLoans(undefined, 0, 100);
        const activeLoans = response.content.filter(loan =>
          loan.status === 'PENDING_PAYMENT' ||
          loan.status === 'CHECKED_OUT' ||
          loan.status === 'OVERDUE'
        );
        setBorrowingBookIds(new Set(activeLoans.map(loan => loan.bookId)));
      } catch (err) {
        console.error('Lỗi khi lấy danh sách sách đang mượn:', err);
      }
    };
    fetchActiveLoans();
  }, [isAuthenticated]);

  const handlePaidCheckout = useCallback((loan: BookLoanResponse) => {
    setCheckoutLoan(loan);
  }, []);

  const handleCheckoutSuccess = useCallback(() => {
    setCheckoutLoan(null);
  }, []);

  const handleReset = () => {
    setSelectedGenre('');
    setSelectedAuthor('');
    setQuery('');
    setCurrentPage(1);
  };

  const filtered: Book[] = MOCK_BOOKS.filter((b) => {
    const mG = !selectedGenre || b.genre === selectedGenre;
    const mA = !selectedAuthor || b.author === selectedAuthor;
    const mQ = !query
      || b.title.toLowerCase().includes(query.toLowerCase())
      || b.author.toLowerCase().includes(query.toLowerCase());
    return mG && mA && mQ;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-6 py-9">

          {/* Page Header */}
          <div className="mb-5">
            <h1 className="text-[1.65rem] font-extrabold text-slate-900 tracking-tight">Duyệt sách</h1>
            <p className="text-sm text-slate-500 mt-1">
              Tìm kiếm và khám phá sách theo thể loại, tác giả hoặc chủ đề bạn quan tâm.
              {selectedGenre && (
                <span className="ml-2 inline-flex items-center gap-1.5 text-indigo-600 font-semibold">
                  Đang lọc: {selectedGenre}
                  <button type="button" onClick={() => setSelectedGenre('')} className="cursor-pointer hover:text-indigo-800">
                    <X size={12} weight="bold" />
                  </button>
                </span>
              )}
            </p>
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-2.5 mb-7 shadow-sm">
            <MagnifyingGlass size={18} className="text-slate-400 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm kiếm sách, tác giả, thể loại…"
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
                selectedGenre={selectedGenre}   setSelectedGenre={setSelectedGenre}
                selectedAuthor={selectedAuthor} setSelectedAuthor={setSelectedAuthor}
                showAll={showAll}               setShowAll={setShowAll}
                onReset={handleReset}
              />
            </div>

            {/* Books */}
            <div className="flex-1 min-w-0">
              <p className="text-[0.9rem] font-bold text-slate-900 mb-5">
                Tất cả sách{' '}
                <span className="font-normal text-slate-400">({filtered.length.toLocaleString()})</span>
              </p>

              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                  <BookOpen size={40} className="text-slate-300" />
                  <p className="font-semibold text-slate-600">Không tìm thấy kết quả</p>
                  <p className="text-sm text-slate-400">Thử thay đổi bộ lọc hoặc từ khóa</p>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="cursor-pointer mt-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Xóa bộ lọc
                  </button>
                </div>
              ) : (
                <div className={view === 'grid'
                  ? 'grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-6'
                  : 'flex flex-col gap-3'
                }>
                  {filtered.map((book) => (
                    <BookCard
                      key={book.id}
                      book={book}
                      view={view}
                      onClick={setSelectedBook}
                      isBorrowing={borrowingBookIds.has(Number(book.id.replace(/\D/g, '')) || 1)}
                    />
                  ))}
                </div>
              )}

              {filtered.length > 0 && (
                <Pagination current={currentPage} total={50} onChange={setCurrentPage} />
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
                <p className="font-bold text-slate-900 text-[0.95rem]">Không tìm thấy cuốn sách bạn muốn?</p>
                <p className="text-sm text-slate-500 mt-0.5">Gửi yêu cầu để thư viện bổ sung cho bạn</p>
              </div>
            </div>
            <button
              type="button"
              className="cursor-pointer shrink-0 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-md shadow-indigo-300/30 active:scale-[0.97]"
            >
              Gửi yêu cầu
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
            <p className="text-xs text-slate-400 italic">"Mỗi cuốn sách là một hành trình."</p>
          </div>
        </footer>
      </main>

      {/* ── Book Detail Dialog (MUI) ─────────────────────────────────────── */}
      <BookDetailDialog
        book={selectedBook}
        onClose={() => setSelectedBook(null)}
        onPaidCheckout={handlePaidCheckout}
        isBorrowing={selectedBook ? borrowingBookIds.has(Number(selectedBook.id.replace(/\D/g, '')) || 1) : false}
      />

      {/* ── CheckoutModal — hiện khi cần thanh toán mượn lẻ ──────────────── */}
      {checkoutLoan && checkoutLoan.sePayCheckout && (
        <CheckoutModal
          loanId={checkoutLoan.id}
          bookTitle={checkoutLoan.bookTitle}
          sePayCheckout={checkoutLoan.sePayCheckout}
          onClose={() => setCheckoutLoan(null)}
          onSuccess={handleCheckoutSuccess}
        />
      )}
    </div>
  );
}
