package com.tuan.progressservice.client;

import com.tuan.progressservice.dto.ActivityAnalysisRequestDTO;
import com.tuan.progressservice.dto.ActivityAnalysisResponseDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "ai-service", url = "${services.ai-service.url:http://localhost:8085}")
public interface AiServiceClient {

    @PostMapping("/api/ai/activity-analysis")
    ActivityAnalysisResponseDTO analyzeActivity(@RequestBody ActivityAnalysisRequestDTO request);
}
