package com.thanh.librarymanagementsystem.exception;

import com.thanh.librarymanagementsystem.payload.response.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalException {
    @ExceptionHandler(GenreException.class)
    public ResponseEntity<ApiResponse<Void>> handleGenreException(GenreException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>(e.getMessage(), false));
    }

    @ExceptionHandler(BookException.class)
    public ResponseEntity<ApiResponse<Void>> handleBookException(BookException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>(e.getMessage(), false));
    }

    @ExceptionHandler(UserException.class)
    public ResponseEntity<ApiResponse<Void>> handleUserException(UserException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>(e.getMessage(), false));
    }

    @ExceptionHandler(SubscriptionPlanException.class)
    public ResponseEntity<ApiResponse<Void>> handleSubscriptionPlanException(SubscriptionPlanException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>(e.getMessage(), false));
    }

    @ExceptionHandler(SubscriptionException.class)
    public ResponseEntity<ApiResponse<Void>> handleSubscriptionException(SubscriptionException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>(e.getMessage(), false));
    }
}
