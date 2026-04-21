package com.tuan.workoutservice.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ExerciseLibraryItemDTO {
    private Long id;
    private String displayName;
    private String muscleGroup;
    private String guidance;
    private String highlight;
    private String technicalNotes;
    private String videoUrl;
    private LocalDateTime updatedAt;
}
