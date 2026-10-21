package com.example.madar.DTO.Out;



public record CommuteResponseDTO(
        Integer placePreferenceId,
        String placeName,
        String placeType,
        Integer importance,
        Integer visitPerWeek,
        Double distanceKm,
        Double durationMinutes) {
}
