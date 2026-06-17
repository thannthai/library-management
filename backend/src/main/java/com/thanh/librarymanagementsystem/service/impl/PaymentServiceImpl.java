package com.thanh.librarymanagementsystem.service.impl;

import com.thanh.librarymanagementsystem.enums.CopyStatus;
import com.thanh.librarymanagementsystem.enums.LoanStatus;
import com.thanh.librarymanagementsystem.enums.PaymentStatus;
import com.thanh.librarymanagementsystem.enums.TransactionStatus;
import com.thanh.librarymanagementsystem.exception.PaymentException;
import com.thanh.librarymanagementsystem.enums.PaymentType;
import com.thanh.librarymanagementsystem.model.BookCopy;
import com.thanh.librarymanagementsystem.model.BookLoan;
import com.thanh.librarymanagementsystem.model.Fine;
import com.thanh.librarymanagementsystem.model.Payment;
import com.thanh.librarymanagementsystem.model.PaymentTransaction;
import com.thanh.librarymanagementsystem.payload.response.PaymentTransactionResponse;
import com.thanh.librarymanagementsystem.payload.response.SePayCheckoutResponse;
import com.thanh.librarymanagementsystem.repository.BookCopyRepository;
import com.thanh.librarymanagementsystem.repository.BookRepository;
import com.thanh.librarymanagementsystem.repository.FineRepository;
import com.thanh.librarymanagementsystem.repository.PaymentRepository;
import com.thanh.librarymanagementsystem.repository.PaymentTransactionRepository;
import com.thanh.librarymanagementsystem.repository.SubscriptionRepository;
import com.thanh.librarymanagementsystem.model.Subscription;
import com.thanh.librarymanagementsystem.model.Book;
import com.thanh.librarymanagementsystem.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    // -----------------------------------------------------------------------
    // Config từ application.yaml — SePay Payment Gateway
    // -----------------------------------------------------------------------

    /** Base URL của SePay pgapi (không dùng để gọi API — chỉ để build checkout form URL) */
    @Value("${sepay.api-url}")
    private String sePayApiUrl;

    @Value("${sepay.merchant-id}")
    private String merchantId;

    @Value("${sepay.secret-key}")
    private String secretKey;

    @Value("${sepay.return-url}")
    private String returnUrl;

    @Value("${sepay.cancel-url}")
    private String cancelUrl;

    @Value("${sepay.bank-code}")
    private String bankCode;

    @Value("${sepay.bank-account}")
    private String bankAccount;

    private final PaymentRepository paymentRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final BookCopyRepository bookCopyRepository;
    private final FineRepository fineRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final BookRepository bookRepository;


    // -----------------------------------------------------------------------
    // API công khai
    // -----------------------------------------------------------------------

    /**
     * Tạo link thanh toán qua SePay Payment Gateway (pgapi).
     *
     * Luồng:
     *   1. Chuẩn bị các tham số đơn hàng
     *   2. Ký HMAC-SHA256 (Base64) theo đúng thứ tự field quy định của SePay
     *   3. POST lên /checkout/init
     *   4. Trả về URL trang thanh toán để redirect user
     *
     * Lưu ý: order_description vẫn giữ cấu trúc "SEVQR <txnRef>"
     * để SePay webhook có thể nhận diện đơn hàng qua nội dung chuyển khoản.
     */
    @Override
    public SePayCheckoutResponse createSePayPaymentUrl(PaymentTransaction paymentTransaction) {
        String txnRef = paymentTransaction.getTxnRef();
        Long amount   = paymentTransaction.getAmount();

        // 1. Các tham số gửi lên SePay pgapi
        //    (thứ tự này PHẢI khớp với thứ tự tạo chữ ký bên dưới)
        String operation     = "PURCHASE";
        String currency      = "VND";
        String description   = "SEVQR " + txnRef; // bắt buộc để webhook nhận diện

        // 2. Tạo chữ ký HMAC-SHA256
        //    Quy tắc SePay: nối các field theo thứ tự cố định, cách nhau dấu phẩy
        //    Chỉ đưa vào chuỗi ký các field CÓ GIÁ TRỊ
        String dataToSign = String.join(",",
                "merchant="            + merchantId,
                "operation="           + operation,
                "order_amount="        + amount,
                "currency="            + currency,
                "order_invoice_number=" + txnRef,
                "order_description="   + description,
                "success_url="         + returnUrl,
                "cancel_url="          + cancelUrl
        );
        String signature = hmacSha256Base64(dataToSign, secretKey);

        // 3. Body POST lên SePay
        // URL form submit: được cấu hình qua api-url trong application.yaml
        // Sandbox : https://pay-sandbox.sepay.vn
        // Production: https://pay.sepay.vn
        String checkoutFormUrl = sePayApiUrl + "/v1/checkout/init";

        // Dùng LinkedHashMap để giữ đúng thứ tự của các field → frontend dễ đọc
        Map<String, String> params = new LinkedHashMap<>();
        params.put("merchant",              merchantId);
        params.put("operation",             operation);
        params.put("order_amount",          String.valueOf(amount));
        params.put("currency",              currency);
        params.put("order_invoice_number",  txnRef);
        params.put("order_description",     description);
        params.put("success_url",           returnUrl);
        params.put("cancel_url",            cancelUrl);
        params.put("signature",             signature);

        String qrCodeUrl = String.format(
                "https://qr.sepay.vn/img?acc=%s&bank=%s&amount=%d&des=%s&template=compact",
                bankAccount,
                bankCode,
                amount,
                java.net.URLEncoder.encode(description, java.nio.charset.StandardCharsets.UTF_8)
        );

        return SePayCheckoutResponse.builder()
                .checkoutFormUrl(checkoutFormUrl)
                .params(params)
                .qrCodeUrl(qrCodeUrl)
                .bankCode(bankCode)
                .bankAccount(bankAccount)
                .description(description)
                .amount(amount)
                .build();
    }

    /**
     * Cập nhật trạng thái PaymentTransaction, Payment và BookLoan sau khi nhận
     * xác nhận thanh toán thành công từ SePay webhook.
     * Hàm này thuần DB, không phụ thuộc vào cổng thanh toán cụ thể.
     */
    @Override
    @Transactional
    public PaymentTransactionResponse updatePaymentAndLoanStatus(
            String txnRef,
            boolean success,
            String gatewayTransactionId,
            String failureReason
    ) {
        PaymentTransaction transaction = paymentTransactionRepository.findByTxnRef(txnRef)
                .orElseThrow(() -> new PaymentException("Payment transaction not found with txnRef: " + txnRef));

        Payment payment   = transaction.getPayment();
        BookLoan bookLoan = payment.getBookLoan();

        transaction.setGatewayPaymentId(gatewayTransactionId);
        transaction.setFailureReason(failureReason);
        transaction.setCompletedAt(LocalDateTime.now());

        if (success) {
            transaction.setStatus(TransactionStatus.SUCCESS);
            payment.setStatus(PaymentStatus.SUCCESS);
            if (PaymentType.LOAN_FEE.equals(payment.getType())) {
                activateBookLoan(bookLoan);
            } else if (PaymentType.FINE.equals(payment.getType())) {
                Fine fine = payment.getFine();
                if (fine != null) {
                    fine.applyPayment(transaction.getAmount());
                    fineRepository.save(fine);
                }
            } else if (PaymentType.SUBSCRIPTION.equals(payment.getType())) {
                Subscription sub = payment.getSubscription();
                if (sub != null) {
                    sub.setIsActive(true);
                    sub.setStartDate(LocalDateTime.now());
                    sub.calculateEndDate();
                    subscriptionRepository.save(sub);
                }
            }
        } else {
            transaction.setStatus(TransactionStatus.FAILED);
            payment.setStatus(PaymentStatus.FAILED);
        }

        PaymentTransaction savedTransaction = paymentTransactionRepository.save(transaction);
        paymentRepository.save(payment);

        return toResponse(savedTransaction);
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    /**
     * Tính chữ ký HMAC-SHA256 và encode Base64.
     * SePay pgapi yêu cầu Base64, khác với VNPay dùng Hex.
     */
    private String hmacSha256Base64(String data, String key) {
        try {
            Mac sha256Hmac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(
                    key.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            sha256Hmac.init(secretKeySpec);
            byte[] hashBytes = sha256Hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hashBytes);
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new PaymentException("Failed to calculate HMAC-SHA256 signature: " + e.getMessage());
        }
    }

    private void activateBookLoan(BookLoan bookLoan) {
        if (bookLoan == null) {
            return;
        }
        // Idempotent guards
        if (LoanStatus.PENDING_PICKUP.equals(bookLoan.getStatus())
                || LoanStatus.CHECKED_OUT.equals(bookLoan.getStatus())) {
            return;
        }
        if (LoanStatus.CANCELED.equals(bookLoan.getStatus())) {
            throw new PaymentException("Đơn mượn sách này đã bị hủy do quá hạn thanh toán.");
        }

        // Chuyển sang PENDING_PICKUP — đã trả tiền, chờ Admin giao sách vật lý tại quầy.
        // checkout_date / due_date sẽ được tính khi Admin bấm "Xác nhận giao sách".
        bookLoan.setStatus(LoanStatus.PENDING_PICKUP);
        bookLoan.setPaymentStatus("PAID");
    }

    private long getLoanDays(BookLoan bookLoan) {
        return switch (bookLoan.getType()) {
            case SHORT_TERM -> 3;
            case NORMAL     -> 14;
        };
    }

    private PaymentTransactionResponse toResponse(PaymentTransaction transaction) {
        return PaymentTransactionResponse.builder()
                .id(transaction.getId())
                .paymentId(transaction.getPayment().getId())
                .txnRef(transaction.getTxnRef())
                .gatewayPaymentId(transaction.getGatewayPaymentId())
                .gatewaySignature(transaction.getGatewaySignature())
                .bankCode(transaction.getBankCode())
                .description(transaction.getDescription())
                .amount(transaction.getAmount())
                .status(transaction.getStatus())
                .failureReason(transaction.getFailureReason())
                .completedAt(transaction.getCompletedAt())
                .createdAt(transaction.getCreatedAt())
                .updatedAt(transaction.getUpdatedAt())
                .build();
    }
}
