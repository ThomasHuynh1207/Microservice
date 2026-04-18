package com.tuan.progressservice.controller;

import com.tuan.progressservice.dto.ProgressLogDTO;
import com.tuan.progressservice.dto.StravaActivityDTO;
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

    @GetMapping("/{id}")
    public ResponseEntity<ProgressLogDTO> getProgressLogById(@PathVariable Long id) {
        ProgressLogDTO log = progressService.getProgressLogById(id);
        return ResponseEntity.ok(log);
    }

    @PostMapping
    public ResponseEntity<ProgressLogDTO> createProgressLog(@RequestBody ProgressLogDTO logDTO) {
        ProgressLogDTO createdLog = progressService.createProgressLog(logDTO);
        return ResponseEntity.ok(createdLog);
    }

    @PostMapping("/import/strava")
    public ResponseEntity<ProgressLogDTO> importStravaActivity(@RequestBody StravaActivityDTO activityDTO) {
        ProgressLogDTO createdLog = progressService.importStravaActivity(activityDTO);
        return ResponseEntity.ok(createdLog);
    }

    // Cập nhật tiến trình theo id (chuẩn REST là PUT)
    // Thêm POST tương thích nếu client ghi nhầm method khi gửi tới /api/progress/{id}
    @PutMapping("/{id}")
    @PostMapping("/{id}")
    public ResponseEntity<ProgressLogDTO> updateProgressLog(@PathVariable Long id, @RequestBody ProgressLogDTO logDTO) {
        ProgressLogDTO updatedLog = progressService.updateProgressLog(id, logDTO);
        return ResponseEntity.ok(updatedLog);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProgressLog(@PathVariable Long id) {
        progressService.deleteProgressLog(id);
        return ResponseEntity.noContent().build();
    }
}
