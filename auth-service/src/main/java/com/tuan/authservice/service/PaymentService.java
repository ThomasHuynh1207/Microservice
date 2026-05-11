package com.tuan.authservice.service;

import com.tuan.authservice.entity.PaymentTransaction;
import com.tuan.authservice.entity.UserAccount;
import com.tuan.authservice.repository.PaymentTransactionRepository;
import com.tuan.authservice.repository.UserAccountRepository;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

@Service
public class PaymentService {
    private static final Duration PAYPAL_TIMEOUT = Duration.ofSeconds(45);

    private final PaymentTransactionRepository transactions;
    private final UserAccountRepository users;
    private final WebClient webClient;
    private final String clientId;
    private final String clientSecret;
    private final String baseUrl;
    private final String currency;

    public PaymentService(
            PaymentTransactionRepository transactions,
            UserAccountRepository users,
            WebClient.Builder webClientBuilder,
            @Value("${paypal.client-id:}") String clientId,
            @Value("${paypal.secret:}") String clientSecret,
            @Value("${paypal.base-url:https://api-m.sandbox.paypal.com}") String baseUrl,
            @Value("${paypal.currency:USD}") String currency) {
        this.transactions = transactions;
        this.users = users;
        this.webClient = webClientBuilder.build();
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.baseUrl = baseUrl;
        this.currency = currency;
    }

    @Transactional
    public CreateOrderResponse createOrder(CreateOrderRequest request) {
        ensureConfigured();
        double amount = resolveAmount(request.plan());
        String orderId = requestPayPalOrder(amount, currency);
        PaymentTransaction transaction = new PaymentTransaction();
        transaction.setUserId(request.userId());
        transaction.setOrderId(orderId);
        transaction.setProvider("PAYPAL");
        transaction.setStatus("CREATED");
        transaction.setAmount(amount);
        transaction.setCurrency(currency);
        transactions.save(transaction);
        return new CreateOrderResponse(orderId, amount, currency);
    }

    @Transactional
    public CaptureOrderResponse captureOrder(CaptureOrderRequest request) {
        ensureConfigured();
        PaymentTransaction transaction = transactions.findByOrderId(request.orderId())
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));
        String status = capturePayPalOrder(request.orderId());
        transaction.setStatus(status);
        transactions.save(transaction);

        boolean completed = "COMPLETED".equalsIgnoreCase(status);
        if (completed) {
            UserAccount account = users.findById(transaction.getUserId())
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));
            account.setPremiumActive(true);
            account.setPremiumSince(Instant.now());
        }
        return new CaptureOrderResponse(request.orderId(), status, completed);
    }

    private void ensureConfigured() {
        if (clientId == null || clientId.isBlank() || clientSecret == null || clientSecret.isBlank()) {
            throw new IllegalStateException("PayPal credentials are not configured");
        }
    }

    private String requestPayPalOrder(double amount, String currency) {
        String accessToken = accessToken();
        Map<String, Object> payload = Map.of(
                "intent", "CAPTURE",
                "purchase_units", List.of(Map.of(
                        "amount", Map.of(
                                "currency_code", currency,
                                "value", String.format(java.util.Locale.US, "%.2f", amount)
                        )
                )),
                "application_context", Map.of(
                        "brand_name", "RunSwim",
                        "user_action", "PAY_NOW"
                )
        );

        Map<?, ?> response = webClient.post()
                .uri(baseUrl + "/v2/checkout/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                .bodyValue(payload)
                .retrieve()
                .bodyToMono(Map.class)
                .block(PAYPAL_TIMEOUT);

        if (response == null || response.get("id") == null) {
            throw new IllegalStateException("Failed to create PayPal order");
        }
        return response.get("id").toString();
    }

    private String capturePayPalOrder(String orderId) {
        String accessToken = accessToken();
        Map<?, ?> response = webClient.post()
                .uri(baseUrl + "/v2/checkout/orders/" + orderId + "/capture")
                .contentType(MediaType.APPLICATION_JSON)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                .retrieve()
                .bodyToMono(Map.class)
                .block(PAYPAL_TIMEOUT);
        Object status = response == null ? null : response.get("status");
        return status == null ? "UNKNOWN" : status.toString();
    }

    private String accessToken() {
        String auth = Base64.getEncoder().encodeToString((clientId + ":" + clientSecret).getBytes(StandardCharsets.UTF_8));
        Map<?, ?> response = webClient.post()
                .uri(baseUrl + "/v1/oauth2/token")
                .header(HttpHeaders.AUTHORIZATION, "Basic " + auth)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(BodyInserters.fromFormData("grant_type", "client_credentials"))
                .retrieve()
                .bodyToMono(Map.class)
                .block(PAYPAL_TIMEOUT);
        Object token = response == null ? null : response.get("access_token");
        if (token == null) {
            throw new IllegalStateException("Failed to get PayPal access token");
        }
        return token.toString();
    }

    private double resolveAmount(String plan) {
        if (plan == null) {
            return 9.99;
        }
        return "PREMIUM".equalsIgnoreCase(plan) ? 9.99 : 0.0;
    }

    public record CreateOrderRequest(Long userId, String plan) {
    }

    public record CreateOrderResponse(String orderId, double amount, String currency) {
    }

    public record CaptureOrderRequest(String orderId) {
    }

    public record CaptureOrderResponse(String orderId, String status, boolean premiumActive) {
    }
}
