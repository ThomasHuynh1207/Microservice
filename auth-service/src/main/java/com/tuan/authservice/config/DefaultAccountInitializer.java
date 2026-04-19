package com.tuan.authservice.config;

import com.tuan.authservice.entity.User;
import com.tuan.authservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

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
            new SeedAccount("nguyenvanb@gmail.com", "Nguyen Van B", "Nam12345", "USER"),
            // Keep legacy email so older environments can still log in.
            new SeedAccount("nguyenvanb@gmail", "Nguyen Van B", "Nam12345", "USER"),
            new SeedAccount("tranlinh@gmail.com", "Tran Linh", "Linh12345", "USER"),
            new SeedAccount("phamminh@gmail.com", "Pham Minh", "Minh12345", "USER"),
            new SeedAccount("thuhang@gmail.com", "Thu Hang", "Hang12345", "USER"),
            new SeedAccount("coach.fitlife@gmail.com", "Coach FitLife", "Coach12345", "ADMIN")
    );

    @Override
    public void run(String... args) {
        for (SeedAccount account : DEFAULT_ACCOUNTS) {
            synchronizeAccount(account);
        }
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

        // Deterministic reset: every startup guarantees default account credentials are usable.
        user.setPassword(passwordEncoder.encode(account.rawPassword()));
        userRepository.save(user);

        for (User duplicate : candidates) {
            if (user.getId() != null && user.getId().equals(duplicate.getId())) {
                continue;
            }

            duplicate.setPassword(passwordEncoder.encode(account.rawPassword()));
            duplicate.setRole(account.role());
            if (duplicate.getName() == null || duplicate.getName().isBlank()) {
                duplicate.setName(account.name());
            }
            userRepository.save(duplicate);
        }
    }

    private record SeedAccount(String email, String name, String rawPassword, String role) {}
}