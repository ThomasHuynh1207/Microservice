package com.tuan.workoutservice.service;

import com.tuan.workoutservice.dto.SeedWorkoutRequest;
import com.tuan.workoutservice.entity.ExerciseSetTemplate;
import com.tuan.workoutservice.entity.ExerciseTemplate;
import com.tuan.workoutservice.entity.WorkoutDay;
import com.tuan.workoutservice.entity.WorkoutPlan;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

public class WorkoutPlanGenerator {
    // Lớp chịu trách nhiệm tạo kế hoạch mẫu dựa vào thông tin onboarding

    public static WorkoutPlan generateSamplePlan(SeedWorkoutRequest request) {
        String normalizedGoal = request.getGoal() == null ? "" : request.getGoal().toLowerCase(Locale.ROOT);
        String normalizedLevel = request.getTrainingLevel() == null ? "" : request.getTrainingLevel().toLowerCase(Locale.ROOT);

        if (normalizedGoal.contains("giảm cân") || normalizedGoal.contains("giảm mỡ") || normalizedGoal.contains("fat")) {
            return buildFatLossCircuit(request);
        }

        if (normalizedLevel.contains("người mới") || normalizedLevel.contains("1-2") || normalizedLevel.contains("1 - 2") || normalizedLevel.contains("1 2")) {
            return buildBeginnerFullBody(request);
        }

        if (normalizedLevel.contains("3-4") || normalizedLevel.contains("3 - 4") || normalizedLevel.contains("3 4")) {
            return buildBeginnerUpperLower(request);
        }

        if (normalizedLevel.contains("5+") || normalizedLevel.contains("5 +") || normalizedLevel.contains("nhiều")) {
            return buildPushPullLegs(request);
        }

        // Default: phù hợp cho người mới và có thể mở rộng
        return buildBeginnerFullBody(request);
    }

    // Template Full Body cho người mới, phù hợp tập 3 buổi/tuần
    private static WorkoutPlan buildBeginnerFullBody(SeedWorkoutRequest request) {
        WorkoutPlan plan = new WorkoutPlan();
        plan.setUserId(request.getUserId());
        plan.setName("Full Body 3 Ngày/Tuần - Người Mới");
        plan.setDescription("Kế hoạch full body nhẹ nhàng, phù hợp người mới bắt đầu và mục tiêu duy trì/tăng cơ.");
        plan.setGoal(request.getGoal());
        plan.setDifficulty("Beginner");
        plan.setDurationWeeks(4);
        plan.setTrainingSplit("Full Body");
        plan.setTotalDaysPerWeek(3);

        WorkoutDay day1 = buildWorkoutDay(1, "Buổi 1 - Full Body", "Toàn thân", "Tập nhẹ, tập trung kỹ thuật", "Ngày nghỉ 1 ngày");
        day1.addExercise(buildExercise(1, "Goblet Squat", "Chân", "3 sets nhẹ, tập kỹ thuật", 3, "10-12"));
        day1.addExercise(buildExercise(2, "Push-up trên ghế", "Ngực / Vai", "Thay thế bench press cho người mới", 3, "8-10"));
        day1.addExercise(buildExercise(3, "Dumbbell Row một tay", "Lưng", "Giữ lưng thẳng", 3, "10-12"));
        day1.addExercise(buildExercise(4, "Plank", "Core", "Giữ kỹ thuật", 3, "30-45s"));

        WorkoutDay day2 = buildWorkoutDay(2, "Buổi 2 - Full Body", "Toàn thân", "Tăng cường sức bền cơ bản", "Ngày nghỉ 1 ngày");
        day2.addExercise(buildExercise(1, "Step-up", "Chân", "Dùng ghế hoặc bục thấp", 3, "10-12 mỗi bên"));
        day2.addExercise(buildExercise(2, "Dumbbell Floor Press", "Ngực", "An toàn cho người mới", 3, "8-10"));
        day2.addExercise(buildExercise(3, "Lat Pulldown hoặc kéo dây trên cao", "Lưng", "Giữ bả vai hạ", 3, "10-12"));
        day2.addExercise(buildExercise(4, "Russian Twist", "Core", "Không vất vả quá", 3, "12-15 mỗi bên"));

        WorkoutDay day3 = buildWorkoutDay(3, "Buổi 3 - Full Body", "Toàn thân", "Tập cân bằng sức mạnh", "Ngày nghỉ 1-2 ngày nếu cần");
        day3.addExercise(buildExercise(1, "Romanian Deadlift với tạ đơn", "Chân / Mông", "Tập kỹ thuật hông", 3, "10-12"));
        day3.addExercise(buildExercise(2, "Dumbbell Shoulder Press", "Vai", "Giữ lưng thẳng", 3, "8-10"));
        day3.addExercise(buildExercise(3, "Seated Cable Row hoặc dumbbell row", "Lưng", "Kéo đều cả hai bên", 3, "10-12"));
        day3.addExercise(buildExercise(4, "Bird Dog", "Core", "Ổn định cột sống", 3, "10 mỗi bên"));

        plan.addDay(day1);
        plan.addDay(day2);
        plan.addDay(day3);
        return plan;
    }

    // Template upper/lower 4 ngày cho người mới hoặc đã quen 3-4 buổi/tuần
    private static WorkoutPlan buildBeginnerUpperLower(SeedWorkoutRequest request) {
        WorkoutPlan plan = new WorkoutPlan();
        plan.setUserId(request.getUserId());
        plan.setName("Upper/Lower 4 Ngày/Tuần - Người Mới");
        plan.setDescription("Kế hoạch chia upper/lower nhẹ nhàng, phù hợp người tập 3-4 buổi mỗi tuần.");
        plan.setGoal(request.getGoal());
        plan.setDifficulty("Beginner");
        plan.setDurationWeeks(4);
        plan.setTrainingSplit("Upper/Lower");
        plan.setTotalDaysPerWeek(4);

        WorkoutDay upper1 = buildWorkoutDay(1, "Buổi 1 - Upper", "Ngực / Lưng / Vai", "Tập upper body với khối lượng vừa phải", "Ngày nghỉ 1 ngày");
        upper1.addExercise(buildExercise(1, "Dumbbell Bench Press", "Ngực", null, 3, "8-10"));
        upper1.addExercise(buildExercise(2, "Seated Cable Row", "Lưng", null, 3, "10-12"));
        upper1.addExercise(buildExercise(3, "Dumbbell Shoulder Press", "Vai", null, 3, "10-12"));

        WorkoutDay lower1 = buildWorkoutDay(2, "Buổi 2 - Lower", "Chân / Mông", "Chú trọng bài tập cơ bản an toàn", "Ngày nghỉ 1 ngày");
        lower1.addExercise(buildExercise(1, "Goblet Squat", "Chân", null, 3, "10-12"));
        lower1.addExercise(buildExercise(2, "Hip Thrust", "Mông", null, 3, "10-12"));
        lower1.addExercise(buildExercise(3, "Romanian Deadlift với tạ đơn", "Chân", null, 3, "10-12"));

        WorkoutDay upper2 = buildWorkoutDay(3, "Buổi 3 - Upper", "Ngực / Lưng / Vai", "Tăng cường sức mạnh trên nửa thân trên", "Ngày nghỉ 1 ngày");
        upper2.addExercise(buildExercise(1, "Incline Dumbbell Press", "Ngực", null, 3, "8-10"));
        upper2.addExercise(buildExercise(2, "One-arm Row", "Lưng", null, 3, "10-12"));
        upper2.addExercise(buildExercise(3, "Lateral Raise", "Vai", null, 3, "12-15"));

        WorkoutDay lower2 = buildWorkoutDay(4, "Buổi 4 - Lower", "Chân / Mông", "Tập nhẹ hơn để phục hồi", "Ngày nghỉ 1-2 ngày nếu cần");
        lower2.addExercise(buildExercise(1, "Split Squat", "Chân", null, 3, "10-12 mỗi bên"));
        lower2.addExercise(buildExercise(2, "Glute Bridge", "Mông", null, 3, "12-15"));
        lower2.addExercise(buildExercise(3, "Calf Raise đứng", "Bắp chân", null, 3, "12-15"));

        plan.addDay(upper1);
        plan.addDay(lower1);
        plan.addDay(upper2);
        plan.addDay(lower2);
        return plan;
    }

    // Template mạch circuit dành cho mục tiêu giảm cân/giảm mỡ
    private static WorkoutPlan buildFatLossCircuit(SeedWorkoutRequest request) {
        WorkoutPlan plan = new WorkoutPlan();
        plan.setUserId(request.getUserId());
        plan.setName("Fat Loss Circuit 3 Ngày/Tuần");
        plan.setDescription("Kế hoạch circuit nhẹ nhàng, kết hợp cardio và cơ bản để người mới dễ tiếp cận.");
        plan.setGoal(request.getGoal());
        plan.setDifficulty("Beginner");
        plan.setDurationWeeks(4);
        plan.setTrainingSplit("Circuit");
        plan.setTotalDaysPerWeek(3);

        WorkoutDay day1 = buildWorkoutDay(1, "Circuit 1", "Toàn thân", "Chuỗi bài tập nhẹ, nghỉ ngắn giữa bài", "Ngày nghỉ 1 ngày");
        day1.addExercise(buildExercise(1, "Bodyweight Squat", "Chân", null, 3, "12-15"));
        day1.addExercise(buildExercise(2, "Push-up giảm tải", "Ngực", null, 3, "8-12"));
        day1.addExercise(buildExercise(3, "Bent-over Row với tạ đơn", "Lưng", null, 3, "10-12"));
        day1.addExercise(buildExercise(4, "Mountain Climbers", "Cardio", null, 3, "30s"));

        WorkoutDay day2 = buildWorkoutDay(2, "Circuit 2", "Cardio + Core", "Tập cường độ vừa phải, tập ổn định", "Ngày nghỉ 1 ngày");
        day2.addExercise(buildExercise(1, "Step-up nhanh", "Chân/Cardio", null, 3, "12 mỗi bên"));
        day2.addExercise(buildExercise(2, "Plank với nâng chân", "Core", null, 3, "30-40s"));
        day2.addExercise(buildExercise(3, "Kettlebell Swing hoặc Dumbbell Swing", "Toàn thân", null, 3, "12-15"));
        day2.addExercise(buildExercise(4, "Jumping Jack", "Cardio", null, 3, "30s"));

        WorkoutDay day3 = buildWorkoutDay(3, "Circuit 3", "Sức bền toàn thân", "Kết thúc tuần bằng bài tập cân bằng", "Ngày nghỉ 1-2 ngày nếu cần");
        day3.addExercise(buildExercise(1, "Walking Lunge", "Chân", null, 3, "12 mỗi bên"));
        day3.addExercise(buildExercise(2, "Incline Push-up", "Ngực", null, 3, "10-12"));
        day3.addExercise(buildExercise(3, "Dumbbell Deadlift", "Lưng/Chân", null, 3, "10-12"));
        day3.addExercise(buildExercise(4, "High Knee March", "Cardio", null, 3, "30s"));

        plan.addDay(day1);
        plan.addDay(day2);
        plan.addDay(day3);
        return plan;
    }

    // Template Push/Pull/Legs dành cho người muốn tập 4 ngày và tăng cơ vừa đủ
    private static WorkoutPlan buildPushPullLegs(SeedWorkoutRequest request) {
        WorkoutPlan plan = new WorkoutPlan();
        plan.setUserId(request.getUserId());
        plan.setName("Push-Pull-Legs 4 Ngày/Tuần");
        plan.setDescription("Kế hoạch Push/Pull/Legs phù hợp mục tiêu tăng cơ hoặc duy trì với cường độ vừa phải.");
        plan.setGoal(request.getGoal());
        plan.setDifficulty("Beginner");
        plan.setDurationWeeks(4);
        plan.setTrainingSplit("Push/Pull/Legs");
        plan.setTotalDaysPerWeek(4);

        WorkoutDay pushDay = buildWorkoutDay(1, "Buổi 1 - Push", "Ngực / Vai / Tay sau", "Tập bài đẩy, không quá nặng", "Ngày nghỉ 1 ngày");
        pushDay.addExercise(buildExercise(1, "Dumbbell Bench Press", "Ngực", null, 3, "8-10"));
        pushDay.addExercise(buildExercise(2, "Arnold Press", "Vai", null, 3, "10-12"));
        pushDay.addExercise(buildExercise(3, "Tricep Dip hỗ trợ", "Tay sau", null, 3, "10-12"));

        WorkoutDay pullDay = buildWorkoutDay(2, "Buổi 2 - Pull", "Lưng / Tay trước", "Tập kéo và ổn định lưng", "Ngày nghỉ 1 ngày");
        pullDay.addExercise(buildExercise(1, "Lat Pulldown hoặc kéo dây", "Lưng", null, 3, "10-12"));
        pullDay.addExercise(buildExercise(2, "Seated Row", "Lưng", null, 3, "10-12"));
        pullDay.addExercise(buildExercise(3, "Hammer Curl", "Tay trước", null, 3, "10-12"));

        WorkoutDay legsDay = buildWorkoutDay(3, "Buổi 3 - Legs", "Chân / Mông", "Tập chân đều đặn, không quá áp lực", "Ngày nghỉ 1 ngày");
        legsDay.addExercise(buildExercise(1, "Goblet Squat", "Chân", null, 3, "10-12"));
        legsDay.addExercise(buildExercise(2, "Romanian Deadlift", "Chân / Mông", null, 3, "10-12"));
        legsDay.addExercise(buildExercise(3, "Calf Raise", "Bắp chân", null, 3, "12-15"));

        WorkoutDay upperAccessory = buildWorkoutDay(4, "Buổi 4 - Upper nhẹ", "Toàn thân trên", "Tập phục hồi, kỹ thuật", "Ngày nghỉ 1-2 ngày nếu cần");
        upperAccessory.addExercise(buildExercise(1, "Incline Dumbbell Press", "Ngực", null, 3, "8-10"));
        upperAccessory.addExercise(buildExercise(2, "Face Pull", "Vai sau", null, 3, "12-15"));
        upperAccessory.addExercise(buildExercise(3, "Plank", "Core", null, 3, "30-40s"));

        plan.addDay(pushDay);
        plan.addDay(pullDay);
        plan.addDay(legsDay);
        plan.addDay(upperAccessory);
        return plan;
    }

    private static WorkoutDay buildWorkoutDay(int order, String name, String focus, String notes, String restBetweenDays) {
        WorkoutDay day = new WorkoutDay();
        day.setDayOrder(order);
        day.setName(name);
        day.setFocus(focus);
        day.setNotes(notes);
        day.setRestBetweenDays(restBetweenDays);
        return day;
    }

    private static ExerciseTemplate buildExercise(int order, String name, String muscleGroup, String notes, int sets, String reps) {
        ExerciseTemplate exercise = new ExerciseTemplate();
        exercise.setExerciseOrder(order);
        exercise.setName(name);
        exercise.setMuscleGroup(muscleGroup);
        exercise.setNotes(notes);
        exercise.addSetTemplate(buildSetTemplate(1, sets, reps));
        return exercise;
    }

    private static ExerciseSetTemplate buildSetTemplate(int stepOrder, int sets, String reps) {
        ExerciseSetTemplate setTemplate = new ExerciseSetTemplate();
        setTemplate.setStepOrder(stepOrder);
        setTemplate.setSets(sets);
        setTemplate.setReps(reps);
        return setTemplate;
    }
}
