package com.thanh.librarymanagementsystem.payload.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionResponse {
    private Long id;

    private Long userId;
    private String userName;
    private String userEmail;

    private Long subscriptionPlanId;
    private String planName;
    private String planCode;
    private BigDecimal price;

    private Integer maxBooksAllowed;
    private Integer maxDaysPerBook;

    private LocalDate startDate;
    private LocalDate endDate;

    //private String status; //ACTIVE, EXPIRED, CANCELLED
    private Boolean isActive;

    private Boolean autoRenew;
    private LocalDateTime cancelledAt;
    private String cancellationReason;
    private Long daysRemaining;

    private Boolean isValid;
    private Boolean isExpired;

    private Long paymentId;
    private Long paymentTransactionId;
    private String txnRef;
    private Long paymentAmount;
    private SePayCheckoutResponse sePayCheckout;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

