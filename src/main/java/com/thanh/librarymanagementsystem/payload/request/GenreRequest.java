package com.thanh.librarymanagementsystem.payload.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GenreRequest {
    @NotBlank(message = "Genre code is required")
    @Size(min = 2, max = 50, message = "Genre code must be between 2 and 50 characters")
    @Pattern(regexp = "^[A-Z]+$", message = "Genre code must contain only uppercase letters")
    private String code;

    @NotBlank(message = "Genre name is required")
    @Size(min = 2, max = 100, message = "Genre name must be between 2 and 100 characters")
    private String name;

    @Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description;

    @Min(value = 0, message = "Display order cannot be negative")
    private Integer displayOrder;

    private Boolean active = true;

    private Long parentGenreId;
}
