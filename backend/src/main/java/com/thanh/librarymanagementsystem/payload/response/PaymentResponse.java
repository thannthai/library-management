package com.thanh.librarymanagementsystem.payload.response;

import com.thanh.librarymanagementsystem.enums.PaymentMethod;
import com.thanh.librarymanagementsystem.enums.PaymentStatus;
import com.thanh.librarymanagementsystem.enums.PaymentType;
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
public class PaymentResponse {
    private Long id;

    private Long userId;
    private String userEmail;

    private Long bookLoanId;
    private Long subscriptionId;
    private Long fineId;

    private PaymentType type;
    private PaymentStatus status;
    private PaymentMethod paymentMethod;

    private Long amount;
    private String currency;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
