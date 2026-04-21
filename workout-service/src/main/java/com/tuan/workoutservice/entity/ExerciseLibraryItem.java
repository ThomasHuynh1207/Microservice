package com.tuan.workoutservice.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.Locale;

@Entity
@Table(name = "exercise_library")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExerciseLibraryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String displayName;

    @Column(nullable = false, unique = true)
    private String normalizedName;

    private String muscleGroup;

    @Column(length = 2400)
    private String guidance;

    @Column(length = 1400)
    private String highlight;

    @Column(length = 1400)
    private String technicalNotes;

    @Column(length = 1000)
    private String videoUrl;

    @Column(nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PrePersist
    @PreUpdate
    public void normalizeBeforeSave() {
        this.displayName = (displayName == null ? "" : displayName).trim();
        this.normalizedName = normalizeName(this.displayName);
        this.updatedAt = LocalDateTime.now();
    }

    public static String normalizeName(String value) {
        String text = value == null ? "" : value.trim();
        String normalized = Normalizer.normalize(text, Normalizer.Form.NFD).replaceAll("\\p{M}+", "");
        return normalized.toLowerCase(Locale.ROOT).replaceAll("\\s+", " ");
    }
}
