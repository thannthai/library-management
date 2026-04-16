package com.thanh.librarymanagementsystem.controller;

import com.thanh.librarymanagementsystem.payload.request.ForgotPasswordRequest;
import com.thanh.librarymanagementsystem.payload.request.LoginRequest;
import com.thanh.librarymanagementsystem.payload.request.ResetPasswordRequest;
import com.thanh.librarymanagementsystem.payload.request.SignUpRequest;
import com.thanh.librarymanagementsystem.payload.response.ApiResponse;
import com.thanh.librarymanagementsystem.payload.response.AuthResponse;
import com.thanh.librarymanagementsystem.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<AuthResponse>> signup(@Valid @RequestBody SignUpRequest signUpRequest) {
        return ResponseEntity.ok(new ApiResponse<>("User registered successfully", true, authService.signup(signUpRequest)));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest loginRequest) {
        return ResponseEntity.ok(new ApiResponse<>("User logged in successfully", true, authService.login(loginRequest)));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@RequestBody ForgotPasswordRequest forgotPasswordRequest) {
        authService.createPasswordResetToken(forgotPasswordRequest.getEmail());
        return ResponseEntity.ok(new ApiResponse<>("A reset link was sent to your email", true));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@RequestBody ResetPasswordRequest resetPasswordRequest) {
        authService.resetPassword(resetPasswordRequest.getToken(), resetPasswordRequest.getNewPassword());
        return ResponseEntity.ok(new ApiResponse<>("Password reset successfully", true));
    }
}
