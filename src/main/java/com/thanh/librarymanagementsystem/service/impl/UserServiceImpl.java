package com.thanh.librarymanagementsystem.service.impl;

import com.thanh.librarymanagementsystem.exception.UserException;
import com.thanh.librarymanagementsystem.mapper.UserMapper;
import com.thanh.librarymanagementsystem.model.User;
import com.thanh.librarymanagementsystem.payload.response.UserResponse;
import com.thanh.librarymanagementsystem.repository.UserRepository;
import com.thanh.librarymanagementsystem.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    private final UserRepository userRepository;

    private final UserMapper userMapper;

    @Override
    public UserResponse getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new UserException("User not authenticated or session expired");
        }

        String email = authentication.getName();

        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserException("User account not found in system"));

        return userMapper.toDTO(currentUser);
    }

    @Override
    public List<UserResponse> getAllUsers() {
        List<User> users = userRepository.findAll();

        return userMapper.toDTO(users);
    }
}
