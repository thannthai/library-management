package com.thanh.librarymanagementsystem.service.impl;

import com.thanh.librarymanagementsystem.domain.UserRole;
import com.thanh.librarymanagementsystem.exception.UserException;
import com.thanh.librarymanagementsystem.mapper.UserMapper;
import com.thanh.librarymanagementsystem.model.PasswordResetToken;
import com.thanh.librarymanagementsystem.model.User;
import com.thanh.librarymanagementsystem.model.UserProfiles;
import com.thanh.librarymanagementsystem.payload.request.LoginRequest;
import com.thanh.librarymanagementsystem.payload.request.SignUpRequest;
import com.thanh.librarymanagementsystem.payload.response.AuthResponse;
import com.thanh.librarymanagementsystem.payload.response.UserResponse;
import com.thanh.librarymanagementsystem.repository.PasswordResetTokenRepository;
import com.thanh.librarymanagementsystem.repository.UserProfilesRepository;
import com.thanh.librarymanagementsystem.repository.UserRepository;
import com.thanh.librarymanagementsystem.security.CustomUserDetailsService;
import com.thanh.librarymanagementsystem.security.JwtProvider;
import com.thanh.librarymanagementsystem.service.AuthService;
import com.thanh.librarymanagementsystem.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {
    private final UserRepository userRepository;
    private final UserProfilesRepository userProfilesRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;

    private final UserMapper userMapper;

    private final CustomUserDetailsService customUserDetailsService;

    private final AuthenticationManager authenticationManager;
    private final PasswordResetTokenRepository passwordResetTokenRepository;

    private final EmailService emailService;

    @Transactional
    public AuthResponse signup(SignUpRequest signUpRequest) {
        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            throw new UserException("Email is already in use!");
        }

        if (userProfilesRepository.existsByPhone(signUpRequest.getPhone())) {
            throw new UserException("Phone number is already in use!");
        }

        UserProfiles profiles = new UserProfiles();
        profiles.setFullName(signUpRequest.getFullName());
        profiles.setPhone(signUpRequest.getPhone());

        User newUser = new User();
        newUser.setEmail(signUpRequest.getEmail());
        newUser.setUserProfiles(profiles);

        newUser.setPassword(passwordEncoder.encode(signUpRequest.getPassword()));

        Set<UserRole> roles = new HashSet<>();
        roles.add(UserRole.ROLE_USER);
        newUser.setRoles(roles);

        newUser.setLastLogin(LocalDateTime.now());

        profiles.setUser(newUser);

        User savedUser = userRepository.save(newUser);

        UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
                .username(newUser.getEmail())
                .password(newUser.getPassword())
                .authorities(savedUser.getRoles().stream()
                        .map(Enum::name)
                        .toArray(String[]::new))
                .build();

        Authentication auth = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);

        String token = jwtProvider.generateToken(userDetails);

        return new AuthResponse(token, "User registered successfully!", userMapper.toDTO(savedUser));
    }

    @Override
    public AuthResponse login(LoginRequest loginRequest) {
        // Tạo một phiếu yêu cầu xác thực chứa Email và Pass người dùng nhập
        UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword());

        // Đưa phiếu này cho AuthenticationManager
        // Spring sẽ tự vào DB check, nếu sai Pass nó sẽ quăng lỗi ngay tại đây
        Authentication authentication = authenticationManager.authenticate(authenticationToken);

        // Nếu đi đến được dòng này nghĩa là Login đúng
        // Ghi tên User vào SecurityContext của Server để hệ thống nhận diện trong request này
        SecurityContextHolder.getContext().setAuthentication(authentication);

        // Ép kiểu để lấy thông tin chi tiết User (UserDetails) đã được Spring xác thực
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();

        String token = jwtProvider.generateToken(userDetails);

        User user = userRepository.findByEmail(loginRequest.getEmail()).get();
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        UserResponse userResponse = userMapper.toDTO(user);

        return new AuthResponse(token, "Login successfully", userResponse);
    }


    @Transactional
    public void createPasswordResetToken(String email) {
        String frontendUrl = "http://localhost:5173/reset-password?token=";

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserException("User not found"));

        String token = UUID.randomUUID().toString();

        PasswordResetToken passwordResetToken = new PasswordResetToken().builder()
                .token(token)
                .user(user)
                .expiryDate(LocalDateTime.now().plusMinutes(5))
                .build();
        passwordResetTokenRepository.save(passwordResetToken);

        String resetLink = frontendUrl + token;
        String subject = "Password Reset Request";
        String body = "Click the link to reset your password (Valid 5 minutes): " + resetLink;

        emailService.sendEmail(user.getEmail(), subject, body);
    }


    @Override
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken passwordResetToken = passwordResetTokenRepository.findByToken(token)
                .orElseThrow(() -> new UserException("Invalid token"));

        if (passwordResetToken.isExpired()) {
            passwordResetTokenRepository.delete(passwordResetToken);
            throw new UserException("Token expired");
        }

        User user = passwordResetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        passwordResetTokenRepository.delete(passwordResetToken);
    }
}
