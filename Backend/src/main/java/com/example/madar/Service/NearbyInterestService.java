package com.example.madar.Service;



import com.example.madar.Api.ApiException;
import com.example.madar.DTO.Out.GooglePlaces.GooglePlacesResponseDTO;
import com.example.madar.DTO.Out.GooglePlaces.NearbyInterestResponseDTO;
import com.example.madar.DTO.Out.GooglePlaces.NearbyPlaceResponseDTO;
import com.example.madar.DTO.Out.Property.PropertyDTO;
import com.example.madar.Model.HousingPreference;
import com.example.madar.Model.LifestyleInterest;
import com.example.madar.Repository.HousingPreferenceRepository;
import com.example.madar.Repository.LifestyleInterestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class NearbyInterestService {

    private final HousingPreferenceRepository housingPreferenceRepository;
    private final LifestyleInterestRepository lifestyleInterestRepository;
    private final PlacePreferenceService placePreferenceService;
    private final PropertyService propertyService;

    // Services around a property before moving in
    public List<NearbyInterestResponseDTO> analyzeProperty(
            Integer userId, String source, String externalId, Double radius) {

        validateRadius(radius);

        if (source == null || !"KITE".equalsIgnoreCase(source)
                || externalId == null || !externalId.matches("[0-9]{1,19}")) {
            throw new ApiException("A KITE source and numeric property ID are required");
        }

        List<LifestyleInterest> interests = getUserInterests(userId);
        PropertyDTO property = propertyService.getPropertyById(source, externalId);

        return analyze(
                property.getLatitude(),
                property.getLongitude(),
                interests,
                radius,
                false
        );
    }

    // Essential services and user interests after moving in
    public List<NearbyInterestResponseDTO> analyzeCurrentHome(
            Integer userId, Double latitude, Double longitude, Double radius) {

        return analyze(
                latitude,
                longitude,
                getUserInterests(userId),
                radius,
                true
        );
    }

    private List<LifestyleInterest> getUserInterests(Integer userId) {

        HousingPreference preference =
                housingPreferenceRepository.findHousingPreferenceByUser_Id(userId);

        if (preference == null) {
            throw new ApiException("Housing preferences not found");
        }

        return lifestyleInterestRepository.findByHousingPreference_Id(
                        preference.getId()
                ).stream()
                .filter(interest -> Boolean.TRUE.equals(interest.getActive()))
                .toList();
    }

    private List<NearbyInterestResponseDTO> analyze(
            Double latitude,
            Double longitude,
            List<LifestyleInterest> interests,
            Double radius,
            boolean includeEssentials) {

        validateRadius(radius);

        if (!validCoordinates(latitude, longitude)) {
            throw new ApiException("Invalid location coordinates");
        }

        List<NearbyInterestResponseDTO> results = new ArrayList<>();

        Map<String, String> basicTypes = new LinkedHashMap<>();

        if (includeEssentials) {
            basicTypes.put("supermarket", "supermarket");
            basicTypes.put("pharmacy", "pharmacy");
            basicTypes.put("hospital", "hospital");
        }

        // Do not request the same basic service twice
        for (Map.Entry<String, String> entry : basicTypes.entrySet()) {
            results.add(searchType(
                    latitude, longitude,
                    entry.getKey(), entry.getValue(), radius
            ));
        }

        for (LifestyleInterest interest : interests) {

            if (interest.getSearchType() == null) {
                continue;
            }

            if (interest.getSearchType() == LifestyleInterest.SearchType.NEARBY) {

                String type = interest.getGooglePlaceType();

                if (type == null || type.isBlank()
                        || basicTypes.containsValue(type)) {
                    continue;
                }
            }

            try {
                GooglePlacesResponseDTO response =
                        placePreferenceService.getNearbyServicesForInterest(
                                latitude, longitude, interest, radius
                        );

                results.add(buildResult(
                        interest.getCode(),
                        latitude, longitude, response, radius
                ));

            } catch (ApiException e) {
                results.add(new NearbyInterestResponseDTO(
                        interest.getCode(),
                        "SEARCH_FAILED",
                        false,
                        null,
                        null
                ));
            }
        }

        return results;
    }

    private NearbyInterestResponseDTO searchType(
            Double latitude, Double longitude,
            String code, String type, Double radius) {

        try {
            GooglePlacesResponseDTO response =
                    placePreferenceService.getNearbyServices(
                            latitude, longitude, type, radius
                    );

            return buildResult(code, latitude, longitude, response, radius);

        } catch (ApiException e) {
            return new NearbyInterestResponseDTO(
                    code, "SEARCH_FAILED", false, null, null
            );
        }
    }

    private NearbyInterestResponseDTO buildResult(
            String code,
            Double latitude,
            Double longitude,
            GooglePlacesResponseDTO response,
            Double radius) {

        NearbyPlaceResponseDTO nearest =
                findNearestPlace(latitude, longitude, response, radius);

        return new NearbyInterestResponseDTO(
                code,
                nearest == null ? "NO_MATCH" : "FOUND",
                nearest != null,
                nearest == null ? null : nearest.place(),
                nearest == null ? null : nearest.straightLineDistanceMeters()
        );
    }

    public void validateRadius(Double radius) {
        if (radius == null || !Double.isFinite(radius)
                || radius <= 0 || radius > 50000) {
            throw new ApiException("Invalid search radius");
        }
    }

    private NearbyPlaceResponseDTO findNearestPlace(
            Double latitude,
            Double longitude,
            GooglePlacesResponseDTO response,
            Double radius) {

        if (response == null || response.places() == null) {
            throw new ApiException("Google Places response is unavailable");
        }

        NearbyPlaceResponseDTO nearest = null;

        for (GooglePlacesResponseDTO.Place place : response.places()) {

            if (place == null || place.id() == null
                    || place.location() == null
                    || !validCoordinates(
                    place.location().latitude(),
                    place.location().longitude())) {
                continue;
            }

            double distance = propertyService.calculateDistanceKm(
                    latitude, longitude,
                    place.location().latitude(),
                    place.location().longitude()
            ) * 1000;

            if (Double.isFinite(distance)
                    && distance <= radius
                    && (nearest == null
                    || distance < nearest.straightLineDistanceMeters())) {

                nearest = new NearbyPlaceResponseDTO(place, distance);
            }
        }

        return nearest;
    }

    private boolean validCoordinates(Double latitude, Double longitude) {
        return latitude != null && longitude != null
                && Double.isFinite(latitude)
                && Double.isFinite(longitude)
                && latitude >= -90 && latitude <= 90
                && longitude >= -180 && longitude <= 180;
    }
}

