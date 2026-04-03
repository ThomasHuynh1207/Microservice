package com.tuan.progressservice.service;

import com.tuan.progressservice.client.AiServiceClient;
import com.tuan.progressservice.dto.ActivityAnalysisRequestDTO;
import com.tuan.progressservice.dto.ActivityAnalysisResponseDTO;
import com.tuan.progressservice.dto.ProgressLogDTO;
import com.tuan.progressservice.dto.StravaActivityDTO;
import com.tuan.progressservice.entity.ProgressLog;
import com.tuan.progressservice.repository.ProgressLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProgressService {

    private final ProgressLogRepository progressLogRepository;
    private final AiServiceClient aiServiceClient;

    public List<ProgressLogDTO> getUserProgressLogs(Long userId) {
        return progressLogRepository.findByUserId(userId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<ProgressLogDTO> getUserProgressLogsInRange(Long userId, LocalDate startDate, LocalDate endDate) {
        return progressLogRepository.findByUserIdAndDateBetween(userId, startDate, endDate)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public ProgressLogDTO createProgressLog(ProgressLogDTO logDTO) {
        ProgressLog log = new ProgressLog();
        log.setUserId(logDTO.getUserId());
        log.setDate(logDTO.getDate());
        log.setSource(logDTO.getSource() != null ? logDTO.getSource() : "manual");
        applyOptionalFields(log, logDTO);

        ProgressLog savedLog = progressLogRepository.save(log);
        return convertToDTO(savedLog);
    }

    public ProgressLogDTO importStravaActivity(StravaActivityDTO activityDTO) {
        ProgressLog log = new ProgressLog();
        log.setUserId(activityDTO.getUserId());
        log.setDate(activityDTO.getActivityDate() != null ? activityDTO.getActivityDate() : LocalDate.now());
        log.setSource("strava");
        log.setExternalActivityId(activityDTO.getActivityId());
        log.setActivityType(activityDTO.getActivityType());
        log.setDistanceKm(activityDTO.getDistanceKm());
        log.setWorkoutMinutes(activityDTO.getMovingTimeMinutes());
        log.setAveragePaceMinutesPerKm(activityDTO.getAveragePaceMinutesPerKm());
        log.setElevationGainMeters(activityDTO.getElevationGainMeters());
        log.setAverageHeartRate(activityDTO.getAverageHeartRate());
        log.setNotes(activityDTO.getNotes());
        log.setMood("Imported");
        log.setAiInsight(generateActivityInsight(activityDTO));

        ProgressLog savedLog = progressLogRepository.save(log);
        return convertToDTO(savedLog);
    }

    public ProgressLogDTO updateProgressLog(Long id, ProgressLogDTO logDTO) {
        ProgressLog log = progressLogRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Progress log not found"));

        if (logDTO.getUserId() != null) {
            log.setUserId(logDTO.getUserId());
        }
        if (logDTO.getDate() != null) {
            log.setDate(logDTO.getDate());
        }
        if (logDTO.getSource() != null) {
            log.setSource(logDTO.getSource());
        }
        applyOptionalFields(log, logDTO);

        ProgressLog savedLog = progressLogRepository.save(log);
        return convertToDTO(savedLog);
    }

    private void applyOptionalFields(ProgressLog log, ProgressLogDTO logDTO) {
        log.setExternalActivityId(logDTO.getExternalActivityId());
        log.setActivityType(logDTO.getActivityType());
        log.setDistanceKm(logDTO.getDistanceKm());
        log.setAveragePaceMinutesPerKm(logDTO.getAveragePaceMinutesPerKm());
        log.setElevationGainMeters(logDTO.getElevationGainMeters());
        log.setAverageHeartRate(logDTO.getAverageHeartRate());
        log.setWeight(logDTO.getWeight());
        log.setBodyFat(logDTO.getBodyFat());
        log.setWorkoutMinutes(logDTO.getWorkoutMinutes());
        log.setNotes(logDTO.getNotes());
        log.setMood(logDTO.getMood());
        log.setAiInsight(logDTO.getAiInsight());
    }

    private String generateActivityInsight(StravaActivityDTO activityDTO) {
        ActivityAnalysisRequestDTO request = new ActivityAnalysisRequestDTO();
        request.setUserId(activityDTO.getUserId());
        request.setActivityType(activityDTO.getActivityType());
        request.setActivityDate(activityDTO.getActivityDate());
        request.setDistanceKm(activityDTO.getDistanceKm());
        request.setMovingTimeMinutes(activityDTO.getMovingTimeMinutes());
        request.setAveragePaceMinutesPerKm(activityDTO.getAveragePaceMinutesPerKm());
        request.setElevationGainMeters(activityDTO.getElevationGainMeters());
        request.setAverageHeartRate(activityDTO.getAverageHeartRate());
        request.setNotes(activityDTO.getNotes());

        try {
            ActivityAnalysisResponseDTO response = aiServiceClient.analyzeActivity(request);
            return response != null ? response.getSummary() : "AI analysis unavailable for this activity.";
        } catch (Exception ex) {
            return "Activity imported successfully, but AI analysis is currently unavailable.";
        }
    }

    private ProgressLogDTO convertToDTO(ProgressLog log) {
        ProgressLogDTO dto = new ProgressLogDTO();
        dto.setId(log.getId());
        dto.setUserId(log.getUserId());
        dto.setDate(log.getDate());
        dto.setSource(log.getSource());
        dto.setExternalActivityId(log.getExternalActivityId());
        dto.setActivityType(log.getActivityType());
        dto.setDistanceKm(log.getDistanceKm());
        dto.setAveragePaceMinutesPerKm(log.getAveragePaceMinutesPerKm());
        dto.setElevationGainMeters(log.getElevationGainMeters());
        dto.setAverageHeartRate(log.getAverageHeartRate());
        dto.setWeight(log.getWeight());
        dto.setBodyFat(log.getBodyFat());
        dto.setWorkoutMinutes(log.getWorkoutMinutes());
        dto.setNotes(log.getNotes());
        dto.setMood(log.getMood());
        dto.setAiInsight(log.getAiInsight());
        return dto;
    }
}
