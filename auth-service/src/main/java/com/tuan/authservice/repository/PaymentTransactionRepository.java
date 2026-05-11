package com.tuan.authservice.repository;

import com.tuan.authservice.entity.PaymentTransaction;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {
    Optional<PaymentTransaction> findByOrderId(String orderId);

    List<PaymentTransaction> findTop50ByOrderByCreatedAtDesc();
}
