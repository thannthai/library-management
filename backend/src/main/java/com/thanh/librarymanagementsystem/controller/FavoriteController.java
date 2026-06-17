package com.thanh.librarymanagementsystem.controller;

import com.thanh.librarymanagementsystem.mapper.BookMapper;
import com.thanh.librarymanagementsystem.model.Favorite;
import com.thanh.librarymanagementsystem.payload.response.ApiResponse;
import com.thanh.librarymanagementsystem.payload.response.BookResponse;
import com.thanh.librarymanagementsystem.service.FavoriteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
public class FavoriteController {

    private final FavoriteService favoriteService;
    private final BookMapper bookMapper;

    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<BookResponse>>> getMyFavorites() {
        List<Favorite> favorites = favoriteService.getMyFavorites();
        List<BookResponse> responses = favorites.stream()
                .map(f -> bookMapper.toDTO(f.getBook()))
                .toList();
        return ResponseEntity.ok(new ApiResponse<>("Favorites retrieved successfully", true, responses));
    }

    @PostMapping("/books/{bookId}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Boolean>> toggleFavorite(@PathVariable Long bookId) {
        Favorite favorite = favoriteService.toggleFavorite(bookId);
        boolean isFavorited = favorite != null;
        String msg = isFavorited ? "Added to favorites" : "Removed from favorites";
        return ResponseEntity.ok(new ApiResponse<>(msg, true, isFavorited));
    }

    @DeleteMapping("/books/{bookId}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> removeFavorite(@PathVariable Long bookId) {
        favoriteService.removeFavorite(bookId);
        return ResponseEntity.ok(new ApiResponse<>("Removed from favorites", true, null));
    }

    @GetMapping("/books/{bookId}/status")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Boolean>> checkFavoriteStatus(@PathVariable Long bookId) {
        boolean isFav = favoriteService.isFavorite(bookId);
        return ResponseEntity.ok(new ApiResponse<>("Checked favorite status", true, isFav));
    }
}
