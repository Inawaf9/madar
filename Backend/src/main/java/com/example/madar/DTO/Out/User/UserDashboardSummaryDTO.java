package com.example.madar.DTO.Out.User;


public record UserDashboardSummaryDTO(
        Integer userId,
        boolean housingPreferencesCompleted,
        long savedPropertiesCount,
        long importantLocationsCount,
        String currentHomeStatus
) {}