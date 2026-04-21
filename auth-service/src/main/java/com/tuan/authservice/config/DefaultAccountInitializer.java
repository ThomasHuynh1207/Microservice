package com.tuan.authservice.config;

import com.tuan.authservice.entity.User;
import com.tuan.authservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Component
@RequiredArgsConstructor
public class DefaultAccountInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    private static final List<SeedAccount> DEFAULT_ACCOUNTS = List.of(
            new SeedAccount("admin@gmail.com", "Admin", "admin12345", "ADMIN"),
            new SeedAccount("nguyenvanc@gmail.com", "Nguyễn văn C", "Nam12345", "USER"),
            new SeedAccount("tranlinh@gmail.com", "Tran Linh", "Linh12345", "USER"),
            new SeedAccount("phamminh@gmail.com", "Pham Minh", "Minh12345", "USER"),
            new SeedAccount("thuhang@gmail.com", "Thu Hang", "Hang12345", "USER")
    );

    @Override
    @Transactional
    public void run(String... args) {
        // Ensure the problematic seeded account is removed from DB if present.
        try {
            userRepository.deleteByEmailIgnoreCase("nguyenvanb@gmail.com");
        } catch (Exception ignore) {
            // ignore failures during deletion attempt
        }

        try {
            userRepository.deleteByEmailIgnoreCase("nguyenvanc@gmail.com");
        } catch (Exception ignore) {
            // ignore failures during deletion attempt
        }

        removeLegacyAdminAccount("coach.fitlife@gmail.com");

        for (SeedAccount account : DEFAULT_ACCOUNTS) {
            synchronizeAccount(account);
        }
    }

    private void removeLegacyAdminAccount(String email) {
        if (email == null || email.isBlank()) {
            return;
        }

        userRepository.deleteByEmailIgnoreCase(email.trim().toLowerCase(Locale.ROOT));
    }

    private void synchronizeAccount(SeedAccount account) {
        String normalizedEmail = account.email().trim().toLowerCase(Locale.ROOT);
        List<User> candidates = userRepository.findAllByEmailIgnoreCase(normalizedEmail);

        User user = candidates.stream()
                .min(Comparator.comparing(User::getId, Comparator.nullsLast(Long::compareTo)))
                .orElseGet(User::new);

        user.setEmail(normalizedEmail);
        user.setName(account.name());
        user.setRole(account.role());
        user.setStatus(com.tuan.authservice.entity.AccountStatus.ACTIVE);
        user.setForcePasswordReset(false);

        // Deterministic reset: every startup guarantees default account credentials are usable.
        user.setPassword(passwordEncoder.encode(account.rawPassword()));
        userRepository.save(user);

        for (User duplicate : candidates) {
            if (user.getId() != null && user.getId().equals(duplicate.getId())) {
                continue;
            }

            duplicate.setPassword(passwordEncoder.encode(account.rawPassword()));
            duplicate.setRole(account.role());
            duplicate.setStatus(com.tuan.authservice.entity.AccountStatus.ACTIVE);
            duplicate.setForcePasswordReset(false);
            if (duplicate.getName() == null || duplicate.getName().isBlank()) {
                duplicate.setName(account.name());
            }
            userRepository.save(duplicate);
        }
    }

    private record SeedAccount(String email, String name, String rawPassword, String role) {}
}