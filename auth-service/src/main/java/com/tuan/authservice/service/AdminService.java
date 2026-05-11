package com.tuan.authservice.service;

import com.tuan.authservice.entity.UserAccount;
import com.tuan.authservice.repository.UserAccountRepository;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminService {

    private final UserAccountRepository users;

    public AdminService(UserAccountRepository users) {
        this.users = users;
    }

    public boolean isAdmin(Long userId) {
        return users.findById(userId)
                .map(u -> "ADMIN".equalsIgnoreCase(u.getRole()))
                .orElse(false);
    }

    @Transactional(readOnly = true)
    public List<UserSummary> getAllUsers() {
        return users.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toSummary)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DashboardStats getStats() {
        long total = users.count();
        long active = users.countByActiveTrue();
        long premium = users.countByPremiumActiveTrue();
        return new DashboardStats(total, active, premium);
    }

    @Transactional
    public UserSummary updateUser(Long userId, UpdateUserRequest req) {
        UserAccount account = users.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        if (req.role() != null && !req.role().isBlank()) {
            account.setRole(req.role().toUpperCase());
        }
        if (req.active() != null) {
            account.setActive(req.active());
        }
        if (req.premiumActive() != null) {
            account.setPremiumActive(req.premiumActive());
            if (req.premiumActive() && account.getPremiumSince() == null) {
                account.setPremiumSince(Instant.now());
            }
        }
        return toSummary(users.save(account));
    }

    private UserSummary toSummary(UserAccount u) {
        return new UserSummary(
                u.getId(), u.getFullName(), u.getEmail(),
                u.getRole(), u.isActive(), u.isPremiumActive(),
                u.isOnboardingCompleted(), u.getPreferredSports(),
                u.getCreatedAt(), u.getPremiumSince()
        );
    }

    public record UserSummary(
            Long id, String fullName, String email,
            String role, boolean active, boolean premiumActive,
            boolean onboardingCompleted, String preferredSports,
            Instant createdAt, Instant premiumSince) {}

    public record DashboardStats(long totalUsers, long activeUsers, long premiumUsers) {}

    public record UpdateUserRequest(String role, Boolean active, Boolean premiumActive) {}
}
