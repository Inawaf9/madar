package com.example.madar.DTO.Out.Commute;



public record CommuteResponseDTO(
        Integer placePreferenceId,
        String placeName,
        String placeType,
        Integer importance,
        Integer visitPerWeek,
        Double distanceKm,
        Double durationMinutes) {
}
