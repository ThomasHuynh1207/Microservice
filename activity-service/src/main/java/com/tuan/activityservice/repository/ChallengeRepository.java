package com.tuan.activityservice.repository;

import com.tuan.activityservice.entity.ChallengeDefinition;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChallengeRepository extends JpaRepository<ChallengeDefinition, Long> {
    Optional<ChallengeDefinition> findByCode(String code);
}
