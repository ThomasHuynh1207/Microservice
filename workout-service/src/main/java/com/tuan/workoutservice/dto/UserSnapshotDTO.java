package com.tuan.workoutservice.dto;

import lombok.Data;

@Data
public class UserSnapshotDTO {
    private Long id;
    private String email;
    private String name;
    private Integer age;
    private String gender;
    private Double height;
    private Double weight;
    private String fitnessGoal;
}
