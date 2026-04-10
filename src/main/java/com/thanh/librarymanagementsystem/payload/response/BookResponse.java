package com.thanh.librarymanagementsystem.payload.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BookResponse {
    private Long id;

    private String isbn;
    private String title;
    private String coverImageUrl;
    private String description;
    private String language;
    private Integer pages;
    private LocalDate publicationDate;
    private BigDecimal price;

    private List<AuthorResponse> authors;

    private List<GenreResponse> genres;

    private PublisherResponse publisher;

    private Integer totalCopies;
    private Integer availableCopies;

    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
