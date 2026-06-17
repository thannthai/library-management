package com.thanh.librarymanagementsystem.repository;

import com.thanh.librarymanagementsystem.model.Payment;
import com.thanh.librarymanagementsystem.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    @Query("SELECT p FROM Payment p WHERE p.bookLoan.id = :loanId AND p.status = :status ORDER BY p.id DESC")
    Optional<Payment> findFirstByBookLoanIdAndStatus(@Param("loanId") Long loanId, @Param("status") PaymentStatus status);
    Optional<Payment> findByBookLoanId(Long loanId);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.status = :status")
    Long sumAmountByStatus(@Param("status") PaymentStatus status);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.status = :status AND p.createdAt >= :startDate")
    Long sumAmountByStatusAndCreatedAtAfter(@Param("status") PaymentStatus status, @Param("startDate") LocalDateTime startDate);
}
