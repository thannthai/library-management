package com.thanh.librarymanagementsystem.payload.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookReservationResponse {
    private Long id;
    private Long bookId;
    private String bookTitle;
    private String bookCoverImage;
    private String status;
    private Integer priorityPosition;
    private LocalDateTime createdAt;
}
