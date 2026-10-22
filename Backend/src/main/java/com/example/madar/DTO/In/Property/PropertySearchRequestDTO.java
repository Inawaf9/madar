package com.example.madar.DTO.In.Property;

import jakarta.validation.constraints.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class PropertySearchRequestDTO {
    @NotBlank(message = "City is required")
    @Pattern(regexp = "^[a-z_]+$", message = "City must be a Kite city slug in English lowercase")
    private String city;

    @Size(min = 2, max = 120, message = "Query must contain between 2 and 120 characters")
    private String q;

    @Pattern(regexp = "^(all|apartment|villa|floor|duplex|building|office|shop|warehouse|land)$",
            message = "Unsupported property type")
    private String type;

    @NotBlank(message = "Purpose must be rent or sale")
    @Pattern(regexp = "^(rent|sale)$", message = "Purpose must be rent or sale")
    private String purpose = "rent";

    @Min(value = 1, message = "Neighborhood ID must be positive")
    private Integer neighborhoodId;

    @Min(value = 0, message = "Minimum price must be between 0 and 2000000000 SAR")
    @Max(value = 2000000000, message = "Minimum price must be between 0 and 2000000000 SAR")
    private Integer minPrice;

    @Min(value = 0, message = "Maximum price must be between 0 and 2000000000 SAR")
    @Max(value = 2000000000, message = "Maximum price must be between 0 and 2000000000 SAR")
    private Integer maxPrice;

    @DecimalMin(value = "0", message = "Minimum area must be between 0 and 10000000 square meters")
    @DecimalMax(value = "10000000", message = "Minimum area must be between 0 and 10000000 square meters")
    private Double minArea;

    @DecimalMin(value = "0", message = "Maximum area must be between 0 and 10000000 square meters")
    @DecimalMax(value = "10000000", message = "Maximum area must be between 0 and 10000000 square meters")
    private Double maxArea;

    @Min(value = 0, message = "Minimum bedrooms must be between 0 and 20")
    @Max(value = 20, message = "Minimum bedrooms must be between 0 and 20")
    private Integer minBedrooms;

    @Min(value = 0, message = "Minimum bathrooms must be between 0 and 20")
    @Max(value = 20, message = "Minimum bathrooms must be between 0 and 20")
    private Integer minBathrooms;

    @Pattern(regexp = "^(true|false)$", message = "Furnished must be true or false")
    private String furnished;

    @Pattern(regexp = "^(monthly|yearly)$", message = "Rent frequency must be monthly or yearly")
    private String rentFrequency;

    @NotNull(message = "Sort must not be null")
    @Pattern(regexp = "^(newest|updated_desc|updated_asc|price_asc|price_desc|price_drop|days_on_market_desc|recommended|price|price-desc|price-drop)$",
            message = "Unsupported property sort")
    private String sort = "newest";

    @NotNull(message = "Limit is required when supplied")
    @Min(value = 1, message = "Limit must be between 1 and 100")
    @Max(value = 100, message = "Limit must be between 1 and 100")
    private Integer limit = 20;

    @Size(max = 500, message = "Cursor must not exceed 500 characters")
    private String cursor;
}
