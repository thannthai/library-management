package com.thanh.librarymanagementsystem.mapper;

import com.thanh.librarymanagementsystem.model.PaymentTransaction;
import com.thanh.librarymanagementsystem.payload.response.PaymentTransactionResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface PaymentTransactionMapper {

    @Mapping(target = "paymentId", source = "payment.id")
    PaymentTransactionResponse toDTO(PaymentTransaction transaction);

    List<PaymentTransactionResponse> toDTO(List<PaymentTransaction> transactions);
}
