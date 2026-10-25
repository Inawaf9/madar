package com.example.madar.DTO.In.PropertyComparison;

import com.example.madar.DTO.In.Security.StrictResourceRequest;
import com.example.madar.Model.PropertyComparison;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PropertyComparisonRequestDTO extends StrictResourceRequest {
    @NotEmpty(message = "First property ID is required")
    private String firstPropertyId;

    @NotEmpty(message = "Second property ID is required")
    private String secondPropertyId;

    @NotEmpty(message = "First property source is required")
    private String firstPropertySource;

    @NotEmpty(message = "Second property source is required")
    private String secondPropertySource;

    public PropertyComparison toEntity() {
        PropertyComparison comparison = new PropertyComparison();
        comparison.setFirstPropertyId(firstPropertyId);
        comparison.setSecondPropertyId(secondPropertyId);
        comparison.setFirstPropertySource(firstPropertySource);
        comparison.setSecondPropertySource(secondPropertySource);
        return comparison;
    }
}
