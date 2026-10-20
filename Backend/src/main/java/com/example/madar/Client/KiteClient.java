package com.example.madar.Client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class KiteClient {

    private final RestClient restClient;

    public KiteClient(
            RestClient.Builder builder,
            @Value("${kite.base-url}") String baseUrl,
            @Value("${kite.api-key}") String apiKey) {

        this.restClient = builder.clone()
                .baseUrl(baseUrl)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .build();
    }
}