package com.thanh.librarymanagementsystem.payload.request;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class BookSearchRequest {
    private String searchTerm;
    private Long genreId;
    private Long authorId;

    private Boolean availableOnly;
    private Boolean checkedOutOnly;
    private Integer page = 0;
    private Integer size = 20;

    private String sortBy = "title";
    private String sortDirection = "DESC";
}
