package com.tuan.workoutservice.repository;

import com.tuan.workoutservice.entity.ExerciseLibraryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExerciseLibraryRepository extends JpaRepository<ExerciseLibraryItem, Long> {
    List<ExerciseLibraryItem> findAllByOrderByDisplayNameAsc();

    List<ExerciseLibraryItem> findByDisplayNameContainingIgnoreCaseOrderByDisplayNameAsc(String keyword);

    Optional<ExerciseLibraryItem> findByNormalizedName(String normalizedName);
}
