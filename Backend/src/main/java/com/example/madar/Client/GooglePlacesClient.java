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

}
