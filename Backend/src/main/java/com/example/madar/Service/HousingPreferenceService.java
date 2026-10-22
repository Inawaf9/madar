package com.example.madar.Service;


import com.example.madar.Api.ApiException;
import com.example.madar.Model.HousingPreference;
import com.example.madar.Model.User;
import com.example.madar.Repository.HousingPreferenceRepository;
import com.example.madar.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;

@Service
@RequiredArgsConstructor
public class HousingPreferenceService {


    private final HousingPreferenceRepository housingPreferenceRepository;
    private final UserRepository userRepository;



    //CRUD METHODS
    // GET ALL
    public List<HousingPreference> getAllHousingPreferences() {
        return housingPreferenceRepository.findAll();
    }

    // GET BY USER ID
    public HousingPreference getHousingPreferenceByUserId(Integer userId) {

        User user = userRepository.findUserById(userId);
        if (user == null) {
            throw new ApiException("User not found");
        }

        HousingPreference preference = housingPreferenceRepository.findHousingPreferenceByUser_Id(userId);

        if (preference == null) {
            throw new ApiException("Housing preference not found");
        }

        return preference;
    }

    // ADD
    public void addHousingPreference(Integer userId, HousingPreference housingPreference) {

        User user = userRepository.findUserById(userId);
        if (user == null) {
            throw new ApiException("User not found");
        }

        HousingPreference existingPreference = housingPreferenceRepository.findHousingPreferenceByUser_Id(userId);

        if (existingPreference != null) {
            throw new ApiException("User already has housing preferences");
        }

        housingPreference.setUser(user);
        housingPreferenceRepository.save(housingPreference);
    }

    // UPDATE
    public void updateHousingPreference(Integer userId, Integer preferenceId, HousingPreference updatedPreference) {

        User user = userRepository.findUserById(userId);
        if (user == null) {
            throw new ApiException("User not found");
        }

        HousingPreference preference = housingPreferenceRepository.findHousingPreferenceById(preferenceId);

        if (preference == null) {
            throw new ApiException("Housing preference not found");
        }

        if (!preference.getUser().getId().equals(userId)) {
            throw new ApiException("This housing preference does not belong to the user");
        }

        preference.setRegion(updatedPreference.getRegion());
        preference.setCity(updatedPreference.getCity());
        preference.setDistrict(updatedPreference.getDistrict());
        preference.setMaxBudget(updatedPreference.getMaxBudget());
        preference.setPropertyType(updatedPreference.getPropertyType());
        preference.setListingType(updatedPreference.getListingType());

        if (updatedPreference.getInterests() != null) {
            preference.setInterests(new HashSet<>(updatedPreference.getInterests()));
        }

        housingPreferenceRepository.save(preference);
    }

    // DELETE
    public void deleteHousingPreference(Integer userId, Integer preferenceId) {

        User user = userRepository.findUserById(userId);
        if (user == null) {
            throw new ApiException("User not found");
        }

        HousingPreference preference = housingPreferenceRepository.findHousingPreferenceById(preferenceId);

        if (preference == null) {
            throw new ApiException("Housing preference not found");
        }

        if (!preference.getUser().getId().equals(userId)) {
            throw new ApiException("This housing preference does not belong to the user");
        }

        housingPreferenceRepository.delete(preference);
    }


}
