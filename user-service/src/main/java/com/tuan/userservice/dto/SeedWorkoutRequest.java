package com.tuan.userservice.dto;

import lombok.Data;

import java.util.List;

@Data
public class SeedWorkoutRequest {
    private Long userId;
    private String gender;
    private Integer age;
    private Double heightCm;
    private Double weightKg;
    private String goal;
    private String trainingLevel;
    private Integer trainingDaysPerWeek;
    private List<String> preferences;
}
