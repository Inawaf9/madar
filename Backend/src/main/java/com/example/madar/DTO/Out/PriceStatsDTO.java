package com.example.madar.DTO.Out;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class PriceStatsDTO {
    private String city;
    private String listingType;
    private String propertyType;
    private Integer totalListings;
    private Integer minPrice;
    private Integer maxPrice;

}