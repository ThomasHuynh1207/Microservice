package com.tuan.activityservice.service;

import com.tuan.activityservice.entity.CommunityPost;
import com.tuan.activityservice.entity.PostComment;
import com.tuan.activityservice.entity.PostLike;
import com.tuan.activityservice.entity.SportType;
import com.tuan.activityservice.repository.CommunityPostRepository;
import com.tuan.activityservice.repository.PostCommentRepository;
import com.tuan.activityservice.repository.PostLikeRepository;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CommunityService {
    private final CommunityPostRepository posts;
    private final PostCommentRepository comments;
    private final PostLikeRepository likes;
    private final NotificationService notifications;

    public CommunityService(
            CommunityPostRepository posts,
            PostCommentRepository comments,
            PostLikeRepository likes,
            NotificationService notifications) {
        this.posts = posts;
        this.comments = comments;
        this.likes = likes;
        this.notifications = notifications;
    }

    @Transactional(readOnly = true)
    public List<PostView> feed(Long userId) {
        return posts.findTop30ByOrderByCreatedAtDesc().stream()
                .map(post -> toView(post, userId))
                .toList();
    }

    @Transactional
    public PostView create(PostRequest request) {
        CommunityPost post = new CommunityPost();
        post.setUserId(request.userId());
        post.setAthleteName(defaultText(request.athleteName(), "Athlete #" + request.userId()));
        post.setSportType(request.sportType());
        post.setTitle(defaultText(request.title(), "New activity"));
        post.setContent(defaultText(request.content(), ""));
        post.setDistanceMeters(request.distanceMeters());
        post.setDurationMinutes(request.durationMinutes());
        post.setCalories(request.calories());
        post.setRouteName(request.routeName());
        post.setVisibility(defaultText(request.visibility(), "PUBLIC"));
        CommunityPost saved = posts.save(post);
        return toView(saved, request.userId());
    }

    @Transactional(readOnly = true)
    public List<CommentView> comments(Long postId) {
        return comments.findByPost_IdOrderByCreatedAtAsc(postId).stream()
                .map(comment -> new CommentView(
                        comment.getId(),
                        comment.getUserId(),
                        comment.getDisplayName(),
                        comment.getContent(),
                        comment.getCreatedAt()
                ))
                .toList();
    }

    @Transactional
    public CommentView addComment(Long postId, CommentRequest request) {
        CommunityPost post = posts.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));
        PostComment comment = new PostComment();
        comment.setPost(post);
        comment.setUserId(request.userId());
        comment.setDisplayName(defaultText(request.displayName(), "Athlete #" + request.userId()));
        comment.setContent(defaultText(request.content(), "Nice work!"));
        PostComment saved = comments.save(comment);
        notifyPostOwner(post, request.userId(), "New comment", saved.getContent());
        return new CommentView(saved.getId(), saved.getUserId(), saved.getDisplayName(), saved.getContent(), saved.getCreatedAt());
    }

    @Transactional
    public LikeState toggleLike(Long postId, Long userId) {
        CommunityPost post = posts.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));
        boolean exists = likes.existsByPost_IdAndUserId(postId, userId);
        if (exists) {
            likes.deleteByPost_IdAndUserId(postId, userId);
        } else {
            PostLike like = new PostLike();
            like.setPost(post);
            like.setUserId(userId);
            likes.save(like);
            notifyPostOwner(post, userId, "New like", "Someone liked your activity.");
        }
        int likeCount = likes.countByPost_Id(postId);
        return new LikeState(!exists, likeCount);
    }

    private PostView toView(CommunityPost post, Long userId) {
        int likeCount = likes.countByPost_Id(post.getId());
        int commentCount = comments.countByPost_Id(post.getId());
        boolean liked = userId != null && likes.existsByPost_IdAndUserId(post.getId(), userId);
        return new PostView(
                post.getId(),
                post.getUserId(),
                post.getAthleteName(),
                post.getTitle(),
                post.getContent(),
                post.getSportType(),
                post.getDistanceMeters(),
                post.getDurationMinutes(),
                post.getCalories(),
                post.getRouteName(),
                post.getCreatedAt(),
                likeCount,
                commentCount,
                liked
        );
    }

    private void notifyPostOwner(CommunityPost post, Long actorId, String title, String message) {
        if (post.getUserId().equals(actorId)) {
            return;
        }
        notifications.create(post.getUserId(), title, message, "COMMUNITY");
    }

    private String defaultText(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
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
    ) {
    }

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
    ) {
    }

    public record CommentRequest(Long userId, String displayName, String content) {
    }

    public record CommentView(Long id, Long userId, String displayName, String content, Instant createdAt) {
    }

    public record LikeState(boolean liked, int likeCount) {
    }
}
