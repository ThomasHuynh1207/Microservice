package com.tuan.communityservice.repository;

import com.tuan.communityservice.entity.PostLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

public interface PostLikeRepository extends JpaRepository<PostLike, Long> {
    int countByPost_Id(Long postId);
    boolean existsByPost_IdAndUserId(Long postId, Long userId);
    @Transactional
    void deleteByPost_IdAndUserId(Long postId, Long userId);
}
