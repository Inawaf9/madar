package com.example.madar.DTO.Out.GooglePlaces;

public record NearbyPlaceResponseDTO(
        GooglePlacesResponseDTO.Place place,
        Double straightLineDistanceMeters
) {}
