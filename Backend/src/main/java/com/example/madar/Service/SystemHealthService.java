package com.example.madar.Service;



import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
public class SystemHealthService {

    private final JdbcTemplate jdbcTemplate;

    @Value("${N8N_ACCOUNT_PAYMENT_WEBHOOK:}")
    private String n8nWebhookUrl;

    @Value("${moyasar.secret-key:${MOYASAR_SECRET_KEY:}}")
    private String moyasarSecretKey;

    @Value("${openrouter.api-key:${OPENROUTER_API_KEY:}}")
    private String openRouterApiKey;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(3))
            .version(HttpClient.Version.HTTP_1_1)
            .proxy(java.net.ProxySelector.of(null))
            .followRedirects(HttpClient.Redirect.NEVER)
            .build();

    private static final long CACHE_DURATION_NANOS =
            Duration.ofSeconds(60).toNanos();

    private volatile Map<String, Object> cachedResult;
    private volatile long lastCheckNanos;

    // Main admin health endpoint with 60-second cache
    public synchronized Map<String, Object> getSystemHealth() {

        long now = System.nanoTime();

        if (cachedResult != null
                && now - lastCheckNanos < CACHE_DURATION_NANOS) {
            return cachedResult;
        }

        // External checks run concurrently
        CompletableFuture<Map<String, Object>> n8nFuture =
                CompletableFuture.supplyAsync(this::checkN8n);

        CompletableFuture<Map<String, Object>> moyasarFuture =
                CompletableFuture.supplyAsync(this::checkMoyasar);

        CompletableFuture<Map<String, Object>> openRouterFuture =
                CompletableFuture.supplyAsync(this::checkOpenRouter);

        Map<String, Object> services = new LinkedHashMap<>();

        services.put("database", checkDatabase());
        services.put("n8n", n8nFuture.join());
        services.put("moyasar", moyasarFuture.join());
        services.put("openRouter", openRouterFuture.join());

        // These APIs are intentionally not called to avoid billable probes.
        services.put("kite", status(
                "NOT_CHECKED",
                "Authenticated KITE health probe not configured",
                null
        ));

        services.put("googleRoutes", status(
                "NOT_CHECKED",
                "Live check disabled to avoid API usage charges",
                null
        ));

        services.put("googlePlaces", status(
                "NOT_CHECKED",
                "Live check disabled to avoid API usage charges",
                null
        ));

        long upCount = countStatus(services, "UP");

        long downCount = countStatus(services, "DOWN");

        long degradedCount = countStatus(services, "DEGRADED");

        long unverifiedCount =
                countStatus(services, "NOT_CHECKED")
                        + countStatus(services, "NOT_CONFIGURED");

        String overall;

        if (hasStatus(services.get("database"), "DOWN")) {
            overall = "DOWN";
        } else if (downCount > 0 || degradedCount > 0) {
            overall = "DEGRADED";
        } else if (unverifiedCount > 0) {
            overall = "PARTIALLY_MONITORED";
        } else {
            overall = "UP";
        }

        Map<String, Object> result = new LinkedHashMap<>();

        result.put("status", overall);
        result.put("checkedAt", OffsetDateTime.now().toString());
        result.put("cacheDurationSeconds", 60);
        result.put("totalServices", services.size());
        result.put("upServices", upCount);
        result.put("downServices", downCount);
        result.put("degradedServices", degradedCount);
        result.put("unverifiedServices", unverifiedCount);
        result.put("services", services);

        cachedResult = result;
        lastCheckNanos = System.nanoTime();

        return cachedResult;
    }

    // Actual database connectivity check
    private Map<String, Object> checkDatabase() {

        long start = System.nanoTime();

        try {
            Integer response = jdbcTemplate.queryForObject(
                    "SELECT 1",
                    Integer.class
            );

            if (Integer.valueOf(1).equals(response)) {
                return status(
                        "UP",
                        "Database connected successfully",
                        elapsed(start)
                );
            }

            return status(
                    "DOWN",
                    "Unexpected database response",
                    elapsed(start)
            );

        } catch (Exception e) {
            return status(
                    "DOWN",
                    "Database connection unavailable",
                    elapsed(start)
            );
        }
    }

    // n8n readiness, including its database readiness
    private Map<String, Object> checkN8n() {

        if (blank(n8nWebhookUrl)) {
            return status(
                    "NOT_CONFIGURED",
                    "n8n webhook URL missing",
                    null
            );
        }

        try {
            URI webhook = URI.create(n8nWebhookUrl);

            if (!validHttpUrl(webhook)) {
                return status(
                        "NOT_CONFIGURED",
                        "Invalid n8n webhook URL",
                        null
                );
            }

            String path = webhook.getPath();
            String prefix = "";

            int index = path.indexOf("/webhook/");

            if (index >= 0) {
                prefix = path.substring(0, index);
            }

            String host = webhook.getHost();

            if ("localhost".equalsIgnoreCase(host)) {
                host = "127.0.0.1";
            }

            URI readiness = new URI(
                    webhook.getScheme(),
                    null,
                    host,
                    webhook.getPort(),
                    prefix + "/healthz/readiness",
                    null,
                    null
            );

            return httpCheck(readiness, null, "n8n");

        } catch (Exception e) {
            return status(
                    "NOT_CONFIGURED",
                    "Invalid n8n health check configuration",
                    null
            );
        }
    }

    // Read-only API request: does not create or charge payments
    private Map<String, Object> checkMoyasar() {

        if (blank(moyasarSecretKey)) {
            return status(
                    "NOT_CONFIGURED",
                    "Moyasar secret key missing",
                    null
            );
        }

        if (!moyasarSecretKey.startsWith("sk_test_")
                && !moyasarSecretKey.startsWith("sk_live_")) {
            return status(
                    "NOT_CONFIGURED",
                    "Invalid Moyasar secret key format",
                    null
            );
        }

        String encoded = Base64.getEncoder().encodeToString(
                (moyasarSecretKey + ":")
                        .getBytes(StandardCharsets.UTF_8)
        );

        return httpCheck(
                URI.create("https://api.moyasar.com/v1/payments?page=1"),
                "Basic " + encoded,
                "Moyasar"
        );
    }

    // Read-only key validation; no AI model calls
    private Map<String, Object> checkOpenRouter() {

        if (blank(openRouterApiKey)) {
            return status(
                    "NOT_CONFIGURED",
                    "OpenRouter API key missing",
                    null
            );
        }

        return httpCheck(
                URI.create("https://openrouter.ai/api/v1/key"),
                "Bearer " + openRouterApiKey,
                "OpenRouter"
        );
    }

    // Safe HTTP GET probe
    private Map<String, Object> httpCheck(
            URI uri,
            String authorization,
            String serviceName) {

        long start = System.nanoTime();

        try {
            HttpRequest.Builder builder = HttpRequest.newBuilder()
                    .uri(uri)
                    .timeout(Duration.ofSeconds(10))
                    .header("Accept", "application/json")
                    .GET();

            if (!blank(authorization)) {
                builder.header("Authorization", authorization);
            }

            HttpResponse<Void> response = httpClient.send(
                    builder.build(),
                    HttpResponse.BodyHandlers.discarding()
            );

            int code = response.statusCode();
            long time = elapsed(start);

            if (code >= 200 && code < 300) {
                return status(
                        "UP",
                        serviceName + " API responded successfully",
                        time
                );
            }

            if (code == 401 || code == 403) {
                return status(
                        "DOWN",
                        serviceName + " authentication failed",
                        time
                );
            }

            if (code == 429) {
                return status(
                        "DEGRADED",
                        serviceName + " rate limit reached",
                        time
                );
            }

            if (code >= 500) {
                return status(
                        "DOWN",
                        serviceName + " server error",
                        time
                );
            }

            return status(
                    "DEGRADED",
                    serviceName + " returned HTTP " + code,
                    time
            );

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();

            return status(
                    "DOWN",
                    serviceName + " check interrupted",
                    elapsed(start)
            );

        } catch (Exception e) {

            System.err.println(
                    "System Health [" + serviceName + "] ERROR: "
                            + e.getClass().getSimpleName()
                            + " - " + e.getMessage()
            );

            return status(
                    "DOWN",
                    serviceName + " unreachable or timed out",
                    elapsed(start)
            );
        }
    }

    private Map<String, Object> status(
            String value,
            String message,
            Long responseTimeMs) {

        Map<String, Object> data = new LinkedHashMap<>();

        data.put("status", value);
        data.put("message", message);
        data.put("responseTimeMs", responseTimeMs);
        data.put("checkedAt", OffsetDateTime.now().toString());

        return data;
    }

    private long countStatus(
            Map<String, Object> services,
            String expected) {

        return services.values().stream()
                .filter(service -> hasStatus(service, expected))
                .count();
    }

    private boolean hasStatus(Object service, String expected) {

        if (!(service instanceof Map<?, ?> map)) {
            return false;
        }

        return expected.equals(map.get("status"));
    }

    private boolean validHttpUrl(URI uri) {
        return uri.getHost() != null
                && ("http".equalsIgnoreCase(uri.getScheme())
                || "https".equalsIgnoreCase(uri.getScheme()));
    }

    private boolean blank(String value) {
        return value == null || value.isBlank();
    }

    private long elapsed(long start) {
        return (System.nanoTime() - start) / 1_000_000;
    }
}
