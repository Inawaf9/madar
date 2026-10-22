package com.example.madar.DTO.Out.Payment;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.OffsetDateTime;

@JsonIgnoreProperties(ignoreUnknown = true)
public record MoyasarIntentDTO(String id, String status, Integer amount, String currency,
                               String description,
                               @JsonProperty("client_secret") String clientSecret,
                               @JsonProperty("expires_at") OffsetDateTime expiresAt) {
    @Override
    public String toString() {
        return "MoyasarIntentDTO[id=" + id + ", status=" + status + "]";
    }
}
