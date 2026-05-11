package com.tuan.communityservice.service;

import com.tuan.communityservice.entity.CommunityPost;
import com.tuan.communityservice.entity.PostComment;
import com.tuan.communityservice.entity.PostLike;
import com.tuan.communityservice.entity.SportType;
import com.tuan.communityservice.repository.CommunityPostRepository;
import com.tuan.communityservice.repository.PostCommentRepository;
import com.tuan.communityservice.repository.PostLikeRepository;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CommunityService {

    private final CommunityPostRepository posts;
    private final PostCommentRepository comments;
    private final PostLikeRepository likes;

    public CommunityService(CommunityPostRepository posts,
                            PostCommentRepository comments,
                            PostLikeRepository likes) {
        this.posts = posts;
        this.comments = comments;
        this.likes = likes;
    }

    @Transactional(readOnly = true)
    public List<PostView> feed(Long userId) {
        return posts.findTop50ByOrderByCreatedAtDesc().stream()
                .map(p -> toView(p, userId))
                .toList();
    }

    @Transactional
    public PostView create(PostRequest req) {
        CommunityPost post = new CommunityPost();
        post.setUserId(req.userId());
        post.setAthleteName(safe(req.athleteName(), "Athlete #" + req.userId()));
        post.setSportType(req.sportType());
        post.setTitle(safe(req.title(), ""));
        post.setContent(safe(req.content(), ""));
        post.setDistanceMeters(req.distanceMeters());
        post.setDurationMinutes(req.durationMinutes());
        post.setCalories(req.calories());
        post.setRouteName(req.routeName());
        post.setVisibility(safe(req.visibility(), "PUBLIC"));
        return toView(posts.save(post), req.userId());
    }

    @Transactional(readOnly = true)
    public List<CommentView> getComments(Long postId) {
        return comments.findByPost_IdOrderByCreatedAtAsc(postId).stream()
                .map(c -> new CommentView(c.getId(), c.getUserId(), c.getDisplayName(), c.getContent(), c.getCreatedAt()))
                .toList();
    }

    @Transactional
    public CommentView addComment(Long postId, CommentRequest req) {
        CommunityPost post = posts.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found: " + postId));
        PostComment comment = new PostComment();
        comment.setPost(post);
        comment.setUserId(req.userId());
        comment.setDisplayName(safe(req.displayName(), "Athlete #" + req.userId()));
        comment.setContent(safe(req.content(), ""));
        PostComment saved = comments.save(comment);
        return new CommentView(saved.getId(), saved.getUserId(), saved.getDisplayName(), saved.getContent(), saved.getCreatedAt());
    }

    @Transactional
    public LikeState toggleLike(Long postId, Long userId) {
        CommunityPost post = posts.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found: " + postId));
        boolean existed = likes.existsByPost_IdAndUserId(postId, userId);
        if (existed) {
            likes.deleteByPost_IdAndUserId(postId, userId);
        } else {
            PostLike like = new PostLike();
            like.setPost(post);
            like.setUserId(userId);
            likes.save(like);
        }
        return new LikeState(!existed, likes.countByPost_Id(postId));
    }

    @Transactional(readOnly = true)
    public List<PostView> userPosts(Long userId) {
        return posts.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(p -> toView(p, userId))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PostView> adminPosts() {
        return posts.findAllByOrderByCreatedAtDesc().stream()
                .map(p -> toView(p, null))
                .toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Long> adminOverview() {
        List<CommunityPost> allPosts = posts.findAll();
        long activeAuthors = allPosts.stream().map(CommunityPost::getUserId).distinct().count();
        return Map.of(
                "totalPosts", posts.count(),
                "totalComments", comments.count(),
                "totalLikes", likes.count(),
                "activeAuthors", activeAuthors
        );
    }

    @Transactional
    public void deletePost(Long postId) {
        if (!posts.existsById(postId)) {
            throw new IllegalArgumentException("Post not found: " + postId);
        }
        likes.deleteByPost_Id(postId);
        comments.deleteByPost_Id(postId);
        posts.deleteById(postId);
    }

    private PostView toView(CommunityPost p, Long requestUserId) {
        return new PostView(
                p.getId(),
                p.getUserId(),
                p.getAthleteName(),
                p.getTitle(),
                p.getContent(),
                p.getSportType(),
                p.getDistanceMeters(),
                p.getDurationMinutes(),
                p.getCalories(),
                p.getRouteName(),
                p.getCreatedAt(),
                likes.countByPost_Id(p.getId()),
                comments.countByPost_Id(p.getId()),
                requestUserId != null && likes.existsByPost_IdAndUserId(p.getId(), requestUserId)
        );
    }

    private String safe(String val, String fallback) {
        return val == null || val.isBlank() ? fallback : val.trim();
    }

    public record PostRequest(
            Long userId,
            String athleteName,
            String title,
            String content,
            SportType sportType,
            Double distanceMeters,
            Integer durationMinutes,
            Integer calories,
            String routeName,
            String visibility
    ) {}

    public record PostView(
            Long id,
            Long userId,
            String athleteName,
            String title,
            String content,
            SportType sportType,
            Double distanceMeters,
            Integer durationMinutes,
            Integer calories,
            String routeName,
            Instant createdAt,
            int likeCount,
            int commentCount,
            boolean likedByMe
    ) {}

    public record CommentRequest(Long userId, String displayName, String content) {}

    public record CommentView(Long id, Long userId, String displayName, String content, Instant createdAt) {}

    public record LikeState(boolean liked, int likeCount) {}
}
