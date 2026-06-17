package com.thanh.librarymanagementsystem.controller;

import com.thanh.librarymanagementsystem.enums.FineStatus;
import com.thanh.librarymanagementsystem.enums.FineType;
import com.thanh.librarymanagementsystem.payload.response.ApiResponse;
import com.thanh.librarymanagementsystem.payload.response.FineResponse;
import com.thanh.librarymanagementsystem.payload.response.PaymentInitiateResponse;
import com.thanh.librarymanagementsystem.service.FineService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/fines")
@RequiredArgsConstructor
public class FineController {

    private final FineService fineService;

    /**
     * API cho sinh viên gửi yêu cầu tạo cổng thanh toán để xóa nợ/phạt qua SePay.
     *
     * @param id ID của khoản phạt
     * @return ApiResponse chứa thông tin cổng thanh toán SePay để redirect
     */
    @PostMapping("/{id}/pay")
    public ResponseEntity<ApiResponse<PaymentInitiateResponse>> payFine(
            @PathVariable Long id
    ) {
        PaymentInitiateResponse response = fineService.payFine(id);
        return ResponseEntity.status(HttpStatus.OK)
                .body(new ApiResponse<>("Payment initiated successfully", true, response));
    }

    @PostMapping("/{id}/confirm")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<FineResponse>> confirmFinePayment(
            @PathVariable Long id
    ) {
        FineResponse response = fineService.confirmFinePayment(id);
        return ResponseEntity.status(HttpStatus.OK)
                .body(new ApiResponse<>("Đã xác nhận thanh toán tiền mặt thành công", true, response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<FineResponse>> getFineById(
            @PathVariable Long id
    ) {
        FineResponse response = fineService.getFineById(id);
        return ResponseEntity.ok(new ApiResponse<>("Fine retrieved successfully", true, response));
    }

    @GetMapping("/book-loan/{bookLoanId}")
    public ResponseEntity<ApiResponse<List<FineResponse>>> getFinesByBookLoanId(
            @PathVariable Long bookLoanId
    ) {
        List<FineResponse> response = fineService.getFinesByBookLoanId(bookLoanId);
        return ResponseEntity.ok(new ApiResponse<>("Fines for book loan retrieved successfully", true, response));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<FineResponse>>> getMyFines(
            @RequestParam(required = false) FineStatus status,
            @RequestParam(required = false) FineType type
    ) {
        List<FineResponse> response = fineService.getMyFines(status, type);
        return ResponseEntity.ok(new ApiResponse<>("Your fines retrieved successfully", true, response));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<FineResponse>>> getAllFines(
            @RequestParam(required = false) FineStatus status,
            @RequestParam(required = false) FineType type,
            @RequestParam(required = false) Long userId,
            Pageable pageable
    ) {
        Page<FineResponse> response = fineService.getAllFines(status, type, userId, pageable);
        return ResponseEntity.ok(new ApiResponse<>("All fines retrieved successfully", true, response));
    }
}
