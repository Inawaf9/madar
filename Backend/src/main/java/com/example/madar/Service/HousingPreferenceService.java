package com.example.madar.Service;


import com.example.madar.Api.ApiException;
import com.example.madar.Model.HousingPreference;
import com.example.madar.Model.User;
import com.example.madar.Repository.HousingPreferenceRepository;
import com.example.madar.Repository.UserRepository;
import com.example.madar.Util.PlaceCategories;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

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

    // Materialize the collection inside the transaction, before external API calls.
    @Transactional(readOnly = true)
    public Set<String> getInterestsByUserId(Integer userId) {
        if (userId == null || userId <= 0) {
            throw new ApiException("Invalid user ID");
        }
        return PlaceCategories.normalize(getHousingPreferenceByUserId(userId).getInterests());
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

        housingPreference.setInterests(PlaceCategories.normalize(housingPreference.getInterests()));
        housingPreference.setUser(user);
        housingPreferenceRepository.save(housingPreference);
    }

    // UPDATE
    @Transactional
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

        Set<String> interests = PlaceCategories.normalize(updatedPreference.getInterests() == null
                ? preference.getInterests() : updatedPreference.getInterests());

        preference.setRegion(updatedPreference.getRegion());
        preference.setCity(updatedPreference.getCity());
        preference.setDistrict(updatedPreference.getDistrict());
        preference.setMaxBudget(updatedPreference.getMaxBudget());
        preference.setPropertyType(updatedPreference.getPropertyType());
        preference.setListingType(updatedPreference.getListingType());

        preference.setInterests(interests);
        preference.setOccupantsCount(updatedPreference.getOccupantsCount());

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
