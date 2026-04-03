package com.thanh.librarymanagementsystem.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Book extends BaseEntity {
    @Column(nullable = false, unique = true)
    private String isbn;

    @Column(nullable = false)
    private String title;

    @ManyToMany
    @JoinTable(
            name = "book_author",
            joinColumns = @JoinColumn(name = "book_id"),
            inverseJoinColumns = @JoinColumn(name = "author_id")
    )
    private List<Author> authors;

    @ManyToMany
    @JoinTable(
            name = "book_genre",
            joinColumns = @JoinColumn(name = "book_id"),
            inverseJoinColumns = @JoinColumn(name = "genre_id")
    )
    private List<Genre> genres;

    @ManyToOne
    @JoinColumn(name = "publisher_id")
    private Publisher publisher;

    private LocalDate publicationDate;

    @Size(max = 20,  message = "Length must not exceed 20 characters")
    private String language;

    private Integer pages;

    @Size(max = 2000,  message = "Length must not exceed 2000 characters")
    private String description;

    @Min(value = 0)
    private Integer totalCopies;

    private Integer availableCopies;

    @Column(nullable = false)
    private BigDecimal price;

    @Size(max = 500, message = "Length must not exceed 500 characters")
    private String coverImageUrl;

    @Column(nullable = false)
    private Boolean active = true;

    @AssertTrue(message = "Available copies cannot exceed total copies")
    public boolean isAvailableCopiesValid() {
        if (totalCopies == null || availableCopies == null) return true;
        return availableCopies <= totalCopies;
    }
}
