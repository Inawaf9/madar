package com.example.madar.Client;

import com.example.madar.Api.ApiException;
import com.example.madar.DTO.Out.GoogleRoutes.GoogleRouteResponseDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;


import java.util.Map;



@Component
public class GoogleRoutesClient {

    private final RestClient restClient;

    public GoogleRoutesClient(
            RestClient.Builder builder,
            @Value("${google.routes-url}") String baseUrl,
            @Value("${google.api-key}") String apiKey) {

        this.restClient = builder.clone()
                .baseUrl(baseUrl)
                .defaultHeader("X-Goog-Api-Key", apiKey)
                .build();
    }




    // Calculate driving distance and duration between two locations
    public GoogleRouteResponseDTO.Route computeRoute(Double originLat, Double originLng, Double destinationLat, Double destinationLng) {
        // No travel is needed when origin and destination are identical
        if (originLat != null && originLng != null &&
                originLat.equals(destinationLat) &&
                originLng.equals(destinationLng)) {

            return new GoogleRouteResponseDTO.Route(0, "0s");
        }

        // Set origin and destination coordinates
        Map<String, Object> origin = Map.of(
                "location", Map.of(
                        "latLng", Map.of(
                                "latitude", originLat,
                                "longitude", originLng
                        )
                )
        );

        Map<String, Object> destination = Map.of(
                "location", Map.of(
                        "latLng", Map.of(
                                "latitude", destinationLat,
                                "longitude", destinationLng
                        )
                )
        );

        // Prepare request body
        Map<String, Object> request = Map.of(
                "origin", origin,
                "destination", destination,
                "travelMode", "DRIVE",
                "routingPreference", "TRAFFIC_AWARE"
        );

        try {
            // Send request to Google Routes API
            GoogleRouteResponseDTO response = restClient.post()
                    .uri("/directions/v2:computeRoutes")
                    .header("X-Goog-FieldMask",
                            "routes.distanceMeters,routes.duration")
                    .body(request)
                    .retrieve()
                    .body(GoogleRouteResponseDTO.class);

            if (response == null || response.routes() == null
                    || response.routes().isEmpty()) {
                throw new ApiException("No route found");
            }

            GoogleRouteResponseDTO.Route route = response.routes().get(0);

            if (route == null ||
                    route.distanceMeters() == null ||
                    route.duration() == null ||
                    route.duration().isBlank()) {

                throw new ApiException("Google Routes returned incomplete distance or duration data");
            }

            return route;
        } catch (RestClientException e) {
            throw new ApiException("Failed to calculate route: " + e.getMessage());
        }
    }


}
