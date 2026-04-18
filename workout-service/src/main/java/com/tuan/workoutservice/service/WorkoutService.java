package com.tuan.workoutservice.service;

import com.tuan.workoutservice.dto.ExerciseSetTemplateDTO;
import com.tuan.workoutservice.dto.ExerciseTemplateDTO;
import com.tuan.workoutservice.dto.SeedWorkoutRequest;
import com.tuan.workoutservice.dto.WorkoutDayDTO;
import com.tuan.workoutservice.dto.WorkoutPlanDTO;
import com.tuan.workoutservice.dto.WorkoutPlanDetailDTO;
import com.tuan.workoutservice.dto.WorkoutSessionDTO;
import com.tuan.workoutservice.entity.ExerciseSetTemplate;
import com.tuan.workoutservice.entity.ExerciseTemplate;
import com.tuan.workoutservice.entity.WorkoutDay;
import com.tuan.workoutservice.entity.WorkoutPlan;
import com.tuan.workoutservice.entity.WorkoutSession;
import com.tuan.workoutservice.repository.WorkoutPlanRepository;
import com.tuan.workoutservice.repository.WorkoutSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
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
        plan.setTrainingSplit(planDTO.getTrainingSplit());
        plan.setTotalDaysPerWeek(planDTO.getTotalDaysPerWeek());

        WorkoutPlan savedPlan = workoutPlanRepository.save(plan);
        return convertPlanToDTO(savedPlan);
    }

    public WorkoutPlanDetailDTO generateSampleWorkoutPlan(SeedWorkoutRequest request) {
        WorkoutPlan plan = WorkoutPlanGenerator.generateSamplePlan(request);
        WorkoutPlan savedPlan = workoutPlanRepository.save(plan);
        return convertPlanToDetailDTO(savedPlan);
    }

    public WorkoutPlanDTO updateWorkoutPlan(Long id, WorkoutPlanDTO planDTO) {
        WorkoutPlan plan = workoutPlanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Workout plan not found"));

        plan.setName(planDTO.getName());
        plan.setDescription(planDTO.getDescription());
        plan.setDifficulty(planDTO.getDifficulty());
        plan.setDurationWeeks(planDTO.getDurationWeeks());
        plan.setGoal(planDTO.getGoal());
        plan.setTrainingSplit(planDTO.getTrainingSplit());
        plan.setTotalDaysPerWeek(planDTO.getTotalDaysPerWeek());

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
        session.setDurationMinutes((int) Duration.between(session.getStartTime(), session.getEndTime()).toMinutes());
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
        dto.setTrainingSplit(plan.getTrainingSplit());
        dto.setTotalDaysPerWeek(plan.getTotalDaysPerWeek());
        return dto;
    }

    private WorkoutPlanDetailDTO convertPlanToDetailDTO(WorkoutPlan plan) {
        WorkoutPlanDetailDTO dto = new WorkoutPlanDetailDTO();
        dto.setId(plan.getId());
        dto.setUserId(plan.getUserId());
        dto.setName(plan.getName());
        dto.setDescription(plan.getDescription());
        dto.setDifficulty(plan.getDifficulty());
        dto.setDurationWeeks(plan.getDurationWeeks());
        dto.setGoal(plan.getGoal());
        dto.setTrainingSplit(plan.getTrainingSplit());
        dto.setTotalDaysPerWeek(plan.getTotalDaysPerWeek());
        dto.setCreatedAt(plan.getCreatedAt());
        dto.setDays(plan.getDays().stream().map(this::convertDayToDTO).collect(Collectors.toList()));
        return dto;
    }

    private WorkoutDayDTO convertDayToDTO(WorkoutDay day) {
        WorkoutDayDTO dto = new WorkoutDayDTO();
        dto.setId(day.getId());
        dto.setDayOrder(day.getDayOrder());
        dto.setName(day.getName());
        dto.setFocus(day.getFocus());
        dto.setNotes(day.getNotes());
        dto.setRestBetweenDays(day.getRestBetweenDays());
        dto.setExercises(day.getExercises().stream().map(this::convertExerciseToDTO).collect(Collectors.toList()));
        return dto;
    }

    private ExerciseTemplateDTO convertExerciseToDTO(ExerciseTemplate exercise) {
        ExerciseTemplateDTO dto = new ExerciseTemplateDTO();
        dto.setId(exercise.getId());
        dto.setExerciseOrder(exercise.getExerciseOrder());
        dto.setName(exercise.getName());
        dto.setMuscleGroup(exercise.getMuscleGroup());
        dto.setNotes(exercise.getNotes());
        dto.setSetTemplates(exercise.getSetTemplates().stream().map(this::convertSetTemplateToDTO).collect(Collectors.toList()));
        return dto;
    }

    private ExerciseSetTemplateDTO convertSetTemplateToDTO(ExerciseSetTemplate setTemplate) {
        ExerciseSetTemplateDTO dto = new ExerciseSetTemplateDTO();
        dto.setId(setTemplate.getId());
        dto.setStepOrder(setTemplate.getStepOrder());
        dto.setSets(setTemplate.getSets());
        dto.setReps(setTemplate.getReps());
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