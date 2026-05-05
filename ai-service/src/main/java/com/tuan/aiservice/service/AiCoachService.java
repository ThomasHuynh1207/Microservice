package com.tuan.aiservice.service;

import com.tuan.aiservice.entity.ChatMessage;
import com.tuan.aiservice.repository.ChatMessageRepository;
import java.time.Duration;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

@Service
public class AiCoachService {
    private static final Logger log = LoggerFactory.getLogger(AiCoachService.class);
    private static final Duration N8N_TIMEOUT = Duration.ofSeconds(75);
    private static final Duration GEMINI_TIMEOUT = Duration.ofSeconds(75);
    private static final String GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
    private static final String GEMINI_SYSTEM_PROMPT = "You are a concise AI fitness coach for running, swimming, recovery, and nutrition. Reply in Vietnamese when the user writes Vietnamese. Give practical, safe, non-medical training advice.";

    private final ChatMessageRepository messages;
    private final WebClient webClient;
    private final String provider;
    private final String n8nWebhookUrl;
    private final String geminiApiKey;
    private final String geminiModel;

    public AiCoachService(
            ChatMessageRepository messages,
            WebClient.Builder webClientBuilder,
            @Value("${app.ai.provider:local}") String provider,
            @Value("${app.ai.n8n-webhook-url:http://localhost:5678/webhook/ai-fitness}") String n8nWebhookUrl,
            @Value("${app.ai.gemini-api-key:}") String geminiApiKey,
            @Value("${app.ai.gemini-model:gemini-2.5-flash}") String geminiModel) {
        this.messages = messages;
        this.webClient = webClientBuilder.build();
        this.provider = provider;
        this.n8nWebhookUrl = n8nWebhookUrl;
        this.geminiApiKey = geminiApiKey;
        this.geminiModel = geminiModel;
    }

    @Transactional
    public ChatResponse chat(ChatRequest request) {
        save(request.userId(), "user", request.message());
        GeneratedReply generatedReply = generateReply(request);
        save(request.userId(), "assistant", generatedReply.reply());
        return new ChatResponse(generatedReply.reply(), generatedReply.provider());
    }

    @Transactional(readOnly = true)
    public List<ChatMessage> history(Long userId) {
        return messages.findTop20ByUserIdOrderByCreatedAtDesc(userId).stream()
                .sorted(Comparator.comparing(ChatMessage::getCreatedAt))
                .toList();
    }

    public InsightResponse insights(InsightRequest request) {
        StringBuilder builder = new StringBuilder();
        if (request.weeklyRunKm() < 20) {
            builder.append("Increase running gently: add one easy 25-35 minute run before adding pace work. ");
        } else {
            builder.append("Running base looks steady; keep one quality session and one relaxed long run. ");
        }
        if (request.weeklySwimMeters() < 3000) {
            builder.append("For swimming, aim for two technique sessions with 6x100m relaxed repeats. ");
        } else {
            builder.append("Swim volume is healthy; add drills only if form breaks late in sets. ");
        }
        builder.append("Nutrition target: carbs before hard days, protein within two hours after sessions, and electrolytes after humid runs.");
        return new InsightResponse(builder.toString());
    }

    private void save(Long userId, String role, String content) {
        ChatMessage message = new ChatMessage();
        message.setUserId(userId);
        message.setRole(role);
        message.setContent(content);
        messages.save(message);
    }

    private GeneratedReply generateReply(ChatRequest request) {
        if (isN8nProvider()) {
            return requestN8n(request)
                .map(reply -> new GeneratedReply(reply, "n8n-gemini"))
                .or(() -> requestGemini(request).map(reply -> new GeneratedReply(reply, "gemini-direct")))
                    .orElseGet(() -> new GeneratedReply(
                            coachReply(request.message(), request.context()),
                            "local-endurance-coach-fallback"));
        }

        return new GeneratedReply(coachReply(request.message(), request.context()), "local-endurance-coach");
    }

    private boolean isN8nProvider() {
        return "n8n".equalsIgnoreCase(provider);
    }

    private Optional<String> requestN8n(ChatRequest request) {
        if (n8nWebhookUrl == null || n8nWebhookUrl.isBlank()) {
            log.warn("n8n AI provider is enabled but app.ai.n8n-webhook-url is empty");
            return Optional.empty();
        }

        try {
            Object response = webClient.post()
                    .uri(n8nWebhookUrl)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(Object.class)
                    .block(N8N_TIMEOUT);

            return extractReply(response);
        } catch (Exception ex) {
            log.warn("n8n AI webhook call failed: {}", ex.getMessage());
            return requestGemini(request);
        }
    }

    private Optional<String> requestGemini(ChatRequest request) {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            log.warn("Gemini API key is not configured");
            return Optional.empty();
        }

        try {
            Object response = webClient.post()
                    .uri(GEMINI_ENDPOINT)
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("Authorization", "Bearer " + geminiApiKey)
                    .bodyValue(Map.of(
                            "model", geminiModel == null || geminiModel.isBlank() ? "gemini-2.5-flash" : geminiModel,
                            "messages", List.of(
                                    Map.of("role", "system", "content", GEMINI_SYSTEM_PROMPT),
                                    Map.of(
                                            "role", "user",
                                            "content", "User ID: " + safeString(request.userId())
                                                    + "\nContext: " + safeString(request.context())
                                                    + "\nMessage: " + safeString(request.message()))
                            )))
                    .retrieve()
                    .bodyToMono(Object.class)
                    .block(GEMINI_TIMEOUT);

            return extractReply(response);
        } catch (Exception ex) {
            log.warn("Direct Gemini call failed: {}", ex.getMessage());
            return Optional.empty();
        }
    }

    private Optional<String> extractReply(Object response) {
        if (response instanceof String text && !text.isBlank()) {
            return Optional.of(text.trim());
        }

        if (response instanceof List<?> list) {
            return list.stream()
                    .map(this::extractReply)
                    .flatMap(Optional::stream)
                    .findFirst();
        }

        if (response instanceof Map<?, ?> map) {
            for (String key : List.of("reply", "recommendation", "output_text", "text", "content")) {
                Object value = map.get(key);
                if (value instanceof String text && !text.isBlank()) {
                    return Optional.of(text.trim());
                }
            }

            for (String key : List.of("body", "data", "message", "choices", "output")) {
                Optional<String> nestedReply = extractReply(map.get(key));
                if (nestedReply.isPresent()) {
                    return nestedReply;
                }
            }
        }

        return Optional.empty();
    }

    private String coachReply(String message, String context) {
        String text = (message == null ? "" : message).toLowerCase(Locale.ROOT);
        if (text.contains("boi") || text.contains("swim")) {
            return "Cho buổi bơi tiếp theo: khởi động 300m, 6x100m ở RPE 6 với nghỉ 20s, 4x50m drill bắt nhịp thở, rồi thả lỏng 200m. Nếu vai căng, giảm tốc độ và giữ sải dài.";
        }
        if (text.contains("chay") || text.contains("run") || text.contains("pace")) {
            return "Với chạy bộ, hãy giữ 80% buổi tập ở cường độ có thể nói chuyện được. Tuần này thêm 1 buổi tempo ngắn: 10 phút khởi động, 3x6 phút nhanh vừa, nghỉ 2 phút, rồi thả lỏng.";
        }
        if (text.contains("an") || text.contains("nutrition") || text.contains("meal") || text.contains("carb")) {
            return "Trước buổi tập chất lượng, ăn carb dễ tiêu như chuối, bánh mì, cơm hoặc yến mạch. Sau tập, ghép 25-35g protein với carb và uống nước có điện giải nếu đổ mồ hôi nhiều.";
        }
        if (context != null && !context.isBlank()) {
            return "Dựa trên ngữ cảnh hiện tại, ưu tiên tính đều đặn: 2-3 buổi chạy dễ, 2 buổi bơi kỹ thuật, và 1 ngày nghỉ thật sự. Gửi thêm mục tiêu cụ thể, mình sẽ tách thành lịch 7 ngày.";
        }
        return "Mình sẽ đóng vai AI coach cho chạy và bơi: nói cho mình biết mục tiêu, số buổi/tuần, và buổi tập gần nhất của bạn. Mình sẽ gợi ý lịch tập, phục hồi và dinh dưỡng phù hợp.";
    }

    private String safeString(Long value) {
        return value == null ? "" : String.valueOf(value);
    }

    private String safeString(String value) {
        return value == null ? "" : value;
    }

    private record GeneratedReply(String reply, String provider) {
    }

    public record ChatRequest(Long userId, String message, String context) {
    }

    public record ChatResponse(String reply, String provider) {
    }

    public record InsightRequest(Long userId, double weeklyRunKm, int weeklySwimMeters, int weeklyMinutes) {
    }

    public record InsightResponse(String recommendation) {
    }
}
