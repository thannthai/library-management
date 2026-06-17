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
public class PublisherRequest {
    @NotBlank(message = "Publisher is mandatory")
    @Size(min = 1, max = 100, message = "Publisher name cannot exceed 100 characters")
    private String name;
}
