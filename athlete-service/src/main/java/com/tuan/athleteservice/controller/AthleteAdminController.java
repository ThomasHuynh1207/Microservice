package com.tuan.athleteservice.controller;

import com.tuan.athleteservice.entity.AthleteProfile;
import com.tuan.athleteservice.entity.OnboardingGoal;
import com.tuan.athleteservice.repository.AthleteProfileRepository;
import com.tuan.athleteservice.repository.OnboardingGoalRepository;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/athletes/admin")
public class AthleteAdminController {

    private final AthleteProfileRepository profileRepo;
    private final OnboardingGoalRepository goalRepo;

    public AthleteAdminController(AthleteProfileRepository profileRepo,
                                  OnboardingGoalRepository goalRepo) {
        this.profileRepo = profileRepo;
        this.goalRepo = goalRepo;
    }

    // ── Athlete profiles ─────────────────────────────────────────────────────

    @GetMapping("/all")
    public ResponseEntity<List<AthleteProfile>> allProfiles(
            @RequestHeader(value = "X-User-Role", required = false) String requesterRole) {
        if (!isAdmin(requesterRole)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(profileRepo.findAll());
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> stats(
            @RequestHeader(value = "X-User-Role", required = false) String requesterRole) {
        if (!isAdmin(requesterRole)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        List<AthleteProfile> all = profileRepo.findAll();
        long total = all.size();
        double avgRunGoal = all.stream()
                .mapToDouble(AthleteProfile::getWeeklyRunGoalKm)
                .average().orElse(0);
        double avgSwimGoal = all.stream()
                .mapToDouble(AthleteProfile::getWeeklySwimGoalMeters)
                .average().orElse(0);
        long completedOnboarding = all.stream()
                .filter(AthleteProfile::isCompletedOnboarding)
                .count();
        return ResponseEntity.ok(Map.of(
                "totalProfiles", total,
                "completedOnboarding", completedOnboarding,
                "avgWeeklyRunGoalKm", Math.round(avgRunGoal * 10.0) / 10.0,
                "avgWeeklySwimGoalMeters", (long) avgSwimGoal
        ));
    }

    // ── Onboarding goals ─────────────────────────────────────────────────────

    @GetMapping("/onboarding/goals")
    public ResponseEntity<List<OnboardingGoal>> listGoals(
            @RequestHeader(value = "X-User-Role", required = false) String requesterRole) {
        if (!isAdmin(requesterRole)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(goalRepo.findAllByOrderBySortOrderAscCreatedAtAsc());
    }

    @PostMapping("/onboarding/goals")
    public ResponseEntity<OnboardingGoal> createGoal(
            @RequestBody GoalRequest req,
            @RequestHeader(value = "X-User-Role", required = false) String requesterRole) {
        if (!isAdmin(requesterRole)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        if (req.title() == null || req.title().isBlank())
            return ResponseEntity.badRequest().build();
        OnboardingGoal goal = new OnboardingGoal();
        goal.setTitle(req.title().trim());
        goal.setDescription(req.description());
        goal.setSortOrder(req.sortOrder() == null ? 0 : req.sortOrder());
        goal.setActive(req.active() == null || req.active());
        return ResponseEntity.ok(goalRepo.save(goal));
    }

    @PutMapping("/onboarding/goals/{id}")
    public ResponseEntity<OnboardingGoal> updateGoal(
            @PathVariable Long id,
            @RequestBody GoalRequest req,
            @RequestHeader(value = "X-User-Role", required = false) String requesterRole) {
        if (!isAdmin(requesterRole)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return goalRepo.findById(id).map(goal -> {
            if (req.title() != null && !req.title().isBlank()) goal.setTitle(req.title().trim());
            if (req.description() != null) goal.setDescription(req.description());
            if (req.sortOrder() != null) goal.setSortOrder(req.sortOrder());
            if (req.active() != null) goal.setActive(req.active());
            return ResponseEntity.ok(goalRepo.save(goal));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/onboarding/goals/{id}")
    public ResponseEntity<Void> deleteGoal(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Role", required = false) String requesterRole) {
        if (!isAdmin(requesterRole)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        if (!goalRepo.existsById(id)) return ResponseEntity.notFound().build();
        goalRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    private boolean isAdmin(String requesterRole) {
        return requesterRole != null && requesterRole.equalsIgnoreCase("ADMIN");
    }

    public record GoalRequest(String title, String description, Integer sortOrder, Boolean active) {}
}
