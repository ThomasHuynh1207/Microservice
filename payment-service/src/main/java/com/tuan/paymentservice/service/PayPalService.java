package com.tuan.paymentservice.service;

import com.tuan.paymentservice.entity.PaymentTransaction;
import com.tuan.paymentservice.repository.PaymentTransactionRepository;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

@Service
public class PayPalService {

    private static final Logger log = LoggerFactory.getLogger(PayPalService.class);
    private static final Duration TIMEOUT = Duration.ofSeconds(45);

    private final PaymentTransactionRepository transactions;
    private final WebClient webClient;
    private final String clientId;
    private final String clientSecret;
    private final String baseUrl;
    private final String currency;
    private final String authServiceUrl;

    public PayPalService(
            PaymentTransactionRepository transactions,
            WebClient.Builder webClientBuilder,
            @Value("${paypal.client-id:}") String clientId,
            @Value("${paypal.secret:}") String clientSecret,
            @Value("${paypal.base-url:https://api-m.sandbox.paypal.com}") String baseUrl,
            @Value("${paypal.currency:USD}") String currency,
            @Value("${auth.service.url:http://auth-service:8081}") String authServiceUrl) {
        this.transactions = transactions;
        this.webClient = webClientBuilder.build();
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.baseUrl = baseUrl;
        this.currency = currency;
        this.authServiceUrl = authServiceUrl;
    }

    @Transactional
    public CreateOrderResponse createOrder(Long userId, String plan, String userName, String userEmail) {
        ensureConfigured();
        double amount = resolveAmount(plan);
        String orderId = requestPayPalOrder(amount);

        PaymentTransaction tx = new PaymentTransaction();
        tx.setUserId(userId);
        tx.setOrderId(orderId);
        tx.setProvider("PAYPAL");
        tx.setStatus("CREATED");
        tx.setAmount(amount);
        tx.setCurrency(currency);
        tx.setPlan(plan);
        tx.setUserName(userName);
        tx.setUserEmail(userEmail);
        transactions.save(tx);

        return new CreateOrderResponse(orderId, amount, currency);
    }

    @Transactional(readOnly = true)
    public AdminStatsResponse getAdminStats(long premiumUsers) {
        long total = transactions.count();
        double revenue = transactions.sumRevenue();
        long completed = transactions.countCompleted();
        long failed = transactions.countFailed();
        return new AdminStatsResponse(total, revenue, premiumUsers, completed, failed);
    }

    @Transactional(readOnly = true)
    public Page<PaymentTransaction> getAdminTransactions(String search, String status, String period, int page, int size) {
        Specification<PaymentTransaction> spec = Specification.where(null);

        if (search != null && !search.isBlank()) {
            String like = "%" + search.trim().toLowerCase() + "%";
            spec = spec.and((root, q, cb) -> cb.or(
                cb.like(cb.lower(cb.coalesce(root.get("userName"), "")), like),
                cb.like(cb.lower(cb.coalesce(root.get("userEmail"), "")), like)
            ));
        }

        if (status != null && !status.isBlank() && !"ALL".equals(status)) {
            String s = status;
            spec = spec.and((root, q, cb) -> cb.equal(root.get("status"), s));
        }

        Instant from = switch (period == null ? "ALL" : period) {
            case "TODAY" -> Instant.now().truncatedTo(ChronoUnit.DAYS);
            case "7D"    -> Instant.now().minus(7, ChronoUnit.DAYS);
            case "MONTH" -> Instant.now().minus(30, ChronoUnit.DAYS);
            default      -> null;
        };
        if (from != null) {
            Instant fromFinal = from;
            spec = spec.and((root, q, cb) -> cb.greaterThanOrEqualTo(root.get("createdAt"), fromFinal));
        }

        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return transactions.findAll(spec, pageable);
    }

    @Transactional
    public CaptureOrderResponse captureOrder(String orderId) {
        ensureConfigured();
        PaymentTransaction tx = transactions.findByOrderId(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));

        String status = capturePayPalOrder(orderId);
        tx.setStatus(status);
        transactions.save(tx);

        boolean completed = "COMPLETED".equalsIgnoreCase(status);
        if (completed) {
            notifyAuthServicePremium(tx.getUserId());
        }

        return new CaptureOrderResponse(orderId, status, completed);
    }

    @Transactional(readOnly = true)
    public List<PaymentTransaction> getUserHistory(Long userId) {
        return transactions.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional(readOnly = true)
    public PremiumStatusResponse getPremiumStatus(Long userId) {
        boolean hasPremium = transactions.existsByUserIdAndStatus(userId, "COMPLETED");
        return new PremiumStatusResponse(userId, hasPremium);
    }

    private void notifyAuthServicePremium(Long userId) {
        try {
            webClient.patch()
                    .uri(authServiceUrl + "/api/auth/internal/users/" + userId + "/premium")
                    .retrieve()
                    .toBodilessEntity()
                    .block(Duration.ofSeconds(10));
            log.info("Premium activated for user {}", userId);
        } catch (Exception e) {
            log.error("Failed to activate premium for user {} in auth-service: {}", userId, e.getMessage());
        }
    }

    private void ensureConfigured() {
        if (clientId == null || clientId.isBlank() || clientSecret == null || clientSecret.isBlank()) {
            throw new IllegalStateException("PayPal credentials are not configured");
        }
    }

    private String requestPayPalOrder(double amount) {
        String token = accessToken();
        Map<String, Object> payload = Map.of(
                "intent", "CAPTURE",
                "purchase_units", List.of(Map.of(
                        "amount", Map.of(
                                "currency_code", currency,
                                "value", String.format(java.util.Locale.US, "%.2f", amount)
                        )
                )),
                "application_context", Map.of("brand_name", "RunSwim", "user_action", "PAY_NOW")
        );

        Map<?, ?> response = webClient.post()
                .uri(baseUrl + "/v2/checkout/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .bodyValue(payload)
                .retrieve()
                .bodyToMono(Map.class)
                .block(TIMEOUT);

        if (response == null || response.get("id") == null) {
            throw new IllegalStateException("Failed to create PayPal order");
        }
        return response.get("id").toString();
    }

    private String capturePayPalOrder(String orderId) {
        String token = accessToken();
        Map<?, ?> response = webClient.post()
                .uri(baseUrl + "/v2/checkout/orders/" + orderId + "/capture")
                .contentType(MediaType.APPLICATION_JSON)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .retrieve()
                .bodyToMono(Map.class)
                .block(TIMEOUT);

        Object status = response == null ? null : response.get("status");
        return status == null ? "UNKNOWN" : status.toString();
    }

    private String accessToken() {
        String auth = Base64.getEncoder().encodeToString(
                (clientId + ":" + clientSecret).getBytes(StandardCharsets.UTF_8));
        Map<?, ?> response = webClient.post()
                .uri(baseUrl + "/v1/oauth2/token")
                .header(HttpHeaders.AUTHORIZATION, "Basic " + auth)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(BodyInserters.fromFormData("grant_type", "client_credentials"))
                .retrieve()
                .bodyToMono(Map.class)
                .block(TIMEOUT);

        Object token = response == null ? null : response.get("access_token");
        if (token == null) throw new IllegalStateException("Failed to get PayPal access token");
        return token.toString();
    }

    private double resolveAmount(String plan) {
        return "PREMIUM".equalsIgnoreCase(plan) ? 9.99 : 9.99;
    }

    public record CreateOrderResponse(String orderId, double amount, String currency) {}
    public record CaptureOrderResponse(String orderId, String status, boolean premiumActive) {}
    public record PremiumStatusResponse(Long userId, boolean premiumActive) {}
    public record AdminStatsResponse(long totalTransactions, double totalRevenue, long totalPremiumUsers, long successfulTransactions, long failedTransactions) {}
}
