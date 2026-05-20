package com.thanh.librarymanagementsystem.service;

import com.thanh.librarymanagementsystem.payload.response.UserResponse;

import java.util.List;

public interface UserService {
    UserResponse getCurrentUser();
    List<UserResponse> getAllUsers();
}
