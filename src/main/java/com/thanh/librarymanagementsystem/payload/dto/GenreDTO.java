package com.thanh.librarymanagementsystem.payload.dto;

import com.thanh.librarymanagementsystem.model.Genre;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GenreDTO {
    private Long id;

    @NotBlank(message = "Genre Code is required")
    private String code;

    @NotBlank(message = "Genre Name is required")
    private String name;

    @Size(max = 500, message = "Length must not exceed 500 characters")
    private String description;

    @Min(value = 0, message = "Display order cannot be negative")
    private Integer displayOrder;

    private Boolean active;

    private Long parentGenreId;

    private String parentGenreName;

    private List<GenreDTO> subGenres;

    private Long bookCount;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
