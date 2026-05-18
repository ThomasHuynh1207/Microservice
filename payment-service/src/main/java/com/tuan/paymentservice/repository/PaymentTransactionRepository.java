package com.tuan.paymentservice.repository;

import com.tuan.paymentservice.entity.PaymentTransaction;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

public interface PaymentTransactionRepository
        extends JpaRepository<PaymentTransaction, Long>, JpaSpecificationExecutor<PaymentTransaction> {

    Optional<PaymentTransaction> findByOrderId(String orderId);
    List<PaymentTransaction> findByUserIdOrderByCreatedAtDesc(Long userId);
    boolean existsByUserIdAndStatus(Long userId, String status);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM PaymentTransaction t WHERE t.status = 'COMPLETED'")
    double sumRevenue();

    @Query("SELECT COUNT(t) FROM PaymentTransaction t WHERE t.status = 'COMPLETED'")
    long countCompleted();

    @Query("SELECT COUNT(t) FROM PaymentTransaction t WHERE t.status = 'FAILED'")
    long countFailed();
}
