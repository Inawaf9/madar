package com.example.madar.Client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class GooglePlacesClient {

    private final RestClient restClient;

    public GooglePlacesClient(
            RestClient.Builder builder,
            @Value("${google.places-url}") String baseUrl,
            @Value("${google.api-key}") String apiKey) {

        this.restClient = builder.clone()
                .baseUrl(baseUrl)
                .defaultHeader("X-Goog-Api-Key", apiKey)
                .build();
    }
}
