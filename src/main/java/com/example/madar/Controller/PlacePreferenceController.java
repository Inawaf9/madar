package com.example.madar.Controller;

import com.example.madar.Api.ApiResponse;
import com.example.madar.Model.PlacePreference;
import com.example.madar.Service.PlacePreferenceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/place-preference")
@RequiredArgsConstructor
public class PlacePreferenceController {

    private final PlacePreferenceService placePreferenceService;

    //get my places
    @GetMapping("/get/{userId}")
    public ResponseEntity<?> getMyPlaces(@PathVariable Integer userId){
        return ResponseEntity.status(200).body(placePreferenceService.getMyPlaces(userId));
    }

    //add place
    @PostMapping("/add/{userId}")
    public ResponseEntity<?> addPlace(@PathVariable Integer userId, @RequestBody @Valid PlacePreference placePreference){
        placePreferenceService.addPlace(userId, placePreference);
        return ResponseEntity.status(200).body(new ApiResponse("Place added successfully"));
    }

    //update place
    @PutMapping("/update/{userId}/{placeId}")
    public ResponseEntity<?> updatePlace(@PathVariable Integer userId, @PathVariable Integer placeId, @RequestBody @Valid PlacePreference placePreference){
        placePreferenceService.updatePlace(userId, placeId, placePreference);
        return ResponseEntity.status(200).body(new ApiResponse("Place updated successfully"));
    }

    //delete place
    @DeleteMapping("/delete/{userId}/{placeId}")
    public ResponseEntity<?> deletePlace(@PathVariable Integer userId, @PathVariable Integer placeId){
        placePreferenceService.deletePlace(userId, placeId);
        return ResponseEntity.status(200).body(new ApiResponse("Place deleted successfully"));
    }

    //update importance only
    @PatchMapping("/importance/{userId}/{placeId}/{importance}")
    public ResponseEntity<?> updateImportance(@PathVariable Integer userId, @PathVariable Integer placeId, @PathVariable Integer importance){
        placePreferenceService.updateImportance(userId, placeId, importance);
        return ResponseEntity.status(200).body(new ApiResponse("Place importance updated successfully"));
    }
}