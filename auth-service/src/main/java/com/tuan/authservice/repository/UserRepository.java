package com.tuan.authservice.repository;

import com.tuan.authservice.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    List<User> findAllByEmailIgnoreCase(String email);
    long deleteByEmailIgnoreCase(String email);

    List<User> findByEmailContainingIgnoreCaseOrNameContainingIgnoreCase(String emailKeyword, String nameKeyword);
}