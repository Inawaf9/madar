package com.example.madar.Controller;

import com.example.madar.Api.ApiResponse;
import com.example.madar.DTO.Out.Commute.CommuteSummaryResponseDTO;
import com.example.madar.DTO.Out.GooglePlaces.GooglePlacesResponseDTO;
import com.example.madar.DTO.Out.PlacePreference.PlacePreferenceSummaryDTO;
import com.example.madar.Model.PlacePreference;
import com.example.madar.Service.PlacePreferenceService;
import com.example.madar.Service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/place-preference")
@RequiredArgsConstructor
public class PlacePreferenceController {

    private final PlacePreferenceService placePreferenceService;
    private final PaymentService paymentService;

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


    // Get commute details and estimated weekly travel time
    @GetMapping("/calculate-commutes/{userId}")
    public ResponseEntity<CommuteSummaryResponseDTO> calculateCommutes(@PathVariable Integer userId, @RequestParam Double latitude, @RequestParam Double longitude) {
        paymentService.requireCommuteAccess(userId);
        CommuteSummaryResponseDTO response = placePreferenceService.getCommuteAnalysis(userId, latitude, longitude);
        return ResponseEntity.status(200).body(response);
    }


    // Search for nearby services around a selected location
    @GetMapping("/nearby-services")
    public ResponseEntity<GooglePlacesResponseDTO> getNearbyServices(@RequestParam Double latitude, @RequestParam Double longitude, @RequestParam String placeType, @RequestParam(defaultValue = "2000") Double radiusMeters) {

        GooglePlacesResponseDTO response = placePreferenceService.getNearbyServices(latitude, longitude, placeType, radiusMeters);

        return ResponseEntity.status(200).body(response);
    }

    @GetMapping("/summary/{userId}")
    public ResponseEntity<PlacePreferenceSummaryDTO> getPlacesSummary(@PathVariable Integer userId) {

        return ResponseEntity.status(200).body(placePreferenceService.getPlacesSummary(userId));
    }









}