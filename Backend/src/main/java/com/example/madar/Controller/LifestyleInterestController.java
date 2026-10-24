package com.example.madar.Controller;

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

    private final LifestyleInterestService lifestyleInterestService;

    // GET USER INTERESTS
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<LifestyleInterest>> getUserLifestyleInterests(@PathVariable Integer userId) {

        return ResponseEntity.status(200).body(lifestyleInterestService.getUserLifestyleInterests(userId));
    }

    // ADD INTEREST
    @PostMapping("/add/{userId}")
    public ResponseEntity<ApiResponse> addLifestyleInterest(@PathVariable Integer userId, @Valid @RequestBody LifestyleInterest interest) {

        lifestyleInterestService.addLifestyleInterest(userId, interest);
        return ResponseEntity.status(200).body(new ApiResponse("Lifestyle interest added successfully"));
    }

    // UPDATE INTEREST
    @PutMapping("/update/{userId}/{interestId}")
    public ResponseEntity<ApiResponse> updateLifestyleInterest(@PathVariable Integer userId, @PathVariable Integer interestId, @Valid @RequestBody LifestyleInterest updatedInterest) {

        lifestyleInterestService.updateLifestyleInterest(userId, interestId, updatedInterest);

        return ResponseEntity.status(200).body(new ApiResponse("Lifestyle interest updated successfully"));
    }

    // DELETE INTEREST
    @DeleteMapping("/delete/{userId}/{interestId}")
    public ResponseEntity<ApiResponse> deleteLifestyleInterest(@PathVariable Integer userId, @PathVariable Integer interestId) {

        lifestyleInterestService.deleteLifestyleInterest(userId, interestId);
        return ResponseEntity.status(200).body(new ApiResponse("Lifestyle interest deleted successfully"));
    }
}
