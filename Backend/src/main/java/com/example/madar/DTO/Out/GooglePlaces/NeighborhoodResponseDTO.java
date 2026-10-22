package com.example.madar.DTO.Out.GooglePlaces;

import java.util.List;

public record NeighborhoodResponseDTO(
        Integer homeId,
        GooglePlacesResponseDTO.Location location,
        Integer radiusMeters,
        List<GooglePlacesResponseDTO.Place> places,
        List<CategorySummary> categories,
        boolean completeInventory
) {
    public record CategorySummary(String category, Integer returnedCount, List<String> placeIds) {}
}
