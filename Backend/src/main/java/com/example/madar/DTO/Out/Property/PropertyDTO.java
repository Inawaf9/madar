package com.example.madar.DTO.Out.Property;

import com.fasterxml.jackson.annotation.JsonIgnore;
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
    private String originalTitle; // العنوان مثل ما كتبه صاحب الإعلان
    private String cityName;
    private String description; // وصف صاحب الإعلان، أو ترجمته الإنجليزية من Kite

    @JsonIgnore
    private String neighborhoodEn; // اسم الحي بالإنجليزي من Kite (للاستخدام الداخلي)

    @JsonIgnore
    private String descriptionEn; // ترجمة الوصف من Kite (للاستخدام الداخلي)

    //both languages in the same response, so the frontend can switch language without a new request
    private String titleAr;
    private String titleEn;
    private String neighborhoodAr;
    private String neighborhoodNameEn;
    private String cityNameAr;
    private String cityNameEn;
    private String descriptionAr;
    private String descriptionTextEn;

    // Public cards/details retain the provider's original price and attribution.
    private Integer bathrooms;
    private String pricePeriod;
    private Long postedPrice;
    private String postedPricePeriod;
    private String sourceUrl;
    private List<String> images;
    private Integer neighborhoodId;
}