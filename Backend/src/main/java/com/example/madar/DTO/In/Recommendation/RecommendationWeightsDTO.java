package com.example.madar.DTO.In.Recommendation;



import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record RecommendationWeightsDTO(

        @Min(0) @Max(100)
        Integer housingWeight,

        @Min(0) @Max(100)
        Integer commuteWeight,

        @Min(0) @Max(100)
        Integer servicesWeight

) {
}
