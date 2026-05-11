package com.tuan.authservice.repository;

import com.tuan.authservice.entity.UserAccount;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {
    Optional<UserAccount> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);
    List<UserAccount> findAllByOrderByCreatedAtDesc();
    long countByPremiumActiveTrue();
    long countByActiveTrue();
}
