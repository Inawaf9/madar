package com.example.madar.DTO.Out.Recommendation;




import java.util.List;

public record NeighborhoodSuggestionsResponseDTO(
        String city,
        String coverageNote,
        List<SuggestedNeighborhood> neighborhoods,
        String aiAnalysis
) {
    public record SuggestedNeighborhood(
            Integer rank,
            String district,
            Double latitude,
            Double longitude,
            Integer sampledPropertyCount,
            Integer lowestSampledPrice,
            Double housingScore,
            Double matchScore,
            NeighborhoodSuitabilityDTO suitability
    ) {}
}

