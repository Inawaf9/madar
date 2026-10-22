package com.example.madar.DTO.Out.Recommendation;


public record RecommendedPropertyDTO(
        Integer rank,
        String propertyId,
        String source,
        String title,
        String city,
        String neighborhood,
        Integer price,
        Integer bedrooms,
        Double areaSqm,
        String image,
        String listingUrl,
        Double matchScore,
        Double housingScore,
        Double commuteScore,
        Double servicesScore,
        String aiReason,
        String aiTradeOff
) {
}