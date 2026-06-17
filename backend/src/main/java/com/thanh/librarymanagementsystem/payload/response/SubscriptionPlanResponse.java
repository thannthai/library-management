package com.thanh.librarymanagementsystem.payload.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionPlanResponse {
    private Long id;

    private String planCode;

    private String name;

    private String description;

    private BigDecimal price;

    private int durationInDays;

    private Integer maxBooksAllowed;

    private Integer maxDaysPerBook;

    private boolean autoRenew;

    private List<String> features;

    private Integer displayOrder;
    private Boolean isActive;
    private Boolean isFeatured;
    private String badgeText;
    private String adminNotes;
}
