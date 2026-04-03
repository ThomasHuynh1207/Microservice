package com.tuan.workoutservice.service;

import com.tuan.workoutservice.dto.WorkoutPlanDTO;
import com.tuan.workoutservice.dto.WorkoutSessionDTO;
import com.tuan.workoutservice.entity.WorkoutPlan;
import com.tuan.workoutservice.entity.WorkoutSession;
import com.tuan.workoutservice.repository.WorkoutPlanRepository;
import com.tuan.workoutservice.repository.WorkoutSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WorkoutService {

    private final WorkoutPlanRepository workoutPlanRepository;
    private final WorkoutSessionRepository workoutSessionRepository;

    // Workout Plan methods
    public List<WorkoutPlanDTO> getUserWorkoutPlans(Long userId) {
        return workoutPlanRepository.findByUserId(userId)
                .stream()
                .map(this::convertPlanToDTO)
                .collect(Collectors.toList());
    }

    public WorkoutPlanDTO createWorkoutPlan(WorkoutPlanDTO planDTO) {
        WorkoutPlan plan = new WorkoutPlan();
        plan.setUserId(planDTO.getUserId());
        plan.setName(planDTO.getName());
        plan.setDescription(planDTO.getDescription());
        plan.setDifficulty(planDTO.getDifficulty());
        plan.setDurationWeeks(planDTO.getDurationWeeks());
        plan.setGoal(planDTO.getGoal());

        WorkoutPlan savedPlan = workoutPlanRepository.save(plan);
        return convertPlanToDTO(savedPlan);
    }

    public WorkoutPlanDTO updateWorkoutPlan(Long id, WorkoutPlanDTO planDTO) {
        WorkoutPlan plan = workoutPlanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Workout plan not found"));

        plan.setName(planDTO.getName());
        plan.setDescription(planDTO.getDescription());
        plan.setDifficulty(planDTO.getDifficulty());
        plan.setDurationWeeks(planDTO.getDurationWeeks());
        plan.setGoal(planDTO.getGoal());

        WorkoutPlan savedPlan = workoutPlanRepository.save(plan);
        return convertPlanToDTO(savedPlan);
    }

    // Workout Session methods
    public List<WorkoutSessionDTO> getUserWorkoutSessions(Long userId) {
        return workoutSessionRepository.findByUserId(userId)
                .stream()
                .map(this::convertSessionToDTO)
                .collect(Collectors.toList());
    }

    public WorkoutSessionDTO startWorkoutSession(WorkoutSessionDTO sessionDTO) {
        WorkoutSession session = new WorkoutSession();
        session.setUserId(sessionDTO.getUserId());
        session.setWorkoutPlanId(sessionDTO.getWorkoutPlanId());
        session.setStartTime(LocalDateTime.now());
        session.setNotes(sessionDTO.getNotes());

        WorkoutSession savedSession = workoutSessionRepository.save(session);
        return convertSessionToDTO(savedSession);
    }

    public WorkoutSessionDTO endWorkoutSession(Long sessionId) {
        WorkoutSession session = workoutSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Workout session not found"));

        session.setEndTime(LocalDateTime.now());
        session.setDurationMinutes(
            (int) java.time.Duration.between(session.getStartTime(), session.getEndTime()).toMinutes()
        );
        session.setCompleted(true);

        WorkoutSession savedSession = workoutSessionRepository.save(session);
        return convertSessionToDTO(savedSession);
    }

    private WorkoutPlanDTO convertPlanToDTO(WorkoutPlan plan) {
        WorkoutPlanDTO dto = new WorkoutPlanDTO();
        dto.setId(plan.getId());
        dto.setUserId(plan.getUserId());
        dto.setName(plan.getName());
        dto.setDescription(plan.getDescription());
        dto.setDifficulty(plan.getDifficulty());
        dto.setDurationWeeks(plan.getDurationWeeks());
        dto.setGoal(plan.getGoal());
        dto.setCreatedAt(plan.getCreatedAt());
        return dto;
    }

    private WorkoutSessionDTO convertSessionToDTO(WorkoutSession session) {
        WorkoutSessionDTO dto = new WorkoutSessionDTO();
        dto.setId(session.getId());
        dto.setUserId(session.getUserId());
        dto.setWorkoutPlanId(session.getWorkoutPlanId());
        dto.setStartTime(session.getStartTime());
        dto.setEndTime(session.getEndTime());
        dto.setDurationMinutes(session.getDurationMinutes());
        dto.setNotes(session.getNotes());
        dto.setCompleted(session.getCompleted());
        return dto;
    }
}