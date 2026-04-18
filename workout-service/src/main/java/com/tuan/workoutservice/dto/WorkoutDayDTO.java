package com.tuan.workoutservice.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class WorkoutDayDTO {
    private Long id;
    private Integer dayOrder;
    private String name;
    private String focus;
    private String notes;
    private String restBetweenDays;
    private List<ExerciseTemplateDTO> exercises = new ArrayList<>();
}
