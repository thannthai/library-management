package com.thanh.librarymanagementsystem.mapper;

import com.thanh.librarymanagementsystem.model.*;
import com.thanh.librarymanagementsystem.payload.request.SubscriptionRequest;
import com.thanh.librarymanagementsystem.payload.response.SubscriptionResponse;
import org.mapstruct.AfterMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public abstract class SubscriptionMapper implements BaseMapper<SubscriptionRequest, SubscriptionResponse, Subscription> {
    @Override
    @Mapping(target = "startDate", ignore = true)
    @Mapping(target = "endDate", ignore = true)
    @Mapping(target = "paymentId", ignore = true)
    @Mapping(target = "paymentTransactionId", ignore = true)
    @Mapping(target = "txnRef", ignore = true)
    @Mapping(target = "paymentAmount", ignore = true)
    @Mapping(target = "sePayCheckout", ignore = true)
    public abstract SubscriptionResponse toDTO(Subscription subscription);


    @AfterMapping
    public void handleToDTO(Subscription subscription, @MappingTarget SubscriptionResponse response) {
        if (subscription.getUser() != null) {
            User user = subscription.getUser();
            
            response.setUserId(user.getId());
            response.setUserEmail(user.getEmail());

            if (user.getUserProfiles() != null) {
                response.setUserName(user.getUserProfiles().getFullName());
            }
        }

        if (subscription.getSubscriptionPlan() != null) {
            response.setSubscriptionPlanId(subscription.getSubscriptionPlan().getId());
        }

        if (subscription.getStartDate() != null) {
            response.setStartDate(subscription.getStartDate().toLocalDate());
        }

        if (subscription.getEndDate() != null) {
            response.setEndDate(subscription.getEndDate().toLocalDate());
        }

        response.setDaysRemaining(subscription.getDaysRemaining());
        response.setIsValid(subscription.isValid());
        response.setIsExpired(subscription.isExpired());
    }
}
