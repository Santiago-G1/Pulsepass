package com.pulsepass.pulsepass.service;

import com.pulsepass.pulsepass.domain.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Date;
import java.util.List;
import java.util.UUID;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    private final String secretBase64;
    private final String issuer;
    private final long expirationSeconds;
    private SecretKey secretKey;

    public JwtService(
            @Value("${pulsepass.jwt.secret-base64}") String secretBase64,
            @Value("${pulsepass.jwt.issuer}") String issuer,
            @Value("${pulsepass.jwt.expiration-seconds}") long expirationSeconds) {
        this.secretBase64 = secretBase64;
        this.issuer = issuer;
        this.expirationSeconds = expirationSeconds;
    }

    @PostConstruct
    void init() {
        byte[] decoded = Base64.getDecoder().decode(secretBase64);
        if (decoded.length < 32) {
            throw new IllegalArgumentException("JWT secret must decode to at least 32 bytes.");
        }
        this.secretKey = Keys.hmacShaKeyFor(decoded);
    }

    public String generateToken(User user) {
        List<String> roles = user.getRoles().stream()
                .map(role -> "ROLE_" + role.name())
                .toList();
        return Jwts.builder()
                .subject(String.valueOf(user.getId()))
                .issuer(issuer)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + (expirationSeconds * 1000L)))
                .id(UUID.randomUUID().toString())
                .claim("username", user.getUsername())
                .claim("email", user.getEmail())
                .claim("roles", roles)
                .signWith(secretKey, Jwts.SIG.HS256)
                .compact();
    }

    public boolean isTokenValid(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException ex) {
            return false;
        }
    }

    public Long getUserId(String token) {
        return Long.parseLong(parseClaims(token).getSubject());
    }

    public Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .requireIssuer(issuer)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
