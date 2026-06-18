package com.thanh.librarymanagementsystem.service.impl;

import com.thanh.librarymanagementsystem.enums.NotificationType;
import com.thanh.librarymanagementsystem.model.BookLoan;
import com.thanh.librarymanagementsystem.model.Subscription;
import com.thanh.librarymanagementsystem.repository.BookLoanRepository;
import com.thanh.librarymanagementsystem.repository.SubscriptionRepository;
import com.thanh.librarymanagementsystem.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * ─── NOTIFICATION SCHEDULER ──────────────────────────────────────────────────
 *
 * Cron job chạy mỗi sáng 08:00 (Asia/Ho_Chi_Minh) để kiểm tra và gửi
 * thông báo nhắc nhở cho người dùng trước khi quá hạn.
 *
 * Có 2 job:
 *
 * ── JOB A — LOAN_EXPIRING ────────────────────────────────────────────────────
 *   Quét các đơn mượn CHECKED_OUT có dueDate trong vòng 24 giờ tới.
 *   → Gửi thông báo + email cho user nhắc trả sách ngày mai.
 *
 * ── JOB B — VIP_EXPIRY ───────────────────────────────────────────────────────
 *   Quét các gói subscription còn ≤ 3 ngày là hết hạn.
 *   → Gửi thông báo + email cho user nhắc gia hạn gói.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationScheduler {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final BookLoanRepository  bookLoanRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final NotificationService notificationService;

    // ─────────────────────────────────────────────────────────────────────────
    // JOB A — LOAN EXPIRING (08:00 hàng ngày)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Tìm tất cả đơn mượn sách đang CHECKED_OUT sắp hết hạn trong vòng 24 giờ tới.
     * Gửi thông báo nhắc nhở tới từng user qua SSE + email.
     *
     * Ví dụ: Nếu hôm nay là ngày 20, job này sẽ cảnh báo các đơn hết hạn vào ngày 21.
     */
    @Scheduled(cron = "0 0 8 * * ?", zone = "Asia/Ho_Chi_Minh")
    @Transactional(readOnly = true)
    public void notifyExpiringLoans() {
        log.info("[NotificationScheduler] Starting LOAN_EXPIRING job...");

        LocalDateTime now      = LocalDateTime.now();
        LocalDateTime tomorrow = now.plusDays(1); // trong 24 giờ tới

        // Lấy danh sách đơn mượn sắp hết hạn
        List<BookLoan> expiringLoans = bookLoanRepository.findLoansExpiringSoon(now, tomorrow);

        int count = 0;
        for (BookLoan loan : expiringLoans) {
            try {
                String bookTitle  = loan.getBookCopy().getBook().getTitle();
                String dueDate    = loan.getDueDate().format(DATE_FORMATTER);

                String title   = "📚 Sách sắp hết hạn mượn!";
                String message = String.format(
                        "Cuốn sách \"%s\" của bạn sẽ hết hạn vào ngày %s. " +
                        "Vui lòng trả sách đúng hạn để tránh bị phạt.",
                        bookTitle, dueDate
                );

                // Gửi thông báo qua SSE + email
                // sendEmail = true vì đây là cảnh báo quan trọng cần email nhắc nhở
                notificationService.createAndPush(loan.getUser(), title, message, NotificationType.LOAN_EXPIRING, true);
                count++;
            } catch (Exception e) {
                // Lỗi 1 đơn không ảnh hưởng các đơn còn lại
                log.error("[NotificationScheduler] Error processing loan {}: {}", loan.getId(), e.getMessage());
            }
        }

        log.info("[NotificationScheduler] LOAN_EXPIRING job done. Notified {} loans.", count);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // JOB B — VIP EXPIRY (08:00 hàng ngày, chạy cùng giờ với Job A)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Tìm tất cả gói subscription đang ACTIVE còn ≤ 3 ngày là hết hạn.
     * Gửi thông báo nhắc nhở tới user qua SSE + email.
     *
     * Gói FREE (price = 0) cũng được cảnh báo (để user biết cần mua lại gói mới).
     */
    @Scheduled(cron = "0 0 8 * * ?", zone = "Asia/Ho_Chi_Minh")
    @Transactional(readOnly = true)
    public void notifyExpiringSubscriptions() {
        log.info("[NotificationScheduler] Starting VIP_EXPIRY job...");

        LocalDateTime now     = LocalDateTime.now();
        LocalDateTime in3days = now.plusDays(3); // còn 3 ngày

        // Lấy danh sách gói sắp hết hạn
        List<Subscription> expiring = subscriptionRepository.findExpiringSubscriptions(now, in3days);

        int count = 0;
        for (Subscription sub : expiring) {
            try {
                String planName = sub.getPlanName() != null ? sub.getPlanName() : "gói hiện tại";
                String endDate  = sub.getEndDate().format(DATE_FORMATTER);
                long daysLeft   = sub.getDaysRemaining();

                String title   = "⚠️ Gói thành viên sắp hết hạn!";
                String message = String.format(
                        "%s của bạn sẽ hết hạn vào ngày %s (còn %d ngày). " +
                        "Vui lòng liên hệ thủ thư để gia hạn gói tại quầy.",
                        planName, endDate, daysLeft
                );

                // Gửi thông báo qua SSE + email
                // sendEmail = true vì đây là cảnh báo quan trọng
                notificationService.createAndPush(sub.getUser(), title, message, NotificationType.VIP_EXPIRY, true);
                count++;
            } catch (Exception e) {
                log.error("[NotificationScheduler] Error processing subscription {}: {}", sub.getId(), e.getMessage());
            }
        }

        log.info("[NotificationScheduler] VIP_EXPIRY job done. Notified {} subscriptions.", count);
    }
}
