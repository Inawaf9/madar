package com.example.madar.Controller;

import com.example.madar.Service.PropertyService;
import com.example.madar.Service.NearbyInterestService;
import com.example.madar.DTO.In.Property.PropertySearchRequestDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/properties")
@RequiredArgsConstructor
public class PropertyController {

    private final PropertyService propertyService;
    private final NearbyInterestService nearbyInterestService;

    @GetMapping("/nearby-interests/{userId}/{source}/{externalId}")
    public ResponseEntity<?> getNearbyInterests(@PathVariable Integer userId, @PathVariable String source,
                                               @PathVariable String externalId,
                                               @RequestParam(defaultValue = "2000") Double radius) {
        return ResponseEntity.status(200).body(nearbyInterestService.analyzeProperty(userId, source, externalId, radius));
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchPublic(@Valid @ModelAttribute PropertySearchRequestDTO request,
                                          @RequestParam MultiValueMap<String, String> parameters) {
        return ResponseEntity.status(200).body(propertyService.searchPublic(request, parameters));
    }

    //search (propertyType can be "all")
    @GetMapping("/search/{city}/{listingType}/{propertyType}/{maxPrice}")
    public ResponseEntity<?> search(@PathVariable String city, @PathVariable String listingType, @PathVariable String propertyType, @PathVariable Integer maxPrice, @RequestParam(defaultValue = "ar") String lang){
        return ResponseEntity.status(200).body(propertyService.localize(propertyService.search(city, listingType, propertyType, maxPrice), lang));
    }

    //get property details
    @GetMapping("/get/{source}/{externalId}")
    public ResponseEntity<?> getPropertyById(@PathVariable String source, @PathVariable String externalId, @RequestParam(defaultValue = "ar") String lang){
        return ResponseEntity.status(200).body(propertyService.localizeOne(propertyService.getPropertyById(source, externalId), lang));
    }

    //properties that match my housing preference inside my district only
    @GetMapping("/by-preference-in-my-district/{userId}")
    public ResponseEntity<?> getByPreferenceInMyDistrict(@PathVariable Integer userId, @RequestParam(defaultValue = "ar") String lang){
        return ResponseEntity.status(200).body(propertyService.localize(propertyService.getByPreferenceInMyDistrict(userId), lang));
    }

    //properties near a location within a radius in km
    @GetMapping("/near-location/{city}/{listingType}/{propertyType}/{latitude}/{longitude}/{radiusKm}")
    public ResponseEntity<?> getNearLocation(@PathVariable String city, @PathVariable String listingType, @PathVariable String propertyType, @PathVariable Double latitude, @PathVariable Double longitude, @PathVariable Double radiusKm, @RequestParam(defaultValue = "ar") String lang){
        return ResponseEntity.status(200).body(propertyService.localize(propertyService.getNearLocation(city, listingType, propertyType, latitude, longitude, radiusKm), lang));
    }

    //properties within my budget in the whole city
    @GetMapping("/within-budget/{userId}")
    public ResponseEntity<?> getWithinBudget(@PathVariable Integer userId, @RequestParam(defaultValue = "ar") String lang){
        return ResponseEntity.status(200).body(propertyService.localize(propertyService.getWithinBudget(userId), lang));
    }

    //properties cheaper than my budget by a margin
    @GetMapping("/under-budget-margin/{userId}/{margin}")
    public ResponseEntity<?> getUnderBudgetMargin(@PathVariable Integer userId, @PathVariable Integer margin, @RequestParam(defaultValue = "ar") String lang){
        return ResponseEntity.status(200).body(propertyService.localize(propertyService.getUnderBudgetMargin(userId, margin), lang));
    }

    //properties in several districts (comma separated)
    @GetMapping("/by-districts/{city}/{listingType}/{propertyType}/{districts}")
    public ResponseEntity<?> getByDistricts(@PathVariable String city, @PathVariable String listingType, @PathVariable String propertyType, @PathVariable String districts, @RequestParam(defaultValue = "ar") String lang){
        return ResponseEntity.status(200).body(propertyService.localize(propertyService.getByDistricts(city, listingType, propertyType, districts), lang));
    }

    //properties between a min and max price
    @GetMapping("/price-range/{city}/{listingType}/{propertyType}/{minPrice}/{maxPrice}")
    public ResponseEntity<?> getByPriceRange(@PathVariable String city, @PathVariable String listingType, @PathVariable String propertyType, @PathVariable Integer minPrice, @PathVariable Integer maxPrice, @RequestParam(defaultValue = "ar") String lang){
        return ResponseEntity.status(200).body(propertyService.localize(propertyService.getByPriceRange(city, listingType, propertyType, minPrice, maxPrice), lang));
    }

    //sort: price, price-desc, newest, price-drop
    @GetMapping("/sort/{city}/{listingType}/{sortBy}")
    public ResponseEntity<?> sortProperties(@PathVariable String city, @PathVariable String listingType, @PathVariable String sortBy, @RequestParam(defaultValue = "ar") String lang){
        return ResponseEntity.status(200).body(propertyService.localize(propertyService.sortProperties(city, listingType, sortBy), lang));
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
    public ResponseEntity<?> getSimilar(@PathVariable String source, @PathVariable String externalId, @RequestParam(defaultValue = "ar") String lang){
        return ResponseEntity.status(200).body(propertyService.localize(propertyService.getSimilar(source, externalId), lang));
    }
}