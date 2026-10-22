package com.example.madar.Util;

import com.example.madar.Api.ApiException;

import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Set;

public final class PlaceCategories {
    public static final Set<String> SUPPORTED_TYPES = Set.of(
            "supermarket", "hospital", "pharmacy", "park", "gym", "cafe",
            "restaurant", "school", "shopping_mall");

    private PlaceCategories() {}

    public static Set<String> normalize(Set<String> interests) {
        Set<String> normalized = new LinkedHashSet<>();
        if (interests == null) {
            return normalized;
        }
        for (String interest : interests) {
            if (interest == null || interest.isBlank()) {
                throw new ApiException("Interest category must not be null or blank");
            }
            String category = interest.trim().toLowerCase(Locale.ROOT);
            if (!SUPPORTED_TYPES.contains(category)) {
                throw new ApiException("Unsupported interest category: " + category);
            }
            normalized.add(category);
        }
        return new LinkedHashSet<>(normalized.stream().sorted().toList());
    }
}
