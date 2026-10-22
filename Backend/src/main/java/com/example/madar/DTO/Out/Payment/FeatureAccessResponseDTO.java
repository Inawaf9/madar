package com.example.madar.DTO.Out.Payment;

import java.time.LocalDateTime;

public record FeatureAccessResponseDTO(String serviceType, boolean access, LocalDateTime expiresAt) {}
