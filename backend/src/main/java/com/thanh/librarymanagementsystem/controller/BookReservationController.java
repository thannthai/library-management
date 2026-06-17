package com.thanh.librarymanagementsystem.controller;

import com.thanh.librarymanagementsystem.payload.response.ApiResponse;
import com.thanh.librarymanagementsystem.payload.response.BookReservationResponse;
import com.thanh.librarymanagementsystem.service.BookReservationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reservations")
@RequiredArgsConstructor
public class BookReservationController {

    private final BookReservationService bookReservationService;

    @PostMapping("/books/{bookId}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<ApiResponse<BookReservationResponse>> reserveBook(
            @PathVariable Long bookId) {
        
        BookReservationResponse response = bookReservationService.reserveBook(bookId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>("Đặt trước sách thành công", true, response));
    }

    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<BookReservationResponse>>> getMyReservations() {
        
        List<BookReservationResponse> responses = bookReservationService.getMyReservations();
        return ResponseEntity.ok(new ApiResponse<>("Lấy danh sách đặt trước thành công", true, responses));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> cancelReservation(@PathVariable Long id) {
        
        bookReservationService.cancelReservation(id);
        return ResponseEntity.ok(new ApiResponse<>("Hủy đặt trước thành công", true, null));
    }
}
