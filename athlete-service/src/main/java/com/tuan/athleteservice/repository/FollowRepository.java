package com.tuan.athleteservice.repository;

import com.tuan.athleteservice.entity.Follow;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FollowRepository extends JpaRepository<Follow, Long> {
    List<Follow> findByFollowerUserId(Long followerUserId);

    boolean existsByFollowerUserIdAndFollowingUserId(Long followerUserId, Long followingUserId);

    void deleteByFollowerUserIdAndFollowingUserId(Long followerUserId, Long followingUserId);
}
