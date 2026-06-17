package com.thanh.librarymanagementsystem.controller;

import com.thanh.librarymanagementsystem.payload.request.BookLoanRequest;
import com.thanh.librarymanagementsystem.payload.response.ApiResponse;
import com.thanh.librarymanagementsystem.payload.response.BookLoanResponse;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.thanh.librarymanagementsystem.payload.response.SePayCheckoutResponse;
import com.thanh.librarymanagementsystem.service.BookLoanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import com.thanh.librarymanagementsystem.payload.response.PageResponse;

import com.thanh.librarymanagementsystem.payload.response.CurrentLoanResponse;
import com.thanh.librarymanagementsystem.security.UserPrincipal;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import java.util.List;

@RestController
@RequestMapping({"/api/book-loans", "/api/loans"})
@RequiredArgsConstructor
public class BookLoanController {
    private final BookLoanService bookLoanService;

    @PostMapping("/checkout")
    public ResponseEntity<ApiResponse<BookLoanResponse>> checkoutBook(
            @Valid @RequestBody BookLoanRequest bookLoanRequest
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>("Book loan created and pending payment", true,
                        bookLoanService.checkoutBook(bookLoanRequest)));
    }

    @PostMapping("/checkin")
    public ResponseEntity<ApiResponse<BookLoanResponse>> checkInBook(
            @RequestParam Long bookLoanId
    ) {
        return ResponseEntity.ok(new ApiResponse<>("Book copy returned and checked in successfully", true,
                bookLoanService.checkInBook(bookLoanId)));
    }

    @PostMapping("/renew")
    public ResponseEntity<ApiResponse<BookLoanResponse>> renewBook(
            @RequestParam Long bookLoanId
    ) {
        return ResponseEntity.ok(new ApiResponse<>("Book loan renewed successfully", true,
                bookLoanService.renewBook(bookLoanId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BookLoanResponse>> getBookLoanById(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(new ApiResponse<>("Book loan retrieved successfully", true,
                bookLoanService.getBookLoanById(id)));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<Void>> cancelPendingLoan(
            @PathVariable Long id
    ) {
        bookLoanService.cancelPendingLoan(id);
        return ResponseEntity.ok(new ApiResponse<>("Đã hủy đơn mượn thành công", true, null));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<PageResponse<BookLoanResponse>>> getMyBookLoans(
            @RequestParam(required = false) String status,
            Pageable pageable
    ) {
        return ResponseEntity.ok(new ApiResponse<>("Your book loans retrieved successfully", true,
                bookLoanService.getMyBookLoans(status, pageable)));
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PageResponse<BookLoanResponse>>> getUserBookLoansForAdmin(
            @PathVariable Long userId,
            @RequestParam(required = false) String status,
            Pageable pageable
    ) {
        return ResponseEntity.ok(new ApiResponse<>("User book loans retrieved successfully", true,
                bookLoanService.getUserBookLoansForAdmin(userId, status, pageable)));
    }

    @GetMapping("/current")
    public ResponseEntity<ApiResponse<List<CurrentLoanResponse>>> getCurrentLoans(
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        List<CurrentLoanResponse> currentLoans = bookLoanService.getCurrentLoans(userPrincipal);
        return ResponseEntity.ok(new ApiResponse<>("Current loans retrieved successfully", true, currentLoans));
    }

    @PostMapping("/borrow")
    public ResponseEntity<ApiResponse<BookLoanResponse>> borrowBook(
            @RequestParam Long bookId,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>("Book borrow request created successfully", true,
                        bookLoanService.borrowBook(bookId, userPrincipal)));
    }

    /**
     * Lấy lại URL thanh toán SePay cho đơn mượn đang PENDING_PAYMENT.
     * Frontend gọi endpoint này khi user bấm nút "Pay Now" trên trang My Loans.
     */
    @GetMapping("/{id}/payment-url")
    public ResponseEntity<ApiResponse<SePayCheckoutResponse>> getPaymentUrl(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(new ApiResponse<>("Payment URL generated successfully", true,
                bookLoanService.getPaymentCheckoutUrl(id)));
    }

    /**
     * Đánh giá sách sau khi trả.
     * Body: { "rating": 4, "comment": "Hay lắm" }
     */
    @org.springframework.web.bind.annotation.PutMapping("/{id}/rate")
    public ResponseEntity<ApiResponse<BookLoanResponse>> rateBookLoan(
            @PathVariable Long id,
            @org.springframework.web.bind.annotation.RequestBody RateRequest body
    ) {
        return ResponseEntity.ok(new ApiResponse<>("Đánh giá thành công", true,
                bookLoanService.rateBookLoan(id, body.getRating(), body.getComment())));
    }

    /** Simple inner DTO for rating request body */
    public static class RateRequest {
        @JsonProperty("rating")
        private Integer rating;
        @JsonProperty("comment")
        private String comment;
        public Integer getRating() { return rating; }
        public String getComment() { return comment; }
    }
}
