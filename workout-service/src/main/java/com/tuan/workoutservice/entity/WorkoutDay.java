package com.tuan.workoutservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "workout_day")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkoutDay {
    // Một buổi tập trong kế hoạch, có thể chứa nhiều bài tập

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workout_plan_id", nullable = false)
    private WorkoutPlan workoutPlan;

    @Column(nullable = false)
    private Integer dayOrder;

    @Column(nullable = false)
    private String name;

    private String focus;
    private String notes;
    private String restBetweenDays; // Ví dụ: "1 ngày nghỉ" hoặc "Ngày nghỉ chủ động"

    @OneToMany(mappedBy = "workoutDay", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("exerciseOrder ASC")
    private List<ExerciseTemplate> exercises = new ArrayList<>();

    public void addExercise(ExerciseTemplate exercise) {
        // Liên kết 2 chiều để JPA biết tập này thuộc buổi tập nào
        exercise.setWorkoutDay(this);
        exercises.add(exercise);
    }
}

