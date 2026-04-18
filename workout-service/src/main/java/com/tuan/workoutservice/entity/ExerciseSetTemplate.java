package com.tuan.workoutservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "exercise_set_template")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExerciseSetTemplate {
    // Mỗi mục là cấu hình sets × reps cho bài tập

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exercise_template_id", nullable = false)
    private ExerciseTemplate exerciseTemplate;

    @Column(nullable = false)
    private Integer stepOrder;

    @Column(nullable = false)
    private Integer sets;

    @Column(nullable = false)
    private String reps; // e.g. "10-12" or "8-10"
}
