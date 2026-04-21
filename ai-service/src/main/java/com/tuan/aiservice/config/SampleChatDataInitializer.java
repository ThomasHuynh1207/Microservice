package com.tuan.aiservice.config;

import com.tuan.aiservice.entity.ChatMessage;
import com.tuan.aiservice.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.seed", name = "sample-data", havingValue = "true")
public class SampleChatDataInitializer implements CommandLineRunner {

    private final ChatMessageRepository chatMessageRepository;

    @Override
    public void run(String... args) {
        if (chatMessageRepository.count() > 0) {
            return;
        }

        List<ChatMessage> sampleMessages = List.of(
                buildMessage(
                        1L,
                        "Tôi muốn bắt đầu giảm cân thì nên tập gì?",
                        "Bạn có thể bắt đầu với 3 buổi/tuần: 2 buổi cardio nhẹ và 1 buổi sức mạnh toàn thân. Hãy theo dõi đều mỗi tuần để tối ưu.",
                        LocalDateTime.now().minusDays(2)
                ),
                buildMessage(
                        1L,
                        "Nên ăn bao nhiêu protein mỗi ngày?",
                        "Mục tiêu hợp lý là khoảng 1.6-2.0g protein trên mỗi kg cân nặng. Chia đều protein vào 3-4 bữa trong ngày để hấp thu tốt hơn.",
                        LocalDateTime.now().minusDays(1)
                ),
                buildMessage(
                        2L,
                        "Tôi hay mệt khi tập tối, có cách nào cải thiện không?",
                        "Bạn nên ăn nhẹ trước tập 60-90 phút, uống đủ nước và ngủ đủ giấc. Nếu vẫn mệt, hãy giảm cường độ trong 1 tuần rồi tăng lại từ từ.",
                        LocalDateTime.now().minusHours(6)
                )
        );

        chatMessageRepository.saveAll(sampleMessages);
    }

    private ChatMessage buildMessage(Long userId, String message, String response, LocalDateTime timestamp) {
        ChatMessage item = new ChatMessage();
        item.setUserId(userId);
        item.setMessage(message);
        item.setResponse(response);
        item.setTimestamp(timestamp);
        item.setMessageType("assistant");
        return item;
    }
}
