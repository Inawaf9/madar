package com.example.madar.Service;

import com.example.madar.Api.ApiException;
import com.example.madar.DTO.Out.GooglePlaces.GooglePlacesResponseDTO;
import com.example.madar.DTO.Out.GooglePlaces.NearbyInterestResponseDTO;
import com.example.madar.DTO.Out.GooglePlaces.NearbyPlaceResponseDTO;
import com.example.madar.DTO.Out.Property.PropertyDTO;
import com.example.madar.Util.PlaceCategories;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class NearbyInterestService {
    private final HousingPreferenceService housingPreferenceService;
    private final PlacePreferenceService placePreferenceService;
    private final PropertyService propertyService;

    public List<NearbyInterestResponseDTO> analyzeProperty(Integer userId, String source, String externalId, Double radius) {
        validateRadius(radius);
        Set<String> interests = housingPreferenceService.getInterestsByUserId(userId);
        if (source == null || !"KITE".equalsIgnoreCase(source)
                || externalId == null || !externalId.matches("[0-9]{1,19}")) {
            throw new ApiException("A KITE source and numeric property ID are required");
        }
        // Resolve the listing server-side; client-supplied coordinates are never used.
        PropertyDTO property = propertyService.getPropertyById(source, externalId);
        return analyze(property.getLatitude(), property.getLongitude(), interests, radius);
    }

    public List<NearbyInterestResponseDTO> analyze(Double latitude, Double longitude, Set<String> interests, Double radius) {
        validateRadius(radius);
        if (!validCoordinates(latitude, longitude)) {
            throw new ApiException("Invalid property coordinates");
        }
        List<NearbyInterestResponseDTO> results = new ArrayList<>();
        // Normalization deduplicates categories, so each category triggers at most one request.
        for (String category : PlaceCategories.normalize(interests)) {
            try {
                GooglePlacesResponseDTO response = placePreferenceService.getNearbyServices(
                        latitude, longitude, category, radius);
                NearbyPlaceResponseDTO match = findNearestPlace(latitude, longitude, response, radius);
                results.add(new NearbyInterestResponseDTO(category, match == null ? "NO_MATCH" : "FOUND",
                        match != null, match == null ? null : match.place(),
                        match == null ? null : match.straightLineDistanceMeters()));
            } catch (ApiException e) {
                results.add(new NearbyInterestResponseDTO(category, "SEARCH_FAILED", false, null, null));
            }
        }
        return results;
    }

    public void validateRadius(Double radius) {
        if (radius == null || !Double.isFinite(radius) || radius <= 0 || radius > 50000) {
            throw new ApiException("Invalid search radius");
        }
    }

    private NearbyPlaceResponseDTO findNearestPlace(Double latitude, Double longitude,
                                                   GooglePlacesResponseDTO response, Double radius) {
        if (response == null) {
            throw new ApiException("Google Places returned an empty response");
        }
        NearbyPlaceResponseDTO nearest = null;
        if (response.places() != null) {
            for (GooglePlacesResponseDTO.Place place : response.places()) {
                if (place == null || place.id() == null || place.location() == null
                        || !validCoordinates(place.location().latitude(), place.location().longitude())) {
                    continue;
                }
                double distance = propertyService.calculateDistanceKm(latitude, longitude,
                        place.location().latitude(), place.location().longitude()) * 1000;
                if (Double.isFinite(distance) && distance <= radius
                        && (nearest == null || distance < nearest.straightLineDistanceMeters())) {
                    nearest = new NearbyPlaceResponseDTO(place, distance);
                }
            }
        }
        return nearest;
    }

    private boolean validCoordinates(Double latitude, Double longitude) {
        return latitude != null && longitude != null && Double.isFinite(latitude) && Double.isFinite(longitude)
                && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
    }
}
