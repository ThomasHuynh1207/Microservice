package com.tuan.activityservice.controller;

import com.tuan.activityservice.entity.Activity;
import com.tuan.activityservice.service.ActivityService;
import com.tuan.activityservice.service.ActivityService.ActivityRequest;
import com.tuan.activityservice.service.ActivityService.ActivityStats;
import com.tuan.activityservice.service.ActivityService.Challenge;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
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

    @PostMapping
    Activity create(@RequestBody ActivityRequest request) {
        return activityService.create(request);
    }

    @GetMapping("/stats/{userId}")
    ActivityStats stats(@PathVariable Long userId) {
        return activityService.stats(userId);
    }

    @GetMapping("/challenges")
    List<Challenge> challenges() {
        return activityService.challenges();
    }
}
