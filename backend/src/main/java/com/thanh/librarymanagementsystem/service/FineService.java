package com.thanh.librarymanagementsystem.service;

import com.thanh.librarymanagementsystem.enums.FineStatus;
import com.thanh.librarymanagementsystem.enums.FineType;
import com.thanh.librarymanagementsystem.payload.response.FineResponse;
import com.thanh.librarymanagementsystem.payload.response.PaymentInitiateResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface FineService {
    /**
     * Tạo yêu cầu thanh toán phạt qua cổng SePay.
     *
     * @param fineId ID của khoản phạt cần thanh toán
     * @return PaymentInitiateResponse chứa các thông số chuyển hướng cổng thanh toán SePay
     */
    PaymentInitiateResponse payFine(Long fineId);

    FineResponse getFineById(Long id);

    List<FineResponse> getFinesByBookLoanId(Long bookLoanId);

    List<FineResponse> getMyFines(FineStatus status, FineType type);

    Page<FineResponse> getAllFines(FineStatus status, FineType type, Long userId, Pageable pageable);

    FineResponse confirmFinePayment(Long fineId);
}
