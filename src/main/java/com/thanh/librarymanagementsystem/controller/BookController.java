package com.thanh.librarymanagementsystem.controller;

import com.thanh.librarymanagementsystem.payload.request.BookRequest;
import com.thanh.librarymanagementsystem.payload.request.BookSearchRequest;
import com.thanh.librarymanagementsystem.payload.response.ApiResponse;
import com.thanh.librarymanagementsystem.payload.response.BookResponse;
import com.thanh.librarymanagementsystem.payload.response.BookStatsResponse;
import com.thanh.librarymanagementsystem.payload.response.PageResponse;
import com.thanh.librarymanagementsystem.service.BookService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/books")
@RequiredArgsConstructor
public class BookController {
    private final BookService service;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<BookResponse>> createBook(@Valid @RequestBody BookRequest bookDTO) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>("Book created successfully", true, service.createBook(bookDTO)));
    }

    @PostMapping("/bulk")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<BookResponse>>> createBooksBulk(@Valid @RequestBody List<BookRequest> bookDTOs) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>("Books created in bulk successfully", true, service.createBooksBulk(bookDTOs)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BookResponse>> getBookById(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiResponse<>("Book retrieved successfully", true, service.getBookById(id)));
    }

    @GetMapping("/isbn/{isbn}")
    public ResponseEntity<ApiResponse<BookResponse>> getBookByISBN(@PathVariable String isbn) {
        return ResponseEntity.ok(new ApiResponse<>("Book retrieved successfully", true, service.getBookByISBN(isbn)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<BookResponse>> updateBook(@PathVariable Long id, @Valid @RequestBody BookRequest bookDTO) {
        return ResponseEntity.ok(new ApiResponse<>("Book updated successfully", true, service.updateBook(id, bookDTO)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> softDeleteBook(@PathVariable Long id) {
        service.softDeleteBook(id);
        return ResponseEntity.ok(new ApiResponse<>("Book deleted softly", true));
    }

    @DeleteMapping("/{id}/permanent")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> hardDeleteBook(@PathVariable Long id) {
        service.hardDeleteBook(id);
        return ResponseEntity.ok(new ApiResponse<>("Book deleted permanently", true));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<PageResponse<BookResponse>>> searchBooks(BookSearchRequest searchRequest) {
        return ResponseEntity.ok(new ApiResponse<>("Books searched successfully", true, service.searchBooks(searchRequest)));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<BookStatsResponse>> getBookStats() {
        long totalActive = service.getTotalActiveBooks();
        long totalAvailable = service.getTotalAvailableBooks();

        BookStatsResponse stats = new BookStatsResponse(totalActive, totalAvailable);
        return ResponseEntity.ok(new ApiResponse<>("Statistics retrieved successfully", true, stats));
    }
}
