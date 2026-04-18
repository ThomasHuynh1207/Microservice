package com.tuan.workoutservice.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class SeedWorkoutRequest {

    @NotNull
    private Long userId;

    @NotBlank
    private String gender;

    @NotNull
    @Min(13)
    private Integer age;

    @NotNull
    private Double heightCm;

    @NotNull
    private Double weightKg;

    @NotBlank
    private String goal; // Giảm cân, Tăng cơ, Duy trì, Giảm mỡ...

    @NotBlank
    private String trainingLevel; // Người mới, Tập 1-2 buổi/tuần, 3-4 buổi, 5+ buổi

    private List<String> preferences; // Sở thích tập luyện
}
