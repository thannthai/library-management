package com.thanh.librarymanagementsystem.service.impl;

import com.thanh.librarymanagementsystem.enums.CopyStatus;
import com.thanh.librarymanagementsystem.enums.FineStatus;
import com.thanh.librarymanagementsystem.enums.FineType;
import com.thanh.librarymanagementsystem.enums.LoanStatus;
import com.thanh.librarymanagementsystem.model.BookCopy;
import com.thanh.librarymanagementsystem.model.BookLoan;
import com.thanh.librarymanagementsystem.model.Fine;
import com.thanh.librarymanagementsystem.repository.BookCopyRepository;
import com.thanh.librarymanagementsystem.repository.BookLoanRepository;
import com.thanh.librarymanagementsystem.repository.BookRepository;
import com.thanh.librarymanagementsystem.repository.FineRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

/**
 * Cron job chạy mỗi đêm lúc 00:00 (Asia/Ho_Chi_Minh).
 *
 * Job 1 — OVERDUE DETECTION:
 *   Quét tất cả đơn CHECKED_OUT có dueDate < now() → chuyển sang OVERDUE,
 *   cộng dồn phạt 5,000 VND/ngày. Nếu đã có Fine PENDING thì cộng thêm,
 *   chưa có thì tạo mới.
 *
 * Job 2 — PICKUP EXPIRY (24h):
 *   Quét tất cả đơn PENDING_PICKUP có updatedAt < now() - 24h →
 *   chuyển sang CANCELED, nhả BookCopy về AVAILABLE, cộng ngược availableCopies.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OverdueLoanScheduler {

    private static final long OVERDUE_FINE_PER_DAY = 5_000L; // 5,000 VND/ngày
    private static final int  PICKUP_EXPIRY_HOURS  = 24;      // 24h để ra nhận sách

    private final BookLoanRepository  bookLoanRepository;
    private final BookCopyRepository  bookCopyRepository;
    private final BookRepository      bookRepository;
    private final FineRepository      fineRepository;
    private final com.thanh.librarymanagementsystem.service.BookReservationService bookReservationService;

    // ─────────────────────────────────────────────────────────────────────────
    // JOB 1 — OVERDUE DETECTION (00:00 daily)
    // ─────────────────────────────────────────────────────────────────────────

    @Scheduled(cron = "0 0 0 * * ?", zone = "Asia/Ho_Chi_Minh")
    @Transactional
    public void markOverdueLoans() {
        log.info("[Scheduler] ⏰ Starting overdue-detection job...");
        LocalDateTime now = LocalDateTime.now();

        List<BookLoan> overdueLoans = bookLoanRepository.findOverdueLoans(
                List.of(LoanStatus.CHECKED_OUT, LoanStatus.OVERDUE),
                now
        );

        int processed = 0;
        for (BookLoan loan : overdueLoans) {
            try {
                long overdueDays = ChronoUnit.DAYS.between(loan.getDueDate(), now);
                if (overdueDays < 1) overdueDays = 1;

                loan.setStatus(LoanStatus.OVERDUE);
                loan.setIsOverdue(true);
                loan.setOverdueDays((short) overdueDays);

                long dailyFine = OVERDUE_FINE_PER_DAY;
                long totalFine = overdueDays * dailyFine;

                // Tìm Fine PENDING hiện tại — nếu có thì cập nhật, không thì tạo mới
                Optional<Fine> existingFine = fineRepository
                        .findByBookLoanIdAndStatus(loan.getId(), FineStatus.PENDING);

                if (existingFine.isPresent()) {
                    Fine fine = existingFine.get();
                    fine.setAmount(totalFine); // Cộng dồn lại tổng
                    fine.setReason("Quá hạn " + overdueDays + " ngày (cập nhật tự động)");
                    fineRepository.save(fine);
                } else {
                    Fine fine = Fine.builder()
                            .bookLoan(loan)
                            .user(loan.getUser())
                            .type(FineType.OVERDUE)
                            .amount(totalFine)
                            .amountPaid(0L)
                            .status(FineStatus.PENDING)
                            .reason("Quá hạn " + overdueDays + " ngày (hạn trả: "
                                    + loan.getDueDate().toLocalDate() + ")")
                            .build();
                    fineRepository.save(fine);
                }

                bookLoanRepository.save(loan);
                processed++;
            } catch (Exception e) {
                log.error("[Scheduler] Error processing overdue loan {}: {}", loan.getId(), e.getMessage());
            }
        }

        log.info("[Scheduler] ✅ Overdue detection complete. Processed {} loans.", processed);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // JOB 2 — PICKUP EXPIRY (00:00 daily, 24h cutoff)
    // ─────────────────────────────────────────────────────────────────────────

    @Scheduled(cron = "0 5 0 * * ?", zone = "Asia/Ho_Chi_Minh")  // 00:05 (5 phút sau Job 1)
    @Transactional
    public void cancelExpiredPickupLoans() {
        log.info("[Scheduler] ⏰ Starting pickup-expiry job (24h rule)...");
        
        // Trước tiên hủy các đặt trước (reservations) quá hạn 48h
        try {
            bookReservationService.expireUnpickedReservations();
        } catch (Exception e) {
            log.error("[Scheduler] Lỗi khi xử lý hủy đặt trước quá hạn: {}", e.getMessage());
        }

        LocalDateTime cutoff = LocalDateTime.now().minusHours(PICKUP_EXPIRY_HOURS);

        List<BookLoan> expiredPickups = bookLoanRepository.findExpiredPickupLoans(cutoff);

        int canceled = 0;
        for (BookLoan loan : expiredPickups) {
            try {
                loan.setStatus(LoanStatus.CANCELED);
                loan.setNotes("Tự động hủy: Quá 24h không ra nhận sách tại quầy.");

                // Nhả bản sao vật lý về kệ
                BookCopy bookCopy = loan.getBookCopy();
                if (bookCopy != null) {
                    bookCopy.setStatus(CopyStatus.AVAILABLE);
                    bookCopyRepository.save(bookCopy);

                    var book = bookCopy.getBook();
                    if (book != null) {
                        int current = book.getAvailableCopies() == null ? 0 : book.getAvailableCopies();
                        book.setAvailableCopies(current + 1);
                        bookRepository.save(book);
                    }
                }

                bookLoanRepository.save(loan);
                canceled++;
                log.info("[Scheduler] Loan {} CANCELED (pickup expired). Book copy restored.", loan.getId());
            } catch (Exception e) {
                log.error("[Scheduler] Error canceling expired pickup loan {}: {}", loan.getId(), e.getMessage());
            }
        }

        log.info("[Scheduler] ✅ Pickup-expiry job complete. Canceled {} loans.", canceled);
    }
}
