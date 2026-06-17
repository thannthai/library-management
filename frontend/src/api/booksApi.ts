import axiosClient from './axiosClient';
import type { BookSearchRequest, BookResponse, GenreResponse, PageResponse } from '../types/books.types';

export const getBooks = async (params: BookSearchRequest): Promise<PageResponse<BookResponse>> => {
  const { data } = await axiosClient.get<{ data: PageResponse<BookResponse> }>('/books', { params });
  return data.data;
};

export const getGenres = async (): Promise<GenreResponse[]> => {
  const { data } = await axiosClient.get<{ data: GenreResponse[] }>('/genres');
  return data.data;
};

export const createBook = async (bookData: any): Promise<BookResponse> => {
  const { data } = await axiosClient.post<{ data: BookResponse }>('/books', bookData);
  return data.data;
};

export const updateBook = async (id: number, bookData: any): Promise<BookResponse> => {
  const { data } = await axiosClient.put<{ data: BookResponse }>(`/books/${id}`, bookData);
  return data.data;
};

export const deleteBook = async (id: number): Promise<void> => {
  await axiosClient.delete(`/books/${id}`);
};

export const getAuthors = async (): Promise<any[]> => {
  const { data } = await axiosClient.get<{ data: any[] }>('/authors');
  return data.data;
};

export const getPublishers = async (): Promise<any[]> => {
  const { data } = await axiosClient.get<{ data: any[] }>('/publishers');
  return data.data;
};

export const createAuthor = async (author: { name: string }): Promise<any> => {
  const { data } = await axiosClient.post<{ data: any }>('/authors', author);
  return data.data;
};

export const createPublisher = async (publisher: { name: string }): Promise<any> => {
  const { data } = await axiosClient.post<{ data: any }>('/publishers', publisher);
  return data.data;
};
