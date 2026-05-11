package com.tuan.authservice.service;

import com.tuan.authservice.entity.UserAccount;
import com.tuan.authservice.repository.UserAccountRepository;
import java.util.Locale;
import java.util.stream.Collectors;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final UserAccountRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserAccountRepository users, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (users.existsByEmailIgnoreCase(email)) {
            throw new IllegalArgumentException("Email already exists");
        }

        UserAccount account = new UserAccount();
        account.setFullName(blankToDefault(request.fullName(), "New athlete"));
        account.setEmail(email);
        account.setPasswordHash(passwordEncoder.encode(request.password()));
        account.setActive(true);
        account.setPreferredSports(request.preferredSports() == null || request.preferredSports().isEmpty()
                ? "RUN,SWIM"
                : request.preferredSports().stream().map(String::toUpperCase).collect(Collectors.joining(",")));
        users.save(account);
        return toResponse(account);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        UserAccount account = users.findByEmailIgnoreCase(normalizeEmail(request.email()))
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));
        if (!account.isActive()) {
            throw new IllegalArgumentException("Account is locked");
        }
        if (!passwordEncoder.matches(request.password(), account.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid email or password");
        }
        return toResponse(account);
    }

    @Transactional
    public void markOnboardingCompleted(Long userId) {
        users.findById(userId).ifPresent(account -> account.setOnboardingCompleted(true));
    }

    @Transactional(readOnly = true)
    public AuthResponse me(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw new IllegalArgumentException("Missing token");
        }
        String email = jwtService.parse(authorization.substring(7)).getSubject();
        UserAccount account = users.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return toResponse(account);
    }

    private AuthResponse toResponse(UserAccount account) {
        return new AuthResponse(
                jwtService.createToken(account),
                account.getId(),
                account.getFullName(),
                account.getEmail(),
                account.getRole(),
            account.isOnboardingCompleted(),
            account.isActive(),
            account.isPremiumActive()
        );
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    private String blankToDefault(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    public record RegisterRequest(String fullName, String email, String password, java.util.List<String> preferredSports) {
    }

    public record LoginRequest(String email, String password) {
    }

    public record AuthResponse(
            String token,
            Long userId,
            String fullName,
            String email,
            String role,
            boolean onboardingCompleted,
            boolean active,
            boolean premiumActive
    ) {
    }
}
