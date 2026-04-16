package com.thanh.librarymanagementsystem.model;

import com.thanh.librarymanagementsystem.domain.AuthProvider;
import com.thanh.librarymanagementsystem.domain.UserRole;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDateTime;
import java.util.Set;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User extends BaseEntity {
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid Email")
    @Column(unique = true, nullable = false)
    private String email;

    @Size(min = 6, message = "Password must be at least 6 characters")
    @Pattern(
            regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=])(?=\\S+$).{8,}$",
            message = "Password must contain at least one digit, one lowercase, one uppercase, one special character, and no whitespace"
    )
    private String password;

    @OneToOne(cascade = CascadeType.ALL)
    private UserProfiles userProfiles;

    @Enumerated(EnumType.STRING)
    private AuthProvider authProvider;

    private String googleId;

    // Create a sub-table
    @ElementCollection(targetClass = UserRole.class, fetch = FetchType.EAGER)
    // Format sub-table
    @CollectionTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"))
    @Enumerated(EnumType.STRING)
    private Set<UserRole> roles;

    private Boolean verified = false;

    private LocalDateTime lastLogin;
}
