package com.thanh.librarymanagementsystem.payload.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionRequest {
    @NotNull(message = "Subscription plan ID is required")
    private Long subscriptionPlanId;

    private Boolean autoRenew;
}
