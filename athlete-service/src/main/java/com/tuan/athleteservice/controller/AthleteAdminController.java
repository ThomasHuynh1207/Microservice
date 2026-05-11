package com.tuan.athleteservice.controller;

import com.tuan.athleteservice.entity.AthleteProfile;
import com.tuan.athleteservice.repository.AthleteProfileRepository;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

@RestController
@RequestMapping("/api/athletes/admin")
public class AthleteAdminController {

    private static final RestTemplate REST = new RestTemplate();

    private final AthleteProfileRepository profileRepo;

    @Value("${auth.service.url:http://auth-service:8081}")
    private String authServiceUrl;

    public AthleteAdminController(AthleteProfileRepository profileRepo) {
        this.profileRepo = profileRepo;
    }

    @GetMapping("/all")
    public ResponseEntity<List<AthleteProfile>> allProfiles(
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        if (!isAdmin(userId)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(profileRepo.findAll());
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> stats(
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        if (!isAdmin(userId)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
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

    private boolean isAdmin(Long userId) {
        if (userId == null) return false;
        try {
            Boolean result = REST.getForObject(
                    authServiceUrl + "/api/auth/internal/users/" + userId + "/is-admin",
                    Boolean.class);
            return Boolean.TRUE.equals(result);
        } catch (Exception e) {
            return false;
        }
    }
}
