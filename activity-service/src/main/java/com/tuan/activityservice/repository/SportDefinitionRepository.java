package com.tuan.activityservice.repository;

import com.tuan.activityservice.entity.SportDefinition;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SportDefinitionRepository extends JpaRepository<SportDefinition, Long> {
    List<SportDefinition> findByActiveTrueOrderBySortOrderAsc();
    Optional<SportDefinition> findByCode(String code);
    boolean existsByCode(String code);
}
