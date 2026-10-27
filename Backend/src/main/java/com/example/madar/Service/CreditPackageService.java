package com.example.madar.Service;


import com.example.madar.Api.ApiException;
import com.example.madar.Model.CreditPackage;
import com.example.madar.Repository.CreditPackageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class CreditPackageService {

    private final CreditPackageRepository creditPackageRepository;


    // Get all packages for admin.
    @Transactional(readOnly = true)
    public List<CreditPackage> getAllPackages() {
        return creditPackageRepository.findAll();
    }


    // Get active packages for users.
    @Transactional(readOnly = true)
    public List<CreditPackage> getActivePackages() {
        return creditPackageRepository.findCreditPackagesByActiveTrue();
    }


    // Get active package by code.
    @Transactional(readOnly = true)
    public CreditPackage getActivePackage(String code) {

        if (code == null || code.isBlank()) {
            throw new ApiException("Package code is required");
        }

        CreditPackage creditPackage = creditPackageRepository.findCreditPackageByCode(code.trim().toUpperCase(Locale.ROOT));

        if (creditPackage == null || !Boolean.TRUE.equals(creditPackage.getActive())) {
            throw new ApiException("Credit package is not available");
        }

        return creditPackage;
    }


    // Create package.
    @Transactional
    public void addPackage(CreditPackage creditPackage) {

        validatePackage(creditPackage);

        String code = creditPackage.getCode().trim().toUpperCase(Locale.ROOT);

        if (creditPackageRepository.existsByCode(code)) {
            throw new ApiException("Package code already exists");
        }

        creditPackage.setId(null);
        creditPackage.setCode(code);

        creditPackageRepository.save(creditPackage);
    }


    // Update package information.
    @Transactional
    public void updatePackage(Integer packageId, CreditPackage updatedPackage) {

        CreditPackage existing = creditPackageRepository.findById(packageId).orElseThrow(() -> new ApiException("Credit package not found"));

        validatePackage(updatedPackage);

        String code = updatedPackage.getCode().trim().toUpperCase(Locale.ROOT);



        if (!existing.getCode().equals(code)) {
            throw new ApiException("Package code cannot be changed");
        }

        existing.setName(updatedPackage.getName().trim());
        existing.setCredits(updatedPackage.getCredits());
        existing.setPriceHalalas(updatedPackage.getPriceHalalas());
        existing.setDiscountPercent(updatedPackage.getDiscountPercent());
        existing.setActive(updatedPackage.getActive());

        creditPackageRepository.save(existing);
    }


    // Delete package only if it has never been purchased.
    @Transactional
    public void deletePackage(Integer packageId) {

        CreditPackage creditPackage = creditPackageRepository.findById(packageId).orElseThrow(() -> new ApiException("Credit package not found"));

        // For payment history, deactivate instead of physically deleting.
        creditPackage.setActive(false);

        creditPackageRepository.save(creditPackage);
    }


    // Calculate final price in halalas.
    public Integer calculateFinalPrice(CreditPackage creditPackage) {

        validatePackage(creditPackage);

        long price = creditPackage.getPriceHalalas();
        long discount = creditPackage.getDiscountPercent();

        long finalPrice = price * (100 - discount) / 100;

        if (finalPrice < 100 || finalPrice > Integer.MAX_VALUE) {
            throw new ApiException("Final package price must be at least 1 SAR");
        }

        return (int) finalPrice;
    }


    // HELPER METHOD

    private void validatePackage(CreditPackage creditPackage) {

        if (creditPackage == null
                || creditPackage.getCode() == null
                || creditPackage.getCode().isBlank()
                || creditPackage.getCode().length() > 50
                || creditPackage.getName() == null
                || creditPackage.getName().isBlank()
                || creditPackage.getName().length() > 100
                || creditPackage.getCredits() == null
                || creditPackage.getCredits() <= 0
                || creditPackage.getPriceHalalas() == null
                || creditPackage.getPriceHalalas() < 100
                || creditPackage.getDiscountPercent() == null
                || creditPackage.getDiscountPercent() < 0
                || creditPackage.getDiscountPercent() > 100
                || creditPackage.getActive() == null) {
            throw new ApiException("Invalid credit package information");
        }

        long discountedPrice =
                (long) creditPackage.getPriceHalalas()
                        * (100 - creditPackage.getDiscountPercent()) / 100;

        if (discountedPrice < 100) {
            throw new ApiException("Final package price must be at least 1 SAR");
        }
    }
}