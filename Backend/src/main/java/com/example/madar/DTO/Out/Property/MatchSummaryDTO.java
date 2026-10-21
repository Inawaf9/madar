package com.example.madar.DTO.Out.Property;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class MatchSummaryDTO {
    private Integer budget;
    private Integer totalListings;
    private Integer inMyDistrict;
    private Integer cheapestPrice;
}