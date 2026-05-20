package com.thanh.librarymanagementsystem.payload.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionPlanRequest {
    private Long id;

    @NotBlank(message = "Plan code is required")
    private String planCode;

   @NotBlank(message = "Plan name is required")
    private String name;

    private String description;

    @NotNull(message = "Price is required")
    @Positive(message = "Price must be positive")
    private BigDecimal price;

    @NotNull(message = "Duration in days is required")
    @Positive(message = "Duration must be positive")
    private Integer durationInDays;

    @NotNull(message = "Max books allowed is required")
    @Positive(message = "Max books must be positive")
    private Integer maxBooksAllowed;

    @NotNull(message = "Max days allowed is required")
    @Positive(message = "Max days must be positive")
    private Integer maxDaysAllowed;

    @NotNull(message = "Max days per book is required")
    @Positive(message = "Max days per book must be positive")
    private Integer maxDaysPerBook;

    private Integer displayOrder;
    private Boolean isActive;
    private Boolean isFeatured;
    private String badgeText;
    private String adminNotes;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String updatedBy;
}
