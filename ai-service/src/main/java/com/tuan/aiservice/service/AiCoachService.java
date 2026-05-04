package com.tuan.aiservice.service;

import com.tuan.aiservice.entity.ChatMessage;
import com.tuan.aiservice.repository.ChatMessageRepository;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AiCoachService {
    private final ChatMessageRepository messages;

    public AiCoachService(ChatMessageRepository messages) {
        this.messages = messages;
    }

    @Transactional
    public ChatResponse chat(ChatRequest request) {
        save(request.userId(), "user", request.message());
        String reply = coachReply(request.message(), request.context());
        save(request.userId(), "assistant", reply);
        return new ChatResponse(reply, "local-endurance-coach");
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

    private String coachReply(String message, String context) {
        String text = (message == null ? "" : message).toLowerCase(Locale.ROOT);
        if (text.contains("bơi") || text.contains("swim")) {
            return "Cho buoi boi tiep theo: khoi dong 300m, 6x100m o RPE 6 voi nghi 20s, 4x50m drill bat kip tho, roi tha long 200m. Neu vai cang, giam toc do va giu stroke dai.";
        }
        if (text.contains("chạy") || text.contains("run") || text.contains("pace")) {
            return "Voi chay bo, hay giu 80% buoi tap o cuong do de noi chuyen duoc. Tuan nay them 1 buoi tempo ngan: 10 phut khoi dong, 3x6 phut nhanh vua, nghi 2 phut, roi tha long.";
        }
        if (text.contains("ăn") || text.contains("nutrition") || text.contains("meal") || text.contains("carb")) {
            return "Truoc buoi tap chat luong, an carb de tieu hoa nhu chuoi, banh mi, com hoac yen mach. Sau tap, ghep 25-35g protein voi carb va uong nuoc co dien giai neu do mo hoi nhieu.";
        }
        if (context != null && !context.isBlank()) {
            return "Du tren ngu canh hien tai, uu tien tinh deu dan: 2-3 buoi chay de, 2 buoi boi ky thuat, va 1 ngay nghi that su. Gui them muc tieu cu the, minh se tach thanh lich 7 ngay.";
        }
        return "Minh se dong vai AI coach cho chay va boi: noi cho minh biet muc tieu, so buoi/tuần, va buoi tap gan nhat cua ban. Minh se goi y lich tap, phuc hoi va dinh duong phu hop.";
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
