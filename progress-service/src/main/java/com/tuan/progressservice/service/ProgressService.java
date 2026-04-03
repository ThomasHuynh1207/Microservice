package com.tuan.progressservice.service;

import com.tuan.progressservice.dto.ProgressLogDTO;
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
        log.setWeight(logDTO.getWeight());
        log.setBodyFat(logDTO.getBodyFat());
        log.setWorkoutMinutes(logDTO.getWorkoutMinutes());
        log.setNotes(logDTO.getNotes());
        log.setMood(logDTO.getMood());

        ProgressLog savedLog = progressLogRepository.save(log);
        return convertToDTO(savedLog);
    }

    public ProgressLogDTO updateProgressLog(Long id, ProgressLogDTO logDTO) {
        ProgressLog log = progressLogRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Progress log not found"));

        log.setWeight(logDTO.getWeight());
        log.setBodyFat(logDTO.getBodyFat());
        log.setWorkoutMinutes(logDTO.getWorkoutMinutes());
        log.setNotes(logDTO.getNotes());
        log.setMood(logDTO.getMood());

        ProgressLog savedLog = progressLogRepository.save(log);
        return convertToDTO(savedLog);
    }

    private ProgressLogDTO convertToDTO(ProgressLog log) {
        ProgressLogDTO dto = new ProgressLogDTO();
        dto.setId(log.getId());
        dto.setUserId(log.getUserId());
        dto.setDate(log.getDate());
        dto.setWeight(log.getWeight());
        dto.setBodyFat(log.getBodyFat());
        dto.setWorkoutMinutes(log.getWorkoutMinutes());
        dto.setNotes(log.getNotes());
        dto.setMood(log.getMood());
        return dto;
    }
}