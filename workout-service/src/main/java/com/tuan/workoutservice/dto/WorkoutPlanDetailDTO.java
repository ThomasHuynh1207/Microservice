package com.tuan.workoutservice.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
public class WorkoutPlanDetailDTO {
    private Long id;
    private Long userId;
    private String name;
    private String description;
    private String difficulty;
    private Integer durationWeeks;
    private String goal;
    private String trainingSplit;
    private Integer totalDaysPerWeek;
    private LocalDateTime createdAt;
    private List<WorkoutDayDTO> days = new ArrayList<>();
}
