package com.tuan.workoutservice.dto;

import lombok.Data;

@Data
public class ExerciseSetTemplateDTO {
    private Long id;
    private Integer stepOrder;
    private Integer sets;
    private String reps;
}
