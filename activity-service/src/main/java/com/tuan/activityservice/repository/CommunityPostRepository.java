package com.tuan.activityservice.repository;

import com.tuan.activityservice.entity.CommunityPost;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommunityPostRepository extends JpaRepository<CommunityPost, Long> {
    List<CommunityPost> findTop30ByOrderByCreatedAtDesc();
}
