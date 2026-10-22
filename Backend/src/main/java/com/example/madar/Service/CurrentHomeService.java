package com.example.madar.Service;


import com.example.madar.Api.ApiException;
import com.example.madar.Client.GooglePlacesClient;
import com.example.madar.DTO.Out.GooglePlaces.GooglePlacesResponseDTO;
import com.example.madar.DTO.Out.GooglePlaces.NearbyPlaceResponseDTO;
import com.example.madar.DTO.Out.GooglePlaces.NearbyInterestResponseDTO;
import com.example.madar.DTO.Out.GooglePlaces.NeighborhoodResponseDTO;
import com.example.madar.Model.CurrentHome;
import com.example.madar.Model.User;
import com.example.madar.Repository.CurrentHomeRepository;
import com.example.madar.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class CurrentHomeService {

    private final CurrentHomeRepository currentHomeRepository;
    private final UserRepository userRepository;
    private final PlacePreferenceService placePreferenceService;
    private final GooglePlacesClient googlePlacesClient;
    private final PropertyService propertyService;
    private final HousingPreferenceService housingPreferenceService;
    private final NearbyInterestService nearbyInterestService;

    //CRUD METHOD
    public List<CurrentHome> getAllCurrentHomes() {
        return currentHomeRepository.findAll();
    }

    //My current home
    public CurrentHome getCurrentHomeByUserId(Integer userId) {

        User user = userRepository.findUserById(userId);
        if (user == null) {
            throw new ApiException("User not found");
        }

        CurrentHome currentHome = currentHomeRepository.findCurrentHomeByUser_Id(userId);
        if (currentHome == null) {
            throw new ApiException("Current home not found for this user");
        }

        return currentHome;
    }


    //add current home
    public void addCurrentHome(Integer userId, CurrentHome currentHome) {

        User user = userRepository.findUserById(userId);
        if (user == null) {
            throw new ApiException("User not found");
        }

        CurrentHome existingHome = currentHomeRepository.findCurrentHomeByUser_Id(userId);
        if (existingHome != null) {
            throw new ApiException("User already has a current home");
        }

        currentHome.setUser(user);
        currentHomeRepository.save(currentHome);
    }

    //update current home
    public void updateCurrentHome(Integer userId, Integer homeId, CurrentHome updatedHome) {

        User user = userRepository.findUserById(userId);
        if (user == null) {
            throw new ApiException("User not found");
        }

        CurrentHome currentHome = currentHomeRepository.findCurrentHomeById(homeId);
        if (currentHome == null) {
            throw new ApiException("Current home not found");
        }

        if (!currentHome.getUser().getId().equals(userId)) {
            throw new ApiException("This home does not belong to the user");
        }

        currentHome.setLatitude(updatedHome.getLatitude());
        currentHome.setLongitude(updatedHome.getLongitude());
        currentHome.setExternalPropertyId(updatedHome.getExternalPropertyId());
        currentHome.setSource(updatedHome.getSource());
        currentHome.setMovedInAt(updatedHome.getMovedInAt());

        currentHomeRepository.save(currentHome);
    }


    //delete current home
    public void deleteCurrentHome(Integer userId, Integer homeId) {

        User user = userRepository.findUserById(userId);
        if (user == null) {
            throw new ApiException("User not found");
        }

        CurrentHome currentHome = currentHomeRepository.findCurrentHomeById(homeId);
        if (currentHome == null) {
            throw new ApiException("Current home not found");
        }

        if (!currentHome.getUser().getId().equals(userId)) {
            throw new ApiException("This home does not belong to the user");
        }

        currentHomeRepository.delete(currentHome);
    }

    // Confirm the user's single stored home without changing its other data.
    @Transactional
    public void confirmMove(Integer userId) {
        if (userRepository.findUserForUpdateById(userId) == null) {
            throw new ApiException("User not found");
        }
        CurrentHome home = currentHomeRepository.findHomeForUpdateByUser_Id(userId);
        if (home == null) {
            throw new ApiException("Current home not found for this user");
        }
        if (home.getMovedInAt() == null) {
            home.setMovedInAt(LocalDate.now());
            currentHomeRepository.save(home);
        }
    }

    public NeighborhoodResponseDTO getNeighborhood(Integer userId) {
        CurrentHome home = getConfirmedHome(userId);
        Map<String, GooglePlacesResponseDTO.Place> places = new LinkedHashMap<>();
        List<NeighborhoodResponseDTO.CategorySummary> categories = new ArrayList<>();

        // Use the existing discovery categories; these are not an essential-services policy.
        for (String category : PlacePreferenceService.SUPPORTED_PLACE_TYPES.stream().sorted().toList()) {
            GooglePlacesResponseDTO response = placePreferenceService.getNearbyServices(
                    home.getLatitude(), home.getLongitude(), category, 2000.0);
            List<String> ids = new ArrayList<>();
            if (response.places() != null) {
                for (GooglePlacesResponseDTO.Place place : response.places()) {
                    if (place != null && place.id() != null && !ids.contains(place.id())) {
                        places.putIfAbsent(place.id(), place);
                        ids.add(place.id());
                    }
                }
            }
            categories.add(new NeighborhoodResponseDTO.CategorySummary(category, ids.size(), ids));
        }
        return new NeighborhoodResponseDTO(home.getId(),
                new GooglePlacesResponseDTO.Location(home.getLatitude(), home.getLongitude()),
                2000, new ArrayList<>(places.values()), categories, false);
    }

    public GooglePlacesResponseDTO getNearbyByCategory(Integer userId, String category, Double radius) {
        CurrentHome home = getConfirmedHome(userId);
        return placePreferenceService.getNearbyServices(home.getLatitude(), home.getLongitude(), category, radius);
    }

    public List<NearbyInterestResponseDTO> getNearestEssential(Integer userId) {
        return getNearestEssential(userId, 2000.0);
    }

    public List<NearbyInterestResponseDTO> getNearestEssential(Integer userId, Double radius) {
        nearbyInterestService.validateRadius(radius);
        Set<String> interests = housingPreferenceService.getInterestsByUserId(userId);
        if (interests.isEmpty()) {
            return List.of();
        }
        CurrentHome home = getConfirmedHome(userId);
        return nearbyInterestService.analyze(home.getLatitude(), home.getLongitude(), interests, radius);
    }

    public List<NearbyPlaceResponseDTO> searchNearby(Integer userId, String query, Double radius) {
        CurrentHome home = getConfirmedHome(userId);
        if (query == null || query.isBlank()) {
            throw new ApiException("Search query is required");
        }
        if (radius == null || !Double.isFinite(radius) || radius <= 0 || radius > 50000) {
            throw new ApiException("Invalid search radius");
        }
        GooglePlacesResponseDTO response = googlePlacesClient.searchPlacesByText(
                home.getLatitude(), home.getLongitude(), query.trim(), radius);
        Map<String, NearbyPlaceResponseDTO> results = new LinkedHashMap<>();
        for (GooglePlacesResponseDTO.Place place : response.places()) {
            if (place == null || place.id() == null || place.location() == null
                    || !validCoordinates(place.location().latitude(), place.location().longitude())) {
                continue;
            }
            double distance = propertyService.calculateDistanceKm(home.getLatitude(), home.getLongitude(),
                    place.location().latitude(), place.location().longitude()) * 1000;
            if (distance <= radius) {
                results.putIfAbsent(place.id(), new NearbyPlaceResponseDTO(place, distance));
            }
        }
        return results.values().stream()
                .sorted(Comparator.comparing(NearbyPlaceResponseDTO::straightLineDistanceMeters)).toList();
    }

    private CurrentHome getConfirmedHome(Integer userId) {
        CurrentHome home = getCurrentHomeByUserId(userId);
        if (home.getMovedInAt() == null) {
            throw new ApiException("Please confirm your move first");
        }
        if (!validCoordinates(home.getLatitude(), home.getLongitude())) {
            throw new ApiException("Invalid current home coordinates");
        }
        return home;
    }

    private boolean validCoordinates(Double latitude, Double longitude) {
        return latitude != null && longitude != null && Double.isFinite(latitude) && Double.isFinite(longitude)
                && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
    }

    //extra endpoints

    public void isConfirmed(Integer userId){

        User user = userRepository.findUserById(userId);
        if (user == null) {
            throw new ApiException("User not found");
        }

        CurrentHome currentHome = currentHomeRepository.findCurrentHomeByUser_Id(userId);
        if(currentHome == null){
            throw new ApiException("Current home not found");
        }
    }

}
