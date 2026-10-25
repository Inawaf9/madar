package com.example.madar.Controller;

import com.example.madar.Security.CurrentUserAccess;
import com.example.madar.Security.ResourceOwnershipAccess;
import com.example.madar.DTO.In.LifestyleInterest.LifestyleInterestRequestDTO;

import com.example.madar.Api.ApiResponse;
import com.example.madar.Model.LifestyleInterest;
import com.example.madar.Service.LifestyleInterestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/lifestyle-interest")
@RequiredArgsConstructor
public class LifestyleInterestController {

    private final CurrentUserAccess currentUserAccess;
    private final ResourceOwnershipAccess resourceOwnershipAccess;
    private final LifestyleInterestService lifestyleInterestService;

    // GET USER INTERESTS
    @GetMapping("/me")
    public ResponseEntity<List<LifestyleInterest>> getUserLifestyleInterests() {
        Integer userId = currentUserAccess.getCurrentUserId();


        return ResponseEntity.status(200).body(lifestyleInterestService.getUserLifestyleInterests(userId));
    }

    // ADD INTEREST
    @PostMapping("/me")
    public ResponseEntity<ApiResponse> addLifestyleInterest(@Valid @RequestBody LifestyleInterestRequestDTO interest) {
        Integer userId = currentUserAccess.getCurrentUserId();

        lifestyleInterestService.addLifestyleInterest(userId, interest.toEntity());
        return ResponseEntity.status(200).body(new ApiResponse("Lifestyle interest added successfully"));
    }

    // UPDATE INTEREST
    @PutMapping("/me/{interestId}")
    public ResponseEntity<ApiResponse> updateLifestyleInterest(@PathVariable Integer interestId, @Valid @RequestBody LifestyleInterestRequestDTO updatedInterest) {
        Integer userId = currentUserAccess.getCurrentUserId();
        resourceOwnershipAccess.requireInterest(interestId);


        lifestyleInterestService.updateLifestyleInterest(userId, interestId, updatedInterest.toEntity());

        return ResponseEntity.status(200).body(new ApiResponse("Lifestyle interest updated successfully"));
    }

    // DELETE INTEREST
    @DeleteMapping("/me/{interestId}")
    public ResponseEntity<ApiResponse> deleteLifestyleInterest(@PathVariable Integer interestId) {
        Integer userId = currentUserAccess.getCurrentUserId();
        resourceOwnershipAccess.requireInterest(interestId);


        lifestyleInterestService.deleteLifestyleInterest(userId, interestId);
        return ResponseEntity.status(200).body(new ApiResponse("Lifestyle interest deleted successfully"));
    }
}
