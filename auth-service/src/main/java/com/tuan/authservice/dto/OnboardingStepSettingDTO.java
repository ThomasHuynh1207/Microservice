package com.tuan.authservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OnboardingStepSettingDTO {
    private Integer stepIndex;
    private String stepKey;
    private String title;
    private String headline;
    private String helperText;
    private String imageUrl;
    private Map<String, String> optionImageUrls;
}
