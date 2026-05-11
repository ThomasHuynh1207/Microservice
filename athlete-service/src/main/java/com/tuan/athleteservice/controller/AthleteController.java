package com.tuan.athleteservice.controller;

import com.tuan.athleteservice.entity.AthleteProfile;
import com.tuan.athleteservice.service.AthleteService;
import com.tuan.athleteservice.service.AthleteService.AthleteProfileRequest;
import com.tuan.athleteservice.service.AthleteService.AthleteSummary;
import com.tuan.athleteservice.service.AthleteService.FollowSummary;
import java.util.List;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/athletes")
public class AthleteController {
    private final AthleteService athleteService;

    public AthleteController(AthleteService athleteService) {
        this.athleteService = athleteService;
    }

    @GetMapping("/{userId}")
    AthleteProfile getProfile(@PathVariable Long userId) {
        return athleteService.getProfile(userId);
    }

    @PutMapping("/{userId}")
    AthleteProfile updateProfile(@PathVariable Long userId, @RequestBody AthleteProfileRequest request) {
        return athleteService.updateProfile(userId, request);
    }

    @PostMapping("/{userId}/onboarding")
    AthleteProfile completeOnboarding(@PathVariable Long userId, @RequestBody AthleteProfileRequest request) {
        return athleteService.completeOnboarding(userId, request);
    }

    @GetMapping("/leaderboard")
    List<AthleteSummary> leaderboard() {
        return athleteService.leaderboard();
    }

    @GetMapping("/{userId}/following")
    List<FollowSummary> following(@PathVariable Long userId) {
        return athleteService.following(userId);
    }

    @PostMapping("/{userId}/follow/{targetId}")
    void follow(@PathVariable Long userId, @PathVariable Long targetId) {
        athleteService.follow(userId, targetId);
    }

    @DeleteMapping("/{userId}/follow/{targetId}")
    void unfollow(@PathVariable Long userId, @PathVariable Long targetId) {
        athleteService.unfollow(userId, targetId);
    }
}
