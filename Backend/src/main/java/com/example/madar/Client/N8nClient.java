package com.example.madar.Client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Component
public class N8nClient {

    private final RestClient restClient;
    private final String welcomeUrl;
    private final String welcomeWebhookKey;

    public N8nClient(
            @Value("${N8N_WELCOME_WEBHOOK:}") String welcomeUrl,
            @Value("${N8N_WELCOME_WEBHOOK_KEY:}") String welcomeWebhookKey
    ) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(2000);
        factory.setReadTimeout(3000);

        this.restClient = RestClient.builder()
                .requestFactory(factory)
                .build();

        this.welcomeUrl = welcomeUrl;
        this.welcomeWebhookKey = welcomeWebhookKey;
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
}