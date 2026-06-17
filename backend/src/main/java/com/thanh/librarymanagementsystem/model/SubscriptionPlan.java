package com.thanh.librarymanagementsystem.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionPlan extends BaseEntity {
    @Column(name = "plan_code", nullable = false, unique = true)
    private String planCode;

    @Column(name = "plan_name", nullable = false, length = 100)
    private String planName;

    @Column(name = "description")
    private String description;

    @Column(name = "price", nullable = false)
    @Positive(message = "Price cannot be less than 0")
    private BigDecimal price;

    @Column(name = "duration_in_days", nullable = false)
    private int durationInDays;

    @Column(name = "max_books_allowed", nullable = false)
    @Positive(message = "Max books must be positive")
    private Integer maxBooksAllowed;

    @Column(name = "max_days_per_book", nullable = false)
    @Positive(message = "Max days per book must be positive")
    private Integer maxDaysPerBook;

    @Column(name = "auto_renew", nullable = false)
    private boolean autoRenew = false;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "subscription_plan_features", joinColumns = @JoinColumn(name = "plan_id"))
    @Column(name = "feature", nullable = false)
    private List<String> features = new ArrayList<>();

    @Column(name = "display_order")
    private Integer displayOrder = 0;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "is_featured", nullable = false)
    private Boolean isFeatured = false;

    @Column(name = "badge_text")
    private String badgeText;

    @Column(name = "admin_notes")
    private String adminNotes;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "updated_by")
    private String updatedBy;
}
