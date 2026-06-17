package com.thanh.librarymanagementsystem.payload.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentInitiateResponse {
    private Long paymentId;
    private Long paymentTransactionId;
    private String txnRef;
    private Long paymentAmount;
    private SePayCheckoutResponse sePayCheckout;
}
