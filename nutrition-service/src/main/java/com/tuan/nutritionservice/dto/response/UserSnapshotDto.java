package com.tuan.nutritionservice.dto.response;

import lombok.Data;

@Data
public class UserSnapshotDto {
    private Long id;
    private Integer age;
    private String gender;
    private Double height;
    private Double weight;
}