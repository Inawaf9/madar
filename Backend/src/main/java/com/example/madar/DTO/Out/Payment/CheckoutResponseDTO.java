package com.example.madar.DTO.Out.Payment;

import java.time.OffsetDateTime;
import java.util.Map;

public record CheckoutResponseDTO(Integer paymentId, String serviceType, Integer amount, String currency,
                                  String intentId, String clientSecret, OffsetDateTime expiresAt,
                                  String givenId, Map<String, String> metadata) {
    @Override
    public String toString() {
        return "CheckoutResponseDTO[paymentId=" + paymentId + ", serviceType=" + serviceType + "]";
    }
}
