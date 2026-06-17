package com.thanh.librarymanagementsystem.model;

import com.thanh.librarymanagementsystem.enums.LoanStatus;
import com.thanh.librarymanagementsystem.enums.LoanType;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "book_loans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookLoan extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * Bản sao vật lý cụ thể được mượn.
     * Thay thế liên kết cũ sang Book (tựa sách trừu tượng) để hỗ trợ quản lý
     * barcode.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "book_copy_id", nullable = false)
    private BookCopy bookCopy;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, columnDefinition = "VARCHAR(50)")
    private LoanType type;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, columnDefinition = "VARCHAR(50)")
    private LoanStatus status;

    @Column(name = "checkout_date", nullable = true)
    private LocalDateTime checkoutDate;

    @Column(name = "due_date", nullable = true)
    private LocalDateTime dueDate;

    /** Ngày dự kiến trả sách (do hệ thống tính từ checkout_date + loanDays) */
    @Column(name = "return_date")
    private LocalDateTime returnDate;

    /**
     * Ngày trả sách thực tế khi sinh viên mang sách về (do API check-in ghi lại)
     */
    @Column(name = "actual_return_date")
    private LocalDateTime actualReturnDate;

    @Column(name = "renewal_count")
    private Integer renewalCount = 0;

    @Column(name = "max_renewals")
    private Integer maxRenewals = 2;

    @Column(name = "notes", length = 1000)
    private String notes;

    @Builder.Default
    @Column(name = "is_overdue")
    private Boolean isOverdue = false;

    @Builder.Default
    @Column(name = "overdue_days")
    private short overdueDays = 0;

    @Column(name = "payment_status", length = 50)
    private String paymentStatus;

    @OneToMany(mappedBy = "bookLoan", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Fine> fines = new ArrayList<>();

    @Version
    private Long version;

    // ── Rating fields (set by user after returning the book) ─────────────────
    /** User's rating for this book, 1-5 stars. Null until rated. */
    @Column(name = "rating")
    private Integer rating;

    /** User's text comment/review. Null until rated. */
    @Column(name = "comment", length = 2000)
    private String comment;

    /** Timestamp when user submitted the rating. */
    @Column(name = "rated_at")
    private LocalDateTime ratedAt;
}
