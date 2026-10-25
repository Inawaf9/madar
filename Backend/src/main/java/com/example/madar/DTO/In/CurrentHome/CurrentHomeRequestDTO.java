package com.example.madar.DTO.In.CurrentHome;

import com.example.madar.DTO.In.Security.StrictResourceRequest;
import com.example.madar.Model.CurrentHome;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CurrentHomeRequestDTO extends StrictResourceRequest {
    @NotNull(message = "Latitude is required")
    @DecimalMin("-90.0") @DecimalMax("90.0")
    private Double latitude;

    @NotNull(message = "Longitude is required")
    @DecimalMin("-180.0") @DecimalMax("180.0")
    private Double longitude;

    private String externalPropertyId;
    private String source;

    public CurrentHome toEntity() {
        CurrentHome home = new CurrentHome();
        home.setLatitude(latitude);
        home.setLongitude(longitude);
        home.setExternalPropertyId(externalPropertyId);
        home.setSource(source);
        return home;
    }
}
