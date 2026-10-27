package com.example.madar.Client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.client.RestClient;

import java.util.HashMap;
import java.util.Map;

@Component
public class N8nClient {

    private final RestClient restClient;
    private final String welcomeUrl;
    private final String welcomeWebhookKey;
    private final String passwordResetUrl;
    private final String passwordResetWebhookKey;

    @Value("${N8N_ACCOUNT_PAYMENT_WEBHOOK:}")
    private String accountPaymentUrl;

    @Value("${N8N_ACCOUNT_PAYMENT_WEBHOOK_KEY:}")
    private String accountPaymentWebhookKey;

    public N8nClient(
            @Value("${N8N_WELCOME_WEBHOOK:}") String welcomeUrl,
            @Value("${N8N_WELCOME_WEBHOOK_KEY:}") String welcomeWebhookKey,
            @Value("${N8N_PASSWORD_RESET_WEBHOOK:}") String passwordResetUrl,
            @Value("${N8N_PASSWORD_RESET_WEBHOOK_KEY:}") String passwordResetWebhookKey

    ) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(2000);
        factory.setReadTimeout(3000);

        this.restClient = RestClient.builder()
                .requestFactory(factory)
                .build();

        this.welcomeUrl = welcomeUrl;
        this.welcomeWebhookKey = welcomeWebhookKey;

        this.passwordResetUrl = passwordResetUrl;
        this.passwordResetWebhookKey = passwordResetWebhookKey;
    }

    //tell n8n a new user registered, so it sends the welcome email (it never breaks the register)
    public void sendWelcome(String fullName, String email){
        if(welcomeUrl == null || welcomeUrl.isBlank()){
            System.out.println("n8n welcome skipped: N8N_WELCOME_WEBHOOK is not set");
            return;
        }

        if (welcomeWebhookKey == null || welcomeWebhookKey.isBlank()) {
            System.out.println("n8n welcome skipped: N8N_WELCOME_WEBHOOK_KEY is not set");
            return;
        }
        try{
            restClient.post()
                    .uri(welcomeUrl)
                    .header("X-Madar-Welcome-Key", welcomeWebhookKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("fullName", fullName, "email", email))
                    .retrieve()
                    .toBodilessEntity();
            System.out.println("n8n welcome sent for " + email);
        }catch (Exception e){
            System.out.println("n8n welcome failed: " + e.getMessage());
        }
    }


    // Send password reset OTP through n8n
    public void sendPasswordReset(String email, String otp) {

        if (passwordResetUrl == null || passwordResetUrl.isBlank()) {
            throw new IllegalStateException("N8N_PASSWORD_RESET_WEBHOOK is not configured");
        }

        if (passwordResetWebhookKey == null || passwordResetWebhookKey.isBlank()) {
            throw new IllegalStateException("N8N_PASSWORD_RESET_WEBHOOK_KEY is not configured");
        }

        restClient.post()
                .uri(passwordResetUrl)
                .header("X-Madar-Reset-Key", passwordResetWebhookKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of(
                        "email", email,
                        "otp", otp
                ))
                .retrieve()
                .toBodilessEntity();
    }


    // Send account/payment events to n8n after database commit
    public void sendAccountPaymentEventAfterCommit(
            String eventType,
            String eventId,
            String fullName,
            String email,
            Integer paymentId) {

        if (!TransactionSynchronizationManager.isActualTransactionActive()
                || !TransactionSynchronizationManager.isSynchronizationActive()) {
            throw new IllegalStateException("Active transaction required");
        }

        TransactionSynchronizationManager.registerSynchronization(
                new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        sendAccountPaymentEvent(
                                eventType, eventId, fullName, email, paymentId
                        );
                    }
                }
        );
    }


    // Send event to the shared n8n workflow
    private void sendAccountPaymentEvent(
            String eventType,
            String eventId,
            String fullName,
            String email,
            Integer paymentId) {

        if (accountPaymentUrl == null || accountPaymentUrl.isBlank()
                || accountPaymentWebhookKey == null || accountPaymentWebhookKey.isBlank()) {
            System.out.println("n8n account/payment skipped: webhook not configured");
            return;
        }

        try {
            Map<String, Object> body = new HashMap<>();

            body.put("eventType", eventType);
            body.put("eventId", eventId);
            body.put("fullName", fullName);
            body.put("email", email);

            if (paymentId != null) {
                body.put("paymentId", paymentId);
            }

            restClient.post()
                    .uri(accountPaymentUrl)
                    .header("X-Madar-Event-Key", accountPaymentWebhookKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .toBodilessEntity();

            System.out.println("n8n event sent: " + eventType);

        } catch (Exception e) {
            System.out.println("n8n event failed: " + e.getMessage());
        }
    }

}