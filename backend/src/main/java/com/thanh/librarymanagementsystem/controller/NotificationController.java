package com.thanh.librarymanagementsystem.controller;

import com.thanh.librarymanagementsystem.model.Notification;
import com.thanh.librarymanagementsystem.model.User;
import com.thanh.librarymanagementsystem.payload.response.ApiResponse;
import com.thanh.librarymanagementsystem.repository.NotificationRepository;
import com.thanh.librarymanagementsystem.service.SseEmitterManager;
import com.thanh.librarymanagementsystem.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final UserService userService;
    private final SseEmitterManager sseEmitterManager; // ← SSE manager

    // ─────────────────────────────────────────────────────────────────────────
    // SSE — Subscribe endpoint
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * ── SSE SUBSCRIBE ────────────────────────────────────────────────────────
     *
     * FE gọi endpoint này 1 lần khi load trang để thiết lập kênh nhận thông báo real-time.
     * Backend giữ kết nối HTTP mở (long-lived connection) và đẩy event bất cứ khi nào có thông báo mới.
     *
     * Cơ chế:
     *   1. Tạo SseEmitter với timeout 5 phút (browser tự reconnect nếu bị ngắt)
     *   2. Đăng ký emitter vào SseEmitterManager với userId
     *   3. Gửi event "CONNECTED" để FE biết kết nối thành công
     *   4. Đăng ký callback cleanup khi kết nối kết thúc (timeout / lỗi / đóng tab)
     *
     * Response header: Content-Type: text/event-stream (theo chuẩn SSE W3C)
     */
    @GetMapping(value = "/subscribe", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public SseEmitter subscribe() {
        User user = userService.getCurrentUser();
        Long userId = user.getId();

        // Tạo SseEmitter với timeout 5 phút (300,000ms)
        // Sau 5 phút không có event, kết nối sẽ tự đóng và FE reconnect
        SseEmitter emitter = new SseEmitter(300_000L);

        // Đăng ký emitter vào central registry
        sseEmitterManager.register(userId, emitter);

        // Callback cleanup khi kết nối kết thúc theo các cách khác nhau
        emitter.onCompletion(() -> sseEmitterManager.remove(userId));  // kết nối hoàn thành (hết timeout)
        emitter.onTimeout(() -> sseEmitterManager.remove(userId));     // timeout
        emitter.onError(e -> sseEmitterManager.remove(userId));        // lỗi network

        // Gửi event "CONNECTED" ngay lập tức để confirm kết nối thành công
        // FE dùng event này để biết SSE đang hoạt động
        try {
            emitter.send(SseEmitter.event()
                    .name("CONNECTED")                   // tên event (FE dùng addEventListener("CONNECTED"))
                    .data("SSE connection established")); // data string để xác nhận
        } catch (IOException e) {
            // Nếu gửi event đầu tiên đã lỗi, đóng kết nối ngay
            log.warn("[SSE] Failed to send CONNECTED event to user {}", userId);
            sseEmitterManager.remove(userId);
            emitter.completeWithError(e);
        }

        return emitter;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // REST — Các endpoint cũ (giữ nguyên)
    // ─────────────────────────────────────────────────────────────────────────

    /** Lấy danh sách thông báo của user hiện tại (dùng cho lần load đầu tiên). */
    @GetMapping
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<Notification>>> getMyNotifications() {
        User user = userService.getCurrentUser();
        List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        return ResponseEntity.ok(new ApiResponse<>("Lấy thông báo thành công", true, notifications));
    }

    /** Đánh dấu một thông báo là đã đọc. */
    @PutMapping("/{id}/read")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable Long id) {
        User user = userService.getCurrentUser();
        notificationRepository.findById(id).ifPresent(notification -> {
            if (notification.getUser().getId().equals(user.getId())) {
                notification.setIsRead(true);
                notificationRepository.save(notification);
            }
        });
        return ResponseEntity.ok(new ApiResponse<>("Đã đánh dấu đọc", true, null));
    }

    /** Đánh dấu tất cả thông báo là đã đọc. */
    @PutMapping("/read-all")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead() {
        User user = userService.getCurrentUser();
        List<Notification> unread = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .filter(n -> !n.getIsRead())
                .collect(java.util.stream.Collectors.toList());
        unread.forEach(n -> n.setIsRead(true));
        notificationRepository.saveAll(unread);
        return ResponseEntity.ok(new ApiResponse<>("Đã đánh dấu tất cả là đã đọc", true, null));
    }
}
