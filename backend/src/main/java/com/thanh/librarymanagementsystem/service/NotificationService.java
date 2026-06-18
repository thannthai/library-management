package com.thanh.librarymanagementsystem.service;

import com.thanh.librarymanagementsystem.enums.NotificationType;
import com.thanh.librarymanagementsystem.model.Notification;
import com.thanh.librarymanagementsystem.model.User;
import com.thanh.librarymanagementsystem.repository.NotificationRepository;
import com.thanh.librarymanagementsystem.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * ─── NOTIFICATION SERVICE ─────────────────────────────────────────────────────
 *
 * Service trung tâm xử lý toàn bộ luồng thông báo:
 *   1. Lưu bản ghi Notification vào database
 *   2. Đẩy event SSE real-time về browser nếu user đang online
 *   3. Gửi email (nếu sendEmail = true)
 *
 * Tất cả các service khác (Scheduler, FineService...) đều gọi qua đây
 * thay vì tự xử lý notification riêng lẻ.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SseEmitterManager sseEmitterManager;
    private final EmailService emailService;

    /**
     * Tạo thông báo cho một user cụ thể, đẩy SSE và (tuỳ chọn) gửi email.
     *
     * @param user       User nhận thông báo
     * @param title      Tiêu đề thông báo
     * @param message    Nội dung chi tiết
     * @param type       Loại thông báo (LOAN_EXPIRING, VIP_EXPIRY, FINE_ISSUED, RESERVATION_READY...)
     * @param sendEmail  true → gửi thêm email cho user
     */
    @Transactional
    public void createAndPush(User user, String title, String message, NotificationType type, boolean sendEmail) {
        // ── Bước 1: Lưu thông báo vào database ──────────────────────────────────
        Notification notification = Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .type(type)
                .isRead(false)
                .build();
        Notification saved = notificationRepository.save(notification);

        // ── Bước 2: Đẩy SSE về browser nếu user đang online ────────────────────
        // Payload gửi qua SSE — FE sẽ nhận và cập nhật badge + hiện toast
        Map<String, Object> ssePayload = new HashMap<>();
        ssePayload.put("id", saved.getId());
        ssePayload.put("title", title);
        ssePayload.put("message", message);
        ssePayload.put("type", type.name());
        ssePayload.put("isRead", false);
        sseEmitterManager.send(user.getId(), ssePayload);

        // ── Bước 3: Gửi email (nếu được yêu cầu) ───────────────────────────────
        if (sendEmail) {
            try {
                // Tạo nội dung HTML email đơn giản
                String emailBody = buildEmailHtml(title, message);
                emailService.sendEmail(user.getEmail(), "[BookNest] " + title, emailBody);
            } catch (Exception e) {
                // Email lỗi không được phép làm hỏng luồng chính
                log.warn("[Notification] Failed to send email to {}: {}", user.getEmail(), e.getMessage());
            }
        }
    }

    /**
     * Tạo thông báo và đẩy SSE tới tất cả Admin trong hệ thống.
     * Dùng cho các sự kiện Admin cần biết ngay (ví dụ: user bị quá hạn sách).
     *
     * @param title   Tiêu đề thông báo
     * @param message Nội dung chi tiết
     * @param type    Loại thông báo
     */
    @Transactional
    public void createAndPushToAllAdmins(String title, String message, NotificationType type) {
        // Tìm tất cả Admin trong hệ thống
        List<User> admins = userRepository.findAllAdmins();
        for (User admin : admins) {
            createAndPush(admin, title, message, type, false); // Admin không cần nhận email spam
        }
    }

    /**
     * Xây dựng template email HTML đơn giản.
     */
    private String buildEmailHtml(String title, String message) {
        return "<div style='font-family:sans-serif;max-width:600px;margin:auto;padding:24px'>"
                + "<div style='background:#4338ca;padding:16px 24px;border-radius:12px 12px 0 0'>"
                + "<h2 style='color:white;margin:0'>📚 BookNest</h2>"
                + "</div>"
                + "<div style='border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 12px 12px'>"
                + "<h3 style='color:#1e293b'>" + title + "</h3>"
                + "<p style='color:#475569;line-height:1.6'>" + message + "</p>"
                + "<hr style='border:none;border-top:1px solid #e2e8f0;margin:20px 0'>"
                + "<p style='color:#94a3b8;font-size:12px'>Thư này được gửi tự động từ hệ thống BookNest. Vui lòng không reply lại email này.</p>"
                + "</div>"
                + "</div>";
    }
}
