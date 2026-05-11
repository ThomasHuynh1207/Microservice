package com.tuan.paymentservice.controller;

import com.tuan.paymentservice.entity.PaymentTransaction;
import com.tuan.paymentservice.service.PayPalService;
import com.tuan.paymentservice.service.PayPalService.CaptureOrderResponse;
import com.tuan.paymentservice.service.PayPalService.CreateOrderResponse;
import com.tuan.paymentservice.service.PayPalService.PremiumStatusResponse;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
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
        return payPalService.createOrder(request.userId(), request.plan());
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

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ErrorResponse(ex.getMessage()));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponse> handleInternalError(IllegalStateException ex) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(new ErrorResponse(ex.getMessage()));
    }

    record CreateOrderRequest(Long userId, String plan) {}
    record ErrorResponse(String message) {}
}
