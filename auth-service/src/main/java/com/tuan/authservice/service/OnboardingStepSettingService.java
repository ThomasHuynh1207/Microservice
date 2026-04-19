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
                        "welcome",
                    "Chào mừng",
                    "Bắt đầu với vài câu hỏi nhanh",
                    "Dành 3-5 phút để tạo dashboard và lộ trình đầu tiên.",
                        "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1000&q=80",
                        Map.of()
                ),
                new DefaultStep(
                        1,
                        "basic-info",
                    "Thông tin cơ bản",
                    "Cho chúng tôi biết thông số hiện tại",
                    "Thông tin này giúp tính BMR, TDEE và mục tiêu calo theo cơ thể của bạn.",
                        "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1000&q=80",
                        Map.of()
                ),
                new DefaultStep(
                        2,
                        "main-goal",
                    "Mục tiêu chính",
                    "Bạn muốn đạt kết quả nào nhất trong 8-12 tuần tới?",
                    "Chọn 1 mục tiêu chính để hệ thống ưu tiên bài tập và dinh dưỡng phù hợp.",
                        "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?auto=format&fit=crop&w=1000&q=80",
                        Map.of()
                ),
                new DefaultStep(
                        3,
                        "training-level",
                    "Mức độ tập luyện",
                    "Đánh giá tần suất và cường độ hiện tại",
                    "Mức độ vận động giúp cân bằng giữa hiệu quả và khả năng phục hồi.",
                        "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1000&q=80",
                        Map.of()
                ),
                new DefaultStep(
                        4,
                        "workout-preferences",
                    "Sở thích tập luyện",
                    "Chọn kiểu tập bạn dễ duy trì đều đặn",
                    "Bạn có thể chọn nhiều lựa chọn. Ảnh minh họa có thể sửa trong trang admin.",
                        "https://images.unsplash.com/photo-1576678927484-cc907957088c?auto=format&fit=crop&w=1000&q=80",
                        Map.of(
                                "gym", "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&q=80",
                                "home", "https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=400&q=80",
                                "cardio", "https://images.unsplash.com/photo-1506197061617-7f5c0b093236?auto=format&fit=crop&w=400&q=80",
                                "yoga", "https://images.unsplash.com/photo-1549570652-97324981a6fd?auto=format&fit=crop&w=400&q=80",
                                "mixed", "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?auto=format&fit=crop&w=400&q=80"
                        )
                ),
                new DefaultStep(
                        5,
                        "nutrition",
                    "Thông tin dinh dưỡng",
                    "Lựa chọn chế độ ăn và lưu ý dị ứng",
                    "Dữ liệu này giúp bộ lọc thực đơn và gợi ý bữa ăn an toàn cho bạn.",
                        "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1000&q=80",
                        Map.of(
                                "no-limit", "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80",
                                "vegetarian", "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=400&q=80",
                                "vegan", "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80",
                                "low-lactose", "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=400&q=80",
                                "low-carb", "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80"
                        )
                ),
                new DefaultStep(
                        6,
                        "summary",
                    "Hoàn tất",
                    "Kế hoạch cá nhân hóa của bạn đã sẵn sàng",
                    "Xem tổng quan calo, macro và hướng dẫn khởi động trong ngày đầu tiên.",
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
