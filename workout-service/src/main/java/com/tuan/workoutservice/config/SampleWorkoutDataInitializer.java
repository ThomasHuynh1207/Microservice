package com.tuan.workoutservice.config;

import com.tuan.workoutservice.entity.ExerciseLibraryItem;
import com.tuan.workoutservice.entity.WorkoutPlan;
import com.tuan.workoutservice.entity.WorkoutSession;
import com.tuan.workoutservice.repository.ExerciseLibraryRepository;
import com.tuan.workoutservice.repository.WorkoutPlanRepository;
import com.tuan.workoutservice.repository.WorkoutSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.seed", name = "sample-data", havingValue = "true")
public class SampleWorkoutDataInitializer implements CommandLineRunner {

    private final ExerciseLibraryRepository exerciseLibraryRepository;
    private final WorkoutPlanRepository workoutPlanRepository;
    private final WorkoutSessionRepository workoutSessionRepository;

    @Override
    public void run(String... args) {
        seedExerciseLibrary();

        seedForUser(
                1L,
                "Ke hoach 4 buoi/tuan",
                "Tap trung giam mo va tang suc ben.",
                "Intermediate",
                "Fat Loss",
                "Upper/Lower",
                4
        );

        seedForUser(
                2L,
                "Ke hoach tai nha",
                "Lich tap gon nhe cho nguoi moi.",
                "Beginner",
                "General Fitness",
                "Full Body",
                3
        );
    }

    private void seedExerciseLibrary() {
        List<ExerciseLibraryItem> seedItems = List.of(
                buildLibraryItem("Bench Press", "Ngực", "Hạ thanh đòn chậm, giữ bả vai siết chặt và đẩy thẳng lên.", "Bài đẩy ngực cơ bản", "Chân bám chắc sàn, cổ tay thẳng và không nảy tạ ở điểm dưới."),
                buildLibraryItem("Incline Bench Press", "Ngực", "Đẩy theo góc dốc nhẹ để nhấn phần ngực trên nhiều hơn.", "Ưu tiên ngực trên", "Giữ khuỷu tay hơi khép và kiểm soát nhịp hạ tạ."),
                buildLibraryItem("Dumbbell Bench Press", "Ngực", "Giữ hai tay ổn định, đi theo quỹ đạo tự nhiên của khớp vai.", "Dễ chỉnh biên độ", "Không khóa cứng khuỷu tay ở đỉnh rep."),
                buildLibraryItem("Push-up", "Ngực", "Giữ thân người thành một đường thẳng từ vai đến gót chân.", "Bài tập nền tảng", "Nếu quá khó, kê tay lên ghế hoặc bục thấp."),
                buildLibraryItem("Lat Pulldown", "Lưng", "Kéo khuỷu tay xuống thay vì kéo bằng bàn tay để vào lưng rõ hơn.", "Tập trung xô", "Không ngửa lưng quá mức khi kéo xuống."),
                buildLibraryItem("Seated Row", "Lưng", "Ngực mở, kéo cáp về bụng dưới và siết bả vai ở cuối biên độ.", "Kéo ngang lưng", "Không dùng quán tính để giật tạ."),
                buildLibraryItem("One-arm Row", "Lưng", "Giữ thân chắc, kéo khuỷu tay về phía hông để ăn lưng giữa.", "Dễ cảm nhận lưng", "Không xoay người để trợ lực quá nhiều."),
                buildLibraryItem("Goblet Squat", "Chân", "Giữ tạ trước ngực, ngồi xuống giữa hai chân và đẩy gót chân khi đứng lên.", "Bài squat an toàn", "Giữ lưng trung lập và đầu gối đi theo hướng mũi chân."),
                buildLibraryItem("Romanian Deadlift", "Chân", "Đẩy hông ra sau, giữ lưng phẳng và kéo căng gân kheo có kiểm soát.", "Nhấn mông và gân kheo", "Thanh/tạ đơn đi sát đùi, không gập lưng dưới."),
                buildLibraryItem("Hip Thrust", "Cơ mông", "Siết mông ở đỉnh, tránh ưỡn lưng quá mức.", "Bài mông chính", "Cằm thu nhẹ và xương sườn không bật lên."),
                buildLibraryItem("Lateral Raise", "Cơ delta", "Nâng tay theo cung rộng, khuỷu hơi cong và không nhún vai.", "Mở vai rõ nét", "Dừng lại khi tay ngang vai để tránh mất tension."),
                buildLibraryItem("Shoulder Press", "Cơ delta", "Đẩy tạ thẳng lên trên đầu, siết core để giữ thân ổn định.", "Vai trước và giữa", "Không đẩy lưng ưỡn quá mạnh khi tạ nặng."),
                buildLibraryItem("Bicep Curl", "Cơ tay trước", "Giữ khuỷu cố định, cuốn tạ bằng bắp tay trước.", "Tay trước cơ bản", "Không vung người lấy đà."),
                buildLibraryItem("Hammer Curl", "Cơ tay trước", "Giữ cổ tay trung lập để nhấn brachialis và cẳng tay.", "Tăng độ dày tay", "Không nâng vai lên khi cuốn."),
                buildLibraryItem("Tricep Pushdown", "Cơ tay sau", "Cố định khuỷu gần thân và duỗi hết tay sau ở cuối rep.", "Tay sau rõ nét", "Không đẩy vai ra trước quá nhiều."),
                buildLibraryItem("Overhead Tricep Extension", "Cơ tay sau", "Đưa khuỷu tay hướng lên và chỉ di chuyển cẳng tay.", "Nhấn đầu dài tay sau", "Giữ core để không cong lưng dưới."),
                buildLibraryItem("Wrist Curl", "Cẳng tay", "Di chuyển cổ tay có kiểm soát, biên độ ngắn và chậm.", "Cẳng tay chuyên biệt", "Không dùng vai để hất tạ."),
                buildLibraryItem("Plank", "Cơ bụng", "Siết bụng, giữ thân như một tấm ván thẳng.", "Core nền tảng", "Không võng lưng hoặc đẩy mông quá cao."),
                buildLibraryItem("Russian Twist", "Cơ bụng", "Xoay thân có kiểm soát, không giật quá nhanh.", "Bụng xiên", "Giữ lưng dài và kiểm soát hơi thở."),
                buildLibraryItem("Dead Bug", "Cơ bụng", "Ép lưng dưới xuống sàn và di chuyển tay/chân đối bên.", "Ổn định core", "Giữ chậm để tránh mất kiểm soát."),
                buildLibraryItem("Mountain Climbers", "Luyện tập chức năng", "Kéo gối về trước nhanh nhưng vẫn giữ core chắc.", "Cardio toàn thân", "Giữ vai không bị sụp xuống cổ tay."),
                buildLibraryItem("Burpee", "Luyện tập chức năng", "Hạ người, bật chân ra sau rồi đứng dậy nhịp nhàng.", "Đốt năng lượng cao", "Điều chỉnh tốc độ theo thể lực hiện tại."),
                buildLibraryItem("Farmer's Carry", "Luyện tập chức năng", "Đi chậm, giữ thân thẳng và siết core trong suốt quãng đi.", "Bài toàn thân thực dụng", "Không nghiêng người sang một bên khi cầm tạ.")
        );

        seedItems.forEach(item -> {
            String normalizedName = ExerciseLibraryItem.normalizeName(item.getDisplayName());
            if (exerciseLibraryRepository.findByNormalizedName(normalizedName).isEmpty()) {
                exerciseLibraryRepository.save(item);
            }
        });
    }

    private ExerciseLibraryItem buildLibraryItem(String displayName, String muscleGroup, String guidance, String highlight, String technicalNotes) {
        ExerciseLibraryItem item = new ExerciseLibraryItem();
        item.setDisplayName(displayName);
        item.setMuscleGroup(muscleGroup);
        item.setGuidance(guidance);
        item.setHighlight(highlight);
        item.setTechnicalNotes(technicalNotes);
        item.setVideoUrl(resolveVideoUrl(displayName));
        return item;
    }

    private String resolveVideoUrl(String displayName) {
        String normalized = ExerciseLibraryItem.normalizeName(displayName);
        return switch (normalized) {
            case "bench press" -> "https://www.youtube.com/watch?v=rT7DgCr-3pg";
            case "incline bench press", "incline dumbbell press" -> "https://www.youtube.com/watch?v=8iPEnn-ltC8";
            case "dumbbell bench press" -> "https://www.youtube.com/watch?v=VmB1G1K7v94";
            case "push-up" -> "https://www.youtube.com/watch?v=IODxDxX7oi4";
            case "lat pulldown" -> "https://www.youtube.com/watch?v=CAwf7n6Luuc";
            case "seated row" -> "https://www.youtube.com/watch?v=HJSVR_67OlM";
            case "one-arm row" -> "https://www.youtube.com/watch?v=pYcpY20QaE8";
            case "goblet squat", "squat" -> "https://www.youtube.com/watch?v=MeIiIdhvXT4";
            case "romanian deadlift" -> "https://www.youtube.com/watch?v=2SHsk9AzdjA";
            case "hip thrust" -> "https://www.youtube.com/watch?v=LM8XHLYJoYs";
            case "lateral raise" -> "https://www.youtube.com/watch?v=3VcKaXpzqRo";
            case "shoulder press" -> "https://www.youtube.com/watch?v=qEwKCR5JCog";
            case "bicep curl" -> "https://www.youtube.com/watch?v=ykJmrZ5v0Oo";
            case "hammer curl" -> "https://www.youtube.com/watch?v=zC3nLlEvin4";
            case "tricep pushdown" -> "https://www.youtube.com/watch?v=2-LAMcpzODU";
            case "overhead tricep extension" -> "https://www.youtube.com/watch?v=YbX7Wd8jQ-Q";
            case "wrist curl" -> "https://www.youtube.com/watch?v=tWn5g7M6mWQ";
            case "plank" -> "https://www.youtube.com/watch?v=ASdvN_XEl_c";
            case "russian twist" -> "https://www.youtube.com/watch?v=wkD8rjkodUI";
            case "dead bug" -> "https://www.youtube.com/watch?v=4XLEnwUr8jI";
            case "mountain climbers" -> "https://www.youtube.com/watch?v=nmwgirgXLYM";
            case "burpee" -> "https://www.youtube.com/watch?v=TU8QYVW0gDU";
            case "farmer's carry" -> "https://www.youtube.com/watch?v=Fkzk_RqlYig";
            default -> "https://www.youtube.com/results?search_query=" + displayName.replace(" ", "+") + "+exercise+tutorial";
        };
    }

    private void seedForUser(
            Long userId,
            String planName,
            String description,
            String difficulty,
            String goal,
            String split,
            Integer daysPerWeek
    ) {
        List<WorkoutPlan> existingPlans = workoutPlanRepository.findByUserId(userId);
        WorkoutPlan plan;
        if (existingPlans.isEmpty()) {
            plan = new WorkoutPlan();
            plan.setUserId(userId);
            plan.setName(planName);
            plan.setDescription(description);
            plan.setDifficulty(difficulty);
            plan.setDurationWeeks(8);
            plan.setGoal(goal);
            plan.setTrainingSplit(split);
            plan.setTotalDaysPerWeek(daysPerWeek);
            plan = workoutPlanRepository.save(plan);
        } else {
            plan = existingPlans.get(0);
        }

        if (workoutSessionRepository.findByUserId(userId).isEmpty()) {
            WorkoutSession session1 = buildCompletedSession(
                    userId,
                    plan.getId(),
                    LocalDateTime.now().minusDays(3).minusMinutes(52),
                    52,
                    "Buoi tap tap trung than tren"
            );
            WorkoutSession session2 = buildCompletedSession(
                    userId,
                    plan.getId(),
                    LocalDateTime.now().minusDays(1).minusMinutes(46),
                    46,
                    "Buoi tap cardio ket hop core"
            );
            workoutSessionRepository.saveAll(List.of(session1, session2));
        }
    }

    private WorkoutSession buildCompletedSession(Long userId, Long planId, LocalDateTime start, int durationMinutes, String notes) {
        WorkoutSession session = new WorkoutSession();
        session.setUserId(userId);
        session.setWorkoutPlanId(planId);
        session.setStartTime(start);
        session.setEndTime(start.plusMinutes(durationMinutes));
        session.setDurationMinutes(durationMinutes);
        session.setNotes(notes);
        session.setCompleted(true);
        return session;
    }
}
