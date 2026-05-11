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
            if (!users.existsByEmailIgnoreCase("runner@example.com")) {
                UserAccount demo = new UserAccount();
                demo.setFullName("Demo Runner");
                demo.setEmail("runner@example.com");
                demo.setPasswordHash(encoder.encode("RunSwim123"));
                demo.setPreferredSports("RUN,SWIM");
                demo.setOnboardingCompleted(true);
                demo.setActive(true);
                demo.setPremiumActive(true);
                users.save(demo);
            }
            List<UserAccount> sampleUsers = List.of(
                    user("Linh Tran", "linh.tran@example.com", encoder.encode("RunSwim123"), true, false),
                    user("Minh Pham", "minh.pham@example.com", encoder.encode("RunSwim123"), true, true),
                    user("Hang Thu", "hang.thu@example.com", encoder.encode("RunSwim123"), true, false),
                    user("An Nguyen", "an.nguyen@example.com", encoder.encode("RunSwim123"), true, true)
            );
            for (UserAccount sample : sampleUsers) {
                if (!users.existsByEmailIgnoreCase(sample.getEmail())) {
                    users.save(sample);
                }
            }
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
