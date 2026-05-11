package com.tuan.communityservice.controller;

import com.tuan.communityservice.service.CommunityService;
import com.tuan.communityservice.service.CommunityService.CommentRequest;
import com.tuan.communityservice.service.CommunityService.CommentView;
import com.tuan.communityservice.service.CommunityService.LikeState;
import com.tuan.communityservice.service.CommunityService.PostRequest;
import com.tuan.communityservice.service.CommunityService.PostView;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

@RestController
@RequestMapping("/api/community")
public class CommunityController {

    private static final RestTemplate REST = new RestTemplate();

    private final CommunityService communityService;

    @Value("${auth.service.url:${AUTH_SERVICE_URL:http://localhost:8081}}")
    private String authServiceUrl;

    public CommunityController(CommunityService communityService) {
        this.communityService = communityService;
    }

    @GetMapping("/posts")
    List<PostView> feed(@RequestParam(defaultValue = "0") Long userId) {
        return communityService.feed(userId);
    }

    @PostMapping("/posts")
    PostView create(@RequestBody PostRequest request) {
        return communityService.create(request);
    }

    @GetMapping("/users/{userId}/posts")
    List<PostView> userPosts(@PathVariable Long userId) {
        return communityService.userPosts(userId);
    }

    @GetMapping("/posts/{postId}/comments")
    List<CommentView> comments(@PathVariable Long postId) {
        return communityService.getComments(postId);
    }

    @PostMapping("/posts/{postId}/comments")
    CommentView addComment(@PathVariable Long postId, @RequestBody CommentRequest request) {
        return communityService.addComment(postId, request);
    }

    @PostMapping("/posts/{postId}/likes/{userId}")
    LikeState toggleLike(@PathVariable Long postId, @PathVariable Long userId) {
        return communityService.toggleLike(postId, userId);
    }

    @DeleteMapping("/posts/{postId}/likes/{userId}")
    LikeState removeLike(@PathVariable Long postId, @PathVariable Long userId) {
        return communityService.toggleLike(postId, userId);
    }

    @GetMapping("/admin/overview")
    ResponseEntity<Map<String, Long>> adminOverview(
            @RequestHeader(value = "X-User-Id", required = false) Long requesterId,
            @RequestHeader(value = "X-User-Role", required = false) String requesterRole) {
        if (!isAdmin(requesterId, requesterRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(communityService.adminOverview());
    }

    @GetMapping("/admin/posts")
    ResponseEntity<List<PostView>> adminPosts(
            @RequestHeader(value = "X-User-Id", required = false) Long requesterId,
            @RequestHeader(value = "X-User-Role", required = false) String requesterRole) {
        if (!isAdmin(requesterId, requesterRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(communityService.adminPosts());
    }

    @DeleteMapping("/admin/posts/{postId}")
    ResponseEntity<Void> deletePost(
            @PathVariable Long postId,
            @RequestHeader(value = "X-User-Id", required = false) Long requesterId,
            @RequestHeader(value = "X-User-Role", required = false) String requesterRole) {
        if (!isAdmin(requesterId, requesterRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        communityService.deletePost(postId);
        return ResponseEntity.noContent().build();
    }

    private boolean isAdmin(Long userId, String role) {
        if (role != null && role.equalsIgnoreCase("ADMIN")) {
            return true;
        }
        if (userId == null) {
            return false;
        }
        try {
            Boolean result = REST.getForObject(
                    authServiceUrl + "/api/auth/internal/users/" + userId + "/is-admin",
                    Boolean.class);
            return Boolean.TRUE.equals(result);
        } catch (Exception ex) {
            return false;
        }
    }

    @ExceptionHandler(IllegalArgumentException.class)
    ResponseEntity<Map<String, String>> badRequest(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", ex.getMessage()));
    }
}
