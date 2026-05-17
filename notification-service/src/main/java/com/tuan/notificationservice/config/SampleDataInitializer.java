package com.tuan.notificationservice.config;

import com.tuan.notificationservice.entity.Notification;
import com.tuan.notificationservice.repository.NotificationRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class SampleDataInitializer implements CommandLineRunner {

    private final NotificationRepository repo;

    public SampleDataInitializer(NotificationRepository repo) {
        this.repo = repo;
    }

    @Override
    public void run(String... args) {
        if (repo.count() > 0) return;

        create(1L, "WORKOUT", "Buổi tập hoàn thành!", "Bạn vừa ghi nhận 5.2 km chạy — chuỗi 3 ngày liên tiếp!", "/training");
        create(1L, "AI_INSIGHT", "Gợi ý từ AI Coach", "Dựa trên hoạt động tuần này, hãy thêm 10 phút chạy bộ nhẹ vào ngày mai.", "/ai");
        create(1L, "NUTRITION", "Nhắc nhở dinh dưỡng", "Bạn còn 420 kcal hôm nay — hãy bổ sung bữa ăn nhẹ sau tập.", "/nutrition");
        create(1L, "PAYMENT", "Thanh toán thành công", "Gói Premium đã được kích hoạt. Chúc bạn luyện tập hiệu quả!", "/profile");
        create(1L, "SYSTEM", "Chào mừng đến RunSwim!", "Hồ sơ của bạn đã sẵn sàng. Hãy bắt đầu ghi hoạt động đầu tiên.", "/dashboard");
    }

    private void create(Long userId, String type, String title, String message, String actionUrl) {
        Notification n = new Notification();
        n.setUserId(userId);
        n.setType(type);
        n.setTitle(title);
        n.setMessage(message);
        n.setActionUrl(actionUrl);
        repo.save(n);
    }
}
