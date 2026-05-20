package com.thanh.librarymanagementsystem.mapper;

import com.thanh.librarymanagementsystem.model.SubscriptionPlan;
import com.thanh.librarymanagementsystem.payload.request.SubscriptionPlanRequest;
import com.thanh.librarymanagementsystem.payload.response.SubscriptionPlanResponse;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public abstract class SubscriptionPlanMapper implements BaseMapper<SubscriptionPlanRequest, SubscriptionPlanResponse, SubscriptionPlan> {

}
