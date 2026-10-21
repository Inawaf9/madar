package com.example.madar.DTO.Out;



import java.util.List;

public record GoogleRouteResponseDTO(List<Route> routes) {
    public record Route(
            Integer distanceMeters,
            String duration
    ) {}
}
