package com.tuan.userservice.config;

import com.tuan.userservice.entity.User;
import com.tuan.userservice.entity.UserProfile;
import com.tuan.userservice.repository.UserProfileRepository;
import com.tuan.userservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Set;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.seed", name = "sample-data", havingValue = "true")
public class SampleUserDataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;

    @Override
    public void run(String... args) {
                // Remove seeded user if present
                try {
                        userRepository.findByEmail("nguyenvanc@gmail.com").ifPresent(u -> {
                                userProfileRepository.findByUserId(u.getId()).ifPresent(userProfileRepository::delete);
                                userRepository.delete(u);
                        });
                } catch (Exception ignore) {
                        // ignore any deletion errors here
                }

                User user1 = upsertUser("nguyenvanc@gmail.com", "Nguyễn văn C", 27, "male", 170.0, 68.0, "Giam mo");
                User user2 = upsertUser("tranlinh@gmail.com", "Tran Linh", 24, "female", 162.0, 55.0, "Tang co");
                User user3 = upsertUser("phamminh@gmail.com", "Pham Minh", 29, "male", 175.0, 78.0, "Suc ben");
                User user4 = upsertUser("thuhang@gmail.com", "Thu Hang", 31, "female", 160.0, 58.0, "Duy tri the luc");
        upsertProfile(user1.getId(), "Uu tien giam mo va tap deu de on dinh can nang.", "Beginner", "Mixed", 4,
                2000, 120, 240, 60, 3, Set.of("cardio", "strength"), Set.of());
        upsertProfile(user2.getId(), "Uu tien tap tai nha va yoga.", "Beginner", "Yoga", 3,
                1850, 95, 220, 55, 3, Set.of("home", "yoga"), Set.of());
        upsertProfile(user3.getId(), "Dang luyen cho muc tieu chay 10km.", "Intermediate", "Cardio", 5,
                2400, 140, 290, 67, 4, Set.of("running", "cardio"), Set.of("dau phong"));
        upsertProfile(user4.getId(), "Can bang giua tap luyen va cong viec.", "Beginner", "Mixed", 3,
                1900, 100, 230, 58, 3, Set.of("mixed", "pilates"), Set.of());
    }

        private User upsertUser(String email, String legacyEmail, String name, Integer age, String gender, Double height, Double weight, String fitnessGoal) {
                User user = userRepository.findByEmail(email)
                                .or(() -> userRepository.findByEmail(legacyEmail))
                                .orElseGet(User::new);
                user.setEmail(email);
                user.setName(name);
                user.setAge(age);
                user.setGender(gender);
                user.setHeight(height);
                user.setWeight(weight);
                user.setFitnessGoal(fitnessGoal);
                return userRepository.save(user);
        }

    private User upsertUser(String email, String name, Integer age, String gender, Double height, Double weight, String fitnessGoal) {
        User user = userRepository.findByEmail(email).orElseGet(User::new);
        user.setEmail(email);
        user.setName(name);
        user.setAge(age);
        user.setGender(gender);
        user.setHeight(height);
        user.setWeight(weight);
        user.setFitnessGoal(fitnessGoal);
        return userRepository.save(user);
    }

    private void upsertProfile(
            Long userId,
            String bio,
            String fitnessLevel,
            String preferredWorkoutType,
            Integer weeklyGoal,
            Integer targetCalories,
            Integer proteinTarget,
            Integer carbsTarget,
            Integer fatTarget,
            Integer mealsPerDay,
            Set<String> preferences,
            Set<String> allergies
    ) {
        UserProfile profile = userProfileRepository.findByUserId(userId).orElseGet(UserProfile::new);
        profile.setUserId(userId);
        profile.setBio(bio);
        profile.setFitnessLevel(fitnessLevel);
        profile.setPreferredWorkoutType(preferredWorkoutType);
        profile.setWeeklyGoal(weeklyGoal);
        profile.setTargetCalories(targetCalories);
        profile.setProteinTarget(proteinTarget);
        profile.setCarbsTarget(carbsTarget);
        profile.setFatTarget(fatTarget);
        profile.setMealsPerDay(mealsPerDay);
        profile.setPreferences(new HashSet<>(preferences));
        profile.setAllergies(new HashSet<>(allergies));
        userProfileRepository.save(profile);
    }
}
