export interface AuthorResponse {
  id: number;
  name: string;
}

export interface GenreResponse {
  id: number;
  code: string;
  name: string;
  description?: string;
  displayOrder?: number;
  active?: boolean;
}

export interface PublisherResponse {
  id: number;
  name: string;
}

export interface BookResponse {
  id: number;
  isbn: string;
  title: string;
  coverImageUrl?: string;
  description?: string;
  language?: string;
  pages?: number;
  publicationDate?: string;
  price?: number;
  loanFeePerDay?: number;
  authors?: AuthorResponse[];
  genres?: GenreResponse[];
  publisher?: PublisherResponse;
  totalCopies: number;
  availableCopies: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  borrowNumber?: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface BookSearchRequest {
  searchTerm?: string;
  genreId?: number;
  authorId?: number;
  availableOnly?: boolean;
  checkedOutOnly?: boolean;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: string;
}
