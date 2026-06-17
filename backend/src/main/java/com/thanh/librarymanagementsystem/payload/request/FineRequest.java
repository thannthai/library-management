package com.thanh.librarymanagementsystem.payload.request;

import com.thanh.librarymanagementsystem.enums.FineStatus;
import com.thanh.librarymanagementsystem.enums.FineType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FineRequest {

    @NotNull(message = "Book Loan ID is required")
    private Long bookLoanId;

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotNull(message = "Fine type is required")
    private FineType type;

    @NotNull(message = "Amount is required")
    @Min(value = 0, message = "Amount cannot be negative")
    private Long amount;

    @Builder.Default
    @Min(value = 0, message = "Amount paid cannot be negative")
    private Long amountPaid = 0L;

    @Builder.Default
    @NotNull(message = "Fine status is required")
    private FineStatus status = FineStatus.PENDING;

    @NotBlank(message = "Reason is mandatory")
    @Size(max = 500, message = "Reason must not exceed 500 characters")
    private String reason;

    @Size(max = 1000, message = "Notes must not exceed 1000 characters")
    private String notes;

    private Long waivedById;
    private String waiverReason;
    private Long processedById;
}
