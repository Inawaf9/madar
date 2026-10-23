package com.example.madar.DTO.Out.Property;


public record PropertyAffordabilityDTO(
        String externalId,
        Double propertyPrice,
        Double userBudget,
        Double priceDifference,
        Double differencePercentage,
        Boolean withinBudget
) {}
