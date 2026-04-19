package com.tuan.workoutservice.config;

import com.tuan.workoutservice.entity.WorkoutPlan;
import com.tuan.workoutservice.entity.WorkoutSession;
import com.tuan.workoutservice.repository.WorkoutPlanRepository;
import com.tuan.workoutservice.repository.WorkoutSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class SampleWorkoutDataInitializer implements CommandLineRunner {

    private final WorkoutPlanRepository workoutPlanRepository;
    private final WorkoutSessionRepository workoutSessionRepository;

    @Override
    public void run(String... args) {
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
