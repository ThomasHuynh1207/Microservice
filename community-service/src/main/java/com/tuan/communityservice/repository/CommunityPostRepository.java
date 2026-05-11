package com.tuan.communityservice.repository;

import com.tuan.communityservice.entity.CommunityPost;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommunityPostRepository extends JpaRepository<CommunityPost, Long> {
    List<CommunityPost> findTop50ByOrderByCreatedAtDesc();
    List<CommunityPost> findByUserIdOrderByCreatedAtDesc(Long userId);
}
