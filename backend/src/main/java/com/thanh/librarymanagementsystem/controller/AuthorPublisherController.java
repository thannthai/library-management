package com.thanh.librarymanagementsystem.controller;

import com.thanh.librarymanagementsystem.model.Author;
import com.thanh.librarymanagementsystem.model.Publisher;
import com.thanh.librarymanagementsystem.payload.response.ApiResponse;
import com.thanh.librarymanagementsystem.repository.AuthorRepository;
import com.thanh.librarymanagementsystem.repository.PublisherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AuthorPublisherController {

    private final AuthorRepository authorRepository;
    private final PublisherRepository publisherRepository;

    @GetMapping("/authors")
    public ResponseEntity<ApiResponse<List<Author>>> getAllAuthors() {
        List<Author> authors = authorRepository.findAll();
        return ResponseEntity.ok(new ApiResponse<>("Authors retrieved successfully", true, authors));
    }

    @PostMapping("/authors")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Author>> createAuthor(@RequestBody Author author) {
        Author saved = authorRepository.save(author);
        return ResponseEntity.ok(new ApiResponse<>("Author created successfully", true, saved));
    }

    @GetMapping("/publishers")
    public ResponseEntity<ApiResponse<List<Publisher>>> getAllPublishers() {
        List<Publisher> publishers = publisherRepository.findAll();
        return ResponseEntity.ok(new ApiResponse<>("Publishers retrieved successfully", true, publishers));
    }

    @PostMapping("/publishers")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Publisher>> createPublisher(@RequestBody Publisher publisher) {
        Publisher saved = publisherRepository.save(publisher);
        return ResponseEntity.ok(new ApiResponse<>("Publisher created successfully", true, saved));
    }
}
