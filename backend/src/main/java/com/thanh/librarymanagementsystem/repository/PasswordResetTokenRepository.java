package com.thanh.librarymanagementsystem.repository;

import com.thanh.librarymanagementsystem.model.PasswordResetToken;
import com.thanh.librarymanagementsystem.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByToken(String token);

    void deleteByUser(User user);

    // Return the most recently created token for a user (ordered by createdAt DESC).
    // Used for rate-limiting checks to prevent spam/abuse.
    Optional<PasswordResetToken> findFirstByUserIdOrderByCreatedAtDesc(Long userId);
}
