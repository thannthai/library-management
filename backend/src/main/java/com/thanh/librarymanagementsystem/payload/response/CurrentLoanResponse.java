package com.thanh.librarymanagementsystem.payload.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CurrentLoanResponse {
    private Long bookId;
    private String title;
    private String authorName;
    private String coverImageUrl;
    private LocalDateTime checkoutDate;
    private LocalDateTime dueDate;
    private String status;
}
