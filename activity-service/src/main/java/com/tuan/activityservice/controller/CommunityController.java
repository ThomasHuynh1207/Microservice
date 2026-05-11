package com.tuan.activityservice.controller;

import com.tuan.activityservice.service.CommunityService;
import com.tuan.activityservice.service.CommunityService.CommentRequest;
import com.tuan.activityservice.service.CommunityService.CommentView;
import com.tuan.activityservice.service.CommunityService.LikeState;
import com.tuan.activityservice.service.CommunityService.PostRequest;
import com.tuan.activityservice.service.CommunityService.PostView;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/activities/community")
public class CommunityController {
    private final CommunityService communityService;

    public CommunityController(CommunityService communityService) {
        this.communityService = communityService;
    }

    @GetMapping("/feed/{userId}")
    List<PostView> feed(@PathVariable Long userId) {
        return communityService.feed(userId);
    }

    @PostMapping("/posts")
    PostView create(@RequestBody PostRequest request) {
        return communityService.create(request);
    }

    @GetMapping("/posts/{postId}/comments")
    List<CommentView> comments(@PathVariable Long postId) {
        return communityService.comments(postId);
    }

    @PostMapping("/posts/{postId}/comments")
    CommentView addComment(@PathVariable Long postId, @RequestBody CommentRequest request) {
        return communityService.addComment(postId, request);
    }

    @PostMapping("/posts/{postId}/likes/{userId}")
    LikeState toggleLike(@PathVariable Long postId, @PathVariable Long userId) {
        return communityService.toggleLike(postId, userId);
    }
}
