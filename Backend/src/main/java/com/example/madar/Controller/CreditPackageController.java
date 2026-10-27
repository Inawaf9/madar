package com.example.madar.Controller;


import com.example.madar.Model.CreditPackage;
import com.example.madar.Service.CreditPackageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.madar.Api.ApiResponse;

import java.util.List;

@RestController
@RequestMapping("/api/v1/credit-packages")
@RequiredArgsConstructor
public class CreditPackageController {

    private final CreditPackageService creditPackageService;


    // Public - Display available packages.
    @GetMapping("/active")
    public ResponseEntity<List<CreditPackage>> getActivePackages() {
        return ResponseEntity.status(200).body(creditPackageService.getActivePackages());
    }


    // Admin - Display all packages.
    @GetMapping
    public ResponseEntity<List<CreditPackage>> getAllPackages() {
        return ResponseEntity.status(200).body(creditPackageService.getAllPackages());
    }


    // Admin - Create package.
    @PostMapping
    public ResponseEntity<?> addPackage(@RequestBody @Valid CreditPackage creditPackage) {

        creditPackageService.addPackage(creditPackage);

        return ResponseEntity.status(200).body(new ApiResponse("Credit package added successfully"));
    }


    // Admin - Update package.
    @PutMapping("/{packageId}")
    public ResponseEntity<?> updatePackage(@PathVariable Integer packageId, @RequestBody @Valid CreditPackage creditPackage) {

        creditPackageService.updatePackage(packageId, creditPackage);

        return ResponseEntity.status(200).body(new ApiResponse("Credit package updated successfully"));
    }


    // Admin - Deactivate package.
    @DeleteMapping("/{packageId}")
    public ResponseEntity<?> deletePackage(@PathVariable Integer packageId) {

        creditPackageService.deletePackage(packageId);

        return ResponseEntity.status(200).body(new ApiResponse("Credit package deactivated successfully"));
    }
}