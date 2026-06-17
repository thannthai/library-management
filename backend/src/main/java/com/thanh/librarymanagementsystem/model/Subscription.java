package com.thanh.librarymanagementsystem.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Subscription extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(nullable = false)
    private SubscriptionPlan subscriptionPlan;

    private String planName;

    private String planCode;

    private BigDecimal price;

    @Column(nullable = false)
    private Integer maxBooksAllowed;

    @Column(nullable = false)
    private Integer maxDaysPerBook;

    @Column(nullable = false)
    private LocalDateTime startDate;

    @Column(nullable = false)
    private LocalDateTime endDate;

    @Column(nullable = false)
    private Boolean isActive = true;

    private Boolean autoRenew = false;

    private LocalDateTime cancelledAt;

    private String cancellationReason;

    public boolean isValid() {
        if (!isActive) {
            return false;
        }

        LocalDateTime now = LocalDateTime.now();
        return !now.isBefore(startDate) && !now.isAfter(endDate);
    }

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(endDate);
    }

    public long getDaysRemaining() {
        if (isExpired())
            return 0;

        return ChronoUnit.DAYS.between(LocalDateTime.now(), endDate);
    }

    public void calculateEndDate() {
        if (subscriptionPlan != null && startDate != null) {
            this.endDate = startDate.plusDays(subscriptionPlan.getDurationInDays());
        }
    }

    public void initializeFromPlan() {
        if (subscriptionPlan != null) {
            this.planName = subscriptionPlan.getPlanName();
            this.planCode = subscriptionPlan.getPlanCode();
            this.price = subscriptionPlan.getPrice();
            this.maxBooksAllowed = subscriptionPlan.getMaxBooksAllowed();
            this.maxDaysPerBook = subscriptionPlan.getMaxDaysPerBook();
            this.startDate = LocalDateTime.now();
            calculateEndDate();
        }
    }
}
