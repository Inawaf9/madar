package com.example.madar.DTO.Out.Recommendation;


public record PropertyMatchResponseDTO(
        String propertyId,
        String source,
        String title,
        Double matchScore,
        Double housingScore,
        Double commuteScore,
        Double servicesScore
) {
}