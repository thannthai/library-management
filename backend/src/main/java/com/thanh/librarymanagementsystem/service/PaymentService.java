package com.thanh.librarymanagementsystem.service;

import com.thanh.librarymanagementsystem.model.PaymentTransaction;
import com.thanh.librarymanagementsystem.payload.response.PaymentTransactionResponse;
import com.thanh.librarymanagementsystem.payload.response.SePayCheckoutResponse;

public interface PaymentService {

    /**
     * Tạo thông tin thanh toán SePay (params + signature) từ PaymentTransaction.
     * Thay vì gọi SePay server-to-server (không đúng với checkout/init),
     * hàm này trả về object chứa URL + params để frontend tự submit form sang SePay.
     *
     * @param paymentTransaction bản ghi giao dịch chứa txnRef và amount
     * @return SePayCheckoutResponse chứa checkoutFormUrl và map params đã ký
     */
    SePayCheckoutResponse createSePayPaymentUrl(PaymentTransaction paymentTransaction);

    /**
     * Cập nhật trạng thái PaymentTransaction, Payment và BookLoan dựa trên kết quả
     * từ SePay webhook/IPN. Đây là hàm nghiệp vụ DB thuần, không phụ thuộc gateway.
     *
     * @param txnRef               mã đơn hàng duy nhất
     * @param success              true nếu thanh toán thành công
     * @param gatewayTransactionId mã giao dịch phía SePay
     * @param failureReason        mô tả lỗi nếu thất bại
     * @return thông tin giao dịch sau khi cập nhật
     */
    PaymentTransactionResponse updatePaymentAndLoanStatus(
            String txnRef,
            boolean success,
            String gatewayTransactionId,
            String failureReason
    );
}
