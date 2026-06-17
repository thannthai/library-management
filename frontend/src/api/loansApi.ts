import axiosClient from './axiosClient';
import type { BookLoanResponse } from '../types/loans.types';
import type { PageResponse } from '../types/books.types';
import type { SePayCheckout } from '../types/subscription.types';

// Spring Boot standard wrapper response interface
interface ApiResponse<T> {
  message: string;
  status: boolean;
  data: T;
}

/**
 * Fetch current user's loans.
 */
export const getMyLoans = async (
  status?: string,
  page = 0,
  size = 10
): Promise<PageResponse<BookLoanResponse>> => {
  const { data } = await axiosClient.get<ApiResponse<PageResponse<BookLoanResponse>>>('/loans/my', {
    params: {
      status: status === 'all' ? undefined : status,
      page,
      size,
    },
  });
  return data.data;
};

/**
 * Renew a book loan.
 */
export const renewBookLoan = async (bookLoanId: number): Promise<BookLoanResponse> => {
  const { data } = await axiosClient.post<ApiResponse<BookLoanResponse>>('/loans/renew', null, {
    params: { bookLoanId },
  });
  return data.data;
};

/**
 * Borrow a book.
 */
export const borrowBook = async (bookId: number): Promise<BookLoanResponse> => {
  const { data } = await axiosClient.post<ApiResponse<BookLoanResponse>>('/loans/borrow', null, {
    params: { bookId },
  });
  return data.data;
};

/**
 * Get (or regenerate) the SePay checkout URL for a PENDING_PAYMENT loan.
 * Called when user clicks "Pay Now" on My Loans page.
 */
export const getLoanPaymentUrl = async (loanId: number): Promise<SePayCheckout> => {
  const { data } = await axiosClient.get<ApiResponse<SePayCheckout>>(`/loans/${loanId}/payment-url`);
  return data.data;
};

/**
 * Get a single BookLoan by ID.
 * Used by CheckoutModal short-polling to detect CHECKED_OUT status.
 */
export const getBookLoanById = async (loanId: number): Promise<BookLoanResponse> => {
  const { data } = await axiosClient.get<ApiResponse<BookLoanResponse>>(`/loans/${loanId}`);
  return data.data;
};

/**
 * Cancel a pending book loan.
 */
export const cancelPendingLoan = async (loanId: number): Promise<void> => {
  await axiosClient.post<ApiResponse<void>>(`/loans/${loanId}/cancel`);
};

/**
 * Rate a returned book loan (1-5 stars + optional comment).
 * Can only be called once per loan (after RETURNED status).
 */
export const rateBookLoan = async (
  loanId: number,
  rating: number,
  comment?: string
): Promise<BookLoanResponse> => {
  const { data } = await axiosClient.put<ApiResponse<BookLoanResponse>>(`/loans/${loanId}/rate`, {
    rating,
    comment: comment ?? null,
  });
  return data.data;
};
