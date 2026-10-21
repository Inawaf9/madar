package com.example.madar.Controller;

import com.example.madar.Service.PropertyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/properties")
@RequiredArgsConstructor
public class PropertyController {

    private final PropertyService propertyService;

    //search (propertyType can be "all")
    @GetMapping("/search/{city}/{listingType}/{propertyType}/{maxPrice}")
    public ResponseEntity<?> search(@PathVariable String city, @PathVariable String listingType, @PathVariable String propertyType, @PathVariable Integer maxPrice){
        return ResponseEntity.status(200).body(propertyService.search(city, listingType, propertyType, maxPrice));
    }

    //get property details
    @GetMapping("/get/{source}/{externalId}")
    public ResponseEntity<?> getPropertyById(@PathVariable String source, @PathVariable String externalId){
        return ResponseEntity.status(200).body(propertyService.getPropertyById(source, externalId));
    }

    //properties that match my housing preference inside my district "ONLYYYY"
    @GetMapping("/by-preference-in-my-district/{userId}")
    public ResponseEntity<?> getByPreferenceInMyDistrict(@PathVariable Integer userId){
        return ResponseEntity.status(200).body(propertyService.getByPreferenceInMyDistrict(userId));
    }

    //properties near a location within a radius in km
    @GetMapping("/near-location/{city}/{listingType}/{propertyType}/{latitude}/{longitude}/{radiusKm}")
    public ResponseEntity<?> getNearLocation(@PathVariable String city, @PathVariable String listingType, @PathVariable String propertyType, @PathVariable Double latitude, @PathVariable Double longitude, @PathVariable Double radiusKm){
        return ResponseEntity.status(200).body(propertyService.getNearLocation(city, listingType, propertyType, latitude, longitude, radiusKm));
    }

    //properties within my budget in the whole city
    @GetMapping("/within-budget/{userId}")
    public ResponseEntity<?> getWithinBudget(@PathVariable Integer userId){
        return ResponseEntity.status(200).body(propertyService.getWithinBudget(userId));
    }

    //properties cheaper than my budget by a margin
    @GetMapping("/under-budget-margin/{userId}/{margin}")
    public ResponseEntity<?> getUnderBudgetMargin(@PathVariable Integer userId, @PathVariable Integer margin){
        return ResponseEntity.status(200).body(propertyService.getUnderBudgetMargin(userId, margin));
    }

    //properties in several districts (comma separated)
    @GetMapping("/by-districts/{city}/{listingType}/{propertyType}/{districts}")
    public ResponseEntity<?> getByDistricts(@PathVariable String city, @PathVariable String listingType, @PathVariable String propertyType, @PathVariable String districts){
        return ResponseEntity.status(200).body(propertyService.getByDistricts(city, listingType, propertyType, districts));
    }

    //properties between a min and max price
    @GetMapping("/price-range/{city}/{listingType}/{propertyType}/{minPrice}/{maxPrice}")
    public ResponseEntity<?> getByPriceRange(@PathVariable String city, @PathVariable String listingType, @PathVariable String propertyType, @PathVariable Integer minPrice, @PathVariable Integer maxPrice){
        return ResponseEntity.status(200).body(propertyService.getByPriceRange(city, listingType, propertyType, minPrice, maxPrice));
    }

    //sort: price, price-desc, newest, price-drop
    @GetMapping("/sort/{city}/{listingType}/{sortBy}")
    public ResponseEntity<?> sortProperties(@PathVariable String city, @PathVariable String listingType, @PathVariable String sortBy){
        return ResponseEntity.status(200).body(propertyService.sortProperties(city, listingType, sortBy));
    }

    //market price stats for one housing type
    @GetMapping("/price-stats/{city}/{listingType}/{propertyType}")
    public ResponseEntity<?> getPriceStats(@PathVariable String city, @PathVariable String listingType, @PathVariable String propertyType){
        return ResponseEntity.status(200).body(propertyService.getPriceStats(city, listingType, propertyType));
    }

    //number of listings in the market
    @GetMapping("/results-count/{city}/{listingType}")
    public ResponseEntity<?> getResultsCount(@PathVariable String city, @PathVariable String listingType){
        return ResponseEntity.status(200).body(propertyService.getResultsCount(city, listingType));
    }

    //similar properties (same city and type, price within 20%)
    @GetMapping("/similar/{source}/{externalId}")
    public ResponseEntity<?> getSimilar(@PathVariable String source, @PathVariable String externalId){
        return ResponseEntity.status(200).body(propertyService.getSimilar(source, externalId));
    }
}