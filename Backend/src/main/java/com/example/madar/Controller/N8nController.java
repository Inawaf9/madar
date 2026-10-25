package com.example.madar.Controller;

import com.example.madar.Service.N8nService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.madar.Service.InternalApiKeyService;
import com.example.madar.DTO.Out.Recommendation.SmartRecommendationResponseDTO;

@RestController
@RequestMapping("/api/v1/n8n")
@RequiredArgsConstructor
public class N8nController {

    private final N8nService n8nService;
    private final InternalApiKeyService internalApiKeyService;


    //called by n8n every day: finds price changes of saved properties
    @PostMapping("/price-changes")
    public ResponseEntity<?> priceChanges(@RequestHeader(value = "X-Madar-Internal-Key", required = false) String apiKey) {

        internalApiKeyService.validate(apiKey);

        return ResponseEntity.ok(n8nService.checkSavedPrices());
    }

    @GetMapping("/weekly-report/recipients")
    public ResponseEntity<?> getWeeklyReportRecipients(@RequestHeader(value = "X-Madar-Internal-Key", required = false) String apiKey) {

        internalApiKeyService.validate(apiKey);

        return ResponseEntity.ok(n8nService.getWeeklyReportRecipients());
    }

    @PostMapping("/weekly-report/recommendations/{userId}")
    public ResponseEntity<SmartRecommendationResponseDTO> getWeeklyRecommendations(@RequestHeader(value = "X-Madar-Internal-Key", required = false) String apiKey,
                                                                                   @PathVariable Integer userId,
                                                                                   @RequestHeader(value = "Accept-Language", defaultValue = "ar") String language) {

        internalApiKeyService.validate(apiKey);

        return ResponseEntity.ok(n8nService.getWeeklyRecommendations(userId, language));
    }
}