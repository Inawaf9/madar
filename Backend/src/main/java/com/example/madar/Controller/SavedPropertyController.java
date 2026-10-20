package com.example.madar.Controller;

import com.example.madar.Api.ApiResponse;
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

    //get my saved properties
    @GetMapping("/get/{userId}")
    public ResponseEntity<?> getMySavedProperty(@PathVariable Integer userId){
        return ResponseEntity.status(200).body(savedPropertyService.getMySavedProperty(userId));
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
}