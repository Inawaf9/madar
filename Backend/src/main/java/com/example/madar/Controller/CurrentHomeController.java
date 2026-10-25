package com.example.madar.Controller;

import com.example.madar.Security.CurrentUserAccess;
import com.example.madar.Security.ResourceOwnershipAccess;
import com.example.madar.DTO.In.CurrentHome.CurrentHomeRequestDTO;


import com.example.madar.Api.ApiResponse;
import com.example.madar.DTO.Out.CurrentHome.CurrentHomeStatusDTO;
import com.example.madar.Model.CurrentHome;
import com.example.madar.Service.CurrentHomeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/current-home")
@RequiredArgsConstructor
public class CurrentHomeController {

    private final CurrentUserAccess currentUserAccess;
    private final ResourceOwnershipAccess resourceOwnershipAccess;
    private final CurrentHomeService currentHomeService;


    // GET ALL
    @GetMapping("/get")
    public ResponseEntity<List<CurrentHome>> getAllCurrentHomes() {
        currentUserAccess.requireAdmin();

        return ResponseEntity.status(200).body(currentHomeService.getAllCurrentHomes());
    }


    // GET CURRENT HOME BY USER ID
    @GetMapping("/me")
    public ResponseEntity<CurrentHome> getCurrentHomeByUserId() {
        Integer userId = currentUserAccess.getCurrentUserId();

        return ResponseEntity.status(200).body(currentHomeService.getCurrentHomeByUserId(userId));
    }


    // ADD CURRENT HOME
    @PostMapping("/me")
    public ResponseEntity<ApiResponse> addCurrentHome(
                                                      @RequestBody @Valid CurrentHomeRequestDTO currentHome) {
        Integer userId = currentUserAccess.getCurrentUserId();
        currentHomeService.addCurrentHome(userId, currentHome.toEntity());
        return ResponseEntity.status(201).body(new ApiResponse("Current home added successfully"));
    }


    // UPDATE CURRENT HOME
    @PutMapping("/me/{homeId}")
    public ResponseEntity<ApiResponse> updateCurrentHome(@PathVariable Integer homeId, @RequestBody @Valid CurrentHomeRequestDTO updatedHome) {
        Integer userId = currentUserAccess.getCurrentUserId();
        resourceOwnershipAccess.requireHome(homeId);

        currentHomeService.updateCurrentHome(userId, homeId, updatedHome.toEntity());
        return ResponseEntity.status(200).body(new ApiResponse("Current home updated successfully"));
    }


    // DELETE CURRENT HOME
    @DeleteMapping("/me/{homeId}")
    public ResponseEntity<ApiResponse> deleteCurrentHome(@PathVariable Integer homeId) {
        Integer userId = currentUserAccess.getCurrentUserId();
        resourceOwnershipAccess.requireHome(homeId);

        currentHomeService.deleteCurrentHome(userId, homeId);
        return ResponseEntity.status(200).body(new ApiResponse("Current home deleted successfully"));
    }
    @PostMapping("/me/confirm-move")
    public ResponseEntity<?> confirmMove() {
        Integer userId = currentUserAccess.getCurrentUserId();

        currentHomeService.confirmMove(userId);
        return ResponseEntity.status(200).body(new ApiResponse("Move confirmed successfully"));
    }

    @GetMapping("/me/neighborhood")
    public ResponseEntity<?> getNeighborhood() {
        Integer userId = currentUserAccess.getCurrentUserId();

        return ResponseEntity.status(200).body(currentHomeService.getNeighborhood(userId));
    }

    @GetMapping("/me/nearby-by-category")
    public ResponseEntity<?> getNearbyByCategory(
                                                @RequestParam String category, @RequestParam Double radius) {
        Integer userId = currentUserAccess.getCurrentUserId();

        return ResponseEntity.status(200).body(currentHomeService.getNearbyByCategory(userId, category, radius));
    }

    @GetMapping("/me/nearest-essential")
    public ResponseEntity<?> getNearestEssential(
                                                @RequestParam(defaultValue = "2000") Double radius) {
        Integer userId = currentUserAccess.getCurrentUserId();

        return ResponseEntity.status(200).body(currentHomeService.getNearestEssential(userId, radius));
    }

    @GetMapping("/me/nearby-search")
    public ResponseEntity<?> searchNearby(@RequestParam String query,
                                         @RequestParam(defaultValue = "2000") Double radius) {
        Integer userId = currentUserAccess.getCurrentUserId();

        return ResponseEntity.status(200).body(currentHomeService.searchNearby(userId, query, radius));
    }


    @GetMapping("/me/status")
    public ResponseEntity<CurrentHomeStatusDTO> getCurrentHomeStatus() {
        Integer userId = currentUserAccess.getCurrentUserId();


        return ResponseEntity.status(200).body(currentHomeService.getCurrentHomeStatus(userId));
    }

}
