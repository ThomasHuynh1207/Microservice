package com.tuan.authservice.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tuan.authservice.dto.OnboardingStepSettingDTO;
import com.tuan.authservice.dto.UpdateOnboardingStepSettingRequest;
import com.tuan.authservice.entity.OnboardingStepSetting;
import com.tuan.authservice.repository.OnboardingStepSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class OnboardingStepSettingService {

    private final OnboardingStepSettingRepository onboardingStepSettingRepository;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public List<OnboardingStepSettingDTO> getAllSettings() {
        return onboardingStepSettingRepository.findAllByOrderByStepIndexAsc().stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public OnboardingStepSettingDTO updateSetting(Integer stepIndex, UpdateOnboardingStepSettingRequest request) {
        OnboardingStepSetting step = onboardingStepSettingRepository.findByStepIndex(stepIndex)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Onboarding step not found"));

        step.setTitle(request.getTitle().trim());
        step.setHeadline(request.getHeadline().trim());
        step.setHelperText(request.getHelperText().trim());
        step.setImageUrl(request.getImageUrl().trim());
        step.setOptionImagesJson(writeOptionImageMap(request.getOptionImageUrls()));

        return toDto(onboardingStepSettingRepository.save(step));
    }

    @Transactional
    public void ensureDefaults() {
        List<DefaultStep> defaults = List.of(
                new DefaultStep(
                        0,
                        "gender",
                    "Gioi tinh",
                    "Xac dinh thong tin co ban",
                    "Chon gioi tinh de he thong tinh BMR/TDEE chinh xac hon.",
                        "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1000&q=80",
                        Map.of(
                                "male", "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=400&q=80",
                                "female", "https://images.unsplash.com/photo-1594737625785-a6cbdabd333c?auto=format&fit=crop&w=400&q=80",
                                "other", "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=400&q=80"
                        )
                ),
                new DefaultStep(
                        1,
                        "age",
                    "Tuoi",
                    "Cho chung toi biet do tuoi hien tai",
                    "Do tuoi la yeu to quan trong de can doi cuong do tap va dinh duong.",
                        "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1000&q=80",
                        Map.of()
                ),
                new DefaultStep(
                        2,
                        "height",
                    "Chieu cao",
                    "Nhap chieu cao hien tai",
                    "Chieu cao (cm) ket hop cung tuoi va can nang de tinh toan chi so chuan xac.",
                        "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?auto=format&fit=crop&w=1000&q=80",
                        Map.of()
                ),
                new DefaultStep(
                        3,
                        "weight",
                    "Can nang",
                    "Nhap can nang hien tai",
                    "Can nang hien tai la baseline de theo doi thay doi trong hanh trinh tap luyen.",
                        "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1000&q=80",
                        Map.of()
                ),
                new DefaultStep(
                        4,
                        "goal",
                    "Muc tieu",
                    "Ban muon dat ket qua nao nhat?",
                    "He thong se uu tien workout split va macro dua tren muc tieu chinh cua ban.",
                        "https://images.unsplash.com/photo-1576678927484-cc907957088c?auto=format&fit=crop&w=1000&q=80",
                        Map.of(
                                "lose_weight", "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=400&q=80",
                                "maintain", "https://images.unsplash.com/photo-1517960413843-0aee8e2b3285?auto=format&fit=crop&w=400&q=80",
                                "build_muscle", "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=400&q=80"
                        )
                ),
                new DefaultStep(
                        5,
                        "activity-level",
                    "Muc do van dong",
                    "Danh gia tan suat va cuong do hien tai",
                    "Thong tin nay giup tao lich tap phu hop, tranh qua tai va de duy tri lau dai.",
                        "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1000&q=80",
                        Map.of(
                                "sedentary", "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=400&q=80",
                                "light", "https://images.unsplash.com/photo-1593079831268-3381b0db4a77?auto=format&fit=crop&w=400&q=80",
                                "moderate", "https://images.unsplash.com/photo-1534258936925-c58bed479fcb?auto=format&fit=crop&w=400&q=80",
                                "active", "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=400&q=80",
                                "very_active", "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=400&q=80"
                        )
                ),
                new DefaultStep(
                        6,
                        "specific-goal",
                    "Muc tieu cu the",
                    "Dat muc tieu ro rang cho 8-12 tuan toi",
                    "Mo ta muc tieu cu the de he thong tao workout + nutrition plan sat voi nhu cau.",
                        "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1000&q=80",
                        Map.of()
                )
        );

        for (DefaultStep item : defaults) {
            if (onboardingStepSettingRepository.findByStepIndex(item.stepIndex()).isPresent()) {
                continue;
            }

            OnboardingStepSetting step = new OnboardingStepSetting();
            step.setStepIndex(item.stepIndex());
            step.setStepKey(item.stepKey());
            step.setTitle(item.title());
            step.setHeadline(item.headline());
            step.setHelperText(item.helperText());
            step.setImageUrl(item.imageUrl());
            step.setOptionImagesJson(writeOptionImageMap(item.optionImageUrls()));

            onboardingStepSettingRepository.save(step);
        }
    }

    private OnboardingStepSettingDTO toDto(OnboardingStepSetting step) {
        return new OnboardingStepSettingDTO(
                step.getStepIndex(),
                step.getStepKey(),
                step.getTitle(),
                step.getHeadline(),
                step.getHelperText(),
                step.getImageUrl(),
                readOptionImageMap(step.getOptionImagesJson())
        );
    }

    private String writeOptionImageMap(Map<String, String> input) {
        Map<String, String> normalized = new LinkedHashMap<>();
        if (input != null) {
            input.forEach((key, value) -> {
                String keyNormalized = key == null ? "" : key.trim();
                String valueNormalized = value == null ? "" : value.trim();
                if (!keyNormalized.isEmpty() && !valueNormalized.isEmpty()) {
                    normalized.put(keyNormalized, valueNormalized);
                }
            });
        }

        try {
            return objectMapper.writeValueAsString(normalized);
        } catch (JsonProcessingException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid option image mapping");
        }
    }

    private Map<String, String> readOptionImageMap(String raw) {
        if (raw == null || raw.isBlank()) {
            return new LinkedHashMap<>();
        }

        try {
            Map<String, String> parsed = objectMapper.readValue(raw, new TypeReference<>() {});
            Map<String, String> normalized = new LinkedHashMap<>();
            parsed.forEach((key, value) -> {
                if (key == null || value == null) {
                    return;
                }
                String keyNormalized = key.trim();
                String valueNormalized = value.trim();
                if (!keyNormalized.isEmpty() && !valueNormalized.isEmpty()) {
                    normalized.put(keyNormalized, valueNormalized);
                }
            });
            return normalized;
        } catch (JsonProcessingException exception) {
            return new LinkedHashMap<>();
        }
    }

    private record DefaultStep(
            Integer stepIndex,
            String stepKey,
            String title,
            String headline,
            String helperText,
            String imageUrl,
            Map<String, String> optionImageUrls
    ) {}
}
