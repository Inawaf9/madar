package com.example.madar.Controller;



import com.example.madar.DTO.In.Recommendation.RecommendationWeightsDTO;
import com.example.madar.DTO.Out.Recommendation.NeighborhoodSuitabilityDTO;
import com.example.madar.DTO.Out.Recommendation.PropertyMatchResponseDTO;
import com.example.madar.DTO.Out.Recommendation.SmartRecommendationResponseDTO;
import com.example.madar.Service.RecommendationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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


}
