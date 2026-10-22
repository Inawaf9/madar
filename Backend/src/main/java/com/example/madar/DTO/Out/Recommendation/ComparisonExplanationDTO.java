package com.example.madar.DTO.Out.Recommendation;




public record ComparisonExplanationDTO(
        Integer recommendedSavedPropertyId,
        String recommendedExternalPropertyId,
        String recommendedPropertyTitle,
        String reason,
        String alternativeReason,
        String tradeOff
) {
}

