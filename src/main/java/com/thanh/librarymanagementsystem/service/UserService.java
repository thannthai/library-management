package com.thanh.librarymanagementsystem.service;

import com.thanh.librarymanagementsystem.model.User;
import com.thanh.librarymanagementsystem.payload.response.UserResponse;

import java.util.List;

public interface UserService {
    User getCurrentUser();
    List<UserResponse> getAllUsers();
}
