package com.thanh.librarymanagementsystem.repository;

import com.thanh.librarymanagementsystem.enums.ReservationStatus;
import com.thanh.librarymanagementsystem.model.BookReservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookReservationRepository extends JpaRepository<BookReservation, Long> {

    List<BookReservation> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<BookReservation> findByBookIdAndStatusOrderByCreatedAtAsc(Long bookId, ReservationStatus status);

    int countByUserIdAndStatus(Long userId, ReservationStatus status);

    boolean existsByUserIdAndBookIdAndStatus(Long userId, Long bookId, ReservationStatus status);

    @Query("SELECT r FROM BookReservation r WHERE r.status = :status AND r.updatedAt < :expirationTime")
    List<BookReservation> findExpiredReservations(@Param("status") ReservationStatus status, @Param("expirationTime") LocalDateTime expirationTime);
}
