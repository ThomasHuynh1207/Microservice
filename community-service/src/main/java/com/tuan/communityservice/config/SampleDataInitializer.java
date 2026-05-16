package com.tuan.communityservice.config;

import com.tuan.communityservice.entity.CommunityPost;
import com.tuan.communityservice.entity.PostComment;
import com.tuan.communityservice.entity.PostLike;
import com.tuan.communityservice.entity.SportType;
import com.tuan.communityservice.repository.CommunityPostRepository;
import com.tuan.communityservice.repository.PostCommentRepository;
import com.tuan.communityservice.repository.PostLikeRepository;
import java.util.ArrayList;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SampleDataInitializer {

    @Bean
    CommandLineRunner seedCommunity(
            CommunityPostRepository posts,
            PostCommentRepository comments,
            PostLikeRepository likes) {
        return args -> {
            List<CommunityPost> created = new ArrayList<>();

            seedPost(posts, created, post(1L,  "Demo Runner", "Tempo 7K ven song",
                "Hoan thanh 7.2 km tempo, 20 phut giua buoi giu nhip kha deu. Tuan nay uu tien ngu som de hoi phuc.",
                SportType.RUN,  7200,  42,  460, "Saigon River Loop"));
            seedPost(posts, created, post(2L,  "Linh Tran", "Bridge repeats",
                "6 lan leo cau, moi lan tap trung giu dang chay va tha long vai. Chan hoi moi nhung cam giac rat da.",
                SportType.RUN,  9800,  58,  690, "Saigon Bridge Tempo"));
            seedPost(posts, created, post(3L,  "Minh Pham", "Smooth 2K swim",
                "Boi 2.050 m, tap trung sai dai va tho nhip 3. Buoi sau se tang them kick set.",
                SportType.SWIM, 2050,  48,  560, "District Pool 50m"));
            seedPost(posts, created, post(4L,  "Hang Thu", "Recovery run",
                "5 km nhe sau ngay tap chan. Pace cham nhung nhip tim on, dung muc tieu phuc hoi.",
                SportType.RUN,  5000,  34,  310, "Gia Dinh Park 5K"));
            seedPost(posts, created, post(5L,  "An Nguyen", "Morning endurance swim",
                "1.600 m buoi sang, chia thanh 4x300 m chinh va tha long 400 m. Cam giac vai tot hon tuan truoc.",
                SportType.SWIM, 1600,  40,  430, "City Pool"));
            seedPost(posts, created, post(6L,  "Duc Nguyen", "Marathon pace 15K",
                "Giu dung pace muc tieu marathon xuyen suot 15K. Nhip tho on dinh, chan khong bi co cung.",
                SportType.RUN,  15000, 90,  980, "Hue Riverside Road"));
            seedPost(posts, created, post(7L,  "Trang Le", "Speed set 8x50m",
                "Sprint 50m x 8, nghi 30 giay giua moi set. Toc do dang cai thien ro ret so voi thang truoc.",
                SportType.SWIM, 800,   22,  340, "Hai Phong Pool"));
            seedPost(posts, created, post(8L,  "Khoa Bui", "Brick 20K bike + 5K run",
                "Dap xe 20K roi chuyen sang chay 5K ngay lap tuc. Chan nang nhung hoan thanh dung pace ke hoach.",
                SportType.RUN,  5000,  32,  380, "HCM Sport Complex"));
            seedPost(posts, created, post(9L,  "Mai Hoang", "Trail ridge 18K",
                "Cung duong nui dep, do cao 850m. Len doc chu dong va xuong doc kiem soat tot. Tuyet voi!",
                SportType.RUN,  18000, 130, 1480, "Da Lat Ridge Trail"));
            seedPost(posts, created, post(10L, "Tien Vo", "Beachside run 5K",
                "Chay ven bien buoi sang som, gio mat va bau troi trong. Pace thoai mai, tinh than phan chan.",
                SportType.RUN,  5000,  35,  360, "Vung Tau Beach Road"));

            List<CommunityPost> feed = posts.findTop50ByOrderByCreatedAtDesc();
            if (comments.count() == 0 && feed.size() >= 5) {
                comments.saveAll(List.of(
                    comment(feed.get(0),  1L,  "Demo Runner", "Buoi boi dep qua, giu deu vay la rat on."),
                    comment(feed.get(1),  3L,  "Minh Pham",  "Recovery ma van gon, nice work!"),
                    comment(feed.get(2),  2L,  "Linh Tran",  "Nhip tho 3 on dinh la nen tang tot do."),
                    comment(feed.get(3),  4L,  "Hang Thu",   "Cau nay tap suc ben rat chat."),
                    comment(feed.get(4),  5L,  "An Nguyen",  "Tempo deu qua, co len!"),
                    comment(feed.get(5),  1L,  "Demo Runner","15K marathon pace rat an tuong!"),
                    comment(feed.get(6),  3L,  "Minh Pham",  "Toc do sprint on dinh roi do Trang."),
                    comment(feed.get(7),  9L,  "Mai Hoang",  "Brick workout nen tang tot cho tri."),
                    comment(feed.get(8),  6L,  "Duc Nguyen", "Duong nui do dep lam, muon thu qua!"),
                    comment(feed.get(9),  8L,  "Khoa Bui",   "Chay bien ma pace on, tuyet!")
                ));
            }

            if (likes.count() == 0 && feed.size() >= 5) {
                likes.saveAll(List.of(
                    like(feed.get(0),  1L), like(feed.get(0),  2L), like(feed.get(0),  6L),
                    like(feed.get(1),  3L), like(feed.get(1),  5L),
                    like(feed.get(2),  1L), like(feed.get(2),  4L), like(feed.get(2),  7L),
                    like(feed.get(3),  5L), like(feed.get(3),  2L),
                    like(feed.get(4),  2L), like(feed.get(4),  8L),
                    like(feed.get(5),  2L), like(feed.get(5),  9L), like(feed.get(5), 10L),
                    like(feed.get(6),  3L), like(feed.get(6),  5L),
                    like(feed.get(7),  1L), like(feed.get(7),  6L),
                    like(feed.get(8),  1L), like(feed.get(8), 10L),
                    like(feed.get(9),  4L), like(feed.get(9),  7L)
                ));
            }
        };
    }

    private void seedPost(CommunityPostRepository posts, List<CommunityPost> created, CommunityPost post) {
        if (!posts.existsByUserIdAndTitle(post.getUserId(), post.getTitle())) {
            created.add(posts.save(post));
        }
    }

    private CommunityPost post(Long userId, String athleteName, String title, String content,
                               SportType sportType, double distanceMeters, int durationMinutes,
                               int calories, String routeName) {
        CommunityPost post = new CommunityPost();
        post.setUserId(userId);
        post.setAthleteName(athleteName);
        post.setTitle(title);
        post.setContent(content);
        post.setSportType(sportType);
        post.setDistanceMeters(distanceMeters);
        post.setDurationMinutes(durationMinutes);
        post.setCalories(calories);
        post.setRouteName(routeName);
        post.setVisibility("PUBLIC");
        return post;
    }

    private PostComment comment(CommunityPost post, Long userId, String name, String content) {
        PostComment comment = new PostComment();
        comment.setPost(post);
        comment.setUserId(userId);
        comment.setDisplayName(name);
        comment.setContent(content);
        return comment;
    }

    private PostLike like(CommunityPost post, Long userId) {
        PostLike like = new PostLike();
        like.setPost(post);
        like.setUserId(userId);
        return like;
    }
}
