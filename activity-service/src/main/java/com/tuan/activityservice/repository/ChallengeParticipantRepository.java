package com.tuan.activityservice.repository;

import com.tuan.activityservice.entity.ChallengeParticipant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChallengeParticipantRepository extends JpaRepository<ChallengeParticipant, Long> {
    List<ChallengeParticipant> findByUserId(Long userId);

    List<ChallengeParticipant> findByChallenge_Code(String code);

    boolean existsByUserIdAndChallenge_Code(Long userId, String code);

    void deleteByUserIdAndChallenge_Code(Long userId, String code);
}
