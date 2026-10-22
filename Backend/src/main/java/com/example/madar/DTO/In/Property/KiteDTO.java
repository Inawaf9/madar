package com.example.madar.DTO.In.Property;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

public class KiteDTO {

    // رد قائمة العقارات
    @Data
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ListResponse {
        private List<Listing> data;
        private Pagination pagination;
    }

    @Data
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Pagination {
        private Integer limit;
        @JsonProperty("next_cursor")
        private String nextCursor;
        @JsonProperty("has_more")
        private Boolean hasMore;
        @JsonProperty("result_window_reached")
        private Boolean resultWindowReached;
    }

    // رد عقار واحد
    @Data
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class SingleResponse {
        private Listing data;
    }

    // رد العدد:توتال
    @Data
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class CountResponse {
        private Count data;
    }

    @Data
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Count {
        private Integer total;
    }

    // العقار الواحد
    @Data
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Listing {
        private Long id;
        private String url;
        private String title;
        private String headline;
        private String description;
        @JsonProperty("listing_type")
        private String listingType;
        @JsonProperty("property_type")
        private String propertyType;
        private Price price;
        private Integer bedrooms;
        private Integer bathrooms;
        @JsonProperty("area_sqm")
        private Double areaSqm;
        private Location location;
        private List<String> images;
        private Source source;
        @JsonProperty("updated_at")
        private String updatedAt;
    }

    @Data
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Price {
        @JsonProperty("yearly_sar")
        private Integer yearlySar;
        @JsonProperty("as_posted")
        private PostedPrice asPosted;
    }

    @Data
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class PostedPrice {
        private Long amount;
        private String frequency;
    }

    @Data
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Location {
        private String city;
        @JsonProperty("neighborhood_id")
        private Integer neighborhoodId;
        @JsonProperty("neighborhood_name_ar")
        private String neighborhood;
        private Double lat;
        private Double lng;
    }
    @Data
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class NeighborhoodsResponse {
        private List<Neighborhood> data;
    }

    @Data
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Neighborhood {
        private Integer id;
        @JsonProperty("name_ar")
        private String nameAr;
        @JsonProperty("name_en")
        private String nameEn;
    }

    @Data
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)//تجاهل أي حقل موجود في الـ جسون وما له مقابل في الكلاس
    public static class Source {
        private String name;
        private String url;
    }
}
