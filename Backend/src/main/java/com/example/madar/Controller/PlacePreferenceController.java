package com.example.madar.Controller;

import com.example.madar.Security.CurrentUserAccess;
import com.example.madar.Security.ResourceOwnershipAccess;
import com.example.madar.DTO.In.PlacePreference.PlacePreferenceRequestDTO;

import com.example.madar.Api.ApiResponse;
import com.example.madar.DTO.Out.Commute.CommuteSummaryResponseDTO;
import com.example.madar.DTO.Out.GooglePlaces.GooglePlacesResponseDTO;
import com.example.madar.DTO.Out.PlacePreference.PlacePreferenceSummaryDTO;
import com.example.madar.Service.PlacePreferenceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/place-preference")
@RequiredArgsConstructor
public class PlacePreferenceController {

    private final CurrentUserAccess currentUserAccess;
    private final ResourceOwnershipAccess resourceOwnershipAccess;
    private final PlacePreferenceService placePreferenceService;

    //get my places
    @GetMapping("/me")
    public ResponseEntity<?> getMyPlaces(){
        Integer userId = currentUserAccess.getCurrentUserId();

        return ResponseEntity.status(200).body(placePreferenceService.getMyPlaces(userId));
    }

    //add place
    @PostMapping("/me")
    public ResponseEntity<?> addPlace(@RequestBody @Valid PlacePreferenceRequestDTO placePreference){
        Integer userId = currentUserAccess.getCurrentUserId();

        placePreferenceService.addPlace(userId, placePreference.toEntity());
        return ResponseEntity.status(200).body(new ApiResponse("Place added successfully"));
    }

    //update place
    @PutMapping("/me/{placeId}")
    public ResponseEntity<?> updatePlace(@PathVariable Integer placeId, @RequestBody @Valid PlacePreferenceRequestDTO placePreference){
        Integer userId = currentUserAccess.getCurrentUserId();
        resourceOwnershipAccess.requirePlace(placeId);

        placePreferenceService.updatePlace(userId, placeId, placePreference.toEntity());
        return ResponseEntity.status(200).body(new ApiResponse("Place updated successfully"));
    }

    //delete place
    @DeleteMapping("/me/{placeId}")
    public ResponseEntity<?> deletePlace(@PathVariable Integer placeId){
        Integer userId = currentUserAccess.getCurrentUserId();
        resourceOwnershipAccess.requirePlace(placeId);

        placePreferenceService.deletePlace(userId, placeId);
        return ResponseEntity.status(200).body(new ApiResponse("Place deleted successfully"));
    }

    //update importance only
    @PatchMapping("/me/{placeId}/importance/{importance}")
    public ResponseEntity<?> updateImportance(@PathVariable Integer placeId, @PathVariable Integer importance){
        Integer userId = currentUserAccess.getCurrentUserId();
        resourceOwnershipAccess.requirePlace(placeId);

        placePreferenceService.updateImportance(userId, placeId, importance);
        return ResponseEntity.status(200).body(new ApiResponse("Place importance updated successfully"));
    }


    // Get commute details using credits
    @GetMapping("/me/commutes")
    public ResponseEntity<CommuteSummaryResponseDTO> calculateCommutes(@RequestParam Double latitude, @RequestParam Double longitude) {

        Integer userId = currentUserAccess.getCurrentUserId();

        return ResponseEntity.status(200).body(placePreferenceService.getCommuteAnalysisWithCredits(userId, latitude, longitude));
    }


    // Search for nearby services around a selected location
    @GetMapping("/nearby-services")
    public ResponseEntity<GooglePlacesResponseDTO> getNearbyServices(@RequestParam Double latitude, @RequestParam Double longitude, @RequestParam String placeType, @RequestParam(defaultValue = "2000") Double radiusMeters) {

        GooglePlacesResponseDTO response = placePreferenceService.getNearbyServices(latitude, longitude, placeType, radiusMeters);

        return ResponseEntity.status(200).body(response);
    }

    @GetMapping("/me/summary")
    public ResponseEntity<PlacePreferenceSummaryDTO> getPlacesSummary() {
        Integer userId = currentUserAccess.getCurrentUserId();


        return ResponseEntity.status(200).body(placePreferenceService.getPlacesSummary(userId));
    }









}