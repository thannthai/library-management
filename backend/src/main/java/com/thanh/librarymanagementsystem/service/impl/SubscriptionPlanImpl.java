package com.thanh.librarymanagementsystem.service.impl;

import com.thanh.librarymanagementsystem.exception.SubscriptionPlanException;
import com.thanh.librarymanagementsystem.mapper.SubscriptionPlanMapper;
import com.thanh.librarymanagementsystem.mapper.UserMapper;
import com.thanh.librarymanagementsystem.model.SubscriptionPlan;
import com.thanh.librarymanagementsystem.model.User;
import com.thanh.librarymanagementsystem.payload.request.SubscriptionPlanRequest;
import com.thanh.librarymanagementsystem.payload.response.SubscriptionPlanResponse;
import com.thanh.librarymanagementsystem.repository.SubscriptionPlanRepository;
import com.thanh.librarymanagementsystem.service.SubscriptionPlanService;
import com.thanh.librarymanagementsystem.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class SubscriptionPlanImpl implements SubscriptionPlanService {
    private final SubscriptionPlanMapper subscriptionPlanMapper;
    private final UserMapper userMapper;

    private final SubscriptionPlanRepository subscriptionPlanRepository;

    private final UserService userService;

    @Override
    public SubscriptionPlanResponse createSubscriptionPlan(SubscriptionPlanRequest request) {
        if (subscriptionPlanRepository.existsByPlanCode(request.getPlanCode())) {
            throw new SubscriptionPlanException("Subscription plan code already exists: " + request.getPlanCode());
        }

        User currentUser = userService.getCurrentUser();

        SubscriptionPlan subscriptionPlan = subscriptionPlanMapper.toEntity(request);
        subscriptionPlan.setCreatedBy(currentUser.getUserProfiles().getFullName());
        subscriptionPlan.setUpdatedBy(currentUser.getUserProfiles().getFullName());

        SubscriptionPlan savedSubscriptionPlan = subscriptionPlanRepository.save(subscriptionPlan);

        return subscriptionPlanMapper.toDTO(savedSubscriptionPlan);
    }

    @Override
    public SubscriptionPlanResponse updateSubscriptionPlan(Long planId, SubscriptionPlanRequest request) {
        SubscriptionPlan existingSubscriptionPlan = subscriptionPlanRepository.findById(planId)
                .orElseThrow(() -> new SubscriptionPlanException("Subscription plan not found with id: " + planId));

        subscriptionPlanMapper.updateEntity(request, existingSubscriptionPlan);

        subscriptionPlanRepository.save(existingSubscriptionPlan);

        return subscriptionPlanMapper.toDTO(existingSubscriptionPlan);
    }

    @Override
    public void deleteSubscriptionPlan(Long planId) {
        SubscriptionPlan existingSubscriptionPlan = subscriptionPlanRepository.findById(planId)
                .orElseThrow(() -> new SubscriptionPlanException("Subscription plan not found with id: " + planId));
        subscriptionPlanRepository.delete(existingSubscriptionPlan);
    }

    @Override
    public SubscriptionPlanResponse getSubscriptionPlanById(Long planId) {
        SubscriptionPlan existingSubscriptionPlan = subscriptionPlanRepository.findById(planId)
                .orElseThrow(() -> new SubscriptionPlanException("Subscription plan not found with id: " + planId));
        return subscriptionPlanMapper.toDTO(existingSubscriptionPlan);
    }


    @Override
    public List<SubscriptionPlanResponse> getAllSubscriptionPlans() {
        List<SubscriptionPlan> subscriptionPlans = subscriptionPlanRepository.findAll();
        return subscriptionPlanMapper.toDTO(subscriptionPlans);
    }
}
