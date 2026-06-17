package com.thanh.librarymanagementsystem.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class JwtProvider {
    @Value("${jwt.secret-key}")
    private String secretKey;

    @Value("${jwt.expiration}")
    private long expiration;

    public String generateToken(UserDetails userDetails) {
        String authorities = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.joining(","));

        Map<String, Object> claims = new HashMap<>(); // Chỗ để nhét thêm thông tin phụ
        claims.put("authorities", authorities);

        return Jwts.builder()
                .claims().add(claims)
                .subject(userDetails.getUsername())
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .and()
                .signWith(getKey()) // QUAN TRỌNG NHẤT: Đóng cái "con dấu" của bạn lên thẻ
                .compact(); // Nén tất cả lại thành 1 chuỗi dài ngoằng (Token)
    }

    public Key getKey() {
        // Dịch ngược cái chuỗi văn bản secretKey trở lại dạng mảng Byte
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);

        // Nhào nặn mảng Byte đó thành đối tượng Key chuẩn của HMAC-SHA
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String extractUserName(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    // Hàm lấy ra một thông tin cụ thể (ví dụ: lấy tên, lấy ngày hết hạn)
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    // Hàm quan trọng nhất: Mở hộp JWT bằng SecretKey của mình
    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith((SecretKey) getKey()) // Dùng cái chìa khóa của Thạnh để mở
                .build()
                .parseSignedClaims(token) // Bắt đầu đọc thẻ
                .getPayload(); // Trả về toàn bộ thông tin bên trong thẻ (gọi là Claims)
    }

    public boolean validateToken(String token, UserDetails userDetails) {
        final String userName = extractUserName(token);
        return (userName.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }

    // Hàm lấy ra ngày hết hạn từ Token
    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    // Hàm kiểm tra xem thẻ đã hết hạn chưa
    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }
}
