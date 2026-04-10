package com.thanh.librarymanagementsystem.payload.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BookRequest {
    @NotBlank(message = "ISBN is mandatory")
    private String isbn;

    @NotBlank(message = "Title is mandatory")
    @Size(min = 1, max = 255, message = "Title must be between 1 and 255 characters")
    private String title;

    @NotEmpty(message = "At least one author is required")
    private List<Long> authorIds;

    @NotEmpty(message = "Genre is mandatory")
    private List<Long> genreIds;

    @NotNull(message = "Publisher is mandatory")
    private Long publisherId;

    private LocalDate publicationDate;

    @Size(max = 20,  message = "Length must not exceed 20 characters")
    private String language;

    @Min(value = 1, message = "Pages must be at least 1")
    @Max(value = 50000, message = "Pages must be not exceed 50000")
    private Integer pages;

    @Size(max = 2000,  message = "Description must not exceed 2000 characters")
    private String description;

    @Min(value = 0, message = "Total copies cannot be negative")
    @NotNull(message = "Total copies is mandatory")
    private Integer totalCopies;

    @Min(value = 0, message = "available copies cannot be negative")
    @NotNull(message = "available copies is mandatory")
    private Integer availableCopies;

    @DecimalMin(value = "0.0", inclusive = true, message = "Price cannot be negative")
    @Digits(integer = 8, fraction = 2, message = "Price must have at most 8 integer digits and 2 decimals")
    private BigDecimal price;

    @Size(max = 500, message = "Length must not exceed 500 characters")
    private String coverImageUrl;

    private Boolean active;
}
