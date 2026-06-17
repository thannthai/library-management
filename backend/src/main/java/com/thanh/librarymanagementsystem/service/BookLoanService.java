package com.thanh.librarymanagementsystem.service;

import com.thanh.librarymanagementsystem.payload.request.BookLoanRequest;
import com.thanh.librarymanagementsystem.payload.response.BookLoanResponse;

import com.thanh.librarymanagementsystem.payload.response.CurrentLoanResponse;
import com.thanh.librarymanagementsystem.payload.response.PageResponse;
import com.thanh.librarymanagementsystem.payload.response.SePayCheckoutResponse;
import com.thanh.librarymanagementsystem.security.UserPrincipal;
import org.springframework.data.domain.Pageable;

public interface BookLoanService {

    /** Tạo yêu cầu mượn sách — khởi tạo đơn và tạo luồng thanh toán nếu cần */
    BookLoanResponse checkoutBook(BookLoanRequest bookLoanRequest);

    /** Trả sách — cập nhật trạng thái đơn và giải phóng bản sao vật lý */
    BookLoanResponse checkInBook(Long bookLoanId);

    /** Gia hạn đơn mượn sách sách */
    BookLoanResponse renewBook(Long bookLoanId);

    /** Xem chi tiết một đơn mượn sách */
    BookLoanResponse getBookLoanById(Long id);

    /** Lấy danh sách đơn mượn sách của tôi (sinh viên) kèm phân trang và lọc trạng thái */
    PageResponse<BookLoanResponse> getMyBookLoans(String status, Pageable pageable);

    /** Admin: Lấy danh sách đơn mượn sách của một người dùng cụ thể kèm phân trang và lọc trạng thái */
    PageResponse<BookLoanResponse> getUserBookLoansForAdmin(Long userId, String status, Pageable pageable);

    java.util.List<CurrentLoanResponse> getCurrentLoans(UserPrincipal userPrincipal);

    BookLoanResponse borrowBook(Long bookId, UserPrincipal userPrincipal);

    /** Lấy lại URL thanh toán SePay cho đơn mượn đang PENDING_PAYMENT */
    SePayCheckoutResponse getPaymentCheckoutUrl(Long loanId);

    /** Xử lý khi Redis key giữ slot mượn sách bị hết hạn (5 phút) */
    void handleExpiredLoan(Long loanId);

    /** Hủy đơn mượn đang chờ thanh toán (giải phóng bản sao vật lý ngay lập tức) */
    void cancelPendingLoan(Long loanId);

    /** Đánh giá sách sau khi trả — chỉ được gọi 1 lần, chỉ với đơn RETURNED */
    BookLoanResponse rateBookLoan(Long loanId, Integer rating, String comment);
}
