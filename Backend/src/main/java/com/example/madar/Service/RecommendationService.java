
package com.example.madar.Service;

import com.example.madar.AI.RecommendationAI;
import com.example.madar.Api.ApiException;
import com.example.madar.DTO.In.Recommendation.RecommendationWeightsDTO;
import com.example.madar.DTO.Out.Commute.CommuteSummaryResponseDTO;
import com.example.madar.DTO.Out.GooglePlaces.GooglePlacesResponseDTO;
import com.example.madar.DTO.Out.Property.PropertyDTO;
import com.example.madar.DTO.Out.Recommendation.*;
import com.example.madar.Model.HousingPreference;
import com.example.madar.Repository.HousingPreferenceRepository;
import com.example.madar.Repository.PlacePreferenceRepository;
import com.example.madar.Util.PlaceCategories;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecommendationService {

    private final PropertyService propertyService;
    private final PlacePreferenceService placePreferenceService;
    private final HousingPreferenceRepository housingPreferenceRepository;
    private final RecommendationAI recommendationAI;
    private final PlacePreferenceRepository placePreferenceRepository;



    // Calculate a single property's suitability
    public PropertyMatchResponseDTO calculatePropertyMatch(Integer userId, String source, String externalId, RecommendationWeightsDTO weights) {

        HousingPreference preference = housingPreferenceRepository.findHousingPreferenceByUser_Id(userId);

        if (preference == null) {
            throw new ApiException("Housing preferences not found");
        }

        PropertyDTO property = propertyService.getPropertyById(source, externalId);

        // Track Google Places availability for this request
        boolean[] placesAvailable = {true};

        return calculateScore(userId, property, preference, weights, placesAvailable);
    }



    // Rank matching properties and generate AI explanations
    public SmartRecommendationResponseDTO getSmartRecommendations(Integer userId, RecommendationWeightsDTO weights,String language) {

        HousingPreference preference =
                housingPreferenceRepository.findHousingPreferenceByUser_Id(userId);

        if (preference == null) {
            throw new ApiException("Housing preferences not found");
        }

        if (preference.getMaxBudget() == null || preference.getMaxBudget().doubleValue() <= 0) {
            throw new ApiException("Housing budget is invalid");
        }

        // Fetch properties using the existing property search
        List<PropertyDTO> candidates = propertyService.search(preference.getCity(), preference.getListingType(), preference.getPropertyType(), preference.getMaxBudget().intValue());

        if (candidates == null || candidates.isEmpty()) {
            throw new ApiException("No properties found for recommendation");
        }

        // Select up to 15 properties with sufficient data
        List<PropertyDTO> selected = candidates.stream()
                .filter(property -> property != null &&
                                property.getExternalId() != null && property.getSource() != null &&
                                property.getLatitude() != null && property.getLongitude() != null &&
                                property.getPrice() != null && property.getPrice() > 0)
                .limit(15)
                .toList();

        if (selected.isEmpty()) {
            throw new ApiException("No properties have sufficient data for matching");
        }

        // Disable Places during bulk ranking to protect the API quota
        boolean[] skipPlaces = {false};

        // Calculate housing and commute scores for all candidates
        List<PropertyMatchResponseDTO> ranked = selected.stream()
                .map(property -> calculateScore(userId, property, preference, weights, skipPlaces))
                .sorted(Comparator.comparing(PropertyMatchResponseDTO::matchScore).reversed())
                .limit(10)
                .toList();

        // Build a lookup map without fetching property details again
        Map<String, PropertyDTO> propertyMap = selected.stream()
                .collect(Collectors.toMap(
                        PropertyDTO::getExternalId,
                        Function.identity(),
                        (first, second) -> first));

        // Fetch nearby services only for the highest-ranked property
        if (!ranked.isEmpty()) {

            PropertyMatchResponseDTO topScore = ranked.get(0);
            PropertyDTO topProperty = propertyMap.get(topScore.propertyId());

            if (topProperty == null) {
                throw new ApiException("Top ranked property not found");
            }

            boolean[] placesAvailable = {true};

            PropertyMatchResponseDTO verifiedTopScore = calculateScore(userId, topProperty, preference, weights, placesAvailable);

            // Keep ranking based on the same criteria for all properties
            // Services are displayed as additional verified information
            PropertyMatchResponseDTO finalTopScore = new PropertyMatchResponseDTO(topScore.propertyId(), topScore.source(), topScore.title(), topScore.matchScore(), topScore.housingScore(), topScore.commuteScore(), verifiedTopScore.servicesScore());

            List<PropertyMatchResponseDTO> updatedRanked = new ArrayList<>(ranked);

            updatedRanked.set(0, finalTopScore);
            ranked = updatedRanked;
        }

        // Generate AI explanations using the final ranked properties
        Map<String, RecommendationAI.PropertyExplanation> explanations = recommendationAI.explainRecommendations(ranked, selected, preference,language);

        // Keep the list effectively final for the lambda
        final List<PropertyMatchResponseDTO> finalRanked = ranked;

        List<RecommendedPropertyDTO> recommendations = java.util.stream.IntStream.range(0, finalRanked.size())
                        .mapToObj(index -> {

                            PropertyMatchResponseDTO score =
                                    finalRanked.get(index);

                            PropertyDTO property =
                                    propertyMap.get(score.propertyId());

                            RecommendationAI.PropertyExplanation explanation =
                                    explanations.get(score.propertyId());

                            String reason = explanation != null &&
                                    explanation.reason() != null &&
                                    !explanation.reason().isBlank()
                                    ? explanation.reason()
                                    : language != null && language.toLowerCase(Locale.ROOT).startsWith("en")
                                    ? "An analysis is currently unavailable for this property."
                                    : "ما توفر تحليل لهذا العقار حاليًا.";
                            String tradeOff = explanation != null &&
                                    explanation.tradeOff() != null &&
                                    !explanation.tradeOff().isBlank()
                                    ? explanation.tradeOff()
                                    : null;

                            return new RecommendedPropertyDTO(index + 1, score.propertyId(), score.source(), property.getTitle(), property.getCity(), property.getNeighborhood(), property.getPrice(), property.getBedrooms(), property.getAreaSqm(), property.getImage(), property.getListingUrl(), score.matchScore(), score.housingScore(), score.commuteScore(), score.servicesScore(), reason, tradeOff);}).toList();

        return new SmartRecommendationResponseDTO(recommendations);
    }


    // Calculate property suitability without Google Places
    public PropertyMatchResponseDTO calculateMatchWithoutPlaces(Integer userId, PropertyDTO property) {

        HousingPreference preference = housingPreferenceRepository.findHousingPreferenceByUser_Id(userId);

        if (preference == null) {
            throw new ApiException("Housing preferences not found");
        }

        boolean[] skipPlaces = {false};

        return calculateScore(userId, property, preference, null, skipPlaces);
    }



    // Evaluate neighborhood suitability using commutes and nearby services

    public NeighborhoodSuitabilityDTO getNeighborhoodSuitability(Integer userId, Double latitude, Double longitude, String district,String language) {

        if (latitude == null || longitude == null || !Double.isFinite(latitude) || !Double.isFinite(longitude) ||
                latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            throw new ApiException("Invalid neighborhood coordinates");
        }

        HousingPreference preference = housingPreferenceRepository.findHousingPreferenceByUser_Id(userId);

        if (preference == null) {
            throw new ApiException("Housing preferences not found");
        }

        // Commute analysis is optional when no important locations exist.
        CommuteSummaryResponseDTO commute = null;
        Double commuteScore = null;

        if (!placePreferenceRepository.findPlacePreferencesByUser_Id(userId).isEmpty()) {
            commute = placePreferenceService.getCommuteAnalysis(userId, latitude, longitude);
            commuteScore = commute.commuteScore();
        }

        // Nearby services are evaluated independently of commute availability.
        Double servicesScore = calculateNeighborhoodServicesScore(latitude, longitude, preference);

        double neighborhoodScore;

        if (commuteScore != null && servicesScore != null) {
            neighborhoodScore = commuteScore * 0.60 + servicesScore * 0.40;
        } else if (commuteScore != null) {
            neighborhoodScore = commuteScore;
        } else if (servicesScore != null) {
            neighborhoodScore = servicesScore;
        } else {
            throw new ApiException("Neighborhood suitability data is unavailable");
        }

        neighborhoodScore = Math.round(neighborhoodScore * 100.0) / 100.0;

        String aiAnalysis = recommendationAI.explainNeighborhood(district, preference, commuteScore, servicesScore,language);

        boolean servicesAvailable = servicesScore != null;
        return new NeighborhoodSuitabilityDTO(district, neighborhoodScore, commuteScore, servicesScore, servicesAvailable, commute, aiAnalysis);
    }











    //helper method

    // Calculate nearby services suitability based on user interests
    private Double calculateNeighborhoodServicesScore(Double latitude, Double longitude, HousingPreference preference) {

        Set<String> serviceTypes = new LinkedHashSet<>();

        serviceTypes.add("supermarket");
        serviceTypes.add("pharmacy");
        serviceTypes.add("hospital");

        serviceTypes.addAll(PlaceCategories.normalize(preference.getInterests()));

        try {
            int availableCategories = 0;

            for (String type : serviceTypes) {
                GooglePlacesResponseDTO nearby = placePreferenceService.getNearbyServices(latitude, longitude, type, 2000.0);

                if (nearby == null) {
                    throw new IllegalStateException("Nearby services response is unavailable");
                }

                boolean found = nearby.places() != null && nearby.places().stream().anyMatch(place -> type.equals(place.primaryType()) || (place.types() != null && place.types().contains(type)));

                if (found) {
                    availableCategories++;
                }
            }

            double score = availableCategories *
                    (100.0 / serviceTypes.size());

            return Math.round(score * 100.0) / 100.0;

        } catch (RuntimeException e) {
            // Continue with commute data if the places provider fails
            return null;
        }
    }



    // Calculate scores using existing property data
    private PropertyMatchResponseDTO calculateScore(Integer userId, PropertyDTO property, HousingPreference preference, RecommendationWeightsDTO weights, boolean[] placesAvailable) {

        if (property == null || property.getLatitude() == null ||
                property.getLongitude() == null || property.getPrice() == null || property.getPrice() <= 0) {
            throw new ApiException("Property has insufficient data for matching");
        }

        if (preference.getMaxBudget() == null || preference.getMaxBudget().doubleValue() <= 0) {
            throw new ApiException("Housing budget is invalid");
        }

        // Default weights
        int housingWeight = 40;
        int commuteWeight = 40;
        int servicesWeight = 20;

        if (weights != null) {
            if (weights.housingWeight() == null || weights.commuteWeight() == null || weights.servicesWeight() == null) {
                throw new ApiException("All recommendation weights are required");
            }

            housingWeight = weights.housingWeight();
            commuteWeight = weights.commuteWeight();
            servicesWeight = weights.servicesWeight();

            if (housingWeight < 0 || commuteWeight < 0 || servicesWeight < 0 || housingWeight > 100 || commuteWeight > 100 ||
                    servicesWeight > 100 || housingWeight + commuteWeight + servicesWeight != 100) {
                throw new ApiException("Recommendation weights must total 100");
            }
        }

        // Calculate housing score
        double budget = preference.getMaxBudget().doubleValue();

        double budgetScore = property.getPrice() <= budget
                ? 100.0
                : (budget / property.getPrice()) * 100.0;

        double housingScore = budgetScore * 0.50;

        if (property.getPropertyType() != null && property.getPropertyType().equalsIgnoreCase(preference.getPropertyType())) {
            housingScore += 20;
        }

        if (property.getListingType() != null && property.getListingType().equalsIgnoreCase(preference.getListingType())) {
            housingScore += 15;
        }

        if (property.getCity() != null && property.getCity().equalsIgnoreCase(preference.getCity())) {
            housingScore += 10;
        }

        if (preference.getDistrict() == null || preference.getDistrict().isBlank() ||
                (property.getNeighborhood() != null && property.getNeighborhood().equalsIgnoreCase(preference.getDistrict()))) {
            housingScore += 5;
        }
        // Adjust housing suitability based on household size and bedrooms
        Integer occupantsCount = preference.getOccupantsCount();
        Integer bedrooms = property.getBedrooms();

        if (occupantsCount != null && occupantsCount > 0 && bedrooms != null && bedrooms > 0) {

            int recommendedBedrooms = (int) Math.ceil(occupantsCount / 2.0);

            if (bedrooms < recommendedBedrooms) {
                housingScore = Math.max(0, housingScore - 10);
            }
        }

        // Commute analysis is optional when the user has no important locations.
        Double commuteScore = null;

        if (!placePreferenceRepository.findPlacePreferencesByUser_Id(userId).isEmpty()) {
            CommuteSummaryResponseDTO commute = placePreferenceService.getCommuteAnalysis(userId, property.getLatitude(), property.getLongitude());

            commuteScore = commute.commuteScore();
        }

        // Basic service categories
        Set<String> serviceTypes = new LinkedHashSet<>();
        serviceTypes.add("supermarket");
        serviceTypes.add("pharmacy");
        serviceTypes.add("hospital");

        // Housing interests already use the supported Google Places category identifiers.
        serviceTypes.addAll(PlaceCategories.normalize(preference.getInterests()));

        // Null means nearby services could not be verified
        Double servicesScore = null;

        if (placesAvailable[0]) {
            try {
                int availableCategories = 0;

                for (String type : serviceTypes) {
                    GooglePlacesResponseDTO nearby = placePreferenceService.getNearbyServices(property.getLatitude(), property.getLongitude(), type, 2000.0);

                    if (nearby == null || nearby.places() == null) {
                        throw new IllegalStateException("Nearby services response is unavailable");
                    }

                    boolean found = nearby.places().stream().anyMatch(place -> type.equals(place.primaryType()) || (place.types() != null && place.types().contains(type)));

                    if (found) {
                        availableCategories++;
                    }
                }

                servicesScore = availableCategories * (100.0 / serviceTypes.size());

            } catch (RuntimeException e) {
                // Do not stop recommendations if Google Places fails
                placesAvailable[0] = false;
                servicesScore = null;
            }
        }

        // Redistribute weights across available factors only.
        double weightedSum = housingScore * housingWeight;
        int totalWeight = housingWeight;

        if (commuteScore != null) {
            weightedSum += commuteScore * commuteWeight;
            totalWeight += commuteWeight;
        }

        if (servicesScore != null) {
            weightedSum += servicesScore * servicesWeight;
            totalWeight += servicesWeight;
        }

        double matchScore = totalWeight == 0
                ? housingScore
                : weightedSum / totalWeight;

        // Round calculated scores
        housingScore = Math.round(housingScore * 100.0) / 100.0;

        if (commuteScore != null) {
            commuteScore = Math.round(commuteScore * 100.0) / 100.0;
        }

        matchScore = Math.round(matchScore * 100.0) / 100.0;

        if (servicesScore != null) {
            servicesScore = Math.round(servicesScore * 100.0) / 100.0;
        }

        return new PropertyMatchResponseDTO(property.getExternalId(), property.getSource(), property.getTitle(), matchScore, housingScore, commuteScore, servicesScore);
    }


}
