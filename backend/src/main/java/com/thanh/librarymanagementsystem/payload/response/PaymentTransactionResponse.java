package com.thanh.librarymanagementsystem.payload.response;

import com.thanh.librarymanagementsystem.enums.TransactionStatus;
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
public class PaymentTransactionResponse {
    private Long id;

    private Long paymentId;

    private String txnRef;
    private String gatewayPaymentId;
    private String gatewaySignature;
    private String bankCode;
    private String description;

    private Long amount;
    private TransactionStatus status;
    private String failureReason;
    private LocalDateTime completedAt;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
