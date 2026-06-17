package com.thanh.librarymanagementsystem.repository;

import com.thanh.librarymanagementsystem.enums.LoanStatus;
import com.thanh.librarymanagementsystem.model.BookLoan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookLoanRepository extends JpaRepository<BookLoan, Long> {

    /**
     * Tìm tất cả đơn mượn đang hoạt động hoặc quá hạn mà dueDate đã qua.
     * Dùng cho Scheduler quét phạt hàng đêm.
     *
     * @param statuses danh sách trạng thái cần kiểm tra (CHECKED_OUT, OVERDUE)
     * @param now      thời điểm hiện tại để so sánh với dueDate
     */
    @Query("SELECT bl FROM BookLoan bl JOIN FETCH bl.user u WHERE bl.status IN :statuses AND bl.dueDate < :now")
    List<BookLoan> findOverdueLoans(
            @Param("statuses") List<LoanStatus> statuses,
            @Param("now") LocalDateTime now);

    /** Tìm tất cả đơn mượn của một người dùng theo trạng thái */
    List<BookLoan> findByUserIdAndStatus(Long userId, LoanStatus status);

    @Query("SELECT bl FROM BookLoan bl WHERE bl.user.id = :userId AND bl.bookCopy.book.id = :bookId AND bl.status = :status")
    Optional<BookLoan> findByUserIdAndBookIdAndStatus(
            @Param("userId") Long userId,
            @Param("bookId") Long bookId,
            @Param("status") LoanStatus status);

    long countByUserIdAndStatusIn(Long userId, List<LoanStatus> statuses);

    @Query("SELECT COUNT(bl) FROM BookLoan bl WHERE bl.user.id = :userId AND bl.status = :status AND bl.actualReturnDate >= :start AND bl.actualReturnDate <= :end")
    long countBooksReadInYear(
            @Param("userId") Long userId,
            @Param("status") LoanStatus status,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    List<BookLoan> findByUserIdAndStatusIn(Long userId, List<LoanStatus> statuses);

    /** Tìm tất cả đơn mượn của một người dùng */
    List<BookLoan> findByUserId(Long userId);

    /** Phân trang: Tìm tất cả đơn mượn của một người dùng */
    Page<BookLoan> findByUserId(Long userId, Pageable pageable);

    /** Phân trang: Tìm đơn mượn của một người dùng theo trạng thái cụ thể */
    Page<BookLoan> findByUserIdAndStatus(Long userId, LoanStatus status, Pageable pageable);

    /** Phân trang: Tìm đơn mượn của một người dùng theo danh sách các trạng thái */
    Page<BookLoan> findByUserIdAndStatusIn(Long userId, List<LoanStatus> statuses, Pageable pageable);

    /** Admin: Phân trang toàn bộ đơn mượn (không giới hạn user) theo trạng thái */
    Page<BookLoan> findByStatus(LoanStatus status, Pageable pageable);

    /** Admin: Toàn bộ đơn mượn (không lọc trạng thái) */
    Page<BookLoan> findAll(Pageable pageable);

    /** Scheduler: Tìm các đơn PENDING_PICKUP đã quá hạn nhận sách (> 24h) */
    @Query("SELECT bl FROM BookLoan bl WHERE bl.status = 'PENDING_PICKUP' AND bl.updatedAt < :cutoff")
    List<BookLoan> findExpiredPickupLoans(@Param("cutoff") LocalDateTime cutoff);

    /** Admin stats: count by status */
    long countByStatus(LoanStatus status);
}

