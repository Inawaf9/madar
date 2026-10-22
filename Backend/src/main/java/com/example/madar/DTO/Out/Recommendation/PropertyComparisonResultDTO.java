package com.example.madar.DTO.Out.Recommendation;


import java.util.List;

public record PropertyComparisonResultDTO(
        List<ComparedPropertyDTO> properties,
        ComparisonExplanationDTO aiAnalysis
) {
}