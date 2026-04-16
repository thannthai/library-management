package com.thanh.librarymanagementsystem.repository;

import com.thanh.librarymanagementsystem.model.UserProfiles;
import org.springframework.data.jpa.repository.JpaRepository;


public interface UserProfilesRepository extends JpaRepository<UserProfiles, Long> {
    Boolean existsByPhone(String phone);
}
