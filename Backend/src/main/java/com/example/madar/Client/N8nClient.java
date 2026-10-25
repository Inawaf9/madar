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

    public N8nClient(@Value("${N8N_WELCOME_WEBHOOK:}") String welcomeUrl){
        //short timeouts: if n8n is slow or off, the register should not wait
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(2000);
        factory.setReadTimeout(3000);
        this.restClient = RestClient.builder().requestFactory(factory).build();
        this.welcomeUrl = welcomeUrl;
    }

    //tell n8n a new user registered, so it sends the welcome email (it never breaks the register)
    public void sendWelcome(String fullName, String email){
        if(welcomeUrl == null || welcomeUrl.isBlank()){
            System.out.println("n8n welcome skipped: N8N_WELCOME_WEBHOOK is not set");
            return;
        }
        try{
            restClient.post()
                    .uri(welcomeUrl)
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