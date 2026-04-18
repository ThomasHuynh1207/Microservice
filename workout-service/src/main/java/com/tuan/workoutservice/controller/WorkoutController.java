package com.tuan.workoutservice.controller;

import com.tuan.workoutservice.dto.SeedWorkoutRequest;
import com.tuan.workoutservice.dto.WorkoutPlanDTO;
import com.tuan.workoutservice.dto.WorkoutPlanDetailDTO;
import com.tuan.workoutservice.dto.WorkoutSessionDTO;
import com.tuan.workoutservice.service.WorkoutService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/workouts")
@RequiredArgsConstructor
public class WorkoutController {

    private final WorkoutService workoutService;

    // Workout Plan endpoints
    @GetMapping("/plans/user/{userId}")
    public ResponseEntity<List<WorkoutPlanDTO>> getUserWorkoutPlans(@PathVariable Long userId) {
        List<WorkoutPlanDTO> plans = workoutService.getUserWorkoutPlans(userId);
        return ResponseEntity.ok(plans);
    }

    @PostMapping("/plans")
    public ResponseEntity<WorkoutPlanDTO> createWorkoutPlan(@RequestBody WorkoutPlanDTO planDTO) {
        WorkoutPlanDTO createdPlan = workoutService.createWorkoutPlan(planDTO);
        return ResponseEntity.ok(createdPlan);
    }

    @PostMapping("/generate-sample")
    public ResponseEntity<WorkoutPlanDetailDTO> generateSampleWorkoutPlan(@Valid @RequestBody SeedWorkoutRequest request) {
        WorkoutPlanDetailDTO generatedPlan = workoutService.generateSampleWorkoutPlan(request);
        return ResponseEntity.ok(generatedPlan);
    }

    @PutMapping("/plans/{id}")
    public ResponseEntity<WorkoutPlanDTO> updateWorkoutPlan(@PathVariable Long id, @RequestBody WorkoutPlanDTO planDTO) {
        WorkoutPlanDTO updatedPlan = workoutService.updateWorkoutPlan(id, planDTO);
        return ResponseEntity.ok(updatedPlan);
    }

    // Workout Session endpoints
    @GetMapping("/sessions/user/{userId}")
    public ResponseEntity<List<WorkoutSessionDTO>> getUserWorkoutSessions(@PathVariable Long userId) {
        List<WorkoutSessionDTO> sessions = workoutService.getUserWorkoutSessions(userId);
        return ResponseEntity.ok(sessions);
    }

    @PostMapping("/sessions")
    public ResponseEntity<WorkoutSessionDTO> startWorkoutSession(@RequestBody WorkoutSessionDTO sessionDTO) {
        WorkoutSessionDTO startedSession = workoutService.startWorkoutSession(sessionDTO);
        return ResponseEntity.ok(startedSession);
    }

    @PutMapping("/sessions/{id}/end")
    public ResponseEntity<WorkoutSessionDTO> endWorkoutSession(@PathVariable Long id) {
        WorkoutSessionDTO endedSession = workoutService.endWorkoutSession(id);
        return ResponseEntity.ok(endedSession);
    }
}