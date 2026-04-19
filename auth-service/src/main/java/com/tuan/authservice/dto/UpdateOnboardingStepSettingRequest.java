package com.tuan.authservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.LinkedHashMap;
import java.util.Map;

@Data
public class UpdateOnboardingStepSettingRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 160, message = "Title max length is 160")
    private String title;

    @NotBlank(message = "Headline is required")
    @Size(max = 240, message = "Headline max length is 240")
    private String headline;

    @NotBlank(message = "Helper text is required")
    private String helperText;

    @NotBlank(message = "Image URL is required")
    private String imageUrl;

    private Map<String, String> optionImageUrls = new LinkedHashMap<>();
}
