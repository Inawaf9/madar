package com.example.madar.DTO.Out.Recommendation;

public record ComparedPropertyDTO(
        Integer savedPropertyId,
        String externalPropertyId,
        String source,
        String title,
        String neighborhood,
        Integer price,
        Integer bedrooms,
        Double areaSqm,
        String image,
        String listingUrl,
        Double matchScore,
        Double housingScore,
        Double commuteScore,
        Double servicesScore
) {
}

