package com.example.madar.Controller;

import com.example.madar.Security.CurrentUserAccess;
import com.example.madar.Security.ResourceOwnershipAccess;
import com.example.madar.DTO.In.HousingPreference.HousingPreferenceRequestDTO;



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

    private final CurrentUserAccess currentUserAccess;
    private final ResourceOwnershipAccess resourceOwnershipAccess;
    private final HousingPreferenceService housingPreferenceService;


    // GET ALL
    @GetMapping("/get")
    public ResponseEntity<List<HousingPreference>> getAllHousingPreferences() {
        currentUserAccess.requireAdmin();

        return ResponseEntity.status(200).body(housingPreferenceService.getAllHousingPreferences());
    }


    // GET BY USER ID
    @GetMapping("/me")
    public ResponseEntity<HousingPreference> getHousingPreferenceByUserId() {
        Integer userId = currentUserAccess.getCurrentUserId();

        return ResponseEntity.status(200).body(housingPreferenceService.getHousingPreferenceByUserId(userId));
    }


    // ADD
    @PostMapping("/me")
    public ResponseEntity<ApiResponse> addHousingPreference(@RequestBody @Valid HousingPreferenceRequestDTO housingPreference) {
        Integer userId = currentUserAccess.getCurrentUserId();
        housingPreferenceService.addHousingPreference(userId, housingPreference.toEntity());
        return ResponseEntity.status(201).body(new ApiResponse("Housing preference added successfully"));
    }


    // UPDATE
    @PutMapping("/me/{preferenceId}")
    public ResponseEntity<ApiResponse> updateHousingPreference(@PathVariable Integer preferenceId, @RequestBody @Valid HousingPreferenceRequestDTO updatedPreference) {
        Integer userId = currentUserAccess.getCurrentUserId();
        resourceOwnershipAccess.requireHousingPreference(preferenceId);

        housingPreferenceService.updateHousingPreference(userId, preferenceId, updatedPreference.toEntity());
        return ResponseEntity.status(200).body(new ApiResponse("Housing preference updated successfully"));
    }


    // DELETE
    @DeleteMapping("/me/{preferenceId}")
    public ResponseEntity<ApiResponse> deleteHousingPreference(@PathVariable Integer preferenceId) {
        Integer userId = currentUserAccess.getCurrentUserId();
        resourceOwnershipAccess.requireHousingPreference(preferenceId);

        housingPreferenceService.deleteHousingPreference(userId, preferenceId);
        return ResponseEntity.status(200).body(new ApiResponse("Housing preference deleted successfully"));
    }




}

