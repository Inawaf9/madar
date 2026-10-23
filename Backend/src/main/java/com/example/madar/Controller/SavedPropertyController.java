package com.example.madar.Controller;

import com.example.madar.Api.ApiResponse;
import com.example.madar.DTO.Out.SavedProperty.SavedPropertySummaryDTO;
import com.example.madar.Model.SavedProperty;
import com.example.madar.Service.SavedPropertyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/saved-property")
@RequiredArgsConstructor
public class SavedPropertyController {
    private final SavedPropertyService savedPropertyService;


    //get my saved properties (live data, both languages)
    @GetMapping("/get/{userId}")
    public ResponseEntity<?> getMySavedProperty(@PathVariable Integer userId, @RequestParam(defaultValue = "ar") String lang){
        return ResponseEntity.status(200).body(savedPropertyService.getMySavedProperty(userId, lang));
    }

    //add saved property
    @PostMapping("/add/{userId}")
    public ResponseEntity<?>addSavedProperty(@PathVariable Integer userId, @RequestBody @Valid SavedProperty savedProperty){
        savedPropertyService.addSavedProperty(userId, savedProperty);
        return ResponseEntity.status(200).body(new ApiResponse("Property saved successfully"));
    }


    //delete saved property
    @DeleteMapping("/delete/{userId}/{savedPropertyId}")
    public ResponseEntity<?>deleteSavedProperty(@PathVariable Integer userId, @PathVariable Integer savedPropertyId){
        savedPropertyService.deleteSavedProperty(userId, savedPropertyId);
        return ResponseEntity.status(200).body(new ApiResponse("Saved property deleted successfully"));
    }

    @GetMapping("/check/{userId}")
    public ResponseEntity<Boolean> isPropertySaved(@PathVariable Integer userId, @RequestParam String source, @RequestParam String externalId) {

        return ResponseEntity.status(200).body(savedPropertyService.isPropertySaved(userId, source, externalId));
    }

    @GetMapping("/summary/{userId}")
    public ResponseEntity<SavedPropertySummaryDTO> getSavedPropertiesSummary(@PathVariable Integer userId) {

        return ResponseEntity.status(200).body(savedPropertyService.getSavedPropertiesSummary(userId));
    }
}