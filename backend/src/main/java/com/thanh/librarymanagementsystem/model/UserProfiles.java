package com.thanh.librarymanagementsystem.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserProfiles extends BaseEntity {
    @OneToOne(mappedBy = "userProfiles")
    private User user;

    private String fullName;

    @Column(unique = true)
    private String phone;

    private String profileImage;
}
