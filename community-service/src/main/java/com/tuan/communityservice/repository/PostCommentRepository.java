package com.tuan.communityservice.repository;

import com.tuan.communityservice.entity.PostComment;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostCommentRepository extends JpaRepository<PostComment, Long> {
    List<PostComment> findByPost_IdOrderByCreatedAtAsc(Long postId);
    int countByPost_Id(Long postId);
    void deleteByPost_Id(Long postId);
}
