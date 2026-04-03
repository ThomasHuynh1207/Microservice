package com.tuan.progressservice.controller;

import com.tuan.progressservice.dto.ProgressLogDTO;
import com.tuan.progressservice.service.ProgressService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/progress")
@RequiredArgsConstructor
public class ProgressController {

    private final ProgressService progressService;

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ProgressLogDTO>> getUserProgressLogs(@PathVariable Long userId) {
        List<ProgressLogDTO> logs = progressService.getUserProgressLogs(userId);
        return ResponseEntity.ok(logs);
    }

    @GetMapping("/user/{userId}/range")
    public ResponseEntity<List<ProgressLogDTO>> getUserProgressLogsInRange(
            @PathVariable Long userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<ProgressLogDTO> logs = progressService.getUserProgressLogsInRange(userId, startDate, endDate);
        return ResponseEntity.ok(logs);
    }

    @PostMapping
    public ResponseEntity<ProgressLogDTO> createProgressLog(@RequestBody ProgressLogDTO logDTO) {
        ProgressLogDTO createdLog = progressService.createProgressLog(logDTO);
        return ResponseEntity.ok(createdLog);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProgressLogDTO> updateProgressLog(@PathVariable Long id, @RequestBody ProgressLogDTO logDTO) {
        ProgressLogDTO updatedLog = progressService.updateProgressLog(id, logDTO);
        return ResponseEntity.ok(updatedLog);
    }
}