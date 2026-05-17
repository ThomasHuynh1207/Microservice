package com.tuan.activityservice.controller;

import com.tuan.activityservice.entity.Activity;
import com.tuan.activityservice.entity.ChallengeDefinition;
import com.tuan.activityservice.entity.Route;
import com.tuan.activityservice.entity.SportDefinition;
import com.tuan.activityservice.service.ActivityService;
import com.tuan.activityservice.service.ActivityService.ActivityRequest;
import com.tuan.activityservice.service.ActivityService.ActivityStats;
import com.tuan.activityservice.service.ActivityService.ChallengeRequest;
import com.tuan.activityservice.service.ActivityService.ChallengeView;
import com.tuan.activityservice.service.ActivityService.LeaderboardEntry;
import com.tuan.activityservice.service.ActivityService.ActivityFinishResult;
import com.tuan.activityservice.service.ActivityService.FinishActivityRequest;
import com.tuan.activityservice.service.ActivityService.TodaySummary;
import com.tuan.activityservice.service.ActivityService.GpsPointRequest;
import com.tuan.activityservice.service.ActivityService.RouteCreateRequest;
import com.tuan.activityservice.service.ActivityService.StartActivityRequest;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/activities")
public class ActivityController {
    private final ActivityService activityService;

    public ActivityController(ActivityService activityService) {
        this.activityService = activityService;
    }

    @GetMapping("/user/{userId}")
    List<Activity> userActivities(@PathVariable Long userId) {
        return activityService.userActivities(userId);
    }

    @GetMapping("/today/{userId}")
    TodaySummary todayStats(@PathVariable Long userId) {
        return activityService.todayStats(userId);
    }

    @GetMapping("/{id}")
    Activity getById(@PathVariable Long id) {
        return activityService.getById(id);
    }

    @PostMapping
    Activity create(@RequestBody ActivityRequest request) {
        return activityService.create(request);
    }

    @PutMapping("/{id}")
    Activity update(@PathVariable Long id, @RequestParam Long userId, @RequestBody ActivityRequest request) {
        return activityService.update(id, userId, request);
    }

    @DeleteMapping("/{id}")
    void delete(@PathVariable Long id, @RequestParam Long userId) {
        activityService.delete(id, userId);
    }

    @GetMapping("/stats/{userId}")
    ActivityStats stats(@PathVariable Long userId) {
        return activityService.stats(userId);
    }

    @GetMapping("/sports")
    List<SportDefinition> sportDefs() {
        return activityService.activeSportDefs();
    }

    @PostMapping("/start")
    ResponseEntity<Activity> startActivity(@RequestBody StartActivityRequest req) {
        if (req.userId() == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(activityService.startActivity(req));
    }

    @PostMapping("/{id}/gps")
    ResponseEntity<Void> addGps(@PathVariable Long id, @RequestBody List<GpsPointRequest> pts) {
        activityService.addGpsPoints(id, pts);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/finish")
    ResponseEntity<ActivityFinishResult> finishActivity(
            @PathVariable Long id,
            @RequestBody FinishActivityRequest req) {
        try {
            return ResponseEntity.ok(activityService.finishActivity(id, req));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @GetMapping("/routes")
    List<Route> routes() {
        return activityService.routes();
    }

    @GetMapping("/routes/{id}")
    ResponseEntity<Route> getRoute(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(activityService.getRoute(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @PostMapping("/routes")
    ResponseEntity<Route> createRoute(
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestBody RouteCreateRequest req) {
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(activityService.createUserRoute(userId, req));
    }

    @PatchMapping("/routes/{routeId}/visibility")
    ResponseEntity<Route> toggleVisibility(
            @PathVariable Long routeId,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        try {
            return ResponseEntity.ok(activityService.toggleRouteVisibility(userId, routeId));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @DeleteMapping("/routes/{routeId}/mine")
    ResponseEntity<Void> deleteMyRoute(
            @PathVariable Long routeId,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        try {
            activityService.deleteUserRoute(userId, routeId);
            return ResponseEntity.noContent().build();
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @GetMapping("/routes/saved/{userId}")
    List<Long> savedRoutes(@PathVariable Long userId) {
        return activityService.savedRoutes(userId);
    }

    @PostMapping("/routes/saved/{userId}/{routeId}")
    void saveRoute(@PathVariable Long userId, @PathVariable Long routeId) {
        activityService.saveRoute(userId, routeId);
    }

    @DeleteMapping("/routes/saved/{userId}/{routeId}")
    void removeRoute(@PathVariable Long userId, @PathVariable Long routeId) {
        activityService.removeRoute(userId, routeId);
    }

    @GetMapping("/challenges/user/{userId}")
    List<ChallengeView> challenges(@PathVariable Long userId) {
        return activityService.challenges(userId);
    }

    @GetMapping("/challenges")
    List<ChallengeDefinition> challengeDefinitions() {
        return activityService.challengeDefinitions();
    }

    @PostMapping("/challenges")
    ChallengeDefinition createChallenge(@RequestBody ChallengeRequest request) {
        return activityService.createChallenge(request);
    }

    @PostMapping("/challenges/{challengeId}/join/{userId}")
    void joinChallenge(@PathVariable String challengeId, @PathVariable Long userId) {
        activityService.joinChallenge(userId, challengeId);
    }

    @DeleteMapping("/challenges/{challengeId}/join/{userId}")
    void leaveChallenge(@PathVariable String challengeId, @PathVariable Long userId) {
        activityService.leaveChallenge(userId, challengeId);
    }

    @GetMapping("/challenges/{challengeId}/leaderboard")
    List<LeaderboardEntry> challengeLeaderboard(@PathVariable String challengeId) {
        return activityService.challengeLeaderboard(challengeId);
    }
}
