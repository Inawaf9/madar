package com.example.madar.Service;

import com.example.madar.Client.KiteClient;
import com.example.madar.DTO.In.Location.KiteLocationsDTO;
import com.example.madar.DTO.Out.Location.CityResponseDTO;
import com.example.madar.DTO.Out.Location.NeighborhoodResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class LocationService {
    private static final Pattern CITY_SLUG = Pattern.compile("^[a-z_]+$");
    private static final long CACHE_TTL_NANOS = Duration.ofMinutes(10).toNanos();

    private final KiteClient kiteClient;
    private CacheEntry<List<CityResponseDTO>> citiesCache;
    private final Map<String, CacheEntry<List<NeighborhoodResponseDTO>>> neighborhoodsCache = new HashMap<>();

    // Synchronization coalesces concurrent cache misses without adding cache infrastructure.
    public synchronized List<CityResponseDTO> getCities() {
        if (citiesCache != null && citiesCache.isFresh()) {
            return citiesCache.value();
        }

        KiteLocationsDTO.CitiesResponse response = kiteClient.getLocationCities();
        if (response == null || response.data() == null || response.data().stream().anyMatch(city ->
                city == null || city.slug() == null || !CITY_SLUG.matcher(city.slug()).matches()
                        || city.nameAr() == null || city.nameEn() == null)) {
            throw invalidProviderResponse();
        }

        List<CityResponseDTO> cities = response.data().stream()
                .map(city -> new CityResponseDTO(city.slug(), city.nameAr(), city.nameEn()))
                .toList();
        citiesCache = new CacheEntry<>(cities, System.nanoTime());
        // Keep cache keys restricted to the latest provider-supported city catalog.
        neighborhoodsCache.clear();
        return cities;
    }

    public synchronized List<NeighborhoodResponseDTO> getNeighborhoods(String city) {
        if (city == null || !CITY_SLUG.matcher(city).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "City must be a lowercase Kite city slug");
        }
        if (getCities().stream().noneMatch(candidate -> candidate.slug().equals(city))) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "City not found");
        }

        CacheEntry<List<NeighborhoodResponseDTO>> cached = neighborhoodsCache.get(city);
        if (cached != null && cached.isFresh()) {
            return cached.value();
        }

        KiteLocationsDTO.NeighborhoodsResponse response = kiteClient.getLocationNeighborhoods(city);
        if (response == null || response.data() == null || response.data().stream().anyMatch(neighborhood ->
                neighborhood == null || neighborhood.id() == null || neighborhood.slug() == null
                        || neighborhood.nameAr() == null || neighborhood.nameEn() == null)) {
            throw invalidProviderResponse();
        }

        List<NeighborhoodResponseDTO> neighborhoods = response.data().stream()
                .map(neighborhood -> new NeighborhoodResponseDTO(neighborhood.id(), neighborhood.slug(),
                        neighborhood.nameAr(), neighborhood.nameEn()))
                .toList();
        neighborhoodsCache.put(city, new CacheEntry<>(neighborhoods, System.nanoTime()));
        return neighborhoods;
    }

    private ResponseStatusException invalidProviderResponse() {
        return new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Location provider returned an invalid response");
    }

    private record CacheEntry<T>(T value, long storedAtNanos) {
        private boolean isFresh() {
            return System.nanoTime() - storedAtNanos < CACHE_TTL_NANOS;
        }
    }
}
