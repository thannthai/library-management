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
