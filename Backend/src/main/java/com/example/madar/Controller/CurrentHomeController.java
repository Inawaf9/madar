package com.example.madar.Controller;



import com.example.madar.Api.ApiResponse;
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

    private final CurrentHomeService currentHomeService;


    // GET ALL
    @GetMapping("/get")
    public ResponseEntity<List<CurrentHome>> getAllCurrentHomes() {
        return ResponseEntity.status(200).body(currentHomeService.getAllCurrentHomes());
    }


    // GET CURRENT HOME BY USER ID
    @GetMapping("/get-by-user/{userId}")
    public ResponseEntity<CurrentHome> getCurrentHomeByUserId(@PathVariable Integer userId) {
        return ResponseEntity.status(200).body(currentHomeService.getCurrentHomeByUserId(userId));
    }


    // ADD CURRENT HOME
    @PostMapping("/add/{userId}")
    public ResponseEntity<ApiResponse> addCurrentHome(@PathVariable Integer userId,
                                                      @RequestBody @Valid CurrentHome currentHome) {

        currentHomeService.addCurrentHome(userId, currentHome);
        return ResponseEntity.status(201).body(new ApiResponse("Current home added successfully"));
    }


    // UPDATE CURRENT HOME
    @PutMapping("/update/{userId}/{homeId}")
    public ResponseEntity<ApiResponse> updateCurrentHome(@PathVariable Integer userId, @PathVariable Integer homeId, @RequestBody @Valid CurrentHome updatedHome) {
        currentHomeService.updateCurrentHome(userId, homeId, updatedHome);
        return ResponseEntity.status(200).body(new ApiResponse("Current home updated successfully"));
    }


    // DELETE CURRENT HOME
    @DeleteMapping("/delete/{userId}/{homeId}")
    public ResponseEntity<ApiResponse> deleteCurrentHome(@PathVariable Integer userId, @PathVariable Integer homeId) {
        currentHomeService.deleteCurrentHome(userId, homeId);
        return ResponseEntity.status(200).body(new ApiResponse("Current home deleted successfully"));
    }
}
