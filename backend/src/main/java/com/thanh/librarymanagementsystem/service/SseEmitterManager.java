package com.thanh.librarymanagementsystem.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * ─── SSE EMITTER MANAGER ─────────────────────────────────────────────────────
 *
 * Bean Singleton quản lý tất cả các kết nối SSE đang hoạt động.
 *
 * Mỗi khi user mở tab BookNest, trình duyệt sẽ gọi endpoint /subscribe và
 * backend tạo ra một SseEmitter cho user đó, lưu vào Map này.
 *
 * Khi có sự kiện xảy ra (phạt quá hạn, gói VIP hết hạn...),
 * các service khác chỉ cần gọi send(userId, data) để đẩy thông báo về browser ngay lập tức.
 *
 * Dùng ConcurrentHashMap để đảm bảo thread-safe (nhiều cron job có thể gửi đồng thời).
 */
@Slf4j
@Component
public class SseEmitterManager {

    // Map lưu trữ: userId → SseEmitter đang hoạt động của user đó
    private final Map<Long, SseEmitter> emitters = new ConcurrentHashMap<>();

    /**
     * Đăng ký một SseEmitter mới cho user.
     * Được gọi khi user gọi GET /api/notifications/subscribe.
     *
     * @param userId  ID của user đang kết nối
     * @param emitter SseEmitter vừa được tạo cho kết nối này
     */
    public void register(Long userId, SseEmitter emitter) {
        // Nếu user đã có kết nối cũ (ví dụ mở tab mới), đóng kết nối cũ trước
        SseEmitter old = emitters.put(userId, emitter);
        if (old != null) {
            try {
                old.complete();
            } catch (Exception ignored) { /* kết nối cũ có thể đã đóng */ }
        }
        log.info("[SSE] User {} connected. Total active connections: {}", userId, emitters.size());
    }

    /**
     * Gửi một event SSE tới một user cụ thể theo userId.
     * Nếu user không online (không có emitter), event sẽ bị bỏ qua (user sẽ load lại khi vào app).
     *
     * @param userId  User cần nhận thông báo
     * @param payload Dữ liệu thông báo cần gửi (sẽ được JSON-serialize tự động)
     */
    public void send(Long userId, Object payload) {
        SseEmitter emitter = emitters.get(userId);
        if (emitter == null) {
            // User không online → bỏ qua, thông báo đã được lưu vào DB
            return;
        }
        try {
            // SseEmitter.event() tạo ra một SSE event với data là payload
            emitter.send(SseEmitter.event()
                    .name("NOTIFICATION")        // tên event để FE phân biệt loại event
                    .data(payload));             // dữ liệu được Spring tự động serialize thành JSON
        } catch (IOException e) {
            // Lỗi gửi → kết nối đã đứt, dọn dẹp
            log.warn("[SSE] Failed to send to user {}, removing emitter. Reason: {}", userId, e.getMessage());
            remove(userId);
        }
    }

    /**
     * Broadcast một event SSE tới tất cả các Admin đang online.
     * Dùng khi có sự kiện cần Admin biết ngay (ví dụ: có user bị quá hạn).
     *
     * @param adminIds Danh sách userId của các Admin cần nhận thông báo
     * @param payload  Dữ liệu thông báo
     */
    public void sendToAdmins(java.util.List<Long> adminIds, Object payload) {
        for (Long adminId : adminIds) {
            send(adminId, payload);
        }
    }

    /**
     * Xoá emitter của một user khỏi registry.
     * Được gọi khi kết nối kết thúc (timeout, error, user đóng tab).
     *
     * @param userId ID của user cần xoá
     */
    public void remove(Long userId) {
        emitters.remove(userId);
        log.info("[SSE] User {} disconnected. Total active connections: {}", userId, emitters.size());
    }
}
