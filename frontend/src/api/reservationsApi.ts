import axiosClient from './axiosClient';

export interface BookReservationResponse {
  id: number;
  userId: number;
  bookId: number;
  bookTitle: string;
  coverImageUrl?: string;
  isbn?: string;
  authorName?: string;
  reservedDate: string;
  status: 'PENDING' | 'FULFILLED' | 'EXPIRED' | 'CANCELED';
  priorityPosition: number;
  estimatedWaitDays?: number;
}

interface ApiResponse<T> {
  message: string;
  status: boolean;
  data: T;
}

export const getMyReservations = async (): Promise<BookReservationResponse[]> => {
  const { data } = await axiosClient.get<ApiResponse<BookReservationResponse[]>>('/reservations/me');
  return data.data;
};

export const reserveBook = async (bookId: number): Promise<BookReservationResponse> => {
  const { data } = await axiosClient.post<ApiResponse<BookReservationResponse>>(`/reservations/books/${bookId}`);
  return data.data;
};

export const cancelReservation = async (reservationId: number): Promise<void> => {
  await axiosClient.delete<ApiResponse<void>>(`/reservations/${reservationId}`);
};
