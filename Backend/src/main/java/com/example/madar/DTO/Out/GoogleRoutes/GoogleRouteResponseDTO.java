package com.example.madar.DTO.Out.GoogleRoutes;



import java.util.List;

public record GoogleRouteResponseDTO(List<Route> routes) {
    public record Route(
            Integer distanceMeters,
            String duration
    ) {}
}
