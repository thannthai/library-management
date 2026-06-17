import { useState, useEffect } from 'react';

import {
  CheckCircle,
  Books,
  Calendar,
  CircleNotch,
  ArrowRight,
  X,
  ArrowCounterClockwise,
  ListChecks,
  User as UserIcon,
  CopySimple,
  CurrencyCircleDollar,
} from '@phosphor-icons/react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import { toast } from 'react-hot-toast';

import DashboardLayout from '../../layouts/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { getMyLoans, renewBookLoan, getLoanPaymentUrl } from '../../api/loansApi';
import type { BookLoanResponse } from '../../types/loans.types';
import type { SePayCheckout } from '../../types/subscription.types';
import CheckoutModal from '../../components/CheckoutModal';

// ─── Deterministic Genre Color Resolver ──────────────────────────────────────
const getGenreColor = (title: string): string => {
  const colors = ['violet', 'orange', 'blue', 'amber', 'yellow', 'rose'];
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

// ─── Google Books Cover Builder & Fallback ───────────────────────────────────
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
  return url;
};

const isGoogleBooksUrl = (url: string | undefined): boolean =>
  !!url && (url.includes('google.com/books') || url.includes('books.google.com'));

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
    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} p-3 flex flex-col justify-between text-white select-none rounded-xl`}>
      <div className="flex flex-col gap-1">
        <span className="text-[7px] font-bold tracking-widest uppercase opacity-75">BookNest</span>
        <h4 className="font-extrabold text-[10px] leading-snug line-clamp-3 text-white" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.15)' }}>
          {title}
        </h4>
      </div>
      <div className="border-t border-white/20 pt-1">
        <p className="text-[8px] font-semibold opacity-90 line-clamp-1 text-white">{author}</p>
      </div>
    </div>
  );
}

function LoanBookCover({
  src,
  isbn,
  alt,
  className,
  title,
  author,
}: {
  src: string | null;
  isbn: string | null;
  alt: string;
  className: string;
  title: string;
  author: string;
}) {
  const isGoogle = isGoogleBooksUrl(src || undefined);
  const genreColor = getGenreColor(title);

  type ImgStage = 'zoom2' | 'zoom1' | 'openlib' | 'css';
  const initialStage = (): ImgStage => {
    if (src) return 'zoom2';
    if (isbn) return 'openlib';
    return 'css';
  };

  const [stage, setStage] = useState<ImgStage>(initialStage);
  const [imgVisible, setImgVisible] = useState(false);

  useEffect(() => {
    setStage(initialStage());
    setImgVisible(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, isbn]);

  const advance = () => {
    setImgVisible(false);
    setStage((prev) => {
      if (prev === 'zoom2' && isGoogle) return 'zoom1';
      if ((prev === 'zoom2' || prev === 'zoom1') && isbn) return 'openlib';
      return 'css';
    });
  };

  // Fallback timeout: if an image stage hangs for more than 3 seconds, force-advance to next stage
  useEffect(() => {
    if (stage === 'css' || imgVisible) return;
    const timer = setTimeout(() => {
      console.log(`LoanBookCover: Stage ${stage} timed out after 3s, advancing...`);
      advance();
    }, 3000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, imgVisible]);

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
      advance();
      return;
    }
    setImgVisible(true);
  };

  const url: string | undefined = (() => {
    switch (stage) {
      case 'zoom2': return isGoogle ? getGoogleBooksUrl(src || undefined, 2) : (src || undefined);
      case 'zoom1': return isGoogle ? getGoogleBooksUrl(src || undefined, 1) : undefined;
      case 'openlib': return isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg` : undefined;
      default:      return undefined;
    }
  })();

  if (stage === 'css' || !url) {
    return <CSSBookCover title={title} author={author} genreColor={genreColor} />;
  }

  return (
    <img
      key={stage}
      src={url}
      alt={alt}
      className={`${className} transition-opacity duration-200 ${imgVisible ? 'opacity-100' : 'opacity-0'}`}
      loading="lazy"
      onLoad={handleLoad}
      onError={advance}
    />
  );
}

// ─── Format Helpers ──────────────────────────────────────────────────────────
const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const getDaysRemaining = (dueDateStr: string | null | undefined) => {
  if (!dueDateStr) return 0;
  const due = new Date(dueDateStr);
  const now = new Date();
  due.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  const diffTime = due.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export default function MyLoansPage() {
  const { user } = useAuth();
  const [loans, setLoans] = useState<BookLoanResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tabs status option matching user mock: All, Active, Overdue, Returned, Lost, Damaged
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'overdue' | 'returned' | 'lost' | 'damaged'>('all');

  // Action states
  const [actionLoanId, setActionLoanId] = useState<number | null>(null);

  // State mở CheckoutModal để thanh toán SePay ngay trên trang
  const [checkoutLoan, setCheckoutLoan] = useState<{
    id: number;
    bookTitle: string;
    sePayCheckout: SePayCheckout;
    createdAt?: string;
  } | null>(null);

  // Details Modal
  const [selectedLoan, setSelectedLoan] = useState<BookLoanResponse | null>(null);

  const fetchLoans = async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      // Map frontend tab to backend API status string
      let apiStatus: string | undefined = undefined;
      if (activeTab === 'active') apiStatus = 'ACTIVE';
      else if (activeTab === 'overdue') apiStatus = 'OVERDUE';
      else if (activeTab === 'returned') apiStatus = 'RETURNED';
      else if (activeTab === 'lost' || activeTab === 'damaged') {
        // Since backend has no LOST/DAMAGED status, we handle these locally:
        // Set loans to empty for these mockup filter options
        setLoans([]);
        setIsLoading(false);
        return;
      }

      const response = await getMyLoans(apiStatus, 0, 100);
      const filteredLoans = response.content.filter((loan) => loan.status !== 'CANCELED');
      setLoans(filteredLoans);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách sách mượn.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeTab]);

  const handleRenew = async (loanId: number) => {
    if (actionLoanId !== null) return;
    setActionLoanId(loanId);
    try {
      await renewBookLoan(loanId);
      toast.success('Gia hạn sách thành công!');
      await fetchLoans();
    } catch (err: any) {
      toast.error(err.message || 'Không thể gia hạn sách.');
    } finally {
      setActionLoanId(null);
    }
  };

  const handlePayPending = async (loan: BookLoanResponse) => {
    if (actionLoanId !== null) return;
    setActionLoanId(loan.id);

    try {
      // Gọi API để lấy/tạo lại URL thanh toán SePay cho loan này
      const sePayCheckout = await getLoanPaymentUrl(loan.id);
      setCheckoutLoan({
        id: loan.id,
        bookTitle: loan.bookTitle,
        sePayCheckout,
        createdAt: loan.createdAt,
      });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Không thể lấy thông tin thanh toán. Vui lòng thử lại.');
    } finally {
      setActionLoanId(null);
    }
  };

  // Dynamic badge resolver based on paymentStatus and status
  const getBadgeConfig = (loan: BookLoanResponse) => {
    if (loan.paymentStatus === 'PENDING_PAYMENT') {
      return { label: 'Pending Payment', cls: 'bg-amber-500 text-white border-amber-500' };
    }
    if (loan.paymentStatus === 'PAID' && loan.status === 'CHECKED_OUT') {
      return { label: 'Checked Out', cls: 'bg-blue-500 text-white border-blue-500' };
    }
    // Fallback to normal status-based rendering
    switch (loan.status) {
      case 'PENDING_PICKUP':
        return { label: 'Chờ nhận sách', cls: 'bg-indigo-500 text-white border-indigo-500' };
      case 'CHECKED_OUT':
        return { label: 'Checked Out', cls: 'bg-blue-500 text-white border-blue-500' };
      case 'RETURNED':
        return { label: 'Returned', cls: 'bg-emerald-500 text-white border-emerald-500' };
      case 'OVERDUE':
        return { label: 'Overdue', cls: 'bg-rose-500 text-white border-rose-500' };
      case 'PENDING_PAYMENT':
        return { label: 'Pending Payment', cls: 'bg-amber-500 text-white border-amber-500' };
      case 'CANCELED':
        return { label: 'Canceled', cls: 'bg-slate-400 text-white border-slate-400' };
      default:
        return { label: loan.status || '', cls: 'bg-slate-500 text-white border-slate-500' };
    }
  };

  const tabsConfig = [
    { id: 'all', label: 'All' },
    { id: 'active', label: 'Active' },
    { id: 'overdue', label: 'Overdue' },
    { id: 'returned', label: 'Returned' },
    { id: 'lost', label: 'Lost' },
    { id: 'damaged', label: 'Damaged' },
  ] as const;

  return (
    <DashboardLayout pageTitle="My Loans">
      {/* Checkout Modal — hiện lên khi cần thanh toán SePay */}
      {checkoutLoan && (
        <CheckoutModal
          loanId={checkoutLoan.id}
          bookTitle={checkoutLoan.bookTitle}
          sePayCheckout={checkoutLoan.sePayCheckout}
          createdAt={checkoutLoan.createdAt}
          onClose={(reason) => {
            setCheckoutLoan(null);
            if (reason === 'expired') {
              toast.error('Hết thời gian giữ chỗ, đơn mượn sách đã bị tự động hủy!');
              fetchLoans();
            }
          }}
          onSuccess={() => {
            toast.success('🎉 Thanh toán thành công! Ra quầy thư viện để nhận sách nhé.', { duration: 5000 });
            setCheckoutLoan(null);
            fetchLoans();
          }}
        />
      )}

      {/* Book Loan Details Modal */}
      <Dialog
        open={Boolean(selectedLoan)}
        onClose={() => setSelectedLoan(null)}
        maxWidth="sm"
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
          {selectedLoan && (
            <div className="relative">
              <IconButton
                onClick={() => setSelectedLoan(null)}
                size="small"
                sx={{
                  position: 'absolute', top: 12, right: 12, zIndex: 10,
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  backdropFilter: 'blur(4px)',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,1)' },
                }}
              >
                <X size={16} />
              </IconButton>

              {/* Band Cover Header */}
              <div className="flex gap-5 p-6 bg-gradient-to-br from-indigo-50 to-violet-50 border-b border-slate-100">
                <div className="w-20 h-28 rounded-xl overflow-hidden shrink-0 shadow bg-slate-100 relative">
                  <LoanBookCover
                    src={selectedLoan.coverImageUrl}
                    isbn={selectedLoan.isbn}
                    alt={selectedLoan.bookTitle}
                    className="w-full h-full object-cover"
                    title={selectedLoan.bookTitle}
                    author={selectedLoan.authorName || 'Chưa rõ'}
                  />
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${getBadgeConfig(selectedLoan).cls}`}>
                    {getBadgeConfig(selectedLoan).label}
                  </span>
                  <h2 className="text-base font-bold text-slate-800 mt-2 leading-snug truncate">
                    {selectedLoan.bookTitle}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <UserIcon size={12} />
                    {selectedLoan.authorName || 'Chưa rõ tác giả'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">ISBN: {selectedLoan.isbn || 'Chưa có'}</p>
                </div>
              </div>

              {/* Loan Details Body */}
              <div className="p-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Loan Details</h3>
                <div className="grid grid-cols-2 gap-4 text-xs mb-5">
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                    <p className="text-slate-400 font-medium">Checkout Date</p>
                    <p className="font-bold text-slate-700 mt-0.5">{formatDate(selectedLoan.checkoutDate)}</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                    <p className="text-slate-400 font-medium">Due Date</p>
                    <p className="font-bold text-slate-700 mt-0.5">{formatDate(selectedLoan.dueDate)}</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                    <p className="text-slate-400 font-medium">Renewals</p>
                    <p className="font-bold text-slate-700 mt-0.5">{selectedLoan.renewalCount} / {selectedLoan.maxRenewals} times</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                    <p className="text-slate-400 font-medium">Overdue Days</p>
                    <p className="font-bold text-slate-700 mt-0.5">{selectedLoan.overdueDays} ngày</p>
                  </div>
                </div>

                {selectedLoan.notes && (
                  <div className="mb-5">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Notes</h4>
                    <p className="text-xs text-slate-600 bg-amber-50/50 border border-amber-100/50 p-3 rounded-xl leading-relaxed italic">
                      "{selectedLoan.notes}"
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-3 mt-6 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setSelectedLoan(null)}
                    className="px-4 h-9 rounded-xl border border-slate-200 text-slate-500 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Đóng
                  </button>
                  {selectedLoan.paymentStatus === 'PAID' && selectedLoan.status === 'CHECKED_OUT' && selectedLoan.renewalCount < selectedLoan.maxRenewals && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLoan(null);
                        handleRenew(selectedLoan.id);
                      }}
                      className="px-4 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Renew Book
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="max-w-4xl mx-auto px-4 py-8 md:px-6">
        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3.5 mb-8">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
            <Books size={24} weight="fill" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 tracking-tight">
              My Borrowed Books
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 leading-none">
              Manage your book loans, track due dates, and renew books
            </p>
          </div>
        </div>

        {/* ── Navigation Tabs ──────────────────────────────────────────────── */}
        <div className="bg-white border border-slate-100 rounded-2xl p-1.5 flex items-center gap-1.5 mb-8 shadow-sm overflow-x-auto">
          {tabsConfig.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-100'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── Loans Grid/List ─────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <CircleNotch size={32} className="animate-spin text-indigo-600 mb-3" />
            <p className="text-xs text-slate-400">Đang tải danh sách sách mượn...</p>
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 text-center max-w-md mx-auto shadow-sm">
            <p className="text-sm text-rose-600 font-semibold mb-2">Đã xảy ra lỗi</p>
            <p className="text-xs text-rose-500 mb-4">{error}</p>
            <button
              onClick={fetchLoans}
              className="px-4 py-2 text-xs font-semibold text-indigo-600 bg-white border border-indigo-200 rounded-xl hover:bg-indigo-50 transition-all cursor-pointer"
            >
              Thử lại
            </button>
          </div>
        ) : loans.length > 0 ? (
          <div className="flex flex-col gap-5">
            {loans.map((loan) => {
              const hasDates = !!loan.dueDate;
              const daysRemaining = hasDates ? getDaysRemaining(loan.dueDate) : 0;
              const overdue = hasDates && (loan.status === 'OVERDUE' || daysRemaining < 0);
              const nearDue = hasDates && daysRemaining >= 0 && daysRemaining <= 3;

              // Compute warning colors
              let dueColorClass = 'text-slate-600';
              let dueLabelClass = 'text-slate-400';
              let borderClass = 'border-slate-100';
              if (overdue) {
                dueColorClass = 'text-rose-600 font-extrabold';
                dueLabelClass = 'text-rose-500 font-bold';
                borderClass = 'border-rose-100 bg-rose-50/10';
              } else if (nearDue) {
                dueColorClass = 'text-amber-600 font-bold';
                dueLabelClass = 'text-amber-500 font-semibold';
                borderClass = 'border-amber-100 bg-amber-50/10';
              }

              const renewalPct = Math.min((loan.renewalCount / loan.maxRenewals) * 100, 100);

              return (
                <div
                  key={loan.id}
                  className={`bg-white rounded-2xl border ${borderClass} p-5 flex flex-col md:flex-row gap-5 transition-all duration-200 hover:shadow-md hover:scale-[1.01] relative shadow-sm`}
                >
                  {/* Status Badge */}
                  <div className="absolute top-4 left-4 z-10">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${getBadgeConfig(loan).cls}`}>
                      {getBadgeConfig(loan).label}
                    </span>
                  </div>

                  {/* Left Column: Book Cover */}
                  <div className="w-20 h-28 rounded-xl overflow-hidden shrink-0 shadow bg-slate-100 relative mt-3 md:mt-0">
                    <LoanBookCover
                      src={loan.coverImageUrl}
                      isbn={loan.isbn}
                      alt={loan.bookTitle}
                      className="w-full h-full object-cover"
                      title={loan.bookTitle}
                      author={loan.authorName || 'Chưa rõ'}
                    />
                  </div>

                  {/* Middle Column: Book Meta info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between pt-1">
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm leading-snug line-clamp-2">
                        {loan.bookTitle}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <UserIcon size={12} className="shrink-0" />
                        {loan.authorName || 'Chưa rõ tác giả'}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">ISBN: {loan.isbn}</p>
                    </div>

                    {loan.notes && (
                      <div className="mt-3 bg-slate-50/80 border border-slate-100/50 px-3 py-2 rounded-xl text-[10px] text-slate-500 italic max-w-lg">
                        Note: {loan.notes}
                      </div>
                    )}

                    {/* TxnRef box — only visible on PENDING_PAYMENT for SePay simulation */}
                    {loan.paymentStatus === 'PENDING_PAYMENT' && loan.txnRef && (
                      <div className="mt-3 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl max-w-lg">
                        <div className="flex items-center gap-1.5 mb-1">
                          <CurrencyCircleDollar size={11} className="text-amber-600 shrink-0" />
                          <p className="text-[9px] font-bold text-amber-600 uppercase tracking-wider leading-none">Mã thanh toán (SePay Simulation)</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="text-[10px] font-mono font-bold text-amber-800 select-all flex-1 break-all">
                            SEVQR {loan.txnRef}
                          </code>
                          <button
                            type="button"
                            title="Copy to clipboard"
                            onClick={() => {
                              navigator.clipboard.writeText(`SEVQR ${loan.txnRef}`);
                            }}
                            className="shrink-0 w-6 h-6 rounded-lg bg-amber-100 hover:bg-amber-200 flex items-center justify-center text-amber-700 transition-colors cursor-pointer"
                          >
                            <CopySimple size={11} weight="bold" />
                          </button>
                        </div>
                        <p className="text-[8px] text-amber-500 mt-1 leading-snug">Copy vào ô "Nội dung chuyển khoản" khi mô phỏng trên SePay dashboard</p>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Date details, renewal count & actions */}
                  <div className="w-full md:w-64 shrink-0 flex flex-col justify-between gap-4 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-5">
                    <div className="grid grid-cols-2 md:flex md:flex-col gap-2.5">
                      {/* Checkout date */}
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                          <Calendar size={14} />
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none">Checkout Date</p>
                          <p className="text-xs font-semibold text-slate-700 mt-1 leading-none">{formatDate(loan.checkoutDate)}</p>
                        </div>
                      </div>

                      {/* Due date */}
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${overdue ? 'bg-rose-50 text-rose-500' : nearDue ? 'bg-amber-50 text-amber-500' : 'bg-slate-50 text-slate-400'}`}>
                          <Calendar size={14} />
                        </div>
                        <div>
                          <p className={`text-[9px] uppercase tracking-wider leading-none ${dueLabelClass}`}>Due Date</p>
                          <p className={`text-xs mt-1 leading-none ${dueColorClass}`}>
                            {formatDate(loan.dueDate)}
                            {overdue && <span className="text-[9px] ml-1 font-bold">(Quá hạn)</span>}
                            {nearDue && <span className="text-[9px] ml-1 font-bold">(Sắp hết hạn)</span>}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Renewal progress */}
                    <div>
                      <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 mb-1 leading-none uppercase tracking-wider">
                        <span>Renewals</span>
                        <span className="text-slate-600">{loan.renewalCount} / {loan.maxRenewals}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                          style={{ width: `${renewalPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => setSelectedLoan(loan)}
                        className="flex-1 h-8 rounded-lg border border-indigo-200 text-indigo-600 text-[10px] font-bold hover:bg-indigo-50/50 transition-colors cursor-pointer"
                      >
                        Details
                      </button>

                      {loan.paymentStatus === 'PENDING_PAYMENT' ? (
                        <button
                          type="button"
                          onClick={() => handlePayPending(loan)}
                          disabled={actionLoanId !== null}
                          className="flex-1 h-8 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-sm shadow-amber-100"
                        >
                          {actionLoanId === loan.id ? (
                            <CircleNotch size={12} className="animate-spin" />
                          ) : (
                            <>
                              Pay Now
                              <ArrowRight size={10} weight="bold" />
                            </>
                          )}
                        </button>
                      ) : (loan.paymentStatus === 'PAID' && loan.status === 'CHECKED_OUT') ? (
                        <button
                          type="button"
                          onClick={() => handleRenew(loan.id)}
                          disabled={actionLoanId !== null || loan.renewalCount >= loan.maxRenewals}
                          className={`flex-1 h-8 rounded-lg text-white text-[10px] font-bold transition-colors flex items-center justify-center gap-1 shadow-sm ${
                            loan.renewalCount >= loan.maxRenewals
                              ? 'bg-slate-200 border-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                              : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100 cursor-pointer'
                          }`}
                        >
                          {actionLoanId === loan.id ? (
                            <CircleNotch size={12} className="animate-spin" />
                          ) : (
                            <>
                              <ArrowCounterClockwise size={11} weight="bold" />
                              Renew
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="flex-1 h-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 text-[10px] font-bold cursor-not-allowed flex items-center justify-center gap-1"
                        >
                          <CheckCircle size={12} weight="fill" className="text-slate-300" />
                          Done
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── Empty State Representation ──────────────────────────────────── */
          <div className="flex flex-col items-center justify-center py-24 text-center bg-white border border-slate-100 rounded-3xl p-8 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 mb-4 shadow-inner">
              <ListChecks size={28} />
            </div>
            <p className="font-bold text-slate-800 text-sm">No borrowed books found</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Thư mục trống. Bạn chưa có lượt mượn sách nào tương ứng với bộ lọc này.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
