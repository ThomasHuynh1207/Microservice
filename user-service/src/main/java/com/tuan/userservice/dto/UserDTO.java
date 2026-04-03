package com.tuan.userservice.dto;

import lombok.Data;

@Data
public class UserDTO {
    private Long id;
    private String email;
    private String name;
    private Integer age;
    private String gender;
    private Double height;
    private Double weight;
    private String fitnessGoal;
}