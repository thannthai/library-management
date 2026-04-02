package com.thanh.librarymanagementsystem.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Genre extends BaseEntity  {
    @NotBlank(message = "Code missing")
    @Column(unique = true, nullable = false, length = 50)
    private String code;

    @NotBlank(message = "Name missing")
    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 500)
    private String description;

    @Min(value = 0)
    private Integer displayOrder;

    @Column(nullable = false)
    private Boolean active = true;

    @ManyToOne
    @JoinColumn(name = "parent_id")
    private Genre parentGenre;

    @OneToMany(mappedBy="parentGenre")
    private List<Genre> subGenres = new ArrayList<>();
}
