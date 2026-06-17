package com.thanh.librarymanagementsystem.controller;

import com.thanh.librarymanagementsystem.payload.request.ForgotPasswordRequest;
import com.thanh.librarymanagementsystem.payload.request.LoginRequest;
import com.thanh.librarymanagementsystem.payload.request.ResetPasswordRequest;
import com.thanh.librarymanagementsystem.payload.request.SignUpRequest;
import com.thanh.librarymanagementsystem.payload.response.ApiResponse;
import com.thanh.librarymanagementsystem.payload.response.AuthResponse;
import com.thanh.librarymanagementsystem.service.AuthService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<AuthResponse>> signup(@Valid @RequestBody SignUpRequest signUpRequest) {
        return ResponseEntity.ok(new ApiResponse<>("User registered successfully", true, authService.signup(signUpRequest)));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest, HttpServletResponse response) {
        // 1. Xác thực & lấy token từ AuthService
        AuthResponse authResponse = authService.login(loginRequest);

        // Tính toán thời gian sống
        long cookieAgeInSeconds = 24 * 60 * 60;

        // 2. Đóng gói token vào ResponseCookie chuẩn chính chủ Spring Boot
        ResponseCookie cookie = ResponseCookie.from("accessToken", authResponse.getJwt())
                .httpOnly(true)
                .secure(false) // Để false để test mượt ở localhost HTTP
                .sameSite("Lax")
                .path("/")
                .maxAge(cookieAgeInSeconds) // Khớp thời gian với lõi token
                .build();

        // 3. Đính cookie vào Header phản hồi
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        // 4. Trả về response (không chứa token trong body vì đã gửi qua cookie)
        return ResponseEntity.ok(new ApiResponse<>("User logged in successfully", true, authResponse.getUserResponse()));
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

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(HttpServletResponse response) {
        // 1. Clear SecurityContext trên server (xóa thông tin login hiện tại)
        SecurityContextHolder.clearContext();

        // 2. Tạo cookie "tử thần" (tên accessToken, value trống, maxAge=0)
        // Các attribute phải giống hệt lúc tạo login cookie, chỉ khác value và maxAge
        ResponseCookie deleteCookie = ResponseCookie.from("accessToken", "")
                .httpOnly(true)
                .secure(false) // localhost=false, production HTTPS=true
                .sameSite("Lax")
                .path("/")
                .maxAge(0) // maxAge=0 → browser xóa cookie ngay
                .build();

        // 3. Đính cookie xóa vào Header trả về
        response.addHeader(HttpHeaders.SET_COOKIE, deleteCookie.toString());

        // 4. Trả về thông báo thành công
        return ResponseEntity.ok(new ApiResponse<>("User logged out successfully", true));
    }
}
