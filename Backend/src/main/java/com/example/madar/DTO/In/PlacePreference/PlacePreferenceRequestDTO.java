package com.example.madar.DTO.In.PlacePreference;

import com.example.madar.DTO.In.Security.StrictResourceRequest;
import com.example.madar.Model.PlacePreference;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PlacePreferenceRequestDTO extends StrictResourceRequest {
    @NotEmpty(message = "Place name is required")
    private String name;

    @NotEmpty(message = "Place type is required")
    private String type;

    @NotNull(message = "Latitude is required")
    @DecimalMin("-90.0") @DecimalMax("90.0")
    private Double latitude;

    @NotNull(message = "Longitude is required")
    @DecimalMin("-180.0") @DecimalMax("180.0")
    private Double longitude;

    @NotNull(message = "Importance is required")
    @Min(value = 1, message = "Importance must be at least 1")
    @Max(value = 5, message = "Importance must not exceed 5")
    private Integer importance;

    @NotNull(message = "visitPerWeek is required")
    private Integer visitPerWeek;

    public PlacePreference toEntity() {
        PlacePreference place = new PlacePreference();
        place.setName(name);
        place.setType(type);
        place.setLatitude(latitude);
        place.setLongitude(longitude);
        place.setImportance(importance);
        place.setVisitPerWeek(visitPerWeek);
        return place;
    }
}
