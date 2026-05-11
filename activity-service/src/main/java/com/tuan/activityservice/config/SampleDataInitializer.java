package com.tuan.activityservice.config;

import com.tuan.activityservice.entity.Activity;
import com.tuan.activityservice.entity.ChallengeDefinition;
import com.tuan.activityservice.entity.ChallengeParticipant;
import com.tuan.activityservice.entity.CommunityPost;
import com.tuan.activityservice.entity.Notification;
import com.tuan.activityservice.entity.PostComment;
import com.tuan.activityservice.entity.PostLike;
import com.tuan.activityservice.entity.Route;
import com.tuan.activityservice.entity.SavedRoute;
import com.tuan.activityservice.entity.SportDefinition;
import com.tuan.activityservice.entity.SportType;
import com.tuan.activityservice.repository.ActivityRepository;
import com.tuan.activityservice.repository.ChallengeParticipantRepository;
import com.tuan.activityservice.repository.ChallengeRepository;
import com.tuan.activityservice.repository.CommunityPostRepository;
import com.tuan.activityservice.repository.NotificationRepository;
import com.tuan.activityservice.repository.PostCommentRepository;
import com.tuan.activityservice.repository.PostLikeRepository;
import com.tuan.activityservice.repository.RouteRepository;
import com.tuan.activityservice.repository.SavedRouteRepository;
import com.tuan.activityservice.repository.SportDefinitionRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SampleDataInitializer {
    @Bean
    CommandLineRunner seedActivities(
            ActivityRepository activities,
            RouteRepository routes,
            SavedRouteRepository savedRoutes,
            ChallengeRepository challenges,
            ChallengeParticipantRepository participants,
            CommunityPostRepository posts,
            PostCommentRepository comments,
            PostLikeRepository likes,
            NotificationRepository notifications,
            SportDefinitionRepository sportDefs) {
        return args -> {
            if (sportDefs.count() == 0) {
                sportDefs.saveAll(List.of(
                    sport("RUN",   "Chạy bộ",          "🏃", "Môn thể thao dùng chân",  "RUN",  1),
                    sport("TRAIL", "Chạy địa hình",     "🏔️","Môn thể thao dùng chân",  "RUN",  2),
                    sport("WALK",  "Đi bộ",             "🚶", "Môn thể thao dùng chân",  "RUN",  3),
                    sport("HIKE",  "Đi bộ đường dài",   "⛰️", "Môn thể thao dùng chân",  "RUN",  4),
                    sport("BIKE",  "Xe đạp",            "🚴", "Môn thể thao đạp xe",      "RUN",  5),
                    sport("MTB",   "Xe đạp địa hình",   "🚵", "Môn thể thao đạp xe",      "RUN",  6),
                    sport("SWIM",  "Bơi lội",           "🏊", "Môn thể thao dưới nước",   "SWIM", 7),
                    sport("GYM",   "Gym",               "🏋️", "Thể dục & Khác",           "RUN",  8),
                    sport("YOGA",  "Yoga",              "🧘", "Thể dục & Khác",           "RUN",  9),
                    sport("OTHER", "Khác",              "⚡", "Thể dục & Khác",           "RUN",  10)
                ));
            }

            if (activities.count() == 0) {
                activities.saveAll(List.of(
                        run(1L, "Demo Runner", "Canal tempo run", "Held the middle 4K right under target pace.", 7200, 42, 91, 460),
                        swim(1L, "Demo Runner", "Lunch freestyle ladder", "Easy 400 warmup, 8x100 steady, short cooldown.", 1800, 42, 138, 520),
                        run(2L, "Linh Tran", "Bridge repeats", "Six climbs with a relaxed jog home.", 9800, 58, 164, 690),
                        swim(3L, "Minh Pham", "Smooth 2K set", "Focused on long strokes and even breathing.", 2050, 48, 132, 560),
                        run(4L, "Hang Thu", "Recovery park run", "Short easy run to keep the legs fresh.", 5000, 34, 124, 310),
                        swim(5L, "An Nguyen", "Morning endurance swim", "Controlled aerobic set before work.", 1600, 40, 128, 430)
                ));
                activities.saveAll(List.of(
                        withDate(run(1L, "Demo Runner", "Easy recovery", "Kept it light after yesterday's swim.", 5200, 34, 124, 310), 2, 3),
                        withDate(swim(1L, "Demo Runner", "Evening endurance", "Steady 5x300m with long strokes.", 1500, 36, 132, 480), 4, 2),
                        withDate(run(1L, "Demo Runner", "Hill reps", "Short climbs, focus on form.", 6400, 41, 156, 520), 6, 4),
                        withDate(swim(1L, "Demo Runner", "Technique drill", "Pull + kick mix for form.", 1200, 28, 118, 360), 9, 1),
                        withDate(run(1L, "Demo Runner", "Weekend long run", "Easy long run with steady breathing.", 12000, 72, 148, 820), 12, 3)
                ));
            }

            if (routes.count() == 0) {
                routes.saveAll(List.of(
                        route("Saigon River Loop", SportType.RUN, "District 1 - Thu Thiem", 7200, "Flat riverside loop suited for steady pacing."),
                        route("Gia Dinh Park 5K", SportType.RUN, "Gia Dinh Park", 5000, "Loop with shade and easy pacing control."),
                        route("District Pool 50m", SportType.SWIM, "District Sports Center", 1500, "Good for interval sets and technique focus."),
                        route("Recovery Swim Lane", SportType.SWIM, "Phu Nhuan Aquatic", 1000, "Easy lane for recovery swims."),
                        route("Saigon Bridge Tempo", SportType.RUN, "Binh Thanh", 6400, "Rolling climb suitable for tempo blocks.")
                ));
            }

            if (challenges.count() == 0) {
                challenges.saveAll(List.of(
                        challenge("run-30", "Run 30K in a week", "RUN", 30000, "meters", "Keep each run conversational; consistency over pace."),
                        challenge("swim-5k", "Swim 5K in a week", "SWIM", 5000, "meters", "Split into 2-3 sessions to stay relaxed."),
                        challenge("balanced", "Run + Swim balance", "MIXED", 4, "activities", "Complete 2 runs and 2 swims in 7 days.")
                ));
            }

            if (savedRoutes.count() == 0) {
                routes.findAll().stream().limit(2).forEach(route -> savedRoutes.save(savedRoute(1L, route)));
            }

            if (participants.count() == 0) {
                challenges.findAll().stream().limit(2).forEach(challenge -> participants.save(participant(1L, challenge)));
            }

            if (posts.count() == 0) {
                posts.saveAll(List.of(
                        post(1L, "Demo Runner", "Tempo 7K", "Cảm giác ổn, giữ nhịp thở đều suốt 20 phút tempo.", SportType.RUN, 7200.0, 42, 460, "Saigon River Loop"),
                        post(2L, "Linh Tran", "Bridge reps", "Hôm nay tập sức bền leo dốc, chân hơi mỏi nhưng ổn.", SportType.RUN, 9800.0, 58, 690, "Saigon Bridge Tempo"),
                        post(3L, "Minh Pham", "Smooth 2K swim", "Tập trung sải dài và thở nhịp 3.", SportType.SWIM, 2050.0, 48, 560, "District Pool"),
                        post(1L, "Demo Runner", "Lunch swim", "Bơi nhẹ, thả lỏng vai sau buổi chạy.", SportType.SWIM, 1800.0, 42, 520, "District Pool")
                ));
            }

            if (comments.count() == 0) {
                List<CommunityPost> seeded = posts.findTop30ByOrderByCreatedAtDesc();
                if (!seeded.isEmpty()) {
                    comments.saveAll(List.of(
                            comment(seeded.get(0), 2L, "Linh Tran", "Nhịp tempo rất đều, cố lên!"),
                            comment(seeded.get(0), 3L, "Minh Pham", "Pace đẹp đó."),
                            comment(seeded.get(seeded.size() - 1), 1L, "Demo Runner", "Bơi nhẹ tốt cho phục hồi.")
                    ));
                }
            }

            if (likes.count() == 0) {
                List<CommunityPost> seeded = posts.findTop30ByOrderByCreatedAtDesc();
                if (!seeded.isEmpty()) {
                    likes.saveAll(List.of(
                            like(seeded.get(0), 2L),
                            like(seeded.get(0), 3L),
                            like(seeded.get(seeded.size() - 1), 2L)
                    ));
                }
            }

            if (notifications.count() == 0) {
                notifications.saveAll(List.of(
                        notification(1L, "Weekly reminder", "You have 2 run sessions planned this week.", "REMINDER"),
                        notification(1L, "New challenge", "Try the Run 30K in a week challenge.", "CHALLENGE"),
                        notification(1L, "Community update", "Linh Tran liked your latest activity.", "COMMUNITY")
                ));
            }
        };
    }

    private Activity run(Long userId, String athlete, String title, String notes, double meters, int minutes, int hr, int calories) {
        Activity activity = base(userId, athlete, SportType.RUN, title, notes, meters, minutes);
        activity.setAverageHeartRate(hr);
        activity.setCalories(calories);
        activity.setElevationGainMeters(52.0);
        activity.setRouteName("Saigon River Loop");
        return activity;
    }

    private Activity swim(Long userId, String athlete, String title, String notes, double meters, int minutes, int hr, int calories) {
        Activity activity = base(userId, athlete, SportType.SWIM, title, notes, meters, minutes);
        activity.setAverageHeartRate(hr);
        activity.setCalories(calories);
        activity.setPoolLengthMeters(50);
        activity.setStrokes(940);
        activity.setRouteName("District Pool");
        return activity;
    }

    private Activity base(Long userId, String athlete, SportType type, String title, String notes, double meters, int minutes) {
        Activity activity = new Activity();
        activity.setUserId(userId);
        activity.setAthleteName(athlete);
        activity.setSportType(type);
        activity.setTitle(title);
        activity.setDescription(notes);
        activity.setStartedAt(LocalDateTime.now().minusDays(userId).minusHours(minutes % 5));
        activity.setDistanceMeters(meters);
        activity.setDurationMinutes(minutes);
        activity.setVisibility("PUBLIC");
        return activity;
    }

    private Activity withDate(Activity activity, int daysAgo, int hoursAgo) {
        activity.setStartedAt(LocalDateTime.now().minusDays(daysAgo).minusHours(hoursAgo));
        return activity;
    }

    private SportDefinition sport(String code, String label, String icon, String category, String backendSport, int order) {
        SportDefinition def = new SportDefinition();
        def.setCode(code);
        def.setLabel(label);
        def.setIcon(icon);
        def.setCategory(category);
        def.setBackendSport(backendSport);
        def.setSortOrder(order);
        def.setActive(true);
        return def;
    }

    private Route route(String name, SportType sportType, String place, int meters, String note) {
        Route route = new Route();
        route.setName(name);
        route.setSportType(sportType);
        route.setPlace(place);
        route.setDistanceMeters(meters);
        route.setNote(note);
        return route;
    }

    private ChallengeDefinition challenge(String code, String title, String sportType, int target, String unit, String note) {
        ChallengeDefinition challenge = new ChallengeDefinition();
        challenge.setCode(code);
        challenge.setTitle(title);
        challenge.setSportType(sportType);
        challenge.setTargetValue(target);
        challenge.setUnit(unit);
        challenge.setNote(note);
        return challenge;
    }

    private SavedRoute savedRoute(Long userId, Route route) {
        SavedRoute saved = new SavedRoute();
        saved.setUserId(userId);
        saved.setRoute(route);
        return saved;
    }

    private ChallengeParticipant participant(Long userId, ChallengeDefinition challenge) {
        ChallengeParticipant participant = new ChallengeParticipant();
        participant.setUserId(userId);
        participant.setChallenge(challenge);
        return participant;
    }

    private CommunityPost post(Long userId, String athleteName, String title, String content, SportType sportType,
                               double distanceMeters, int durationMinutes, int calories, String routeName) {
        CommunityPost post = new CommunityPost();
        post.setUserId(userId);
        post.setAthleteName(athleteName);
        post.setTitle(title);
        post.setContent(content);
        post.setSportType(sportType);
        post.setDistanceMeters(distanceMeters);
        post.setDurationMinutes(durationMinutes);
        post.setCalories(calories);
        post.setRouteName(routeName);
        post.setVisibility("PUBLIC");
        return post;
    }

    private PostComment comment(CommunityPost post, Long userId, String name, String content) {
        PostComment comment = new PostComment();
        comment.setPost(post);
        comment.setUserId(userId);
        comment.setDisplayName(name);
        comment.setContent(content);
        return comment;
    }

    private PostLike like(CommunityPost post, Long userId) {
        PostLike like = new PostLike();
        like.setPost(post);
        like.setUserId(userId);
        return like;
    }

    private Notification notification(Long userId, String title, String message, String type) {
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notification.setRead(false);
        return notification;
    }
}
