package com.example.madar.Controller;

import com.example.madar.Security.CurrentUserAccess;



import com.example.madar.Api.ApiResponse;
import com.example.madar.DTO.In.Recommendation.RecommendationWeightsDTO;
import com.example.madar.DTO.Out.Recommendation.*;
import com.example.madar.Service.RecommendationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/recommendations")
public class RecommendationController {

    private final CurrentUserAccess currentUserAccess;
    private final RecommendationService recommendationService;

    // Calculate a property's match score for a user
    @PostMapping("/me/match-score")
    public ResponseEntity<PropertyMatchResponseDTO> calculatePropertyMatch(@RequestParam String source, @RequestParam String externalId, @RequestBody(required = false) @Valid RecommendationWeightsDTO weights) {
        Integer userId = currentUserAccess.getCurrentUserId();


        return ResponseEntity.status(200).body(recommendationService.calculatePropertyMatch(userId, source, externalId, weights));
    }


    // Generate the top 10 personalized property recommendations
    @PostMapping("/me/smart")
    public ResponseEntity<SmartRecommendationResponseDTO> getSmartRecommendations(@RequestBody(required = false) @Valid RecommendationWeightsDTO weights,@RequestHeader(value = "Accept-Language", defaultValue = "ar") String language) {
        Integer userId = currentUserAccess.getCurrentUserId();


        return ResponseEntity.status(200).body(recommendationService.getSmartRecommendationsWithCredits(userId, weights, language));
    }

    // Evaluate a neighborhood for the current user's lifestyle and commutes
    @GetMapping("/me/neighborhood-suitability")
    public ResponseEntity<NeighborhoodSuitabilityDTO> getNeighborhoodSuitability(@RequestParam Double latitude, @RequestParam Double longitude, @RequestParam(required = false) String district,@RequestHeader(value = "Accept-Language", defaultValue = "ar") String language) {
        Integer userId = currentUserAccess.getCurrentUserId();

        return ResponseEntity.status(200).body(recommendationService.getNeighborhoodSuitability(userId, latitude, longitude, district,language));
    }


    @GetMapping("/me/compare-neighborhoods")
    public ResponseEntity<NeighborhoodComparisonDTO> compareNeighborhoods(
            @RequestParam Double firstLatitude, @RequestParam Double firstLongitude, @RequestParam String firstDistrict,
            @RequestParam Double secondLatitude, @RequestParam Double secondLongitude, @RequestParam String secondDistrict, @RequestHeader(value = "Accept-Language", defaultValue = "ar") String language) {
        Integer userId = currentUserAccess.getCurrentUserId();


        return ResponseEntity.status(200).body(recommendationService.compareNeighborhoods(userId, firstLatitude, firstLongitude, firstDistrict, secondLatitude, secondLongitude, secondDistrict, language));
    }


    @PostMapping("/me/suggest-neighborhoods")
    public ResponseEntity<NeighborhoodSuggestionsResponseDTO> suggestNeighborhoodsWithWeights(@RequestBody(required = false) @Valid RecommendationWeightsDTO weights, @RequestHeader(value = "Accept-Language", defaultValue = "ar") String language) {
        Integer userId = currentUserAccess.getCurrentUserId();


        return ResponseEntity.status(200).body(recommendationService.suggestNeighborhoods(userId, language, weights));
    }


    @PutMapping("/me/selected-neighborhood")
    public ResponseEntity<ApiResponse> selectNeighborhood(@RequestBody Map<String, String> request) {
        Integer userId = currentUserAccess.getCurrentUserId();


        recommendationService.selectNeighborhood(userId, request.get("district"));

        return ResponseEntity.status(200).body(new ApiResponse("Neighborhood selected successfully"));
    }


    @PostMapping("/me/selected-neighborhood-properties")
    public ResponseEntity<SmartRecommendationResponseDTO> getSelectedNeighborhoodRecommendations(@RequestBody(required = false) @Valid RecommendationWeightsDTO weights, @RequestHeader(value = "Accept-Language", defaultValue = "ar") String language) {
        Integer userId = currentUserAccess.getCurrentUserId();


        return ResponseEntity.status(200).body(recommendationService.getSelectedNeighborhoodRecommendationsWithCredits(userId, weights, language));
    }



}
