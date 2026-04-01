package com.thanh.librarymanagementsystem.controller;

import com.thanh.librarymanagementsystem.payload.dto.GenreDTO;
import com.thanh.librarymanagementsystem.payload.response.ApiResponse;
import com.thanh.librarymanagementsystem.service.GenreService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/genres")
@RequiredArgsConstructor
public class GenreController {
    private final GenreService service;

    @PostMapping()
    public ResponseEntity<ApiResponse<GenreDTO>> addGenre(@Valid @RequestBody GenreDTO genreDTO) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>("Genre is created Successfully", true, service.createGenre(genreDTO)));
    }

    @GetMapping()
    public ResponseEntity<ApiResponse<List<GenreDTO>>> getAllGenres() {
        return ResponseEntity.ok(new ApiResponse<>("Genres are retrieved successfully", true, service.getAllGenres()));
    }

    @GetMapping("/code/{code}")
    public ResponseEntity<ApiResponse<GenreDTO>> getGenreByCode(@PathVariable String code) {
        return ResponseEntity.ok(new ApiResponse<>("Genre is retrieved successfully", true, service.getGenreByCode(code)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<GenreDTO>> updateGenre(@PathVariable Long id, @Valid @RequestBody GenreDTO dto) {
        return ResponseEntity.ok(new ApiResponse<>("Genre is updated successfully", true, service.updateGenre(id, dto)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteGenre(@PathVariable Long id) {
        service.deleteGenre(id);
        return ResponseEntity.ok(new ApiResponse<>("Genre is soft-deleted", true, null));
    }

    @DeleteMapping("/{id}/hardDelete")
    public ResponseEntity<ApiResponse<Void>> hardDeleteGenre(@PathVariable Long id) {
        service.hardDeleteGenre(id);
        return ResponseEntity.ok(new ApiResponse<>("Genre is deleted successfully", true, null));
    }

    @GetMapping("/top-level")
    public ResponseEntity<ApiResponse<List<GenreDTO>>> getTopLevelGenres() {
        return ResponseEntity.ok(new ApiResponse<>("Genres retrieved successfully", true, service.getTopLevelGenres()));
    }

    @GetMapping("/count")
    public ResponseEntity<ApiResponse<Long>> getTotalActiveGenres() {
        return ResponseEntity.ok(new ApiResponse<>("Counted all active genres successfully", true, service.getTotalActiveGenres()));
    }

    @GetMapping("/{id}/book-count")
    public ResponseEntity<ApiResponse<Long>> getBookCountByGenre(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiResponse<>("Counted all books by genre successfully", true, service.getBookCountByGenre(id)));
    }
}
