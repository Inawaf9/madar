package com.example.madar.DTO.In.Location;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public final class KiteLocationsDTO {
    private KiteLocationsDTO() {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record CitiesResponse(List<City> data) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record City(String slug, @JsonProperty("name_ar") String nameAr,
                       @JsonProperty("name_en") String nameEn) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record NeighborhoodsResponse(List<Neighborhood> data) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Neighborhood(Integer id, String slug, @JsonProperty("name_ar") String nameAr,
                               @JsonProperty("name_en") String nameEn) {}
}
