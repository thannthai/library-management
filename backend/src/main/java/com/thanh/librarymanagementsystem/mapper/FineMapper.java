package com.thanh.librarymanagementsystem.mapper;

import com.thanh.librarymanagementsystem.model.Fine;
import com.thanh.librarymanagementsystem.payload.request.FineRequest;
import com.thanh.librarymanagementsystem.payload.response.FineResponse;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public abstract class FineMapper implements BaseMapper<FineRequest, FineResponse, Fine> {

    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "userEmail", source = "user.email")
    @Mapping(target = "bookLoanId", source = "bookLoan.id")
    @Mapping(target = "waivedById", source = "waivedBy.id")
    @Mapping(target = "waivedByEmail", source = "waivedBy.email")
    @Mapping(target = "processedById", source = "processedBy.id")
    @Mapping(target = "processedByEmail", source = "processedBy.email")
    public abstract FineResponse toDTO(Fine fine);

    @Mapping(target = "user", ignore = true)
    @Mapping(target = "bookLoan", ignore = true)
    @Mapping(target = "waivedBy", ignore = true)
    @Mapping(target = "processedBy", ignore = true)
    public abstract Fine toEntity(FineRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "bookLoan", ignore = true)
    @Mapping(target = "waivedBy", ignore = true)
    @Mapping(target = "processedBy", ignore = true)
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    public abstract void updateEntity(FineRequest request, @MappingTarget Fine fine);
}
