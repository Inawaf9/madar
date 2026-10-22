package com.example.madar.DTO.Out.Payment;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record MoyasarPaymentDTO(String id, String status, Integer amount, String currency,
                                String description, Integer refunded, Integer captured) {}
