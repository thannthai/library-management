package com.thanh.librarymanagementsystem.service;

import com.thanh.librarymanagementsystem.enums.FineStatus;
import com.thanh.librarymanagementsystem.enums.FineType;
import com.thanh.librarymanagementsystem.enums.LoanStatus;
import com.thanh.librarymanagementsystem.model.BookLoan;
import com.thanh.librarymanagementsystem.model.Fine;
import com.thanh.librarymanagementsystem.repository.BookLoanRepository;
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
 * Scheduler chạy ngầm hàng đêm để tự động quét và tích lũy tiền phạt
 * cho tất cả các đơn mượn sách đã quá hạn mà chưa được trả.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OverdueScheduler {

    /** Mức phạt cố định mỗi ngày quá hạn (đơn vị: VND) */
    private static final long FINE_PER_DAY = 5_000L;

    private final BookLoanRepository bookLoanRepository;
    private final FineRepository fineRepository;

    /**
     * Hàm quét phạt tự động — chạy vào lúc 00:00:00 mỗi đêm.
     *
     * <p>Luồng xử lý:</p>
     * <ol>
     *   <li>Lấy toàn bộ đơn mượn có trạng thái CHECKED_OUT hoặc OVERDUE mà dueDate đã qua.</li>
     *   <li>Với mỗi đơn quá hạn:
     *     <ul>
     *       <li>Nếu đang CHECKED_OUT → chuyển sang OVERDUE.</li>
     *       <li>Nếu chưa có phiếu phạt PENDING → tạo phiếu phạt mới (ngày đầu tiên quá hạn).</li>
     *       <li>Nếu đã có phiếu phạt PENDING → cộng dồn thêm 5.000 VND và cập nhật lý do.</li>
     *     </ul>
     *   </li>
     * </ol>
     *
     * <p>Toàn bộ hàm được bọc trong @Transactional để đảm bảo tính toàn vẹn dữ liệu —
     * nếu có lỗi xảy ra giữa chừng thì toàn bộ thay đổi sẽ được rollback.</p>
     */
    @Transactional
    @Scheduled(cron = "0 0 0 * * ?")
    public void scanAndUpdateOverdueFines() {
        LocalDateTime now = LocalDateTime.now();

        log.info("[OverdueScheduler] Bắt đầu quét phạt quá hạn lúc: {}", now);

        // Tìm tất cả đơn mượn đang hoạt động (CHECKED_OUT) hoặc đã quá hạn (OVERDUE)
        // mà dueDate đã qua thời điểm hiện tại → những đơn này cần xử lý phạt
        List<BookLoan> overdueLoans = bookLoanRepository.findOverdueLoans(
                List.of(LoanStatus.CHECKED_OUT, LoanStatus.OVERDUE),
                now
        );

        log.info("[OverdueScheduler] Tìm thấy {} đơn mượn quá hạn.", overdueLoans.size());

        for (BookLoan loan : overdueLoans) {
            try {
                processOverdueLoan(loan, now);
            } catch (Exception e) {
                // Log lỗi từng đơn nhưng không dừng toàn bộ job
                log.error("[OverdueScheduler] Lỗi khi xử lý đơn mượn ID={}: {}", loan.getId(), e.getMessage());
            }
        }

        log.info("[OverdueScheduler] Hoàn tất quét phạt quá hạn.");
    }

    /**
     * Xử lý logic phạt cho một đơn mượn quá hạn.
     *
     * @param loan đơn mượn cần xử lý
     * @param now  thời điểm hiện tại
     */
    private void processOverdueLoan(BookLoan loan, LocalDateTime now) {
        // ── Bước 1: Chuyển trạng thái đơn từ CHECKED_OUT sang OVERDUE nếu chưa ──
        if (loan.getStatus() == LoanStatus.CHECKED_OUT) {
            loan.setStatus(LoanStatus.OVERDUE);
            loan.setIsOverdue(true);
            bookLoanRepository.save(loan);
            log.info("[OverdueScheduler] Đơn ID={} chuyển trạng thái → OVERDUE", loan.getId());
        }

        // ── Bước 2: Tính số ngày quá hạn thực tế ──
        long overdueDays = ChronoUnit.DAYS.between(loan.getDueDate(), now);
        if (overdueDays < 1) overdueDays = 1; // Tối thiểu 1 ngày để tránh edge case lúc 00:00

        // ── Bước 3: Cập nhật overdueDays trên đơn mượn ──
        loan.setOverdueDays((short) Math.min(overdueDays, Short.MAX_VALUE));
        bookLoanRepository.save(loan);

        // ── Bước 4: Kiểm tra xem đã có phiếu phạt PENDING chưa ──
        Optional<Fine> existingFineOpt = fineRepository.findByBookLoanIdAndStatus(loan.getId(), FineStatus.PENDING);

        if (existingFineOpt.isEmpty()) {
            // ── Trường hợp A: Ngày đầu tiên quá hạn → Tạo phiếu phạt mới ──
            Fine newFine = Fine.builder()
                    .bookLoan(loan)
                    .user(loan.getUser())
                    .type(FineType.OVERDUE)
                    .amount(FINE_PER_DAY)
                    .reason(String.format(
                            "Quá hạn mượn sách ngày đầu tiên. Mã vạch: %s — Hạn trả: %s",
                            loan.getBookCopy().getBarcode(),
                            loan.getDueDate().toLocalDate()
                    ))
                    .build();

            fineRepository.save(newFine);
            log.info("[OverdueScheduler] Tạo phiếu phạt mới cho đơn ID={}, số tiền: {} VND", loan.getId(), FINE_PER_DAY);

        } else {
            // ── Trường hợp B: Đã có phiếu phạt từ trước → Cộng dồn tiền phạt ──
            Fine existingFine = existingFineOpt.get();
            long newAmount = existingFine.getAmount() + FINE_PER_DAY;
            existingFine.setAmount(newAmount);
            existingFine.setReason(String.format(
                    "Quá hạn %d ngày. Mã vạch: %s — Hạn trả: %s — Tổng phạt tích lũy: %,d VND",
                    overdueDays,
                    loan.getBookCopy().getBarcode(),
                    loan.getDueDate().toLocalDate(),
                    newAmount
            ));

            fineRepository.save(existingFine);
            log.info("[OverdueScheduler] Cộng dồn phạt cho đơn ID={}: {} ngày quá hạn, tổng {} VND",
                    loan.getId(), overdueDays, newAmount);
        }
    }
}
