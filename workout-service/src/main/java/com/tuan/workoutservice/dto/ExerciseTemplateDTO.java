package com.tuan.workoutservice.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class ExerciseTemplateDTO {
    private Long id;
    private Integer exerciseOrder;
    private String name;
    private String muscleGroup;
    private String notes;
    private List<ExerciseSetTemplateDTO> setTemplates = new ArrayList<>();
}
