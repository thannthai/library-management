package com.thanh.librarymanagementsystem.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtFilter extends OncePerRequestFilter {
    @Autowired
    private JwtProvider jwtProvider;

    @Autowired
    private ApplicationContext context;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        String token = null;
        String username = null;

        // 1. Lấy toàn bộ danh sách Cookies từ trình duyệt gửi lên
        Cookie[] cookies = request.getCookies();

        if (cookies != null) {
            // 2. Duyệt tìm chiếc cookie mang tên "accessToken"
            for (Cookie cookie : cookies) {
                if ("accessToken".equals(cookie.getName())) {
                    token = cookie.getValue(); // Bốc chuỗi JWT ra
                    if (token != null && !token.isEmpty()) {
                        username = jwtProvider.extractUserName(token); // Giải mã lấy username
                    }
                    break;
                }
            }
        }

        // 3. Toàn bộ đoạn logic kiểm tra username và nạp vào SecurityContextHolder
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = context.getBean(CustomUserDetailsService.class).loadUserByUsername(username);

            if (jwtProvider.validateToken(token, userDetails)) {
                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());

                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        filterChain.doFilter(request, response);
    }
}
