package com.example.madar.DTO.Out.GooglePlaces;

public record NearbyInterestResponseDTO(
        String category,
        String status,
        boolean found,
        GooglePlacesResponseDTO.Place place,
        Double straightLineDistanceMeters
) {}
