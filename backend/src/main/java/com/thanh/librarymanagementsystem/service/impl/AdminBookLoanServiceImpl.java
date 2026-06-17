package com.thanh.librarymanagementsystem.service.impl;

import com.thanh.librarymanagementsystem.enums.CopyStatus;
import com.thanh.librarymanagementsystem.enums.FineStatus;
import com.thanh.librarymanagementsystem.enums.FineType;
import com.thanh.librarymanagementsystem.enums.LoanStatus;
import com.thanh.librarymanagementsystem.enums.PaymentStatus;
import com.thanh.librarymanagementsystem.exception.BookLoanException;
import com.thanh.librarymanagementsystem.mapper.BookLoanMapper;
import com.thanh.librarymanagementsystem.model.BookCopy;
import com.thanh.librarymanagementsystem.model.BookLoan;
import com.thanh.librarymanagementsystem.model.Fine;
import com.thanh.librarymanagementsystem.payload.response.BookLoanResponse;
import com.thanh.librarymanagementsystem.payload.response.PageResponse;
import com.thanh.librarymanagementsystem.repository.BookCopyRepository;
import com.thanh.librarymanagementsystem.repository.BookLoanRepository;
import com.thanh.librarymanagementsystem.repository.BookRepository;
import com.thanh.librarymanagementsystem.repository.FineRepository;
import com.thanh.librarymanagementsystem.repository.PaymentRepository;
import com.thanh.librarymanagementsystem.service.AdminBookLoanService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminBookLoanServiceImpl implements AdminBookLoanService {

    private static final long OVERDUE_FINE_PER_DAY = 5_000L; // 5,000 VND/ngày
    private static final int  LOAN_DAYS_NORMAL      = 14;
    private static final int  LOAN_DAYS_SHORT        = 3;

    private final BookLoanRepository      bookLoanRepository;
    private final BookCopyRepository      bookCopyRepository;
    private final BookRepository          bookRepository;
    private final FineRepository          fineRepository;
    private final com.thanh.librarymanagementsystem.repository.SubscriptionRepository subscriptionRepository;
    private final com.thanh.librarymanagementsystem.service.BookReservationService bookReservationService;
    private final BookLoanMapper          bookLoanMapper;
    private final PaymentRepository       paymentRepository;

    // ─────────────────────────────────────────────────────────────────────────
    // GET LOANS (Admin — all users)
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public PageResponse<BookLoanResponse> getAdminLoans(String status, Pageable pageable) {
        Page<BookLoan> page;

        if (status == null || status.isBlank() || status.equalsIgnoreCase("ALL")) {
            page = bookLoanRepository.findAll(pageable);
        } else {
            try {
                LoanStatus loanStatus = LoanStatus.valueOf(status.toUpperCase());
                page = bookLoanRepository.findByStatus(loanStatus, pageable);
            } catch (IllegalArgumentException e) {
                throw new BookLoanException("Trạng thái đơn mượn không hợp lệ: " + status);
            }
        }

        List<BookLoanResponse> content = page.getContent()
                .stream()
                .map(bookLoanMapper::toDTO)
                .toList();

        return new PageResponse<>(
                content,
                page.getTotalElements(),
                page.getTotalPages(),
                page.getNumber(),
                page.getSize(),
                page.isFirst(),
                page.isLast(),
                page.isEmpty()
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PICKUP — Admin xác nhận giao sách tại quầy
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public BookLoanResponse pickupLoan(Long loanId) {
        BookLoan loan = bookLoanRepository.findById(loanId)
                .orElseThrow(() -> new BookLoanException("Không tìm thấy đơn mượn với ID: " + loanId));

        if (loan.getStatus() != LoanStatus.PENDING_PICKUP) {
            throw new BookLoanException(
                    "Chỉ có thể xác nhận giao sách cho đơn đang ở trạng thái PENDING_PICKUP. " +
                    "Trạng thái hiện tại: " + loan.getStatus());
        }

        // Tính ngày mượn và ngày hết hạn: VIP = 30 ngày, FREE = 7 ngày
        LocalDateTime now = LocalDateTime.now();
        List<com.thanh.librarymanagementsystem.model.Subscription> activeSubs = 
                subscriptionRepository.findActiveSubscriptionByUserId(loan.getUser().getId(), now);
        
        int loanDays = activeSubs.isEmpty() ? 7 : 30;

        loan.setStatus(LoanStatus.CHECKED_OUT);
        loan.setCheckoutDate(now);
        loan.setDueDate(now.plusDays(loanDays));

        try {
            bookLoanRepository.save(loan);
        } catch (OptimisticLockingFailureException e) {
            throw new BookLoanException("Đơn mượn vừa được cập nhật bởi thao tác khác. Vui lòng thử lại.");
        }

        log.info("[Admin Pickup] Loan {} checked out. Due date: {}", loanId, loan.getDueDate());
        return bookLoanMapper.toDTO(loan);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RETURN — Admin nhận trả sách tại quầy
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public Map<String, Object> returnLoan(Long loanId) {
        BookLoan loan = bookLoanRepository.findById(loanId)
                .orElseThrow(() -> new BookLoanException("Không tìm thấy đơn mượn với ID: " + loanId));

        if (loan.getStatus() != LoanStatus.CHECKED_OUT && loan.getStatus() != LoanStatus.OVERDUE) {
            throw new BookLoanException(
                    "Chỉ có thể nhận trả sách cho đơn đang ở trạng thái CHECKED_OUT hoặc OVERDUE. " +
                    "Trạng thái hiện tại: " + loan.getStatus());
        }

        LocalDateTime now = LocalDateTime.now();
        loan.setStatus(LoanStatus.RETURNED);
        loan.setActualReturnDate(now);

        // ── Hồi bản sao vật lý về kệ ──────────────────────────────────────
        BookCopy bookCopy = loan.getBookCopy();
        if (bookCopy != null) {
            bookCopy.setStatus(CopyStatus.AVAILABLE);
            bookCopyRepository.save(bookCopy);

            // Cộng ngược availableCopies
            var book = bookCopy.getBook();
            if (book != null) {
                book.setAvailableCopies((book.getAvailableCopies() == null ? 0 : book.getAvailableCopies()) + 1);
                bookRepository.save(book);
                
                // Gọi xử lý hàng đợi đặt trước (Reservation Queue)
                try {
                    bookReservationService.processQueueForReturnedBook(book.getId());
                } catch (Exception e) {
                    log.error("Lỗi khi xử lý hàng đợi đặt trước cho cuốn sách ID: " + book.getId(), e);
                }
            }
        }

        // ── Tính tiền phạt nếu quá hạn ────────────────────────────────────
        long fineAmount = 0L;
        if (loan.getDueDate() != null && now.isAfter(loan.getDueDate())) {
            long overdueDays = ChronoUnit.DAYS.between(loan.getDueDate(), now);
            if (overdueDays < 1) overdueDays = 1; // tối thiểu 1 ngày phạt
            fineAmount = overdueDays * OVERDUE_FINE_PER_DAY;

            loan.setIsOverdue(true);
            loan.setOverdueDays((short) overdueDays);

            // Tạo Fine bản ghi
            Fine fine = Fine.builder()
                    .bookLoan(loan)
                    .user(loan.getUser())
                    .type(FineType.OVERDUE)
                    .amount(fineAmount)
                    .amountPaid(0L)
                    .status(FineStatus.PENDING)
                    .reason("Quá hạn " + overdueDays + " ngày (hạn trả: "
                            + loan.getDueDate().toLocalDate() + ", trả thực tế: "
                            + now.toLocalDate() + ")")
                    .build();

            fineRepository.save(fine);
            log.info("[Admin Return] Loan {} overdue {} days. Fine created: {} VND", loanId, overdueDays, fineAmount);
        }

        bookLoanRepository.save(loan);

        Map<String, Object> result = new HashMap<>();
        result.put("loan", bookLoanMapper.toDTO(loan));
        result.put("fineAmount", fineAmount);
        result.put("hasFinePending", fineAmount > 0);
        return result;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ADMIN STATS
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getAdminStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalLoans",         bookLoanRepository.count());
        stats.put("pendingPayment",      bookLoanRepository.countByStatus(LoanStatus.PENDING_PAYMENT));
        stats.put("pendingPickup",       bookLoanRepository.countByStatus(LoanStatus.PENDING_PICKUP));
        stats.put("checkedOut",          bookLoanRepository.countByStatus(LoanStatus.CHECKED_OUT));
        stats.put("overdue",             bookLoanRepository.countByStatus(LoanStatus.OVERDUE));
        stats.put("returned",            bookLoanRepository.countByStatus(LoanStatus.RETURNED));
        stats.put("totalBooks",          bookRepository.count());

        // Revenue calculations
        Long totalRevenue = paymentRepository.sumAmountByStatus(PaymentStatus.SUCCESS);
        LocalDateTime startOfMonth = LocalDateTime.now().withDayOfMonth(1).toLocalDate().atStartOfDay();
        Long monthlyRevenue = paymentRepository.sumAmountByStatusAndCreatedAtAfter(PaymentStatus.SUCCESS, startOfMonth);

        stats.put("totalRevenue", totalRevenue);
        stats.put("monthlyRevenue", monthlyRevenue);
        return stats;
    }
}
