package com.thanh.librarymanagementsystem.controller;

import com.thanh.librarymanagementsystem.payload.request.SubscriptionRequest;
import com.thanh.librarymanagementsystem.payload.response.ApiResponse;
import com.thanh.librarymanagementsystem.payload.response.SubscriptionResponse;
import com.thanh.librarymanagementsystem.service.SubscriptionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/subscriptions")
public class SubscriptionController {
    private final SubscriptionService subscriptionService;

    @PostMapping("/subscribe")
    public ResponseEntity<ApiResponse<SubscriptionResponse>> subscribe(@Valid @RequestBody SubscriptionRequest subscriptionRequest) {
        SubscriptionResponse subscriptionResponse = subscriptionService.subscribe(subscriptionRequest);
        return ResponseEntity.ok(new ApiResponse<>("Subscribed successfully", true, subscriptionResponse));
    }

    @PostMapping("/user/active")
    public ResponseEntity<ApiResponse<SubscriptionResponse>> getUsersActiveSubscriptions(@RequestParam Long userId) {
        SubscriptionResponse subscriptionResponse = subscriptionService.getUsersActiveSubscriptions(userId);

        return ResponseEntity.ok(new ApiResponse<>("Active subscription retrieved successfully", true, subscriptionResponse));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin")
    public ResponseEntity<ApiResponse<List<SubscriptionResponse>>> getAllSubscriptions() {
        int page = 0;
        int size = 10;

        Pageable pageable = PageRequest.of(page, size);

        List<SubscriptionResponse> subscriptionResponses = subscriptionService.getAllSubscriptions(pageable);
        return ResponseEntity.ok(new ApiResponse<>("Subscriptions retrieved successfully", true, subscriptionResponses));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/admin/deactivate-expired")
    public ResponseEntity<ApiResponse<List<SubscriptionResponse>>> deactivateExpiredSubscriptions() {
        int page = 0;
        int size = 10;
        Pageable pageable = PageRequest.of(page, size);

        subscriptionService.deactiveExpiredSubscriptions();

        return ResponseEntity.ok(new ApiResponse<>("Expired subscriptions deactivated successfully", true, null));
    }

    @PostMapping("/cancel/{subscriptionId}")
    public ResponseEntity<ApiResponse<SubscriptionResponse>> cancelSubscription(@PathVariable Long subscriptionId, @RequestParam(required = false) String reason) {
        SubscriptionResponse subscriptionResponse = subscriptionService.cancelSubscription(subscriptionId, reason);
        return ResponseEntity.ok(new ApiResponse<>("Subscription cancelled successfully", true, subscriptionResponse));
    }

    @PostMapping("/activate")
    public ResponseEntity<ApiResponse<SubscriptionResponse>> activateSubscription(@RequestParam Long subscriptionId, @RequestParam Long paymentId) {
        SubscriptionResponse subscriptionResponse = subscriptionService.activeSubscription(subscriptionId, paymentId);
        return ResponseEntity.ok(new ApiResponse<>("Subscription activated successfully", true, subscriptionResponse));
    }

}
