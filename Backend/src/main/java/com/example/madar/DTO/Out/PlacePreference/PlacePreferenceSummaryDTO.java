package com.example.madar.DTO.Out.PlacePreference;


import java.util.Map;

public record PlacePreferenceSummaryDTO(
        long totalPlaces,
        Map<String, Long> countByType
) {}
