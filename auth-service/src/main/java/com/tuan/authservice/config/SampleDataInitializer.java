package com.tuan.authservice.config;

import com.tuan.authservice.entity.UserAccount;
import com.tuan.authservice.repository.UserAccountRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class SampleDataInitializer {
    @Bean
    CommandLineRunner seedAuthUsers(UserAccountRepository users, PasswordEncoder encoder) {
        return args -> {
            if (users.existsByEmailIgnoreCase("runner@example.com")) {
                return;
            }
            UserAccount demo = new UserAccount();
            demo.setFullName("Demo Runner");
            demo.setEmail("runner@example.com");
            demo.setPasswordHash(encoder.encode("RunSwim123"));
            demo.setPreferredSports("RUN,SWIM");
            demo.setOnboardingCompleted(true);
            demo.setActive(true);
            demo.setPremiumActive(true);
            users.save(demo);
        };
    }
}
