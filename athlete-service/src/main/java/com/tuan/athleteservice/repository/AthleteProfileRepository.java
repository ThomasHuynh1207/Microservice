package com.tuan.athleteservice.repository;

import com.tuan.athleteservice.entity.AthleteProfile;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AthleteProfileRepository extends JpaRepository<AthleteProfile, Long> {
    Optional<AthleteProfile> findByUserId(Long userId);

    List<AthleteProfile> findByUserIdIn(List<Long> userIds);
}
