package com.example.madar.Client;

import com.example.madar.DTO.Out.Payment.MoyasarIntentDTO;
import com.example.madar.DTO.Out.Payment.MoyasarPaymentDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

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
    public MoyasarIntentDTO createIntent(Integer amount, String currency, String reference, String callbackUrl) {
        try {
            MoyasarIntentDTO response = restClient.post().uri("/payment_intents")
                    .body(Map.of("amount", amount, "currency", currency,
                            "description", reference, "callback_url", callbackUrl))
                    .retrieve().body(MoyasarIntentDTO.class);
            if (response == null) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Moyasar returned an empty intent");
            }
            return response;
        } catch (RestClientException e) {
            // Do not expose provider response bodies, headers, credentials, or client secrets.
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to create Moyasar checkout");
        }
    }

    public MoyasarIntentDTO getIntent(String intentId) {
        try {
            MoyasarIntentDTO response = restClient.get().uri("/payment_intents/{id}", intentId)
                    .retrieve().body(MoyasarIntentDTO.class);
            if (response == null) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Moyasar returned an empty intent");
            }
            return response;
        } catch (RestClientException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to retrieve Moyasar checkout");
        }
    }

    public MoyasarPaymentDTO getPayment(String paymentId) {
        try {
            MoyasarPaymentDTO response = restClient.get().uri("/payments/{id}", paymentId)
                    .retrieve().body(MoyasarPaymentDTO.class);
            if (response == null) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Moyasar returned an empty payment");
            }
            return response;
        } catch (HttpClientErrorException.NotFound e) {
            // given_id is reserved locally before browser fulfillment creates the payment.
            return null;
        } catch (RestClientException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to retrieve Moyasar payment");
        }
    }
}
