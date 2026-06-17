package com.thanh.librarymanagementsystem.controller;

import com.thanh.librarymanagementsystem.payload.response.ApiResponse;
import com.thanh.librarymanagementsystem.payload.response.PaymentTransactionResponse;
import com.thanh.librarymanagementsystem.model.PaymentTransaction;
import com.thanh.librarymanagementsystem.repository.PaymentTransactionRepository;
import com.thanh.librarymanagementsystem.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.HashMap;

@Slf4j
@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {
    private final PaymentService paymentService;
    private final RedisTemplate<String, Object> redisTemplate;
    private final PaymentTransactionRepository paymentTransactionRepository;

    @Value("${sepay.webhook-token}")
    private String webhookToken;

    /**
     * Webhook IPN nhận từ SePay sau khi giao dịch hoàn tất.
     * SePay POST một JSON object chứa các trường như:
     *   - content: nội dung chuyển khoản (chứa txnRef, ví dụ "SEVQR BL1012345678")
     *   - id: mã giao dịch phía SePay
     *   - transferAmount: số tiền thực nhận
     *
     * Đã tích hợp bảo mật API Key kiểm tra Header Authorization: "Apikey <token>"
     */
    @PostMapping("/sepay/webhook")
    public ResponseEntity<?> handleSePayWebhook(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Map<String, Object> payload
    ) {
        log.info("[SePay Webhook] Received payload: {}", payload);

        // 1. Xác thực Webhook API Key bảo mật
        String expectedHeader = "Apikey " + webhookToken;
        if (authHeader == null || !authHeader.equals(expectedHeader)) {
            log.warn("[SePay Webhook] Unauthorized request. Header: {}", authHeader);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>("Unauthorized: Invalid Webhook API Key", false, null));
        }

        // 2. Trích xuất txnRef từ nội dung chuyển khoản
        String transferContent = (String) payload.getOrDefault("content", "");
        if (transferContent == null || transferContent.isBlank()) {
            transferContent = (String) payload.getOrDefault("transferContent", "");
        }
        log.info("[SePay Webhook] Transfer content: '{}'", transferContent);

        String txnRef = extractTxnRef(transferContent);
        log.info("[SePay Webhook] Extracted txnRef: '{}'", txnRef);

        if (txnRef == null || txnRef.isBlank()) {
            log.warn("[SePay Webhook] Cannot extract txnRef from content: '{}'", transferContent);
            Map<String, Object> errMap = new HashMap<>();
            errMap.put("success", false);
            errMap.put("message", "Cannot extract txnRef from transfer content: '" + transferContent + "'. Expected format: 'SEVQR BL<loanId><digits>'");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errMap);
        }

        // 3. Tìm giao dịch trong DB để lấy số tiền cần thanh toán thực tế (động theo Book Loan, Fine hoặc Subscription)
        PaymentTransaction transaction = paymentTransactionRepository.findByTxnRef(txnRef).orElse(null);
        if (transaction == null) {
            log.warn("[SePay Webhook] Transaction not found for txnRef '{}'", txnRef);
            Map<String, Object> errMap = new HashMap<>();
            errMap.put("success", false);
            errMap.put("message", "Transaction not found for txnRef: " + txnRef);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errMap);
        }

        long expectedAmount = transaction.getAmount();
        Object rawAmount = payload.get("transferAmount");
        long actualAmount = 0L;
        if (rawAmount instanceof Number) {
            actualAmount = ((Number) rawAmount).longValue();
        } else if (rawAmount instanceof String s && !s.isBlank()) {
            try {
                actualAmount = Long.parseLong(s.trim());
            } catch (NumberFormatException ignored) {
                actualAmount = 0L;
            }
        }

        if (actualAmount != expectedAmount) {
            log.warn("[SePay Webhook] Invalid amount for txnRef '{}': expected={}, actual={}", txnRef, expectedAmount, actualAmount);
            Map<String, Object> errMap = new HashMap<>();
            errMap.put("success", false);
            errMap.put("message", "Invalid amount: expected " + expectedAmount + " VND, but received " + actualAmount + " VND.");
            return ResponseEntity.ok(errMap);
        }

        String gatewayTransactionId = String.valueOf(payload.getOrDefault("id", ""));

        PaymentTransactionResponse response = paymentService.updatePaymentAndLoanStatus(
                txnRef,
                true,
                gatewayTransactionId,
                null
        );
        log.info("[SePay Webhook] Successfully processed txnRef: {}", txnRef);

        try {
            if (txnRef.startsWith("BL")) {
                // Cắt chuỗi lấy loanId ở giữa: Bỏ 2 chữ cái đầu "BL" và bỏ 8 chữ số ngẫu nhiên cuối cùng
                String loanIdStr = txnRef.substring(2, txnRef.length() - 8);
                Long loanId = Long.parseLong(loanIdStr);
                
                String redisKey = "loan:hold:" + loanId;
                String statusKey = "loan:status:" + loanId;
                
                // Thực hiện xóa key trên Redis
                Boolean isDeleted = redisTemplate.delete(redisKey);

                redisTemplate.opsForValue().set(statusKey, "PENDING_PICKUP", 60, TimeUnit.SECONDS);
                
                if (Boolean.TRUE.equals(isDeleted)) {
                    log.info("[SePay Webhook] Successfully removed Redis hold key: {}", redisKey);
                } else {
                    log.warn("[SePay Webhook] Redis key {} not found or already expired!", redisKey);
                }
            }
        } catch (Exception e) {
            // Bọc try-catch riêng để nếu lỗi Redis (ví dụ mất kết nối mạng tạm thời) 
            // thì vẫn trả về thành công cho SePay, không làm rollback dữ liệu tiền tệ MySQL bên trên.
            log.error("[SePay Webhook] Error while deleting Redis key for txnRef: " + txnRef, e);
        }

        Map<String, Object> responseMap = new HashMap<>();
        responseMap.put("success", true);
        responseMap.put("message", "SePay webhook processed successfully");
        responseMap.put("data", response);

        return ResponseEntity.ok(responseMap);
    }

    /**
     * Trích xuất mã đơn hàng (txnRef) từ nội dung chuyển khoản SePay.
     *
     * Các format txnRef hợp lệ trong hệ thống:
     *   - "BL" + loanId + 8digits  (Book Loan)
     *   - "FN" + fineId + 8digits  (Fine)
     *   - "SUB" + subId + 8digits  (Subscription)
     *
     * SePay gửi nội dung dạng: "SEVQR BL10212345678"
     * Fallback: tìm bất kỳ token nào khớp pattern [A-Z]{2,3}\d+ trong content.
     */
    private String extractTxnRef(String transferContent) {
        if (transferContent == null || transferContent.isBlank()) {
            return null;
        }

        // Ưu tiên: tìm token khớp [BL|FN|SUB]\d+ trong toàn bộ content
        String[] tokens = transferContent.trim().split("\\s+");
        for (String token : tokens) {
            // Match BL, FN, SUB đi theo sau là ít nhất 4 chữ số
            if (token.matches("(BL|FN|SUB)\\d{4,}.*")) {
                return token.replaceAll("[^A-Za-z0-9]", "").trim();
            }
        }

        // Fallback: lấy token đầu tiên sau "SEVQR "
        String prefix = "SEVQR ";
        int idx = transferContent.indexOf(prefix);
        if (idx >= 0) {
            String after = transferContent.substring(idx + prefix.length()).trim();
            String firstToken = after.split("\\s+")[0];
            if (!firstToken.isBlank()) {
                return firstToken;
            }
        }

        return null;
    }
}
