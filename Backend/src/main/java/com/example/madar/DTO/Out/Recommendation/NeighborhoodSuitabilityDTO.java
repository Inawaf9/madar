package com.example.madar.DTO.Out.Recommendation;



import com.example.madar.DTO.Out.Commute.CommuteSummaryResponseDTO;

public record NeighborhoodSuitabilityDTO(
        String district,
        Double neighborhoodScore,
        Double commuteScore,
        Double servicesScore,
        boolean servicesAvailable,
        CommuteSummaryResponseDTO commuteAnalysis,
        String aiAnalysis
) {
}

