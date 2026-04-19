package com.tuan.authservice.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(
        name = "onboarding_step_settings",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = "step_index"),
                @UniqueConstraint(columnNames = "step_key")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OnboardingStepSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "step_index", nullable = false)
    private Integer stepIndex;

    @Column(name = "step_key", nullable = false, length = 100)
    private String stepKey;

    @Column(nullable = false, length = 160)
    private String title;

    @Column(nullable = false, length = 240)
    private String headline;

    @Column(name = "helper_text", columnDefinition = "TEXT")
    private String helperText;

    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;

    @Column(name = "option_images_json", columnDefinition = "TEXT")
    private String optionImagesJson;
}
