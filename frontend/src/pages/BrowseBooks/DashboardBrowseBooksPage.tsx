/**
 * DashboardBrowseBooksPage.tsx
 * ────────────────────────────────────────────────────────────────────────────
 * Browse Books page inside the Dashboard layout.
 * Layout: left filter sidebar (genres + availability) | right card grid
 * Integrated with real APIs from Backend.
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  MagnifyingGlass,
  BookOpen,
  BookmarkSimple,
  SortAscending,
  Funnel,
  X,
  CheckCircle,
  XCircle,
  User as UserIcon,
  CircleNotch,
  CalendarCheck,
} from '@phosphor-icons/react';
import { toast } from 'react-hot-toast';

import Dialog        from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import IconButton    from '@mui/material/IconButton';

import DashboardLayout from '../../layouts/DashboardLayout';
import CheckoutModal from '../../components/CheckoutModal';
import { GENRE_COLOR_MAP } from '../../data/landingMockData';
import type { BookResponse, GenreResponse } from '../../types/books.types';
import type { SePayCheckout } from '../../types/subscription.types';
import { getBooks, getGenres } from '../../api/booksApi';
import { borrowBook, cancelPendingLoan, getMyLoans } from '../../api/loansApi';
import { getMyFavorites, toggleFavorite } from '../../api/favoritesApi';
import { reserveBook } from '../../api/reservationsApi';
import { getActiveSubscription } from '../../api/subscriptionApi';
import { useAuth } from '../../context/AuthContext';

const SORT_OPTIONS = [
  { value: 'newest',  label: 'Newest First' },
  { value: 'az',      label: 'Title A–Z' },
  { value: 'za',      label: 'Title Z–A' },
];

const AVAIL_OPTIONS = [
  { value: 'all',       label: 'All Books' },
  { value: 'available', label: 'Available Now' },
  { value: 'checked_out', label: 'Checked Out' },
];

// ─── Deterministic Genre Color Resolver ──────────────────────────────────────
const getGenreColor = (genreName: string): string => {
  const colors = ['violet', 'orange', 'blue', 'amber', 'yellow', 'rose'];
  let hash = 0;
  for (let i = 0; i < genreName.length; i++) {
    hash = genreName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

// ─── Google Books cover URL builder ─────────────────────────────────────────
// zoom=2 → ~512 px wide (preferred). Some books only support zoom=1 (~128 px).
// We build both and fall back inside BookCover.
const getGoogleBooksUrl = (url: string | undefined, zoom: 1 | 2): string | undefined => {
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
  return url; // Non-Google URL — return as-is
};

const isGoogleBooksUrl = (url: string | undefined): boolean =>
  !!url && (url.includes('google.com/books') || url.includes('books.google.com'));

// ─── Premium CSS Book Cover Placeholder ──────────────────────────────────────
function CSSBookCover({ title, author, genreColor }: { title: string; author: string; genreColor: string }) {
  const gradientMap: Record<string, string> = {
    violet: 'from-violet-600 to-indigo-700',
    orange: 'from-orange-500 to-rose-600',
    blue:   'from-blue-600 to-cyan-700',
    amber:  'from-amber-500 to-orange-700',
    yellow: 'from-yellow-500 to-amber-600',
    rose:   'from-rose-600 to-pink-700',
  };
  const gradient = gradientMap[genreColor] || 'from-indigo-600 to-purple-700';

  return (
    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} p-5 flex flex-col justify-between text-white select-none`}>
      <div className="flex flex-col gap-2">
        <span className="text-[9px] font-bold tracking-widest uppercase opacity-75">BookNest Collection</span>
        <h4 className="font-extrabold text-sm leading-snug line-clamp-3 mt-1 text-white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.15)' }}>
          {title}
        </h4>
      </div>
      <div className="flex flex-col gap-1 border-t border-white/20 pt-2.5">
        <p className="text-[10px] font-semibold opacity-90 line-clamp-1 text-white">{author}</p>
      </div>
    </div>
  );
}

// ─── Reusable Book Cover Component — 3-stage fallback ──────────────────────
//
// Stage chain:
//   zoom2 → zoom1 → openlib (ISBN) → css
//
// ⚠️  naturalWidth check ONLY at zoom=2.
//     Real zoom=1 images are ~128px — same size as Google's placeholder.
//     Checking size at zoom=1 would cause false positives and skip real covers.
//
type ImgStage = 'zoom2' | 'zoom1' | 'openlib' | 'css';

function BookCover({
  src,
  isbn,
  alt,
  className,
  title,
  author,
  genreColor,
}: {
  src: string | undefined;
  isbn?: string | undefined;
  alt: string;
  className: string;
  fallbackSeed?: string | number; // compat only, unused
  title: string;
  author: string;
  genreColor: string;
}) {
  const isGoogle = isGoogleBooksUrl(src);

  const initialStage = (): ImgStage => {
    if (src) return 'zoom2';
    if (isbn) return 'openlib';
    return 'css';
  };

  const [stage, setStage] = useState<ImgStage>(initialStage);

  // Reset when the book prop changes
  useEffect(() => {
    setStage(initialStage());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, isbn]);

  // Advance to next stage in the fallback chain
  const advance = () => {
    setStage((prev) => {
      if (prev === 'zoom2' && isGoogle) return 'zoom1';
      if ((prev === 'zoom2' || prev === 'zoom1') && isbn) return 'openlib';
      return 'css';
    });
  };

  // Hide the img element until we confirm it shows a real cover (not Google's/OpenLibrary's placeholder).
  // Prevents the brief flash of placeholder images.
  const [imgVisible, setImgVisible] = useState(false);

  // Validate image dimension at each stage to detect placeholders:
  // - Google's "Image not available" banner: 300×48 px (height < 100 px).
  // - Open Library empty fallback or general failed image: 1×1 px transparent (width/height < 10 px).
  // - Zoom2 check: Real zoom=2 covers are usually > 200px wide.
  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    let isPlaceholder = false;

    if (stage === 'zoom2') {
      isPlaceholder = naturalWidth < 200 || naturalHeight < 100;
    } else if (stage === 'zoom1') {
      isPlaceholder = naturalHeight < 100 || naturalWidth < 10;
    } else if (stage === 'openlib') {
      isPlaceholder = naturalWidth < 10 || naturalHeight < 10;
    }

    if (isPlaceholder) {
      advance(); // placeholder detected → try next stage
      return;    // don't reveal this img
    }

    setImgVisible(true); // confirmed real image → show it
  };

  // Compute the URL for the current stage
  const url: string | undefined = (() => {
    switch (stage) {
      case 'zoom2': return isGoogle ? getGoogleBooksUrl(src, 2) : src;
      case 'zoom1': return isGoogle ? getGoogleBooksUrl(src, 1) : undefined;
      case 'openlib': return isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg` : undefined;
      default:      return undefined;
    }
  })();

  if (stage === 'css' || !url) {
    return <CSSBookCover title={title} author={author} genreColor={genreColor} />;
  }

  return (
    <img
      key={stage}             // remount on stage change; resets imgVisible to false
      src={url}
      alt={alt}
      // Hide until confirmed real — prevents 300×48 placeholder from ever flashing
      className={`${className} transition-opacity duration-200 ${imgVisible ? 'opacity-100' : 'opacity-0'}`}
      loading="lazy"
      onLoad={handleLoad}
      onError={advance}
    />
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: 'available' | 'checked_out' | 'borrowing' }) {
  const map = {
    available:   { label: 'Available',   cls: 'bg-emerald-500 text-white' },
    checked_out: { label: 'Checked Out', cls: 'bg-rose-500 text-white' },
    borrowing:   { label: 'Borrowing',   cls: 'bg-indigo-600 text-white' },
  };
  const { label, cls } = map[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
      {label}
    </span>
  );
}

// ─── Book Card ────────────────────────────────────────────────────────────────
function BookCard({
  book,
  onSelect,
  isBorrowing,
  isFavorite,
  onToggleFavorite,
}: {
  book: BookResponse;
  onSelect: () => void;
  isBorrowing?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}) {
  const genreName = book.genres && book.genres.length > 0 ? book.genres[0].name : 'Khác';
  const genreColor = getGenreColor(genreName);
  const pillCls = GENRE_COLOR_MAP[genreColor] ?? 'bg-slate-100 text-slate-600';
  const authorName = book.authors && book.authors.length > 0 ? book.authors.map((a) => a.name).join(', ') : 'Chưa rõ tác giả';
  const copiesStr = `${book.availableCopies}/${book.totalCopies} cuốn`;
  const isAvailable = book.availableCopies > 0;
  const status: 'available' | 'checked_out' | 'borrowing' = isBorrowing
    ? 'borrowing'
    : (isAvailable ? 'available' : 'checked_out');

  return (
    <motion.div
      layout
      onClick={onSelect}
      className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg hover:shadow-slate-200/60 hover:-translate-y-0.5 transition-all duration-300 ease-in-out opacity-0 animate-fade-in flex flex-col cursor-pointer"
    >
      {/* Cover — portrait aspect ratio (standard book 2:3) */}
      <div className="relative w-full aspect-[2/3] overflow-hidden bg-slate-100">
        <BookCover
          src={book.coverImageUrl}
          isbn={book.isbn}
          alt={book.title}
          className="absolute inset-0 w-full h-full object-cover"
          fallbackSeed={book.isbn || book.id}
          title={book.title}
          author={authorName}
          genreColor={genreColor}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
        {/* Status badge */}
        <div className="absolute top-2.5 left-2.5">
          <StatusBadge status={status} />
        </div>
        {/* Bookmark button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite?.();
          }}
          className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-lg backdrop-blur flex items-center justify-center transition-colors cursor-pointer ${
            isFavorite ? 'bg-indigo-600 text-white shadow shadow-indigo-200' : 'bg-white/90 text-slate-500 hover:text-indigo-600'
          }`}
        >
          <BookmarkSimple size={14} weight={isFavorite ? 'fill' : 'regular'} />
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4">
        <span className={`self-start text-[10px] font-semibold px-2 py-0.5 rounded-full mb-2 ${pillCls}`}>
          {genreName}
        </span>
        <h3 className="font-bold text-slate-800 text-sm leading-snug line-clamp-2 mb-1">
          {book.title}
        </h3>
        <p className="text-xs text-slate-500 flex items-center gap-1 mb-1.5">
          <UserIcon size={11} className="shrink-0" />
          {authorName}
        </p>
        <p className="text-[11px] text-slate-400 mb-1">{book.isbn}</p>
        <p className="text-[11px] text-slate-400 mb-3">{copiesStr}</p>
        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 flex-1">
          {book.description}
        </p>

        {/* Action button */}
        <button
          type="button"
          onClick={onSelect}
          className="mt-4 w-full h-9 rounded-xl text-sm font-semibold border-2 border-indigo-500 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all duration-150 cursor-pointer"
        >
          View
        </button>
      </div>
    </motion.div>
  );
}

// ─── Book Detail Dialog ───────────────────────────────────────────────────────
function BookDetailDialog({
  book,
  onClose,
  onBorrowPaid,
  isBorrowing,
  isFavorite,
  onToggleFavorite,
  isVip,
}: {
  book: BookResponse | null;
  onClose: () => void;
  /** Gọi khi mượn lẻ thành công — truyền loanId + sePayCheckout để mở CheckoutModal */
  onBorrowPaid: (loanId: number, sePayCheckout: SePayCheckout, bookTitle: string) => void;
  isBorrowing?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  /** true nếu user đang có gói VIP hợp lệ */
  isVip?: boolean;
}) {
  if (!book) return null;

  const [borrowing, setBorrowing] = useState(false);
  const [reserving, setReserving] = useState(false);
  const navigate = useNavigate();

  const genreName = book.genres && book.genres.length > 0 ? book.genres[0].name : 'Khác';
  const genreColor = getGenreColor(genreName);
  const pillCls = GENRE_COLOR_MAP[genreColor] ?? 'bg-slate-100 text-slate-600';
  const authorName = book.authors && book.authors.length > 0 ? book.authors.map((a) => a.name).join(', ') : 'Chưa rõ tác giả';
  const copiesStr = `${book.availableCopies}/${book.totalCopies} cuốn`;
  const isAvailable = book.availableCopies > 0;
  const status: 'available' | 'checked_out' | 'borrowing' = isBorrowing
    ? 'borrowing'
    : (isAvailable ? 'available' : 'checked_out');

  const handleBorrow = async () => {
    if (!book) return;
    setBorrowing(true);
    try {
      const loanData = await borrowBook(book.id);

      if (loanData.sePayCheckout === null || loanData.sePayCheckout === undefined) {
        // Nhánh 1: User có gói Subscription hợp lệ → mượn ngay, không cần thanh toán
        toast.success('Mượn sách thành công theo gói hội viên!');
        // Giữ nguyên trang để user tiếp tục lướt sách, KHÔNG chuyển hướng
        onClose();
      } else {
        // Nhánh 2: User mượn lẻ → cần thanh toán → mở CheckoutModal
        // TUYỆT ĐỐI KHÔNG toast success ở đây
        onClose();
        onBorrowPaid(loanData.id, loanData.sePayCheckout, book.title);
      }
    } catch (err: any) {
      console.error('Lỗi khi mượn sách:', err);
      const serverMessage = err.message || err.response?.data?.message;
      if (serverMessage) {
        toast.error(serverMessage);
      } else {
        toast.error('Mượn sách thất bại! Sách có thể đã có người khác giữ chỗ trước. Vui lòng thử lại.');
      }
    } finally {
      setBorrowing(false);
    }
  };

  const handleReserve = async () => {
    if (!book) return;
    // FREE user: show upgrade prompt
    if (!isVip) {
      toast(
        (
          <span>
            Tính năng đặt trước chỉ dành cho hội viên VIP. 
            <button
              type="button"
              onClick={() => { navigate('/dashboard/subscriptions'); }}
              style={{ color: '#6366f1', fontWeight: 700, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              Nâng cấp ngay →
            </button>
          </span>
        ),
        { icon: '👑', duration: 5000 }
      );
      return;
    }
    setReserving(true);
    try {
      await reserveBook(book.id);
      toast.success(`Đã đặt trước “${book.title}” thành công! Bạn sẽ được thông báo khi sách về quầy.`);
      onClose();
    } catch (err: any) {
      const serverMessage = err?.response?.data?.message || err?.message;
      toast.error(serverMessage || 'Không thể đặt trước. Vui lòng thử lại.');
    } finally {
      setReserving(false);
    }
  };

  return (
    <Dialog
      open={Boolean(book)}
      onClose={onClose}
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
        <div className="relative">
          <IconButton
            onClick={onClose}
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

          {/* Cover band */}
          <div className="flex gap-5 p-5 pb-4 bg-gradient-to-br from-indigo-50 to-violet-50 border-b border-slate-100">
            <div className="w-24 h-36 rounded-xl overflow-hidden shrink-0 shadow-md bg-slate-100">
              <BookCover
                src={book.coverImageUrl}
                isbn={book.isbn}
                alt={book.title}
                className="w-full h-full object-cover"
                fallbackSeed={book.isbn || book.id}
                title={book.title}
                author={authorName}
                genreColor={genreColor}
              />
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${pillCls}`}>
                {genreName}
              </span>
              <h2 className="text-lg font-bold text-slate-800 mt-2 leading-snug">{book.title}</h2>
              <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                <UserIcon size={13} />
                {authorName}
              </p>
              <div className="flex items-center gap-2 mt-3">
                <StatusBadge status={status} />
                <span className="text-xs text-slate-400">{copiesStr}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">ISBN: {book.isbn}</p>
            </div>
          </div>

          {/* Description + Actions */}
          <div className="p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">About this book</h3>
            <p className="text-sm text-slate-600 leading-relaxed max-h-48 overflow-y-auto pr-1">
              {book.description || 'Chưa có mô tả chi tiết cho cuốn sách này.'}
            </p>

            <div className="flex gap-3 mt-6">
              {isBorrowing ? (
                <button
                  type="button"
                  disabled
                  className="flex-1 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm font-semibold cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <CheckCircle size={15} weight="fill" className="text-indigo-600" />
                  Bạn đang mượn sách này
                </button>
              ) : isAvailable ? (
                <>
                  <button
                    type="button"
                    onClick={handleBorrow}
                    disabled={borrowing}
                    className="flex-1 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {borrowing ? (
                      <CircleNotch size={15} className="animate-spin" />
                    ) : (
                      <BookOpen size={15} />
                    )}
                    {borrowing ? 'Borrowing...' : 'Borrow Now'}
                  </button>
                  <button
                    type="button"
                    onClick={onToggleFavorite}
                    className={`flex-1 h-10 rounded-xl border-2 text-sm font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                      isFavorite 
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 hover:bg-indigo-100' 
                        : 'border-slate-200 text-slate-600 hover:border-indigo-400 hover:text-indigo-600'
                    }`}
                  >
                    <BookmarkSimple size={15} weight={isFavorite ? 'fill' : 'regular'} />
                    {isFavorite ? 'Saved' : 'Save'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleReserve}
                    disabled={reserving}
                    className={`flex-1 h-10 rounded-xl text-sm font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed ${
                      isVip
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        : 'bg-amber-500 hover:bg-amber-600 text-white'
                    }`}
                  >
                    {reserving ? (
                      <CircleNotch size={15} className="animate-spin" />
                    ) : (
                      <CalendarCheck size={15} />
                    )}
                    {reserving ? 'Đang đặt...' : isVip ? 'Reserve' : 'Reserve (VIP only)'}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="h-10 px-5 rounded-xl border-2 border-slate-200 text-slate-500 text-sm font-medium hover:border-slate-300 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Pagination Component ───────────────────────────────────────────────────
function Pagination({
  current,
  total,
  onChange,
}: {
  current: number;
  total: number;
  onChange: (page: number) => void;
}) {
  if (total <= 1) return null;

  const btnCls = (active: boolean, disabled = false) => [
    'w-9 h-9 rounded-lg flex items-center justify-center text-xs font-semibold border transition-all duration-150',
    active ? 'bg-indigo-600 border-indigo-600 text-white' : '',
    !active && !disabled ? 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 cursor-pointer shadow-sm' : '',
    disabled ? 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed' : '',
  ].filter(Boolean).join(' ');

  const pages = [];
  for (let i = 1; i <= total; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-1.5 mt-8 pb-4">
      <button
        className={btnCls(false, current === 1)}
        onClick={() => onChange(current - 1)}
        disabled={current === 1}
      >
        Trước
      </button>
      {pages.map((p) => (
        <button
          key={p}
          className={btnCls(p === current)}
          onClick={() => onChange(p)}
        >
          {p}
        </button>
      ))}
      <button
        className={btnCls(false, current === total)}
        onClick={() => onChange(current + 1)}
        disabled={current === total}
      >
        Sau
      </button>
    </div>
  );
}

// ─── Page Component ──────────────────────────────────────────────────────────
export default function DashboardBrowseBooksPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const contentRef = useRef<HTMLDivElement>(null);
  const [books, setBooks] = useState<BookResponse[]>([]);
  const [genresList, setGenresList] = useState<GenreResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  // VIP status
  const [isVip, setIsVip] = useState(false);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeGenreId, setActiveGenreId] = useState<number | null>(null);
  const [availability, setAvailability] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const [selected, setSelected] = useState<BookResponse | null>(null);
  const [filterOpen, setFilterOpen] = useState(false); // mobile filter drawer
  const [borrowingBookIds, setBorrowingBookIds] = useState<Set<number>>(new Set());

  // State cho CheckoutModal (mượn lẻ trả tiền)
  const [checkoutLoanId, setCheckoutLoanId] = useState<number | null>(null);
  const [checkoutSePayData, setCheckoutSePayData] = useState<SePayCheckout | null>(null);
  const [checkoutBookTitle, setCheckoutBookTitle] = useState<string>('');

  // State for user favorites
  const [favoriteBookIds, setFavoriteBookIds] = useState<Set<number>>(new Set());

  // Fetch favorites
  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const favs = await getMyFavorites();
        setFavoriteBookIds(new Set(favs.map(b => b.id)));
      } catch (err) {
        console.error('Lỗi khi lấy danh sách yêu thích:', err);
      }
    };
    fetchFavorites();
  }, []);

  // Fetch VIP status
  useEffect(() => {
    if (!user) return;
    getActiveSubscription(user.id)
      .then((sub) => {
        // Subscription is valid if status is active/valid and not expired
        if (sub && (sub.isActive || sub.isValid)) {
          const now = new Date();
          const endDate = sub.endDate ? new Date(sub.endDate) : null;
          setIsVip(!endDate || endDate > now);
        } else {
          setIsVip(false);
        }
      })
      .catch(() => setIsVip(false));
  }, [user]);

  const handleToggleFavorite = async (bookId: number) => {
    try {
      const isFav = await toggleFavorite(bookId);
      if (isFav) {
        toast.success('Đã thêm vào danh sách yêu thích!');
      } else {
        toast.success('Đã xóa khỏi danh sách yêu thích.');
      }
      setFavoriteBookIds((prev) => {
        const next = new Set(prev);
        if (isFav) {
          next.add(bookId);
        } else {
          next.delete(bookId);
        }
        return next;
      });
    } catch (err) {
      toast.error('Không thể cập nhật danh sách yêu thích.');
    }
  };

  // Fetch active borrowing loans for current user to block duplicate borrowing in UI
  useEffect(() => {
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
  }, [refreshTrigger]);

  // Debounce search input to avoid hammering backend
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 450);
    return () => clearTimeout(timer);
  }, [search]);

  // Load genres list on mount
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const data = await getGenres();
        setGenresList(data);
      } catch (err) {
        console.error('Failed to fetch genres:', err);
      }
    };
    fetchGenres();
  }, []);

  // Reset page to 1 on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, activeGenreId, availability, sortBy]);

  // Scroll to top when page or filters change
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage, activeGenreId, debouncedSearch, availability, sortBy]);

  // Load books
  useEffect(() => {
    const fetchBooks = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let apiSortBy = 'createdAt';
        let apiSortDirection = 'DESC';
        if (sortBy === 'az') {
          apiSortBy = 'title';
          apiSortDirection = 'ASC';
        } else if (sortBy === 'za') {
          apiSortBy = 'title';
          apiSortDirection = 'DESC';
        }

        const data = await getBooks({
          searchTerm: debouncedSearch || undefined,
          genreId: activeGenreId || undefined,
          availableOnly: availability === 'available' ? true : undefined,
          checkedOutOnly: availability === 'checked_out' ? true : undefined,
          page: currentPage - 1,
          size: 15, // fitting 5 columns perfectly (3 rows of 5 cards)
          sortBy: apiSortBy,
          sortDirection: apiSortDirection,
        });

        setBooks(data.content);
        setTotalPages(data.totalPages);
        setTotalElements(data.totalElements);
      } catch (err: any) {
        setError(err.message || 'Không thể tải danh sách sách.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBooks();
  }, [debouncedSearch, activeGenreId, availability, sortBy, currentPage, refreshTrigger]);

  // Sidebar panel (shared between desktop and mobile drawer)
  const FilterPanel = () => {
    const displayGenres = [
      { id: null, name: 'Tất cả thể loại' },
      ...genresList,
    ];

    return (
      <div className="flex flex-col gap-6">
        {/* Genres */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Genres</h3>
          <ul className="flex flex-col gap-0.5">
            {displayGenres.map((g) => {
              const isActive = g.id === activeGenreId;
              return (
                <li key={g.id ?? 'all'}>
                  <button
                    type="button"
                    onClick={() => { setActiveGenreId(g.id); setFilterOpen(false); }}
                    className={[
                      'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 cursor-pointer text-left',
                      isActive
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-700',
                    ].join(' ')}
                  >
                    <span className={`w-2 h-2 rounded-full border shrink-0 ${isActive ? 'bg-white border-white' : 'border-slate-300'}`} />
                    {g.name}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Availability */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Availability</h3>
          <div className="flex flex-col gap-2">
            {AVAIL_OPTIONS.map(({ value, label }) => {
              const checked = availability === value;
              return (
                <label key={value} className="flex items-center gap-2.5 cursor-pointer group">
                  <div
                    className={[
                      'w-4 h-4 rounded border-2 flex items-center justify-center transition-colors duration-150',
                      checked
                        ? 'bg-indigo-600 border-indigo-600'
                        : 'border-slate-300 group-hover:border-indigo-400',
                    ].join(' ')}
                    onClick={() => setAvailability(value)}
                  >
                    {checked && <CheckCircle size={10} weight="fill" color="white" />}
                  </div>
                  <span
                    className={`text-sm cursor-pointer ${checked ? 'text-indigo-700 font-semibold' : 'text-slate-600'}`}
                    onClick={() => setAvailability(value)}
                  >
                    {label}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout pageTitle="Browse Books">
      <div className="flex flex-col h-full overflow-hidden">

        {/* ── Page header ─────────────────────────────────────────────────── */}
        <div className="px-6 py-6 md:px-8 border-b border-slate-100 bg-white">
          <h1 className="text-2xl font-extrabold text-slate-800">
            Browse Our <span className="text-indigo-600">Collection</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Discover thousands of books across all genres
          </p>
        </div>

        {/* ── Body ────────────────────────────────────────────────────────── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* Desktop filter sidebar */}
          <aside className="hidden lg:flex flex-col w-56 xl:w-64 shrink-0 bg-white border-r border-slate-100 overflow-y-auto">
            <div className="p-5">
              <FilterPanel />
            </div>
          </aside>

          {/* Mobile filter drawer */}
          <AnimatePresence>
            {filterOpen && (
              <>
                <motion.div
                  key="filter-backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/30 z-40 lg:hidden"
                  onClick={() => setFilterOpen(false)}
                />
                <motion.div
                  key="filter-drawer"
                  initial={{ x: -280 }}
                  animate={{ x: 0 }}
                  exit={{ x: -280 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                  className="fixed top-0 left-0 h-full w-72 bg-white z-50 overflow-y-auto shadow-2xl lg:hidden"
                >
                  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                    <span className="font-bold text-slate-800">Filters</span>
                    <button
                      type="button"
                      onClick={() => setFilterOpen(false)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="p-5">
                    <FilterPanel />
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* ── Main content ─────────────────────────────────────────────── */}
          <div ref={contentRef} className="flex-1 flex flex-col min-w-0 overflow-y-auto">

            {/* Search + sort + filter bar */}
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-100 px-5 md:px-6 py-3 flex items-center gap-3">
              {/* Mobile filter toggle */}
              <button
                type="button"
                onClick={() => setFilterOpen(true)}
                className="lg:hidden flex items-center gap-1.5 px-3 h-9 rounded-lg border border-slate-200 text-sm text-slate-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors cursor-pointer shrink-0"
              >
                <Funnel size={14} />
                Filters
              </button>

              {/* Search */}
              <div className="relative flex-1">
                <MagnifyingGlass
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title, author, or category…"
                  className="w-full h-9 pl-9 pr-9 text-sm bg-slate-50 border border-slate-200 rounded-lg
                    placeholder:text-slate-400 text-slate-700
                    focus:outline-none focus:ring-2 focus:ring-indigo-300/50 focus:border-indigo-400
                    transition-all duration-150"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Sort */}
              <div className="flex items-center gap-1.5 shrink-0">
                <SortAscending size={15} className="text-slate-400 hidden sm:block" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-9 pl-3 pr-8 text-sm bg-white border border-slate-200 rounded-lg text-slate-600
                    focus:outline-none focus:ring-2 focus:ring-indigo-300/50 focus:border-indigo-400
                    cursor-pointer transition-all duration-150 appearance-none"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Results summary */}
            <div className="px-5 md:px-6 pt-4 pb-1 flex items-center gap-2">
              <span className="text-sm text-slate-500">
                <span className="font-semibold text-slate-700">{totalElements}</span> books found
              </span>
              {(activeGenreId !== null || availability !== 'all' || search) && (
                <button
                  type="button"
                  onClick={() => { setSearch(''); setActiveGenreId(null); setAvailability('all'); }}
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 cursor-pointer underline underline-offset-2"
                >
                  <XCircle size={12} />
                  Clear filters
                </button>
              )}
            </div>

            {/* Card grid & list container */}
            <div className="px-5 md:px-6 py-4 pb-8 min-h-[500px]">
              {isLoading ? (
                /* Loading Skeletons for modern premium feel */
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {Array.from({ length: 10 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-2xl border border-slate-100 overflow-hidden flex flex-col animate-pulse"
                    >
                      <div className="w-full aspect-[2/3] bg-slate-100" />
                      <div className="p-4 flex flex-col gap-2 flex-1">
                        <div className="w-12 h-3.5 bg-slate-150 rounded-full" />
                        <div className="w-3/4 h-5 bg-slate-200 rounded" />
                        <div className="w-1/2 h-4 bg-slate-100 rounded" />
                        <div className="w-full h-8 bg-indigo-50 rounded mt-auto" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                /* Error state representation */
                <div className="flex flex-col items-center justify-center py-20 text-center text-red-500">
                  <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
                    <XCircle size={28} className="text-red-500" />
                  </div>
                  <p className="font-semibold text-lg">Đã xảy ra lỗi</p>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              ) : books.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {books.map((book) => (
                      <BookCard
                        key={book.id}
                        book={book}
                        onSelect={() => setSelected(book)}
                        isBorrowing={borrowingBookIds.has(book.id)}
                        isFavorite={favoriteBookIds.has(book.id)}
                        onToggleFavorite={() => handleToggleFavorite(book.id)}
                      />
                    ))}
                  </div>

                  <Pagination
                    current={currentPage}
                    total={totalPages}
                    onChange={(p) => setCurrentPage(p)}
                  />
                </>
              ) : (
                /* Empty state representation */
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                    <BookOpen size={28} className="text-slate-400" />
                  </div>
                  <p className="font-semibold text-slate-700">No books found</p>
                  <p className="text-sm text-slate-400 mt-1">Try adjusting your search or filters</p>
                  <button
                    type="button"
                    onClick={() => { setSearch(''); setActiveGenreId(null); setAvailability('all'); }}
                    className="mt-4 px-4 py-2 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer"
                  >
                    Reset filters
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Book detail dialog */}
      <BookDetailDialog
        book={selected}
        onClose={() => setSelected(null)}
        onBorrowPaid={(loanId, sePayCheckout, bookTitle) => {
          setCheckoutLoanId(loanId);
          setCheckoutSePayData(sePayCheckout);
          setCheckoutBookTitle(bookTitle);
        }}
        isBorrowing={selected ? borrowingBookIds.has(selected.id) : false}
        isFavorite={selected ? favoriteBookIds.has(selected.id) : false}
        onToggleFavorite={() => selected && handleToggleFavorite(selected.id)}
        isVip={isVip}
      />

      {/* Checkout Modal — hiện lên khi mượn lẻ cần thanh toán SePay */}
      {checkoutLoanId !== null && checkoutSePayData !== null && (
        <CheckoutModal
          loanId={checkoutLoanId}
          bookTitle={checkoutBookTitle}
          sePayCheckout={checkoutSePayData}
          onClose={async (reason) => {
            if (reason === 'expired') {
              toast.error('Hết thời gian giữ chỗ, đơn mượn sách đã bị tự động hủy!');
            } else if (reason === 'closed' && checkoutLoanId !== null) {
              try {
                await cancelPendingLoan(checkoutLoanId);
                toast('Đã hủy yêu cầu mượn sách.', { icon: 'ℹ️' });
              } catch (err) {
                console.error("Lỗi khi hủy đơn mượn:", err);
              }
            }
            setCheckoutLoanId(null);
            setCheckoutSePayData(null);
            setCheckoutBookTitle('');
            setRefreshTrigger((prev) => prev + 1);
          }}
          onSuccess={() => {
            toast.success('🎉 Thanh toán thành công! Ra quầy thư viện để nhận sách nhé.', { duration: 5000 });
            setCheckoutLoanId(null);
            setCheckoutSePayData(null);
            setCheckoutBookTitle('');
            setRefreshTrigger((prev) => prev + 1);
            navigate('/dashboard/loans');
          }}
        />
      )}
    </DashboardLayout>
  );
}
