package com.tuan.workoutservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "exercise_template")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExerciseTemplate {
    // Template bài tập gồm tên, nhóm cơ, và cấu hình sets/reps

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workout_day_id", nullable = false)
    private WorkoutDay workoutDay;

    @Column(name = "exercise_order", nullable = false)
    private Integer exerciseOrder;

    @Column(nullable = false)
    private String name;

    private String muscleGroup;
    private String notes;

    @OneToMany(mappedBy = "exerciseTemplate", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("stepOrder ASC")
    private List<ExerciseSetTemplate> setTemplates = new ArrayList<>();

    public void addSetTemplate(ExerciseSetTemplate setTemplate) {
        // Liên kết 2 chiều để JPA lưu setTemplate cùng exercise
        setTemplate.setExerciseTemplate(this);
        setTemplates.add(setTemplate);
    }
}
