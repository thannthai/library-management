package com.thanh.librarymanagementsystem.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionPlan extends BaseEntity {
    @Column(nullable = false, unique = true)
    private String planCode;

    @Column(nullable = false, length = 100)
    private String planName;

    private String description;

    @Column(nullable = false)
    @Positive(message = "Price cannot be less than 0")
    private BigDecimal price;

    @Column(nullable = false)
    private int durationInDays;

    @Column(nullable = false)
    @Positive(message = "Max books must be positive")
    private Integer maxBooksAllowed;

    @Column(nullable = false)
    @Positive(message = "Max days must be positive")
    private Integer maxDaysAllowed;

    @Column(nullable = false)
    @Positive(message = "Max days per book must be positive")
    private Integer maxDaysPerBook;

    private Integer displayOrder = 0;

    private Boolean isActive = true;

    private Boolean isFeatured = false;

    private String badgeText;

    private String adminNotes;

    private String createdBy;

    private String updatedBy;
}
