package com.thanh.librarymanagementsystem.payload.response;

import com.thanh.librarymanagementsystem.enums.LoanStatus;
import com.thanh.librarymanagementsystem.enums.LoanType;
import com.thanh.librarymanagementsystem.payload.response.SePayCheckoutResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookLoanResponse {
    private Long id;

    private Long userId;
    private String userEmail;

    private Long bookId;
    private String bookTitle;
    private String coverImageUrl;
    private String isbn;
    private String authorName;

    private LoanType type;
    private LoanStatus status;

    private LocalDateTime checkoutDate;
    private LocalDateTime dueDate;
    private LocalDateTime returnDate;

    private Integer renewalCount;
    private Integer maxRenewals;
    private String notes;
    private Boolean isOverdue;
    private short overdueDays;

    private Long paymentId;
    private Long paymentTransactionId;
    private String txnRef;
    private Long paymentAmount;

    private String paymentStatus;

    /** Thông tin để frontend submit form sang SePay → user thanh toán */
    private SePayCheckoutResponse sePayCheckout;

    private List<FineResponse> fines;

    // ── Rating ─────────────────────────────────────────────────────
    private Integer rating;
    private String comment;
    private java.time.LocalDateTime ratedAt;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
