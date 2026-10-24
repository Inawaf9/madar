package com.example.madar.Controller;

import com.example.madar.DTO.Out.Location.CityResponseDTO;
import com.example.madar.DTO.Out.Location.NeighborhoodResponseDTO;
import com.example.madar.Service.LocationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/locations")
@RequiredArgsConstructor
public class LocationController {
    private final LocationService locationService;

    @GetMapping("/cities")
    public ResponseEntity<List<CityResponseDTO>> getCities() {
        return ResponseEntity.status(200).body(locationService.getCities());
    }

    @GetMapping("/cities/{city}/neighborhoods")
    public ResponseEntity<List<NeighborhoodResponseDTO>> getNeighborhoods(@PathVariable String city) {
        return ResponseEntity.status(200).body(locationService.getNeighborhoods(city));
    }
}
