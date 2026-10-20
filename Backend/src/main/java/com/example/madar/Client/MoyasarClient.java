package com.example.madar.Client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class MoyasarClient {

    private final RestClient restClient;

    public MoyasarClient(
            RestClient.Builder builder,
            @Value("${moyasar.base-url}") String baseUrl,
            @Value("${moyasar.api-key}") String apiKey) {

        this.restClient = builder.clone()
                .baseUrl(baseUrl)
                .defaultHeaders(headers -> headers.setBasicAuth(apiKey, ""))
                .build();
    }
}
