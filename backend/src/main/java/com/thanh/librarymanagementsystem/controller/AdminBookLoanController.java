package com.thanh.librarymanagementsystem.controller;

import com.thanh.librarymanagementsystem.payload.response.ApiResponse;
import com.thanh.librarymanagementsystem.payload.response.BookLoanResponse;
import com.thanh.librarymanagementsystem.payload.response.PageResponse;
import com.thanh.librarymanagementsystem.service.AdminBookLoanService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Các API dành riêng cho Admin/Thủ thư.
 * Đường dẫn prefix: /api/admin
 * Tất cả endpoint đều yêu cầu ROLE_ADMIN (được cấu hình cả ở SecurityConfig lẫn @PreAuthorize).
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminBookLoanController {

    private final AdminBookLoanService adminBookLoanService;

    // ── GET /api/admin/book-loans?status=PENDING_PICKUP&page=0&size=20 ────────
    @GetMapping("/book-loans")
    public ResponseEntity<ApiResponse<PageResponse<BookLoanResponse>>> getAdminLoans(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(new ApiResponse<>(
                "Admin loans retrieved successfully",
                true,
                adminBookLoanService.getAdminLoans(status, pageable)
        ));
    }

    // ── POST /api/admin/book-loans/{id}/pickup ────────────────────────────────
    /**
     * Admin xác nhận giao sách vật lý tại quầy.
     * Chuyển PENDING_PICKUP → CHECKED_OUT, tính checkoutDate + dueDate.
     */
    @PostMapping("/book-loans/{id}/pickup")
    public ResponseEntity<ApiResponse<BookLoanResponse>> pickupLoan(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(new ApiResponse<>(
                "Xác nhận giao sách thành công!",
                true,
                adminBookLoanService.pickupLoan(id)
        ));
    }

    // ── POST /api/admin/book-loans/{id}/return ────────────────────────────────
    /**
     * Admin nhận trả sách tại quầy.
     * Chuyển CHECKED_OUT/OVERDUE → RETURNED, hồi kho, tự động tính phạt nếu quá hạn.
     */
    @PostMapping("/book-loans/{id}/return")
    public ResponseEntity<ApiResponse<Map<String, Object>>> returnLoan(
            @PathVariable Long id
    ) {
        Map<String, Object> result = adminBookLoanService.returnLoan(id);
        String message = (Boolean) result.get("hasFinePending")
                ? "Sách đã được trả. Có phạt quá hạn — vui lòng thu tiền mặt tại quầy."
                : "Sách đã được trả thành công.";
        return ResponseEntity.ok(new ApiResponse<>(message, true, result));
    }

    // ── GET /api/admin/dashboard/stats ────────────────────────────────────────
    @GetMapping("/dashboard/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAdminStats() {
        return ResponseEntity.ok(new ApiResponse<>(
                "Admin stats retrieved",
                true,
                adminBookLoanService.getAdminStats()
        ));
    }
}
