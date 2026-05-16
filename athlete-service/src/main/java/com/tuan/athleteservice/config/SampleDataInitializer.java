package com.tuan.athleteservice.config;

import com.tuan.athleteservice.entity.AthleteProfile;
import com.tuan.athleteservice.entity.Follow;
import com.tuan.athleteservice.entity.OnboardingGoal;
import com.tuan.athleteservice.repository.AthleteProfileRepository;
import com.tuan.athleteservice.repository.FollowRepository;
import com.tuan.athleteservice.repository.OnboardingGoalRepository;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SampleDataInitializer {
    @Bean
    CommandLineRunner seedAthletes(AthleteProfileRepository profiles, FollowRepository follows,
                                   OnboardingGoalRepository goals) {
        return args -> {
            List<AthleteProfile> sampleProfiles = List.of(
                profile(1L,  "Demo Runner", "Ho Chi Minh City", "Sub-60 10K and 3K swim week",             35, 3200, "INTERMEDIATE", "RUN,SWIM"),
                profile(2L,  "Linh Tran",   "Da Nang",          "Build a steady half-marathon base",        45, 1600, "INTERMEDIATE", "RUN,SWIM"),
                profile(3L,  "Minh Pham",   "Ha Noi",           "Swim smoother freestyle sets",             18, 5200, "ADVANCED",     "RUN,SWIM"),
                profile(4L,  "Hang Thu",    "Nha Trang",        "Add one more swim technique day",          28, 1800, "BEGINNER",     "RUN,SWIM"),
                profile(5L,  "An Nguyen",   "Can Tho",          "Swim endurance and easy weekend runs",     22, 3600, "INTERMEDIATE", "RUN,SWIM"),
                profile(6L,  "Duc Nguyen",  "Hue",              "Complete first marathon under 4 hours",    42, 1000, "INTERMEDIATE", "RUN"),
                profile(7L,  "Trang Le",    "Hai Phong",        "Drop 200m freestyle time under 2:30",      12, 5000, "ADVANCED",     "SWIM"),
                profile(8L,  "Khoa Bui",    "Ho Chi Minh City", "Complete sprint triathlon this season",    30, 2500, "BEGINNER",     "RUN,SWIM"),
                profile(9L,  "Mai Hoang",   "Da Lat",           "Trail ultra 50K preparation",              60,  600, "ADVANCED",     "RUN"),
                profile(10L, "Tien Vo",     "Vung Tau",         "Maintain 5 active sessions per week",      20, 2000, "BEGINNER",     "RUN,SWIM")
            );
            for (AthleteProfile sample : sampleProfiles) {
                profiles.findByUserId(sample.getUserId()).orElseGet(() -> profiles.save(sample));
            }

            if (goals.count() == 0) {
                goals.saveAll(List.of(
                    goal("Giảm cân & cải thiện vóc dáng",  "Đốt mỡ, tăng cường sức khỏe tim mạch và cải thiện ngoại hình thông qua vận động đều đặn.", 1),
                    goal("Cải thiện tốc độ & hiệu suất",   "Nâng cao thành tích thi đấu, tăng tốc độ và kỹ thuật chạy/bơi cho vận động viên có mục tiêu cụ thể.", 2),
                    goal("Tăng sức bền lâu dài",           "Xây dựng nền tảng thể lực vững chắc để hoàn thành các cự ly dài như marathon hay open water.", 3),
                    goal("Luyện tập cho vui & thư giãn",   "Tận hưởng hoạt động thể chất mà không áp lực thành tích — phù hợp cho người mới bắt đầu.", 4),
                    goal("Mục tiêu cá nhân",               "Theo đuổi mục tiêu riêng như hoàn thành sự kiện đầu tiên, phục hồi sau chấn thương hoặc duy trì lối sống năng động.", 5)
                ));
            }

            if (follows.count() == 0) {
                follows.saveAll(List.of(
                    follow(1L,  2L), follow(1L,  3L), follow(1L,  9L),
                    follow(2L,  1L), follow(2L,  6L),
                    follow(3L,  5L), follow(3L,  7L),
                    follow(4L,  1L), follow(4L,  8L),
                    follow(5L,  1L), follow(5L,  3L),
                    follow(6L,  1L), follow(6L,  9L),
                    follow(7L,  3L), follow(7L,  5L),
                    follow(8L,  1L), follow(8L,  4L),
                    follow(9L,  6L), follow(9L,  1L),
                    follow(10L, 4L), follow(10L, 8L)
                ));
            }
        };
    }

    private AthleteProfile profile(Long userId, String name, String city, String goal,
                                   double runKm, int swimMeters, String level, String sports) {
        AthleteProfile profile = new AthleteProfile();
        profile.setUserId(userId);
        profile.setDisplayName(name);
        profile.setCity(city);
        profile.setPrimaryGoal(goal);
        profile.setBio("Run and swim focused athlete from " + city + ".");
        profile.setExperienceLevel(level);
        profile.setPreferredTrainingDays("MON,WED,FRI,SUN");
        profile.setNutritionFocus("Endurance performance");
        profile.setWeeklyRunGoalKm(runKm);
        profile.setWeeklySwimGoalMeters(swimMeters);
        profile.setCompletedOnboarding(true);
        return profile;
    }

    private OnboardingGoal goal(String title, String description, int sortOrder) {
        OnboardingGoal g = new OnboardingGoal();
        g.setTitle(title);
        g.setDescription(description);
        g.setSortOrder(sortOrder);
        g.setActive(true);
        return g;
    }

    private Follow follow(Long followerId, Long followingId) {
        Follow follow = new Follow();
        follow.setFollowerUserId(followerId);
        follow.setFollowingUserId(followingId);
        return follow;
    }
}
