package com.example.madar.DTO.Out.User;



import java.util.List;

public record ProfileCompletionDTO(
        Integer completionPercentage,
        Boolean housingCompleted,
        Boolean placesCompleted,
        Boolean interestsCompleted,
        Boolean readyForSearch,
        List<MissingFeature> missingFeatures
) {
    public record MissingFeature(
            String feature,
            String messageKey
    ) {}
}
