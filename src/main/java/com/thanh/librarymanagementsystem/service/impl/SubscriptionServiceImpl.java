package com.thanh.librarymanagementsystem.service.impl;

import com.thanh.librarymanagementsystem.exception.SubscriptionException;
import com.thanh.librarymanagementsystem.exception.SubscriptionPlanException;
import com.thanh.librarymanagementsystem.mapper.SubscriptionMapper;
import com.thanh.librarymanagementsystem.model.Subscription;
import com.thanh.librarymanagementsystem.model.SubscriptionPlan;
import com.thanh.librarymanagementsystem.model.User;
import com.thanh.librarymanagementsystem.payload.request.SubscriptionRequest;
import com.thanh.librarymanagementsystem.payload.response.SubscriptionResponse;
import com.thanh.librarymanagementsystem.repository.SubscriptionPlanRepository;
import com.thanh.librarymanagementsystem.repository.SubscriptionRepository;
import com.thanh.librarymanagementsystem.repository.UserRepository;
import com.thanh.librarymanagementsystem.service.SubscriptionService;
import com.thanh.librarymanagementsystem.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SubscriptionServiceImpl implements SubscriptionService {
    private final SubscriptionRepository subscriptionRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final UserRepository userRepository;

    private final SubscriptionMapper subscriptionMapper;
    private final UserService userService;

    @Override
    public SubscriptionResponse subscribe(SubscriptionRequest subscriptionRequest) {
        User currentUser = userService.getCurrentUser();

        SubscriptionPlan plan = subscriptionPlanRepository.findById(subscriptionRequest.getSubscriptionPlanId())
                .orElseThrow(() -> new SubscriptionPlanException("Subscription Plan Not Found"));

        Subscription subscription = subscriptionMapper.toEntity(subscriptionRequest);
        subscription.setUser(currentUser);
        subscription.setSubscriptionPlan(plan);

        subscription.initializeFromPlan();
        subscription.setIsActive(false); // Set to false until payment is confirmed

        Subscription savedSubscription = subscriptionRepository.save(subscription);

        //create payment (todo)

        return subscriptionMapper.toDTO(savedSubscription);
    }

    @Override
    public SubscriptionResponse getUsersActiveSubscriptions(Long userId) {
        User currentUser = userService.getCurrentUser();

        Subscription subscription = subscriptionRepository.findActiveSubscriptionByUserId(currentUser.getId(), LocalDate.now())
                .orElseThrow(() -> new SubscriptionException("No active subscription found for user with id: " + currentUser.getId()));

        return subscriptionMapper.toDTO(subscription);
    }

    @Override
    public SubscriptionResponse cancelSubscription(Long subscriptionId, String reason) {
        Subscription subscription = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new SubscriptionException("Subscription not found with id: " + subscriptionId));

        if (!subscription.getIsActive()) {
            throw new SubscriptionException("Subscription is already cancelled");
        }

        subscription.setCancelledAt(LocalDateTime.now());
        subscription.setCancellationReason(reason != null ? reason : "Cancel by user");

        subscription = subscriptionRepository.save(subscription);

        return subscriptionMapper.toDTO(subscription);
    }

    @Override
    public SubscriptionResponse activeSubscription(Long subscriptionId, Long paymentId) {
        Subscription subscription = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new SubscriptionException("Subscription not found with id: " + subscriptionId));

        if (subscription.getIsActive()) {
            throw new SubscriptionException("Subscription is already active");
        }

        //todo validate payment

        subscription.setIsActive(true);

        subscription = subscriptionRepository.save(subscription);

        return subscriptionMapper.toDTO(subscription);
    }

    @Override
    public List<SubscriptionResponse> getAllSubscriptions(Pageable pageable) {
        List<Subscription> subscriptions = subscriptionRepository.findAll(pageable).getContent();
        return subscriptionMapper.toDTO(subscriptions);
    }

    @Override
    public void deactiveExpiredSubscriptions() {
        List<Subscription> expiredSubscriptions = subscriptionRepository.findExpiredActiveSubscription(LocalDate.now());

        for (Subscription subscription : expiredSubscriptions) {
            subscription.setIsActive(false);
            subscriptionRepository.save(subscription);
        }
    }
}
