package com.tuan.activityservice.config;

import com.tuan.activityservice.entity.Activity;
import com.tuan.activityservice.entity.ChallengeDefinition;
import com.tuan.activityservice.entity.ChallengeParticipant;
import com.tuan.activityservice.entity.Notification;
import com.tuan.activityservice.entity.SportDefinition;
import com.tuan.activityservice.entity.SportType;
import com.tuan.activityservice.repository.ActivityRepository;
import com.tuan.activityservice.repository.ChallengeParticipantRepository;
import com.tuan.activityservice.repository.ChallengeRepository;
import com.tuan.activityservice.repository.NotificationRepository;
import com.tuan.activityservice.repository.SportDefinitionRepository;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SampleDataInitializer {
    @Bean
    CommandLineRunner seedActivities(
            ActivityRepository activities,
            ChallengeRepository challenges,
            ChallengeParticipantRepository participants,
            NotificationRepository notifications,
            SportDefinitionRepository sportDefs) {
        return args -> {

            // 1. Sport definitions
            if (sportDefs.count() == 0) {
                sportDefs.saveAll(List.of(
                    sport("RUN",   "Chạy bộ",          "🏃",  "Môn thể thao dùng chân",  "RUN",  1),
                    sport("TRAIL", "Chạy địa hình",     "🏔️", "Môn thể thao dùng chân",  "RUN",  2),
                    sport("WALK",  "Đi bộ",             "🚶",  "Môn thể thao dùng chân",  "RUN",  3),
                    sport("HIKE",  "Đi bộ đường dài",   "⛰️",  "Môn thể thao dùng chân",  "RUN",  4),
                    sport("BIKE",  "Xe đạp",            "🚴",  "Môn thể thao đạp xe",      "RUN",  5),
                    sport("MTB",   "Xe đạp địa hình",   "🚵",  "Môn thể thao đạp xe",      "RUN",  6),
                    sport("SWIM",  "Bơi lội",           "🏊",  "Môn thể thao dưới nước",   "SWIM", 7),
                    sport("GYM",   "Gym",               "🏋️", "Thể dục & Khác",           "RUN",  8),
                    sport("YOGA",  "Yoga",              "🧘",  "Thể dục & Khác",           "RUN",  9),
                    sport("OTHER", "Khác",              "⚡",  "Thể dục & Khác",           "RUN",  10)
                ));
            }

            // 2. Activities — per-user idempotent seeding
            Set<Long> seededUsers = activities.findAll().stream()
                    .map(Activity::getUserId).collect(Collectors.toSet());

            List<Activity> toSeed = new ArrayList<>();

            if (!seededUsers.contains(1L)) {
                toSeed.add(run( 1L, "Demo Runner", "Canal tempo run",      "Held middle 4K right under target pace.",    7200, 42, 91,  460));
                toSeed.add(swim(1L, "Demo Runner", "Lunch freestyle",       "8x100 steady, short cooldown.",              1800, 42, 138, 520));
                toSeed.add(aged(run( 1L, "Demo Runner", "Easy recovery",    "Light after yesterday swim.",                5200, 34, 124, 310), 2, 3));
                toSeed.add(aged(swim(1L, "Demo Runner", "Evening endurance","Steady 5x300m, long strokes.",               1500, 36, 132, 480), 4, 2));
                toSeed.add(aged(run( 1L, "Demo Runner", "Hill reps",        "Short climbs, focus on form.",               6400, 41, 156, 520), 6, 4));
                toSeed.add(aged(swim(1L, "Demo Runner", "Technique drill",  "Pull + kick mix for form.",                  1200, 28, 118, 360), 9, 1));
                toSeed.add(aged(run( 1L, "Demo Runner", "Weekend long run", "Easy long run, steady breathing.",          12000, 72, 148, 820), 12, 3));
            }
            if (!seededUsers.contains(2L)) {
                toSeed.add(run( 2L, "Linh Tran",  "Bridge repeats",        "Six climbs, relaxed jog home.",              9800, 58, 164, 690));
                toSeed.add(swim(2L, "Linh Tran",  "Steady 1K swim",        "Focused on breathing rhythm.",               1000, 25, 128, 320));
                toSeed.add(aged(run(2L, "Linh Tran", "Tempo intervals",    "4x1K at 5K pace with 90s rest.",             8000, 50, 168, 600), 3, 2));
            }
            if (!seededUsers.contains(3L)) {
                toSeed.add(swim(3L, "Minh Pham",  "Smooth 2K set",         "Long strokes, even breathing.",              2050, 48, 132, 560));
                toSeed.add(swim(3L, "Minh Pham",  "Kick drill session",    "Board kick 10x50m, technique focus.",        1500, 35, 122, 400));
                toSeed.add(aged(run(3L, "Minh Pham", "Easy 5K",            "Conversational pace with friends.",          5000, 32, 126, 350), 5, 1));
            }
            if (!seededUsers.contains(4L)) {
                toSeed.add(run( 4L, "Hang Thu",   "Recovery park run",     "Easy to keep legs fresh.",                   5000, 34, 124, 310));
                toSeed.add(swim(4L, "Hang Thu",   "Technique swim",        "Focused on catch phase of stroke.",          1200, 30, 118, 330));
                toSeed.add(aged(run(4L, "Hang Thu", "Fartlek session",     "Unstructured speed play, 8K.",               8000, 48, 155, 520), 4, 2));
            }
            if (!seededUsers.contains(5L)) {
                toSeed.add(swim(5L, "An Nguyen",  "Morning endurance",     "Aerobic set before work.",                   1600, 40, 128, 430));
                toSeed.add(swim(5L, "An Nguyen",  "Pull buoy set",         "Upper body isolation, 1.8K.",                1800, 38, 130, 460));
                toSeed.add(aged(run(5L, "An Nguyen", "Evening jog",        "Easy 6K by the river.",                      6000, 38, 132, 380), 2, 3));
            }
            if (!seededUsers.contains(6L)) {
                toSeed.add(run( 6L, "Duc Nguyen", "Marathon pace run",     "15K at target marathon pace.",              15000, 90, 152, 980));
                toSeed.add(run( 6L, "Duc Nguyen", "Easy aerobic build",    "10K conversational, building base.",        10000, 62, 136, 620));
                toSeed.add(aged(run(6L, "Duc Nguyen", "Long slow distance","22K LSD, keep HR under 145.",              22000, 135, 142, 1380), 7, 4));
            }
            if (!seededUsers.contains(7L)) {
                toSeed.add(swim(7L, "Trang Le",   "Speed set",             "8x50m sprint with 30s rest.",                  800, 22, 168, 340));
                toSeed.add(swim(7L, "Trang Le",   "Endurance 3K",          "200m + 8x200m + 200m cooldown.",             3000, 62, 144, 650));
                toSeed.add(aged(run(7L, "Trang Le", "Active recovery run", "Easy 4K to flush legs.",                     4000, 28, 128, 280), 3, 1));
            }
            if (!seededUsers.contains(8L)) {
                toSeed.add(run( 8L, "Khoa Bui",   "Brick run off bike",    "5K run immediately after 20K bike.",         5000, 32, 162, 380));
                toSeed.add(swim(8L, "Khoa Bui",   "Open water prep",       "2K at race-simulation effort.",              2000, 45, 148, 490));
                toSeed.add(aged(run(8L, "Khoa Bui", "Interval 6K",         "6x1K at 5K pace, building speed.",           6000, 38, 165, 460), 5, 2));
            }
            if (!seededUsers.contains(9L)) {
                toSeed.add(run( 9L, "Mai Hoang",  "Trail climb session",   "Technical mountain trail, 12K.",            12000, 95, 158, 1050));
                toSeed.add(run( 9L, "Mai Hoang",  "Ridge loop",            "Beautiful ridge route, elevation 850m.",    18000, 130, 148, 1480));
                toSeed.add(aged(run(9L, "Mai Hoang", "Recovery trail",     "Easy 8K on flat forest trail.",              8000, 55, 134, 560), 3, 2));
            }
            if (!seededUsers.contains(10L)) {
                toSeed.add(run( 10L, "Tien Vo",   "Beachside run",         "5K along the coast, great views.",           5000, 35, 138, 360));
                toSeed.add(swim(10L, "Tien Vo",   "Sea swim",              "1.5K open water in calm conditions.",        1500, 38, 132, 400));
                toSeed.add(aged(run(10L, "Tien Vo", "Sunrise jog",         "Easy morning 4K before work.",               4000, 28, 128, 280), 2, 1));
            }

            if (!toSeed.isEmpty()) activities.saveAll(toSeed);

            // 3. Challenges
            if (challenges.count() == 0) {
                challenges.saveAll(List.of(
                    challenge("run-30",   "Run 30K in a week",     "RUN",   30000, "meters",     "Keep each run conversational; consistency over pace."),
                    challenge("swim-5k",  "Swim 5K in a week",     "SWIM",  5000,  "meters",     "Split into 2-3 sessions to stay relaxed."),
                    challenge("balanced", "Run + Swim balance",    "MIXED", 4,     "activities",  "Complete 2 runs and 2 swims in 7 days."),
                    challenge("trail-50", "Trail 50K this month",  "RUN",   50000, "meters",     "Ideal for trail enthusiasts building ultra base.")
                ));
            }

            if (participants.count() == 0) {
                List<ChallengeDefinition> all = challenges.findAll();
                if (all.size() >= 2) {
                    participants.saveAll(List.of(
                        participant(1L,  all.get(0)), participant(1L,  all.get(1)),
                        participant(2L,  all.get(0)),
                        participant(5L,  all.get(1)),
                        participant(6L,  all.get(0)),
                        participant(7L,  all.get(1)),
                        participant(8L,  all.get(2)),
                        participant(9L,  all.get(3 < all.size() ? 3 : 0))
                    ));
                }
            }

            // 4. Notifications — per-user
            Set<Long> notifUsers = notifications.findAll().stream()
                    .map(Notification::getUserId).collect(Collectors.toSet());
            List<Notification> notifs = new ArrayList<>();
            if (!notifUsers.contains(1L)) {
                notifs.add(notification(1L, "Weekly reminder", "You have 2 run sessions planned this week.", "REMINDER"));
                notifs.add(notification(1L, "New challenge",   "Try the Run 30K in a week challenge.",        "CHALLENGE"));
            }
            if (!notifUsers.contains(2L))
                notifs.add(notification(2L, "Challenge joined", "You joined the Run 30K challenge. Good luck!", "CHALLENGE"));
            if (!notifUsers.contains(9L))
                notifs.add(notification(9L, "Weekly reminder", "Trail session scheduled for this weekend.", "REMINDER"));
            if (!notifs.isEmpty()) notifications.saveAll(notifs);
        };
    }

    // ── helpers ──────────────────────────────────────────────────────────────────

    private Activity run(Long userId, String athlete, String title, String notes,
                         double meters, int minutes, int hr, int calories) {
        Activity a = base(userId, athlete, SportType.RUN, title, notes, meters, minutes);
        a.setAverageHeartRate(hr);
        a.setCalories(calories);
        a.setElevationGainMeters(userId % 3 == 0 ? 85.0 : 42.0);
        a.setRouteName(userId <= 5 ? "Saigon River Loop" : userId == 9 ? "Da Lat Ridge" : "City Route");
        return a;
    }

    private Activity swim(Long userId, String athlete, String title, String notes,
                          double meters, int minutes, int hr, int calories) {
        Activity a = base(userId, athlete, SportType.SWIM, title, notes, meters, minutes);
        a.setAverageHeartRate(hr);
        a.setCalories(calories);
        a.setPoolLengthMeters(50);
        a.setStrokes(940);
        a.setRouteName(userId == 7 ? "Hai Phong Pool" : "District Pool");
        return a;
    }

    private Activity base(Long userId, String athlete, SportType type, String title,
                          String notes, double meters, int minutes) {
        Activity activity = new Activity();
        activity.setUserId(userId);
        activity.setAthleteName(athlete);
        activity.setSportType(type);
        activity.setTitle(title);
        activity.setDescription(notes);
        activity.setStartedAt(LocalDateTime.now().minusDays(userId % 7).minusHours(minutes % 5));
        activity.setDistanceMeters(meters);
        activity.setDurationMinutes(minutes);
        activity.setVisibility("PUBLIC");
        return activity;
    }

    private Activity aged(Activity activity, int daysAgo, int hoursAgo) {
        activity.setStartedAt(LocalDateTime.now().minusDays(daysAgo).minusHours(hoursAgo));
        return activity;
    }

    private SportDefinition sport(String code, String label, String icon,
                                   String category, String backendSport, int order) {
        SportDefinition def = new SportDefinition();
        def.setCode(code); def.setLabel(label); def.setIcon(icon);
        def.setCategory(category); def.setBackendSport(backendSport);
        def.setSortOrder(order); def.setActive(true);
        return def;
    }

    private ChallengeDefinition challenge(String code, String title, String sportType,
                                           int target, String unit, String note) {
        ChallengeDefinition c = new ChallengeDefinition();
        c.setCode(code); c.setTitle(title); c.setSportType(sportType);
        c.setTargetValue(target); c.setUnit(unit); c.setNote(note);
        return c;
    }

    private ChallengeParticipant participant(Long userId, ChallengeDefinition challenge) {
        ChallengeParticipant p = new ChallengeParticipant();
        p.setUserId(userId); p.setChallenge(challenge);
        return p;
    }

    private Notification notification(Long userId, String title, String message, String type) {
        Notification n = new Notification();
        n.setUserId(userId); n.setTitle(title); n.setMessage(message);
        n.setType(type); n.setRead(false);
        return n;
    }
}
