package com.example.madar.DTO.Out.GooglePlaces;



import java.util.List;

public record GooglePlacesResponseDTO(
        List<Place> places
) {
    public record Place(
            String id,
            DisplayName displayName,
            String formattedAddress,
            Location location,
            String primaryType,
            List<String> types
    ) {}

    public record DisplayName(String text) {}

    public record Location(
            Double latitude,
            Double longitude
    ) {}
}

