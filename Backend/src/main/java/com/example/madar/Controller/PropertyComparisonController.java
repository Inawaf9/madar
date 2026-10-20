package com.example.madar.Controller;



import com.example.madar.Api.ApiResponse;
import com.example.madar.Model.PropertyComparison;
import com.example.madar.Service.PropertyComparisonService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/property-comparison")
@RequiredArgsConstructor
public class PropertyComparisonController {

    private final PropertyComparisonService comparisonService;


    // GET ALL
    @GetMapping("/get")
    public ResponseEntity<List<PropertyComparison>> getAllComparisons() {
        return ResponseEntity.status(200).body(comparisonService.getAllComparisons());
    }


    // GET BY USER ID
    @GetMapping("/get-by-user/{userId}")
    public ResponseEntity<List<PropertyComparison>> getComparisonsByUserId(@PathVariable Integer userId) {
        return ResponseEntity.status(200).body(comparisonService.getComparisonsByUserId(userId));
    }


    // GET BY ID
    @GetMapping("/get-by-id/{userId}/{comparisonId}")
    public ResponseEntity<PropertyComparison> getComparisonById(@PathVariable Integer userId, @PathVariable Integer comparisonId) {
        return ResponseEntity.status(200).body(comparisonService.getComparisonById(userId, comparisonId));
    }


    // ADD
    @PostMapping("/add/{userId}")
    public ResponseEntity<ApiResponse> addComparison(@PathVariable Integer userId, @RequestBody @Valid PropertyComparison comparison) {

        comparisonService.addComparison(userId, comparison);
        return ResponseEntity.status(201).body(new ApiResponse("Comparison added successfully"));
    }


    // UPDATE
    @PutMapping("/update/{userId}/{comparisonId}")
    public ResponseEntity<ApiResponse> updateComparison(@PathVariable Integer userId, @PathVariable Integer comparisonId, @RequestBody @Valid PropertyComparison updatedComparison) {

        comparisonService.updateComparison(userId, comparisonId, updatedComparison);
        return ResponseEntity.status(200).body(new ApiResponse("Comparison updated successfully"));
    }


    // DELETE
    @DeleteMapping("/delete/{userId}/{comparisonId}")
    public ResponseEntity<ApiResponse> deleteComparison(@PathVariable Integer userId, @PathVariable Integer comparisonId) {

        comparisonService.deleteComparison(userId, comparisonId);
        return ResponseEntity.status(200).body(new ApiResponse("Comparison deleted successfully"));
    }
}
