package com.thanh.librarymanagementsystem.repository;

import com.thanh.librarymanagementsystem.model.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {
    @Query("SELECT s FROM Subscription s" +
            " WHERE s.user.id = :userId AND" +
            " s.startDate <= :today AND s.endDate >= :today")
    Optional<Subscription> findActiveSubscriptionByUserId(@Param("userId") Long userId, @Param("today") LocalDate today);

    @Query("SELECT s FROM Subscription s" +
            " WHERE s.isActive = true AND" +
            " s.endDate < :today")
    List<Subscription> findExpiredActiveSubscription(@Param("today") LocalDate today);
}
