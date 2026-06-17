package com.thanh.librarymanagementsystem.mapper;

import com.thanh.librarymanagementsystem.model.SubscriptionPlan;
import com.thanh.librarymanagementsystem.payload.request.SubscriptionPlanRequest;
import com.thanh.librarymanagementsystem.payload.response.SubscriptionPlanResponse;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public abstract class SubscriptionPlanMapper implements BaseMapper<SubscriptionPlanRequest, SubscriptionPlanResponse, SubscriptionPlan> {

    @Override
    @Mapping(target = "planName", source = "name")
    public abstract SubscriptionPlan toEntity(SubscriptionPlanRequest d);

    @Override
    @Mapping(target = "name", source = "planName")
    public abstract SubscriptionPlanResponse toDTO(SubscriptionPlan e);

    @Override
    @Mapping(target = "planName", source = "name")
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    public abstract void updateEntity(SubscriptionPlanRequest dto, @MappingTarget SubscriptionPlan entity);
}
