package com.thanh.librarymanagementsystem.payload.request;

import com.thanh.librarymanagementsystem.enums.LoanType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookLoanRequest {
    @NotNull(message = "Mã bản sao sách là bắt buộc")
    private Long bookCopyId;

    @NotNull(message = "Loan type is required")
    private LoanType type;

    @Size(max = 1000, message = "Notes must not exceed 1000 characters")
    private String notes;
}
