package com.thanh.librarymanagementsystem.mapper;

import com.thanh.librarymanagementsystem.model.Payment;
import com.thanh.librarymanagementsystem.payload.response.PaymentResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface PaymentMapper {

    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "userEmail", source = "user.email")
    @Mapping(target = "bookLoanId", source = "bookLoan.id")
    @Mapping(target = "subscriptionId", source = "subscription.id")
    @Mapping(target = "fineId", source = "fine.id")
    PaymentResponse toDTO(Payment payment);

    List<PaymentResponse> toDTO(List<Payment> payments);
}
