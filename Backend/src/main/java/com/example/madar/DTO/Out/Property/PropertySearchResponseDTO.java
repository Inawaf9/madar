package com.example.madar.DTO.Out.Property;

import java.util.List;

public record PropertySearchResponseDTO(List<PropertyDTO> data, Pagination pagination) {
    public record Pagination(Integer limit, String nextCursor, Boolean hasMore, Boolean resultWindowReached) {}
}
