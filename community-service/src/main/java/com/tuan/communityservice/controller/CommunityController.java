package com.tuan.communityservice.controller;

import com.tuan.communityservice.service.CommunityService;
import com.tuan.communityservice.service.CommunityService.CommentRequest;
import com.tuan.communityservice.service.CommunityService.CommentView;
import com.tuan.communityservice.service.CommunityService.LikeState;
import com.tuan.communityservice.service.CommunityService.PostRequest;
import com.tuan.communityservice.service.CommunityService.PostView;
import java.util.List;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/community")
public class CommunityController {

    private final CommunityService communityService;

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
}
