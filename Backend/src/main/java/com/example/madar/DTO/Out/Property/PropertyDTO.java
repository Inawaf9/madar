package com.example.madar.DTO.Out.Property;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PropertyDTO {
    private String externalId;
    private String source;
    private String sourceName;
    private String title;
    private String listingUrl;
    private String city;
    private String neighborhood;
    private String propertyType;
    private String listingType;
    private Integer price;
    private Integer bedrooms;
    private Double areaSqm;
    private Double latitude;
    private Double longitude;
    private String image;
    private String updatedAt;
    private Double distanceKm; // يتعبى بس في near-location

    // Public cards/details retain the provider's original price and attribution.
    private String description;
    private Integer bathrooms;
    private String pricePeriod;
    private Long postedPrice;
    private String postedPricePeriod;
    private String sourceUrl;
    private List<String> images;
    private Integer neighborhoodId;
}
