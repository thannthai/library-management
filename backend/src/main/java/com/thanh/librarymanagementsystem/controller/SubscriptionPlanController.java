package com.thanh.librarymanagementsystem.controller;

import com.thanh.librarymanagementsystem.payload.request.SubscriptionPlanRequest;
import com.thanh.librarymanagementsystem.payload.response.ApiResponse;
import com.thanh.librarymanagementsystem.payload.response.SubscriptionPlanResponse;
import com.thanh.librarymanagementsystem.service.SubscriptionPlanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subscription-plans")
@RequiredArgsConstructor
public class SubscriptionPlanController {
    private final SubscriptionPlanService subscriptionPlanService;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SubscriptionPlanResponse>> getSubscriptionPlanById(@PathVariable Long id){
        return ResponseEntity.ok(new ApiResponse<>("Plan retrieved successfully", true, subscriptionPlanService.getSubscriptionPlanById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SubscriptionPlanResponse>>> getAllSubscriptionPlans() {
        return ResponseEntity.ok(new ApiResponse<>("Plans retrieved successfully", true, subscriptionPlanService.getAllSubscriptionPlans()));
    }

    @PostMapping("/admin/create")
    public ResponseEntity<ApiResponse<SubscriptionPlanResponse>> createSubscriptionPlan(@Valid @RequestBody SubscriptionPlanRequest subscriptionPlanRequest) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>("Plan created successfully", true, subscriptionPlanService.createSubscriptionPlan(subscriptionPlanRequest)));
    }

    @PutMapping("/admin/{id}")
    public ResponseEntity<ApiResponse<SubscriptionPlanResponse>> updateSubscriptionPlan(@PathVariable Long id, @Valid @RequestBody SubscriptionPlanRequest subscriptionPlanRequest) {
        return ResponseEntity.ok(new ApiResponse<>("Plan updated successfully", true, subscriptionPlanService.updateSubscriptionPlan(id, subscriptionPlanRequest)));
    }

    @DeleteMapping("/admin/{id}")
    public ResponseEntity<ApiResponse<SubscriptionPlanResponse>> deleteSubscriptionPlan(@PathVariable Long id) {
        subscriptionPlanService.deleteSubscriptionPlan(id);
        return ResponseEntity.ok(new ApiResponse<>("Plan deleted successfully", true));
    }
}
