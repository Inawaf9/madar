package com.example.madar.Controller;



import com.example.madar.Api.ApiResponse;
import com.example.madar.Model.HousingPreference;
import com.example.madar.Service.HousingPreferenceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/housing-preference")
@RequiredArgsConstructor
public class HousingPreferenceController {

    private final HousingPreferenceService housingPreferenceService;


    // GET ALL
    @GetMapping("/get")
    public ResponseEntity<List<HousingPreference>> getAllHousingPreferences() {
        return ResponseEntity.status(200).body(housingPreferenceService.getAllHousingPreferences());
    }


    // GET BY USER ID
    @GetMapping("/get-by-user/{userId}")
    public ResponseEntity<HousingPreference> getHousingPreferenceByUserId(@PathVariable Integer userId) {
        return ResponseEntity.status(200).body(housingPreferenceService.getHousingPreferenceByUserId(userId));
    }


    // ADD
    @PostMapping("/add/{userId}")
    public ResponseEntity<ApiResponse> addHousingPreference(@PathVariable Integer userId, @RequestBody @Valid HousingPreference housingPreference) {
        housingPreferenceService.addHousingPreference(userId, housingPreference);
        return ResponseEntity.status(201).body(new ApiResponse("Housing preference added successfully"));
    }


    // UPDATE
    @PutMapping("/update/{userId}/{preferenceId}")
    public ResponseEntity<ApiResponse> updateHousingPreference(@PathVariable Integer userId, @PathVariable Integer preferenceId, @RequestBody @Valid HousingPreference updatedPreference) {
        housingPreferenceService.updateHousingPreference(userId, preferenceId, updatedPreference);
        return ResponseEntity.status(200).body(new ApiResponse("Housing preference updated successfully"));
    }


    // DELETE
    @DeleteMapping("/delete/{userId}/{preferenceId}")
    public ResponseEntity<ApiResponse> deleteHousingPreference(@PathVariable Integer userId, @PathVariable Integer preferenceId) {
        housingPreferenceService.deleteHousingPreference(userId, preferenceId);
        return ResponseEntity.status(200).body(new ApiResponse("Housing preference deleted successfully"));
    }




}

