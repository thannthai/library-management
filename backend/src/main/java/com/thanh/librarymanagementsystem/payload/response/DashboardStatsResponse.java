package com.thanh.librarymanagementsystem.payload.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardStatsResponse {
    private Long currentLoansCount;
    private Long reservationsCount;
    private Long booksReadCount;
    private Integer dayStreak;
    private Integer readingGoal;
}
