package com.thanh.librarymanagementsystem.service;

import com.thanh.librarymanagementsystem.payload.request.SubscriptionRequest;
import com.thanh.librarymanagementsystem.payload.response.SubscriptionResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface SubscriptionService {
    SubscriptionResponse subscribe(SubscriptionRequest subscriptionRequest);

    SubscriptionResponse getUsersActiveSubscriptions(Long userId);

    SubscriptionResponse cancelSubscription(Long subscriptionId, String reason);

    SubscriptionResponse activeSubscription(Long subscriptionId, Long paymentId);

    List<SubscriptionResponse> getAllSubscriptions(Pageable pageable);

    void deactiveExpiredSubscriptions();
}
