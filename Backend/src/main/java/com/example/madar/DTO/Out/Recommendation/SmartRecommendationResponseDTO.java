package com.example.madar.DTO.Out.Recommendation;


import java.util.List;

public record SmartRecommendationResponseDTO(
        List<RecommendedPropertyDTO> recommendations
) {
}