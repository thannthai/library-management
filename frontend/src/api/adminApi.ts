/**
 * adminApi.ts
 * ─────────────────────────────────────────────────────────────
 * Tất cả API calls dành riêng cho Admin/Thủ thư.
 * Tất cả request đều tự động đính kèm cookie JWT qua withCredentials.
 */

import axiosClient from './axiosClient';

// ─── Types ────────────────────────────────────────────────────────────────────

export type LoanStatus =
  | 'PENDING_PAYMENT'
  | 'PENDING_PICKUP'
  | 'CHECKED_OUT'
  | 'OVERDUE'
  | 'RETURNED'
  | 'CANCELED'
  | 'ALL';

export interface AdminLoanItem {
  id: number;
  userId: number;
  userEmail: string;
  bookId: number;
  bookTitle: string;
  coverImageUrl: string;
  isbn: string;
  authorName: string;
  type: 'NORMAL' | 'SHORT_TERM';
  status: LoanStatus;
  checkoutDate: string | null;
  dueDate: string | null;
  returnDate: string | null;
  renewalCount: number;
  paymentStatus: string;
  fines: AdminFineItem[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminFineItem {
  id: number;
  amount: number;
  amountPaid: number;
  status: string;
  reason: string;
  type: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface AdminStats {
  totalLoans: number;
  pendingPayment: number;
  pendingPickup: number;
  checkedOut: number;
  overdue: number;
  returned: number;
  totalBooks: number;
  totalRevenue?: number;
  monthlyRevenue?: number;
}

export interface ReturnLoanResult {
  loan: AdminLoanItem;
  fineAmount: number;
  hasFinePending: boolean;
}

// ─── API Functions ────────────────────────────────────────────────────────────

interface ApiResponse<T> {
  message: string;
  status: boolean;
  data: T;
}

/**
 * Lấy danh sách tất cả đơn mượn (có thể lọc theo status).
 */
export const getAdminLoans = async (
  status: LoanStatus | null = null,
  page = 0,
  size = 20,
): Promise<PageResponse<AdminLoanItem>> => {
  const params: Record<string, string | number> = { page, size };
  if (status && status !== 'ALL') params.status = status;

  const { data } = await axiosClient.get<ApiResponse<PageResponse<AdminLoanItem>>>(
    '/admin/book-loans',
    { params },
  );
  return data.data;
};

/**
 * Admin xác nhận giao sách tại quầy (PENDING_PICKUP → CHECKED_OUT).
 */
export const pickupLoan = async (loanId: number): Promise<AdminLoanItem> => {
  const { data } = await axiosClient.post<ApiResponse<AdminLoanItem>>(
    `/admin/book-loans/${loanId}/pickup`,
  );
  return data.data;
};

/**
 * Admin nhận trả sách tại quầy (CHECKED_OUT/OVERDUE → RETURNED).
 */
export const returnLoan = async (loanId: number): Promise<ReturnLoanResult> => {
  const { data } = await axiosClient.post<ApiResponse<ReturnLoanResult>>(
    `/admin/book-loans/${loanId}/return`,
  );
  return data.data;
};

/**
 * Thống kê nhanh cho Admin Dashboard.
 */
export const getAdminStats = async (): Promise<AdminStats> => {
  const { data } = await axiosClient.get<ApiResponse<AdminStats>>(
    '/admin/dashboard/stats',
  );
  return data.data;
};
