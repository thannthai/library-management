package com.thanh.librarymanagementsystem.controller;

import com.thanh.librarymanagementsystem.mapper.UserMapper;
import com.thanh.librarymanagementsystem.payload.response.ApiResponse;
import com.thanh.librarymanagementsystem.payload.response.UserResponse;
import com.thanh.librarymanagementsystem.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;

    private final UserMapper userMapper;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser() {
        return ResponseEntity.ok(new ApiResponse<>("Current user retrieved successfully", true, userMapper.toDTO(userService.getCurrentUser())));
    }

    @GetMapping("/list")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllUsers() {
        return ResponseEntity.ok(new ApiResponse<>("All users retrieved successfully", true, userService.getAllUsers()));
    }
}
