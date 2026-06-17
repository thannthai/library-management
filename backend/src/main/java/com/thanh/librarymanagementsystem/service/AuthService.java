package com.thanh.librarymanagementsystem.service;

import com.thanh.librarymanagementsystem.payload.request.LoginRequest;
import com.thanh.librarymanagementsystem.payload.request.SignUpRequest;
import com.thanh.librarymanagementsystem.payload.response.AuthResponse;

public interface AuthService {
    AuthResponse signup(SignUpRequest signUpRequest);

    AuthResponse login(LoginRequest loginRequest);

    void createPasswordResetToken(String email);

    void resetPassword(String token, String newPassword);
}
