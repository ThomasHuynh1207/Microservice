package com.tuan.authservice.controller;

import com.tuan.authservice.entity.UserAccount;
import com.tuan.authservice.repository.UserAccountRepository;
import com.tuan.authservice.service.AuthService;
import com.tuan.authservice.service.AuthService.AuthResponse;
import com.tuan.authservice.service.AuthService.LoginRequest;
import com.tuan.authservice.service.AuthService.RegisterRequest;
import com.tuan.authservice.service.PaymentService;
import com.tuan.authservice.service.PaymentService.CaptureOrderRequest;
import com.tuan.authservice.service.PaymentService.CaptureOrderResponse;
import com.tuan.authservice.service.PaymentService.CreateOrderRequest;
import com.tuan.authservice.service.PaymentService.CreateOrderResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;
    private final PaymentService paymentService;
    private final UserAccountRepository users;

    public AuthController(AuthService authService, PaymentService paymentService, UserAccountRepository users) {
        this.authService = authService;
        this.paymentService = paymentService;
        this.users = users;
    }

    @PostMapping("/register")
    AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    AuthResponse me(@RequestHeader(value = "Authorization", required = false) String authorization) {
        return authService.me(authorization);
    }

    @PatchMapping("/users/{userId}/onboarding-complete")
    void completeOnboarding(@PathVariable Long userId) {
        authService.markOnboardingCompleted(userId);
    }

    @PostMapping("/payments/paypal/create-order")
    CreateOrderResponse createPaypalOrder(@RequestBody CreateOrderRequest request) {
        return paymentService.createOrder(request);
    }

    @PostMapping("/payments/paypal/capture/{orderId}")
    CaptureOrderResponse capturePaypalOrder(@PathVariable String orderId) {
        return paymentService.captureOrder(new CaptureOrderRequest(orderId));
    }

    @GetMapping("/users/{userId}/premium-status")
    PremiumStatusResponse premiumStatus(@PathVariable Long userId) {
        UserAccount account = users.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return new PremiumStatusResponse(account.getId(), account.isPremiumActive(), account.getPremiumSince());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    ResponseEntity<ErrorResponse> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ErrorResponse(ex.getMessage()));
    }

    record ErrorResponse(String message) {
    }

    record PremiumStatusResponse(Long userId, boolean premiumActive, java.time.Instant premiumSince) {
    }
}
