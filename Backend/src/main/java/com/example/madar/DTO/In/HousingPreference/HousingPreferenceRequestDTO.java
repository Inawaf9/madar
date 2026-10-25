package com.example.madar.DTO.In.HousingPreference;

import com.example.madar.DTO.In.Security.StrictResourceRequest;
import com.example.madar.Model.HousingPreference;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class HousingPreferenceRequestDTO extends StrictResourceRequest {
    @NotEmpty(message = "Region is required")
    private String region;

    @NotEmpty(message = "City is required")
    @Pattern(regexp = "^[a-z-]+$", message = "City must be in English lowercase like riyadh or jeddah")
    private String city;

    @Size(max = 100, message = "District must be less than 100 characters")
    private String district;

    @NotNull(message = "Budget is required")
    @DecimalMin(value = "1.0", message = "Budget must be greater than zero")
    private BigDecimal maxBudget;

    @NotNull(message = "Occupants count is required")
    @Min(value = 1, message = "Occupants count must be at least 1")
    private Integer occupantsCount;

    @NotEmpty(message = "Property type is required")
    @Pattern(regexp = "^(apartment|villa|floor|duplex|building)$", message = "Property type must be apartment, villa, floor, duplex or building")
    private String propertyType;

    @NotEmpty(message = "Listing type is required")
    @Pattern(regexp = "^(rent|sale)$", message = "Listing type must be rent or sale")
    private String listingType;

    private Boolean includeNearbyServices = true;

    public HousingPreference toEntity() {
        HousingPreference preference = new HousingPreference();
        preference.setRegion(region);
        preference.setCity(city);
        preference.setDistrict(district);
        preference.setMaxBudget(maxBudget);
        preference.setOccupantsCount(occupantsCount);
        preference.setPropertyType(propertyType);
        preference.setListingType(listingType);
        preference.setIncludeNearbyServices(includeNearbyServices);
        return preference;
    }
}
