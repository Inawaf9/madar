package com.example.madar.Controller;



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

    private final RecommendationService recommendationService;

    // Calculate a property's match score for a user
    @PostMapping("/match-score/{userId}")
    public ResponseEntity<PropertyMatchResponseDTO> calculatePropertyMatch(@PathVariable Integer userId, @RequestParam String source, @RequestParam String externalId, @RequestBody(required = false) @Valid RecommendationWeightsDTO weights) {

        return ResponseEntity.status(200).body(recommendationService.calculatePropertyMatch(userId, source, externalId, weights));
    }


    // Generate the top 10 personalized property recommendations
    @PostMapping("/smart/{userId}")
    public ResponseEntity<SmartRecommendationResponseDTO> getSmartRecommendations(@PathVariable Integer userId, @RequestBody(required = false) @Valid RecommendationWeightsDTO weights,@RequestHeader(value = "Accept-Language", defaultValue = "ar") String language) {

        return ResponseEntity.status(200).body(recommendationService.getSmartRecommendations(userId, weights,language));
    }

    // Evaluate a neighborhood for the current user's lifestyle and commutes
    @GetMapping("/neighborhood-suitability/{userId}")
    public ResponseEntity<NeighborhoodSuitabilityDTO> getNeighborhoodSuitability(@PathVariable Integer userId, @RequestParam Double latitude, @RequestParam Double longitude, @RequestParam(required = false) String district,@RequestHeader(value = "Accept-Language", defaultValue = "ar") String language) {
        return ResponseEntity.status(200).body(recommendationService.getNeighborhoodSuitability(userId, latitude, longitude, district,language));
    }


    @GetMapping("/compare-neighborhoods/{userId}")
    public ResponseEntity<NeighborhoodComparisonDTO> compareNeighborhoods(
            @PathVariable Integer userId, @RequestParam Double firstLatitude, @RequestParam Double firstLongitude, @RequestParam String firstDistrict,
            @RequestParam Double secondLatitude, @RequestParam Double secondLongitude, @RequestParam String secondDistrict, @RequestHeader(value = "Accept-Language", defaultValue = "ar") String language) {

        return ResponseEntity.status(200).body(recommendationService.compareNeighborhoods(userId, firstLatitude, firstLongitude, firstDistrict, secondLatitude, secondLongitude, secondDistrict, language));
    }


    @PostMapping("/suggest-neighborhoods/{userId}")
    public ResponseEntity<NeighborhoodSuggestionsResponseDTO> suggestNeighborhoodsWithWeights(@PathVariable Integer userId, @RequestBody(required = false) @Valid RecommendationWeightsDTO weights, @RequestHeader(value = "Accept-Language", defaultValue = "ar") String language) {

        return ResponseEntity.status(200).body(recommendationService.suggestNeighborhoods(userId, language, weights));
    }


    @PutMapping("/select-neighborhood/{userId}")
    public ResponseEntity<ApiResponse> selectNeighborhood(@PathVariable Integer userId, @RequestBody Map<String, String> request) {

        recommendationService.selectNeighborhood(userId, request.get("district"));

        return ResponseEntity.status(200).body(new ApiResponse("Neighborhood selected successfully"));
    }


    @PostMapping("/selected-neighborhood-properties/{userId}")
    public ResponseEntity<SmartRecommendationResponseDTO> getSelectedNeighborhoodRecommendations(@PathVariable Integer userId, @RequestBody(required = false) @Valid RecommendationWeightsDTO weights, @RequestHeader(value = "Accept-Language", defaultValue = "ar") String language) {

        return ResponseEntity.status(200).body(recommendationService.getSelectedNeighborhoodRecommendations(userId, weights, language));
    }



}
