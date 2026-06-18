package com.thanh.librarymanagementsystem.repository;

import com.thanh.librarymanagementsystem.enums.UserRole;
import com.thanh.librarymanagementsystem.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    Boolean existsByEmail(String email);

    /**
     * Tìm tất cả user có vai trò ADMIN trong hệ thống.
     * Dùng bởi NotificationService để broadcast thông báo tới tất cả Admin.
     */
    @Query("SELECT DISTINCT u FROM User u JOIN u.roles r WHERE r = com.thanh.librarymanagementsystem.enums.UserRole.ROLE_ADMIN")
    List<User> findAllAdmins();
}
