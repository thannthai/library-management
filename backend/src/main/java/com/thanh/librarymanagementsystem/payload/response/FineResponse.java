package com.thanh.librarymanagementsystem.payload.response;

import com.thanh.librarymanagementsystem.enums.FineStatus;
import com.thanh.librarymanagementsystem.enums.FineType;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FineResponse {
    private Long id;
    private Long bookLoanId;
    private Long userId;
    private String userEmail;
    private String userName;        // Full name từ UserProfiles
    private String bookTitle;       // Tên sách liên quan tới khoản phạt này
    private Integer overdueDays;    // Số ngày quá hạn (lấy từ BookLoan)
    private FineType type;
    private Long amount;
    private Long amountPaid;
    private FineStatus status;
    private String reason;
    private String notes;
    private Long waivedById;
    private String waivedByEmail;
    private LocalDateTime waivedAt;
    private String waiverReason;
    private LocalDateTime paidAt;
    private Long processedById;
    private String processedByEmail;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
