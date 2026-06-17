import axiosClient from './axiosClient';
import type { BookResponse } from '../types/books.types';

interface ApiResponse<T> {
  message: string;
  status: boolean;
  data: T;
}

export const getMyFavorites = async (): Promise<BookResponse[]> => {
  const { data } = await axiosClient.get<ApiResponse<BookResponse[]>>('/favorites/me');
  return data.data;
};

export const toggleFavorite = async (bookId: number): Promise<boolean> => {
  const { data } = await axiosClient.post<ApiResponse<boolean>>(`/favorites/books/${bookId}`);
  return data.data;
};

export const removeFavorite = async (bookId: number): Promise<void> => {
  await axiosClient.delete<ApiResponse<void>>(`/favorites/books/${bookId}`);
};

export const checkFavoriteStatus = async (bookId: number): Promise<boolean> => {
  const { data } = await axiosClient.get<ApiResponse<boolean>>(`/favorites/books/${bookId}/status`);
  return data.data;
};
