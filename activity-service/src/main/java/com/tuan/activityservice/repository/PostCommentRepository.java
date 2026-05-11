package com.tuan.activityservice.repository;

import com.tuan.activityservice.entity.PostComment;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostCommentRepository extends JpaRepository<PostComment, Long> {
    List<PostComment> findByPost_IdOrderByCreatedAtAsc(Long postId);

    int countByPost_Id(Long postId);
}
