package com.example.madar.Controller;

import com.example.madar.Security.CurrentUserAccess;
import com.example.madar.Security.ResourceOwnershipAccess;
import com.example.madar.DTO.In.SavedProperty.SavedPropertyRequestDTO;

import com.example.madar.Api.ApiResponse;
import com.example.madar.DTO.Out.SavedProperty.SavedPropertySummaryDTO;
import com.example.madar.Service.SavedPropertyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/saved-property")
@RequiredArgsConstructor
public class SavedPropertyController {
    private final CurrentUserAccess currentUserAccess;
    private final ResourceOwnershipAccess resourceOwnershipAccess;
    private final SavedPropertyService savedPropertyService;


    //get my saved properties (live data, both languages)
    @GetMapping("/me")
    public ResponseEntity<?> getMySavedProperty(@RequestParam(defaultValue = "ar") String lang){
        Integer userId = currentUserAccess.getCurrentUserId();

        return ResponseEntity.status(200).body(savedPropertyService.getMySavedProperty(userId, lang));
    }

    //add saved property
    @PostMapping("/me")
    public ResponseEntity<?>addSavedProperty(@RequestBody @Valid SavedPropertyRequestDTO savedProperty){
        Integer userId = currentUserAccess.getCurrentUserId();

        savedPropertyService.addSavedProperty(userId, savedProperty.toEntity());
        return ResponseEntity.status(200).body(new ApiResponse("Property saved successfully"));
    }


    //delete saved property
    @DeleteMapping("/me/{savedPropertyId}")
    public ResponseEntity<?>deleteSavedProperty(@PathVariable Integer savedPropertyId){
        Integer userId = currentUserAccess.getCurrentUserId();
        resourceOwnershipAccess.requireSavedProperty(savedPropertyId);

        savedPropertyService.deleteSavedProperty(userId, savedPropertyId);
        return ResponseEntity.status(200).body(new ApiResponse("Saved property deleted successfully"));
    }

    @GetMapping("/me/check")
    public ResponseEntity<?> isPropertySaved(@RequestParam String source, @RequestParam String externalId) {
        Integer userId = currentUserAccess.getCurrentUserId();


        return ResponseEntity.status(200).body(savedPropertyService.isPropertySaved(userId, source, externalId));
    }

    @GetMapping("/me/summary")
    public ResponseEntity<SavedPropertySummaryDTO> getSavedPropertiesSummary() {
        Integer userId = currentUserAccess.getCurrentUserId();


        return ResponseEntity.status(200).body(savedPropertyService.getSavedPropertiesSummary(userId));
    }
}