package com.thanh.librarymanagementsystem.model;

import com.thanh.librarymanagementsystem.enums.FineStatus;
import com.thanh.librarymanagementsystem.enums.FineType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "fines")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Fine extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "book_loan_id", nullable = false)
    private BookLoan bookLoan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, columnDefinition = "VARCHAR(50)")
    private FineType type;

    @Column(name = "amount", nullable = false)
    private Long amount;

    @Builder.Default
    @Column(name = "amount_paid")
    private Long amountPaid = 0L;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, columnDefinition = "VARCHAR(50)")
    private FineStatus status = FineStatus.PENDING;

    @Column(name = "reason", nullable = false, length = 500)
    private String reason;

    @Column(name = "notes", length = 1000)
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "waived_by")
    private User waivedBy;

    @Column(name = "waived_at")
    private LocalDateTime waivedAt;

    @Column(name = "waiver_reason", length = 500)
    private String waiverReason;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "processed_by")
    private User processedBy;

    // Lấy số tiền còn nợ (Tổng phạt - Tiền đã trả)
    public Long getAmountOutstanding() {
        return this.amount - this.amountPaid;
    }

    // Kiểm tra xem đã trả hết nợ chưa
    public boolean isFullyPaid() {
        return this.amountPaid >= this.amount || this.status == FineStatus.PAID;
    }

    // Kiểm tra xem có phải nợ đã được hủy/miễn giảm không
    public boolean isWaived() {
        return this.status == FineStatus.WAIVED;
    }

    // Kiểm tra xem nợ có đang treo không
    public boolean isPending() {
        return this.status == FineStatus.PENDING || this.status == FineStatus.PARTIALLY_PAID;
    }

    // Hàm cộng tiền khi sinh viên thanh toán (Dùng cho luồng Webhook SePay)
    public void applyPayment(Long payAmount) {
        this.amountPaid += payAmount;
        if (this.isFullyPaid()) {
            this.status = FineStatus.PAID;
            this.paidAt = LocalDateTime.now();
        } else {
            this.status = FineStatus.PARTIALLY_PAID;
        }
    }

    // Hàm miễn giảm nợ (Dùng cho Admin xử lý sự cố)
    public void waive(User admin, String waiverReason) {
        this.status = FineStatus.WAIVED;
        this.waivedBy = admin;
        this.waiverReason = waiverReason;
        this.waivedAt = LocalDateTime.now();
    }
}
