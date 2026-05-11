package com.tuan.activityservice.repository;

import com.tuan.activityservice.entity.PostLike;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostLikeRepository extends JpaRepository<PostLike, Long> {
    int countByPost_Id(Long postId);

    boolean existsByPost_IdAndUserId(Long postId, Long userId);

    void deleteByPost_IdAndUserId(Long postId, Long userId);
}
