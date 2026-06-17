package com.thanh.librarymanagementsystem.payload.response;

import com.thanh.librarymanagementsystem.enums.UserRole;
import lombok.*;

import java.util.Set;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private Long id;
    private String email;
    private String fullName;
    private String phone;
    private Set<UserRole> roles;
    private boolean isVerified;
    private String authProvider;
    private LocalDateTime createdAt;
}
