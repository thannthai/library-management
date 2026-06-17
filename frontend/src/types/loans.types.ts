import type { SePayCheckout } from './subscription.types';

export interface BookLoanResponse {
  id: number;
  userId: number;
  userEmail: string;
  bookId: number;
  bookTitle: string;
  coverImageUrl: string | null;
  isbn: string | null;
  authorName: string | null;
  type: 'SHORT_TERM' | 'NORMAL';
  status: 'PENDING_PAYMENT' | 'PENDING_PICKUP' | 'CHECKED_OUT' | 'RETURNED' | 'OVERDUE' | 'CANCELED';
  checkoutDate: string;
  dueDate: string;
  returnDate: string | null;
  renewalCount: number;
  maxRenewals: number;
  notes: string | null;
  isOverdue: boolean;
  overdueDays: number;
  paymentId: number | null;
  paymentTransactionId: number | null;
  txnRef: string | null;
  paymentAmount: number | null;
  paymentStatus: string | null;
  sePayCheckout: SePayCheckout | null;
  createdAt: string;
  updatedAt: string;
  // Rating fields — null until user rates the returned book
  rating: number | null;
  comment: string | null;
  ratedAt: string | null;
}
