package com.example.madar.Controller;

import com.example.madar.Security.CurrentUserAccess;
import com.example.madar.Security.ResourceOwnershipAccess;
import com.example.madar.DTO.In.PropertyComparison.PropertyComparisonRequestDTO;



import com.example.madar.Api.ApiResponse;
import com.example.madar.DTO.Out.Recommendation.PropertyComparisonResultDTO;
import com.example.madar.Model.PropertyComparison;
import com.example.madar.Service.PropertyComparisonService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/property-comparison")
@RequiredArgsConstructor
public class PropertyComparisonController {

    private final CurrentUserAccess currentUserAccess;
    private final ResourceOwnershipAccess resourceOwnershipAccess;
    private final PropertyComparisonService comparisonService;


    // GET ALL
    @GetMapping("/get")
    public ResponseEntity<List<PropertyComparison>> getAllComparisons() {
        currentUserAccess.requireAdmin();

        return ResponseEntity.status(200).body(comparisonService.getAllComparisons());
    }


    // GET BY USER ID
    @GetMapping("/me")
    public ResponseEntity<List<PropertyComparison>> getComparisonsByUserId() {
        Integer userId = currentUserAccess.getCurrentUserId();

        return ResponseEntity.status(200).body(comparisonService.getComparisonsByUserId(userId));
    }


    // GET BY ID
    @GetMapping("/me/{comparisonId}")
    public ResponseEntity<PropertyComparison> getComparisonById(@PathVariable Integer comparisonId) {
        Integer userId = currentUserAccess.getCurrentUserId();
        resourceOwnershipAccess.requireComparison(comparisonId);

        return ResponseEntity.status(200).body(comparisonService.getComparisonById(userId, comparisonId));
    }


    // ADD
    @PostMapping("/me")
    public ResponseEntity<ApiResponse> addComparison(@RequestBody @Valid PropertyComparisonRequestDTO comparison) {
        Integer userId = currentUserAccess.getCurrentUserId();
        comparisonService.addComparison(userId, comparison.toEntity());
        return ResponseEntity.status(201).body(new ApiResponse("Comparison added successfully"));
    }


    // UPDATE
    @PutMapping("/me/{comparisonId}")
    public ResponseEntity<ApiResponse> updateComparison(@PathVariable Integer comparisonId, @RequestBody @Valid PropertyComparisonRequestDTO updatedComparison) {
        Integer userId = currentUserAccess.getCurrentUserId();
        resourceOwnershipAccess.requireComparison(comparisonId);


        comparisonService.updateComparison(userId, comparisonId, updatedComparison.toEntity());
        return ResponseEntity.status(200).body(new ApiResponse("Comparison updated successfully"));
    }


    // DELETE
    @DeleteMapping("/me/{comparisonId}")
    public ResponseEntity<ApiResponse> deleteComparison(@PathVariable Integer comparisonId) {
        Integer userId = currentUserAccess.getCurrentUserId();
        resourceOwnershipAccess.requireComparison(comparisonId);


        comparisonService.deleteComparison(userId, comparisonId);
        return ResponseEntity.status(200).body(new ApiResponse("Comparison deleted successfully"));
    }




    // Compare two properties without saving them
    @GetMapping("/me/compare-two/{firstSource}/{firstPropertyId}/{secondSource}/{secondPropertyId}")

    public ResponseEntity<?> compareTwoProperties(@PathVariable String firstSource, @PathVariable String firstPropertyId, @PathVariable String secondSource, @PathVariable String secondPropertyId
    ,@RequestHeader(value = "Accept-Language", defaultValue = "ar") String language) {
        Integer userId = currentUserAccess.getCurrentUserId();

        return ResponseEntity.status(200).body(comparisonService.compareTwoPropertiesWithCredits(userId, firstSource, firstPropertyId, secondSource, secondPropertyId, language));
    }



    // Compare selected saved properties with AI
    @GetMapping("/me/compare-multiple/{savedPropertyIds}")
    public ResponseEntity<PropertyComparisonResultDTO> compareMultipleProperties(@PathVariable List<Integer> savedPropertyIds,@RequestHeader(value = "Accept-Language", defaultValue = "ar") String language) {
        Integer userId = currentUserAccess.getCurrentUserId();
        resourceOwnershipAccess.requireSavedProperties(savedPropertyIds);


        return ResponseEntity.status(200).body(comparisonService.compareMultiplePropertiesWithCredits(userId, savedPropertyIds, language));
    }




}
