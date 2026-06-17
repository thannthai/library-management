package com.thanh.librarymanagementsystem.service.impl;

import com.thanh.librarymanagementsystem.exception.BookException;
import com.thanh.librarymanagementsystem.mapper.BookMapper;
import com.thanh.librarymanagementsystem.mapper.BookMapperImpl;
import com.thanh.librarymanagementsystem.model.Book;
import com.thanh.librarymanagementsystem.payload.request.BookRequest;
import com.thanh.librarymanagementsystem.payload.request.BookSearchRequest;
import com.thanh.librarymanagementsystem.payload.response.BookResponse;
import com.thanh.librarymanagementsystem.payload.response.PageResponse;
import com.thanh.librarymanagementsystem.repository.BookRepository;
import com.thanh.librarymanagementsystem.service.BookService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BookServiceImpl implements BookService {
    private final BookRepository bookRepository;
    private final BookMapper bookMapper;

    @Override
    public BookResponse createBook(BookRequest bookRequest) {
        if (bookRepository.existsByIsbn(bookRequest.getIsbn())) {
            throw new BookException("Book ISBN already exists");
        }

        Book book = bookMapper.toEntity(bookRequest);
        if (!book.isAvailableCopiesValid()) {
            throw new BookException("Validation failed for book: " + book.getTitle());
        }
        Book savedBook = bookRepository.save(book);

        return bookMapper.toDTO(savedBook);
    }

    @Override
    @Transactional
    public List<BookResponse> createBooksBulk(List<BookRequest> bookRequests) {
        if (CollectionUtils.isEmpty(bookRequests)) {
            throw new BookException("Book creation list cannot be empty");
        }

        List<Book> books = bookRequests.stream()
                .map(bookMapper::toEntity)
                .peek(book -> {
                    if (!book.isAvailableCopiesValid()) {
                        throw new BookException("Validation failed for book: " + book.getTitle());
                    }
                })
                .toList();

        List<Book> savedBooks = bookRepository.saveAll(books);
        return bookMapper.toDTO(savedBooks);
    }

    @Override
    public BookResponse getBookById(Long id) {
        Book bookFound = bookRepository.findById(id)
                .orElseThrow(() -> new BookException("Not found id: " + id));

        return bookMapper.toDTO(bookFound);
    }

    @Override
    public BookResponse getBookByISBN(String isbn) {
        if (bookRepository.existsByIsbn(isbn)) {
            throw new BookException("Not found ISBN: " + isbn);
        }
        Book bookFound = bookRepository.findByIsbn(isbn).get();
        return bookMapper.toDTO(bookFound);
    }

    @Override
    public BookResponse updateBook(Long id, BookRequest bookRequest) {
        Book existedBook = bookRepository.findById(id)
                .orElseThrow(() -> new BookException("Not found id: " + id));

        bookMapper.updateEntity(bookRequest, existedBook);
        if (!existedBook.isAvailableCopiesValid()) {
            throw new BookException("Validation failed for book: " + existedBook.getTitle());
        }
        Book savedBook = bookRepository.save(existedBook);

        return bookMapper.toDTO(savedBook);
    }

    @Override
    public void softDeleteBook(Long id) {
        Book existedBook = bookRepository.findById(id).orElseThrow(() -> new BookException("Not found id: " + id));

        existedBook.setActive(false);
        bookRepository.save(existedBook);
    }

    @Override
    public void hardDeleteBook(Long id) {
        Book existedBook = bookRepository.findById(id).orElseThrow(() -> new BookException("Not found id: " + id));
        bookRepository.delete(existedBook);
    }

    @Override
    public PageResponse<BookResponse> searchBooks(BookSearchRequest searchRequest) {
        Pageable pageable = createPageable(
                searchRequest.getPage(),
                searchRequest.getSize(),
                searchRequest.getSortBy(),
                searchRequest.getSortDirection()
        );

        Page<Book> bookPage = bookRepository.searchBooksWithFilters(searchRequest, pageable);

        return convertToPageResponse(bookPage);
    }

    private Pageable createPageable(int page, int size, String sortBy, String sortDirection) {
        size = Math.min(size, 100);
        size = Math.max(size, 1);

        Sort sort = sortDirection.equalsIgnoreCase("ASC")
                ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();

        return PageRequest.of(page, size, sort);
    }

    private PageResponse<BookResponse> convertToPageResponse(Page<Book> bookPage) {
        List<BookResponse> bookResponses = bookPage.getContent().stream()
                .map(bookMapper::toDTO)
                .toList();

        return new PageResponse<>(
                bookResponses,
                bookPage.getTotalElements(),
                bookPage.getTotalPages(),
                bookPage.getNumber(),
                bookPage.getSize(),
                bookPage.isFirst(),
                bookPage.isLast(),
                bookPage.isEmpty()
        );
    }

    @Override
    public long getTotalActiveBooks() {
        return bookRepository.countByActiveTrue();
    }

    @Override
    public long getTotalAvailableBooks() {
        return bookRepository.countAvailableBooks();
    }
}
