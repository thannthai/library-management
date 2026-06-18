package com.thanh.librarymanagementsystem.service;

import com.thanh.librarymanagementsystem.payload.request.BookRequest;
import com.thanh.librarymanagementsystem.payload.request.BookSearchRequest;
import com.thanh.librarymanagementsystem.payload.response.BookResponse;
import com.thanh.librarymanagementsystem.payload.response.PageResponse;

import java.util.List;

public interface BookService {
    BookResponse createBook(BookRequest bookRequest);
    List<BookResponse> createBooksBulk(List<BookRequest> bookRequests);
    BookResponse getBookById(Long id);
    BookResponse getBookByISBN(String isbn);
    BookResponse updateBook(Long id, BookRequest bookRequest);
    void softDeleteBook(Long id);
    void hardDeleteBook(Long id);
    PageResponse<BookResponse> searchBooks(BookSearchRequest searchRequest);
    long getTotalActiveBooks();
    long getTotalAvailableBooks();
    List<BookResponse> getFeaturedBooks();
}
