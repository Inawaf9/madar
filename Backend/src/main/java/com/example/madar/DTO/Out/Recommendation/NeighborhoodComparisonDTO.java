package com.example.madar.DTO.Out.Recommendation;


public record NeighborhoodComparisonDTO(
        NeighborhoodSuitabilityDTO firstNeighborhood,
        NeighborhoodSuitabilityDTO secondNeighborhood,
        String betterNeighborhood,
        Double scoreDifference
) {}
