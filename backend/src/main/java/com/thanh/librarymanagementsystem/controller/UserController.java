package com.thanh.librarymanagementsystem.controller;

import com.thanh.librarymanagementsystem.mapper.UserMapper;
import com.thanh.librarymanagementsystem.model.User;
import com.thanh.librarymanagementsystem.model.UserProfiles;
import com.thanh.librarymanagementsystem.payload.response.ApiResponse;
import com.thanh.librarymanagementsystem.payload.response.UserResponse;
import com.thanh.librarymanagementsystem.repository.UserRepository;
import com.thanh.librarymanagementsystem.service.UserService;
import lombok.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;
    private final UserRepository userRepository;
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

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(@RequestBody ProfileUpdateRequest request) {
        User currentUser = userService.getCurrentUser();
        UserProfiles profiles = currentUser.getUserProfiles();
        if (profiles == null) {
            profiles = new UserProfiles();
        }
        profiles.setFullName(request.getFullName());
        profiles.setPhone(request.getPhone());
        currentUser.setUserProfiles(profiles);
        userRepository.save(currentUser);
        return ResponseEntity.ok(new ApiResponse<>("Profile updated successfully", true, userMapper.toDTO(currentUser)));
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProfileUpdateRequest {
        private String fullName;
        private String phone;
    }
}
