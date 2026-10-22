package com.example.madar.DTO.Out.Payment;

import java.time.LocalDateTime;

public record PaymentResponseDTO(Integer id, String serviceType, Integer amount, String currency,
                                 String status, LocalDateTime createdAt, LocalDateTime paidAt,
                                 LocalDateTime accessExpiresAt, Integer refundedAmount) {}
