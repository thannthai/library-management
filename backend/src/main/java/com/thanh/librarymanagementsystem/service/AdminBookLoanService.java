package com.thanh.librarymanagementsystem.service;

import com.thanh.librarymanagementsystem.payload.response.BookLoanResponse;
import com.thanh.librarymanagementsystem.payload.response.PageResponse;
import org.springframework.data.domain.Pageable;

import java.util.Map;

public interface AdminBookLoanService {

    /**
     * Lấy danh sách đơn mượn theo trạng thái (có phân trang).
     * @param status null = lấy tất cả
     */
    PageResponse<BookLoanResponse> getAdminLoans(String status, Pageable pageable);

    /**
     * Xác nhận giao sách vật lý tại quầy.
     * Chuyển trạng thái: PENDING_PICKUP → CHECKED_OUT
     * Tính toán và lưu checkoutDate + dueDate tại đây.
     * Áp dụng Optimistic Locking để an toàn concurrency.
     */
    BookLoanResponse pickupLoan(Long loanId);

    /**
     * Nhận trả sách tại quầy.
     * Chuyển trạng thái: CHECKED_OUT hoặc OVERDUE → RETURNED.
     * Hồi BookCopy về AVAILABLE.
     * Nếu quá hạn → tự động tạo Fine.
     * @return Map gồm "loan" (BookLoanResponse) và "fineAmount" (Long, 0 nếu không phạt)
     */
    Map<String, Object> returnLoan(Long loanId);

    /**
     * Thống kê nhanh cho Admin Dashboard.
     */
    Map<String, Object> getAdminStats();
}
