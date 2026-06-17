package com.thanh.librarymanagementsystem.payload.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Map;

/**
 * DTO chứa thông tin để frontend tạo HTML form và submit sang SePay.
 *
 * Frontend cần:
 *   1. Tạo <form method="POST" action="{checkoutFormUrl}">
 *   2. Với mỗi entry trong params: <input type="hidden" name="{key}" value="{value}"/>
 *   3. Submit form (hoặc auto-submit bằng JS)
 *
 * Sau khi submit, browser sẽ được SePay redirect sang trang thanh toán.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SePayCheckoutResponse {

    /**
     * URL endpoint SePay nhận form submit.
     * Sandbox:    https://pay-sandbox.sepay.vn/v1/checkout/init
     * Production: https://pay.sepay.vn/v1/checkout/init
     */
    private String checkoutFormUrl;

    /**
     * Tất cả các tham số (đã ký) cần đưa vào hidden inputs của form.
     * Key = tên field, Value = giá trị (đã convert sang String).
     */
    private Map<String, String> params;

    // Các trường bổ sung để hiển thị mã QR VietQR trực tiếp trong ứng dụng
    private String qrCodeUrl;
    private String bankCode;
    private String bankAccount;
    private String description;
    private Long amount;
}
