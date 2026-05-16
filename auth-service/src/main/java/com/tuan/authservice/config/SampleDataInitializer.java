package com.tuan.authservice.config;

import com.tuan.authservice.entity.UserAccount;
import com.tuan.authservice.repository.UserAccountRepository;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class SampleDataInitializer {
    @Bean
    CommandLineRunner seedAuthUsers(UserAccountRepository users, PasswordEncoder encoder) {
        return args -> {
            // 10 regular users seeded first so IDs are 1-10
            List<UserAccount> regularUsers = List.of(
                user("Demo Runner",  "runner@example.com",     encoder.encode("RunSwim123"), true,  true),
                user("Linh Tran",    "linh.tran@example.com",  encoder.encode("RunSwim123"), true,  false),
                user("Minh Pham",    "minh.pham@example.com",  encoder.encode("RunSwim123"), true,  true),
                user("Hang Thu",     "hang.thu@example.com",   encoder.encode("RunSwim123"), true,  false),
                user("An Nguyen",    "an.nguyen@example.com",  encoder.encode("RunSwim123"), true,  true),
                user("Duc Nguyen",   "duc.nguyen@example.com", encoder.encode("RunSwim123"), true,  false),
                user("Trang Le",     "trang.le@example.com",   encoder.encode("RunSwim123"), true,  true),
                user("Khoa Bui",     "khoa.bui@example.com",   encoder.encode("RunSwim123"), true,  false),
                user("Mai Hoang",    "mai.hoang@example.com",  encoder.encode("RunSwim123"), true,  true),
                user("Tien Vo",      "tien.vo@example.com",    encoder.encode("RunSwim123"), true,  false)
            );
            for (UserAccount u : regularUsers) {
                if (!users.existsByEmailIgnoreCase(u.getEmail())) {
                    users.save(u);
                }
            }
            // Admin seeded last → gets ID 11
            if (!users.existsByEmailIgnoreCase("admin@runswim.local")) {
                UserAccount admin = new UserAccount();
                admin.setFullName("Admin");
                admin.setEmail("admin@runswim.local");
                admin.setPasswordHash(encoder.encode("Admin@123"));
                admin.setRole("ADMIN");
                admin.setOnboardingCompleted(true);
                admin.setActive(true);
                users.save(admin);
            }
        };
    }

    private UserAccount user(String fullName, String email, String passwordHash,
                             boolean onboardingCompleted, boolean premiumActive) {
        UserAccount account = new UserAccount();
        account.setFullName(fullName);
        account.setEmail(email);
        account.setPasswordHash(passwordHash);
        account.setPreferredSports("RUN,SWIM");
        account.setOnboardingCompleted(onboardingCompleted);
        account.setActive(true);
        account.setPremiumActive(premiumActive);
        return account;
    }
}
