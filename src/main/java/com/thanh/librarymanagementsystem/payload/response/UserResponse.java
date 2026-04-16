package com.thanh.librarymanagementsystem.payload.response;

import com.thanh.librarymanagementsystem.domain.UserRole;
import lombok.*;

import java.util.Set;

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
}
