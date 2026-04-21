package com.tuan.authservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = true)
    private String name;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String role = "USER";

    @Enumerated(EnumType.STRING)
    @Column(nullable = true)
    private AccountStatus status = AccountStatus.ACTIVE;

    @Column(nullable = true)
    private Boolean forcePasswordReset = false;

    @PrePersist
    void ensureDefaults() {
        if (status == null) {
            status = AccountStatus.ACTIVE;
        }
        if (forcePasswordReset == null) {
            forcePasswordReset = false;
        }
    }

    public boolean isForcePasswordReset() {
        return Boolean.TRUE.equals(forcePasswordReset);
    }
}