package com.thanh.librarymanagementsystem.controller;

import com.thanh.librarymanagementsystem.model.Notification;
import com.thanh.librarymanagementsystem.model.User;
import com.thanh.librarymanagementsystem.payload.response.ApiResponse;
import com.thanh.librarymanagementsystem.repository.NotificationRepository;
import com.thanh.librarymanagementsystem.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<Notification>>> getMyNotifications() {
        User user = userService.getCurrentUser();
        List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        return ResponseEntity.ok(new ApiResponse<>("Lấy thông báo thành công", true, notifications));
    }

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
