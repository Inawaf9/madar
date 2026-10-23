package com.example.madar.DTO.Out.SavedProperty;


import java.util.Map;

public record SavedPropertySummaryDTO(
        long totalSaved,
        Map<String, Long> countBySource
) {}