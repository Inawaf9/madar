package com.example.madar.Service;

import com.example.madar.Api.ApiException;
import com.example.madar.Model.PlacePreference;
import com.example.madar.Model.User;
import com.example.madar.Repository.PlacePreferenceRepository;
import com.example.madar.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@RequiredArgsConstructor
@Service
public class PlacePreferenceService {
    private final PlacePreferenceRepository placePreferenceRepository;
    private final UserRepository userRepository;


    //get Places for User
public List<PlacePreference>getMyPlaces(Integer userId){
    User user=userRepository.findUserById(userId);
    if(user==null){
        throw new ApiException("User not found");
    }
    List<PlacePreference>userPlaces=placePreferenceRepository.findPlacePreferencesByUser_Id(userId);
    if(userPlaces.isEmpty()){
        throw new ApiException("No places found for this user");
    }
    return userPlaces;
}


//Post places

    public void addPlace(Integer userId, PlacePreference placePreference){
    User user=userRepository.findUserById(userId);
    if(user==null){
        throw new ApiException("User not found");
    }
        placePreference.setId(null);
        placePreference.setUser(user);
        placePreferenceRepository.save(placePreference);
    }


    //update place

    public void updatePlace(Integer userId, Integer placeId, PlacePreference updated){
        PlacePreference oldPlace = placePreferenceRepository.findPlacePreferenceById(placeId);
        if(oldPlace == null){
            throw new ApiException("Place not found");
        }
        if(!oldPlace.getUser().getId().equals(userId)){
            throw new ApiException("You are not authorized to update this place");
        }
        oldPlace.setName(updated.getName());
        oldPlace.setType(updated.getType());
        oldPlace.setLatitude(updated.getLatitude());
        oldPlace.setLongitude(updated.getLongitude());
        oldPlace.setImportance(updated.getImportance());
        oldPlace.setVisitPerWeek(updated.getVisitPerWeek());
        placePreferenceRepository.save(oldPlace);
    }



    public void deletePlace(Integer userId, Integer placeId){
        PlacePreference place = placePreferenceRepository.findPlacePreferenceById(placeId);
        if(place == null){
            throw new ApiException("Place not found");
        }
        if(!place.getUser().getId().equals(userId)){
            throw new ApiException("You are not authorized to delete this place");
        }
        placePreferenceRepository.delete(place);
    }


    //update importance only
    public void updateImportance(Integer userId, Integer placeId, Integer importance){
        PlacePreference place = placePreferenceRepository.findPlacePreferenceById(placeId);
        if(place == null){
            throw new ApiException("Place not found");
        }
        if(!place.getUser().getId().equals(userId)){
            throw new ApiException("You are not authorized to update this place");
        }
        if(importance<1||importance>5){
            throw new ApiException("Importance must be between 1 and 5");
        }
        place.setImportance(importance);
        placePreferenceRepository.save(place);
    }

























}
