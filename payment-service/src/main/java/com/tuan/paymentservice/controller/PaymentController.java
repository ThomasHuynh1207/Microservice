package com.tuan.paymentservice.controller;

import com.tuan.paymentservice.entity.PaymentTransaction;
import com.tuan.paymentservice.service.PayPalService;
import com.tuan.paymentservice.service.PayPalService.AdminStatsResponse;
import com.tuan.paymentservice.service.PayPalService.CaptureOrderResponse;
import com.tuan.paymentservice.service.PayPalService.CreateOrderResponse;
import com.tuan.paymentservice.service.PayPalService.PremiumStatusResponse;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PayPalService payPalService;

    public PaymentController(PayPalService payPalService) {
        this.payPalService = payPalService;
    }

    @PostMapping("/paypal/create-order")
    public CreateOrderResponse createOrder(@RequestBody CreateOrderRequest request) {
        return payPalService.createOrder(
            request.userId(), request.plan(),
            request.userName(), request.userEmail());
    }

    @PostMapping("/paypal/capture/{orderId}")
    public CaptureOrderResponse captureOrder(@PathVariable String orderId) {
        return payPalService.captureOrder(orderId);
    }

    @GetMapping("/users/{userId}/history")
    public List<PaymentTransaction> getUserHistory(@PathVariable Long userId) {
        return payPalService.getUserHistory(userId);
    }

    @GetMapping("/users/{userId}/premium-status")
    public PremiumStatusResponse getPremiumStatus(@PathVariable Long userId) {
        return payPalService.getPremiumStatus(userId);
    }

    // ─── Admin endpoints ──────────────────────────────────────────────────────

    @GetMapping("/admin/stats")
    public ResponseEntity<AdminStatsResponse> getAdminStats(
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @RequestParam(defaultValue = "0") long premiumUsers) {
        if (!isAdmin(role)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(payPalService.getAdminStats(premiumUsers));
    }

    @GetMapping("/admin/transactions")
    public ResponseEntity<Map<String, Object>> getAdminTransactions(
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @RequestParam(required = false) String search,
            @RequestParam(required = false, defaultValue = "ALL") String status,
            @RequestParam(required = false, defaultValue = "ALL") String period,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        if (!isAdmin(role)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        Page<PaymentTransaction> result = payPalService.getAdminTransactions(search, status, period, page, size);
        Map<String, Object> body = Map.of(
            "content", result.getContent(),
            "totalElements", result.getTotalElements(),
            "totalPages", result.getTotalPages(),
            "page", result.getNumber(),
            "size", result.getSize()
        );
        return ResponseEntity.ok(body);
    }

    private boolean isAdmin(String role) {
        return role != null && role.equalsIgnoreCase("ADMIN");
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ErrorResponse(ex.getMessage()));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponse> handleInternalError(IllegalStateException ex) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(new ErrorResponse(ex.getMessage()));
    }

    record CreateOrderRequest(Long userId, String plan, String userName, String userEmail) {}
    record ErrorResponse(String message) {}
}
