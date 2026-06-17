package com.thanh.librarymanagementsystem.service;

import com.thanh.librarymanagementsystem.payload.request.SubscriptionPlanRequest;
import com.thanh.librarymanagementsystem.payload.response.SubscriptionPlanResponse;

import java.util.List;

public interface SubscriptionPlanService {
    SubscriptionPlanResponse createSubscriptionPlan(SubscriptionPlanRequest request);

    SubscriptionPlanResponse updateSubscriptionPlan(Long planId, SubscriptionPlanRequest request);

    void deleteSubscriptionPlan(Long planId);

    SubscriptionPlanResponse getSubscriptionPlanById(Long planId);

    List<SubscriptionPlanResponse> getAllSubscriptionPlans();
}
