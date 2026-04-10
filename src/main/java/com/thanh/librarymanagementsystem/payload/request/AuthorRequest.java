package com.thanh.librarymanagementsystem.payload.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AuthorRequest {
    @NotBlank(message = "Author is mandatory")
    @Size(min = 1, max = 255, message = "Author name must be between 1 and 255 characters")
    private String name;
}
