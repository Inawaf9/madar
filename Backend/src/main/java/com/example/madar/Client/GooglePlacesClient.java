package com.example.madar.Client;

import com.example.madar.Api.ApiException;
import com.example.madar.DTO.Out.GooglePlaces.GooglePlacesResponseDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;
import java.util.Map;

@Component
public class GooglePlacesClient {

    private final RestClient restClient;

    public GooglePlacesClient(
            RestClient.Builder builder,
            @Value("${google.places-url}") String baseUrl,
            @Value("${google.api-key}") String apiKey) {

        this.restClient = builder.clone()
                .baseUrl(baseUrl)
                .defaultHeader("X-Goog-Api-Key", apiKey)
                .build();
    }



    // Search for nearby services around a property
    public GooglePlacesResponseDTO searchNearbyPlaces(Double latitude, Double longitude, String placeType, Double radiusMeters) {

        Map<String, Object> request = Map.of(
                "includedTypes", List.of(placeType),
                "maxResultCount", 10,
                "rankPreference", "DISTANCE",
                "locationRestriction", Map.of("circle", Map.of("center", Map.of("latitude", latitude, "longitude", longitude), "radius", radiusMeters))
        );

        try {
            GooglePlacesResponseDTO response = restClient.post()
                    .uri("/v1/places:searchNearby")
                    .header("X-Goog-FieldMask",
                            "places.id,places.displayName,places.formattedAddress,"
                                    + "places.location,places.primaryType,places.types")                    .body(request)
                    .retrieve()
                    .body(GooglePlacesResponseDTO.class);

            return response == null
                    ? new GooglePlacesResponseDTO(List.of())
                    : response;

        } catch (RestClientException e) {
            throw new ApiException("Failed to search nearby places: " + e.getMessage());
        }
    }

    // A circular bias is only a search context; the service filters returned coordinates.
    public GooglePlacesResponseDTO searchPlacesByText(Double latitude, Double longitude, String query, Double radiusMeters) {
        Map<String, Object> request = Map.of(
                "textQuery", query,
                "pageSize", 20,
                "locationBias", Map.of("circle", Map.of(
                        "center", Map.of("latitude", latitude, "longitude", longitude),
                        "radius", radiusMeters))
        );

        try {
            GooglePlacesResponseDTO response = restClient.post()
                    .uri("/v1/places:searchText")
                    .header("X-Goog-FieldMask", "places.id,places.displayName,places.formattedAddress,places.location,places.primaryType,places.types")
                    .body(request)
                    .retrieve()
                    .body(GooglePlacesResponseDTO.class);
            if (response == null) {
                throw new ApiException("Google Places returned an empty response");
            }
            return response.places() == null ? new GooglePlacesResponseDTO(List.of()) : response;
        } catch (RestClientException e) {
            throw new ApiException("Failed to search places by text");
        }
    }




    // Search multiple nearby service types in one Google request
    public GooglePlacesResponseDTO searchNearbyPlacesBatch(Double latitude, Double longitude, List<String> placeTypes, Double radiusMeters) {

        if (latitude == null || longitude == null ||
                !Double.isFinite(latitude) || !Double.isFinite(longitude) ||
                latitude < -90 || latitude > 90 ||
                longitude < -180 || longitude > 180) {
            throw new ApiException("Invalid coordinates");
        }

        if (radiusMeters == null || !Double.isFinite(radiusMeters) || radiusMeters <= 0 || radiusMeters > 50000) {
            throw new ApiException("Invalid search radius");
        }

        if (placeTypes == null || placeTypes.isEmpty()) {
            return new GooglePlacesResponseDTO(List.of());
        }

        List<String> types = placeTypes.stream()
                .filter(type -> type != null && !type.isBlank())
                .distinct()
                .toList();

        if (types.isEmpty()) {
            return new GooglePlacesResponseDTO(List.of());
        }

        if (types.size() > 50) {
            throw new ApiException("Maximum 50 place types are allowed");
        }

        Map<String, Object> request = Map.of(
                "includedTypes", types,
                "maxResultCount", 20,
                "rankPreference", "DISTANCE",
                "locationRestriction", Map.of(
                        "circle", Map.of(
                                "center", Map.of(
                                        "latitude", latitude,
                                        "longitude", longitude
                                ),
                                "radius", radiusMeters
                        )
                )
        );

        try {
            GooglePlacesResponseDTO response = restClient.post()
                    .uri("/v1/places:searchNearby")
                    .header(
                            "X-Goog-FieldMask",
                            "places.id,places.displayName,places.formattedAddress,"
                                    + "places.location,places.primaryType,places.types"
                    )
                    .body(request)
                    .retrieve()
                    .body(GooglePlacesResponseDTO.class);

            return response == null || response.places() == null
                    ? new GooglePlacesResponseDTO(List.of())
                    : response;

        } catch (RestClientException e) {
            throw new ApiException("Failed to search nearby service types");
        }
    }
}
