package com.example.madar.Service;


import com.example.madar.Api.ApiException;
import com.example.madar.Model.HousingPreference;
import com.example.madar.Model.LifestyleInterest;
import com.example.madar.Repository.HousingPreferenceRepository;
import com.example.madar.Repository.LifestyleInterestRepository;
import com.example.madar.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class LifestyleInterestService {

    private final LifestyleInterestRepository lifestyleInterestRepository;
    private final HousingPreferenceRepository housingPreferenceRepository;
    private final UserRepository userRepository;


    // GET ALL INTERESTS
    public List<LifestyleInterest> getAllLifestyleInterests() {
        return lifestyleInterestRepository.findAll();
    }


    // GET USER INTERESTS
    public List<LifestyleInterest> getUserLifestyleInterests(Integer userId) {

        if (userRepository.findUserById(userId) == null) {
            throw new ApiException("User not found");
        }

        HousingPreference preference = housingPreferenceRepository.findHousingPreferenceByUser_Id(userId);

        if (preference == null) {
            throw new ApiException("Housing preference not found");
        }

        return lifestyleInterestRepository.findByHousingPreference_Id(preference.getId());
    }


    // ADD INTEREST
    @Transactional
    public void addLifestyleInterest(Integer userId, LifestyleInterest interest) {

        if (userRepository.findUserById(userId) == null) {
            throw new ApiException("User not found");
        }

        HousingPreference preference = housingPreferenceRepository.findHousingPreferenceByUser_Id(userId);

        if (preference == null) {
            throw new ApiException("Housing preference not found");
        }

        if (interest == null || interest.getCode() == null || interest.getCode().isBlank()) {
            throw new ApiException("Interest code is required");
        }

        String code = interest.getCode().trim().toLowerCase(Locale.ROOT);

        if (lifestyleInterestRepository.existsByHousingPreference_IdAndCodeIgnoreCase(preference.getId(), code)) {
            throw new ApiException("This interest is already added");
        }

        configureInterest(interest, code);

        interest.setHousingPreference(preference);

        lifestyleInterestRepository.save(interest);
    }


    // UPDATE INTEREST
    @Transactional
    public void updateLifestyleInterest(Integer userId, Integer interestId, LifestyleInterest updatedInterest) {

        if (userRepository.findUserById(userId) == null) {
            throw new ApiException("User not found");
        }

        LifestyleInterest interest = lifestyleInterestRepository.findLifestyleInterestById(interestId);

        if (interest == null) {
            throw new ApiException("Lifestyle interest not found");
        }

        if (!interest.getHousingPreference().getUser().getId().equals(userId)) {
            throw new ApiException("This interest does not belong to the user");
        }

        if (updatedInterest == null || updatedInterest.getCode() == null || updatedInterest.getCode().isBlank()) {
            throw new ApiException("Interest code is required");
        }

        String code = updatedInterest.getCode().trim().toLowerCase(Locale.ROOT);

        if (lifestyleInterestRepository.existsByHousingPreference_IdAndCodeIgnoreCaseAndIdNot(interest.getHousingPreference().getId(), code, interestId)) {
            throw new ApiException("This interest is already added");
        }

        Boolean requestedActive = updatedInterest.getActive();
        Boolean previousActive = interest.getActive();

        configureInterest(interest, code);

        interest.setActive(requestedActive != null ? requestedActive : previousActive);

        lifestyleInterestRepository.save(interest);
    }


    // DELETE INTEREST
    @Transactional
    public void deleteLifestyleInterest(Integer userId, Integer interestId) {

        if (userRepository.findUserById(userId) == null) {
            throw new ApiException("User not found");
        }

        LifestyleInterest interest =
                lifestyleInterestRepository.findLifestyleInterestById(interestId);

        if (interest == null) {
            throw new ApiException("Lifestyle interest not found");
        }

        if (!interest.getHousingPreference().getUser().getId().equals(userId)) {
            throw new ApiException("This interest does not belong to the user");
        }

        lifestyleInterestRepository.delete(interest);
    }


    //helper methods

    // CONFIGURE INTEREST BASED ON USER SELECTION
    private void configureInterest(LifestyleInterest interest, String code) {

        interest.setCode(code);
        interest.setActive(true);
        interest.setGooglePlaceType(null);
        interest.setSearchQuery(null);

        switch (code) {

            // GENERAL CATEGORIES - OPTIONAL SUBCATEGORY

            case "education" -> setText(interest, "EDUCATION", "مدارس وجامعات");

            case "health" -> setText(interest, "HEALTH", "مرافق صحية");

            case "sports" -> setText(interest, "SPORTS", "مرافق رياضية");

            case "shopping" -> setText(interest, "SHOPPING", "أماكن تسوق");

            case "nature" -> setText(interest, "NATURE", "حدائق ومماشي");

            case "food" -> setText(interest, "FOOD", "مطاعم ومقاهي");

            case "transport" -> setText(interest, "TRANSPORT", "محطات نقل عام");

            case "services" -> setText(interest, "SERVICES", "خدمات يومية");


            // EDUCATION - SAUDI SCHOOL STAGES

            case "kindergarten" -> setNearby(interest, "EDUCATION", "preschool");

            case "primary_school" -> setNearby(interest, "EDUCATION", "primary_school");

            case "intermediate_school" -> setText(interest, "EDUCATION", "مدرسة متوسطة");

            case "high_school" -> setNearby(interest, "EDUCATION", "secondary_school");

            case "university" -> setNearby(interest, "EDUCATION", "university");


            // HEALTH

            case "hospital" -> setNearby(interest, "HEALTH", "hospital");

            case "medical_center" -> setText(interest, "HEALTH", "مركز طبي");

            case "medical_clinic" -> setText(interest, "HEALTH", "عيادة طبية");

            case "dentist" -> setNearby(interest, "HEALTH", "dentist");

            case "pharmacy" -> setNearby(interest, "HEALTH", "pharmacy");

            case "physiotherapy" -> setText(interest, "HEALTH", "مركز علاج طبيعي");


            // SPORTS

            case "fitness" -> setNearby(interest, "SPORTS", "gym");

            case "swimming_pool" -> setText(interest, "SPORTS", "مسبح");

            case "yoga" -> setText(interest, "SPORTS", "مركز يوغا");

            case "sports_field" -> setText(interest, "SPORTS", "ملعب رياضي");

            case "sports_complex" -> setText(interest, "SPORTS", "مجمع رياضي");


            // SHOPPING

            case "supermarket" -> setNearby(interest, "SHOPPING", "supermarket");

            case "hypermarket" -> setText(interest, "SHOPPING", "هايبر ماركت");

            case "shopping_mall" -> setNearby(interest, "SHOPPING", "shopping_mall");

            case "furniture" -> setNearby(interest, "SHOPPING", "furniture_store");

            case "home_goods" -> setText(interest, "SHOPPING", "مستلزمات منزلية");


            // NATURE

            case "park" -> setNearby(interest, "NATURE", "park");

            case "walking_track" -> setText(interest, "NATURE", "ممشى");

            case "playground" -> setText(interest, "NATURE", "ملعب أطفال");


            // FOOD

            case "restaurant" -> setNearby(interest, "FOOD", "restaurant");

            case "cafe" -> setNearby(interest, "FOOD", "cafe");

            case "bakery" -> setNearby(interest, "FOOD", "bakery");


            // TRANSPORT

            case "metro" -> setNearby(interest, "TRANSPORT", "subway_station");

            case "bus_station" -> setNearby(interest, "TRANSPORT", "bus_station");


            // DAILY SERVICES

            case "bank" -> setNearby(interest, "SERVICES", "bank");

            case "atm" -> setNearby(interest, "SERVICES", "atm");

            case "laundry" -> setNearby(interest, "SERVICES", "laundry");

            case "gas_station" -> setNearby(interest, "SERVICES", "gas_station");


            default -> throw new ApiException("Unsupported interest: " + code);
        }
    }


    // GOOGLE NEARBY SEARCH CONFIGURATION
    private void setNearby(LifestyleInterest interest, String category, String googleType) {

        interest.setCategory(category);
        interest.setSearchType(LifestyleInterest.SearchType.NEARBY);
        interest.setGooglePlaceType(googleType);
    }


    // GOOGLE TEXT SEARCH CONFIGURATION
    private void setText(LifestyleInterest interest, String category, String query) {

        interest.setCategory(category);
        interest.setSearchType(LifestyleInterest.SearchType.TEXT);
        interest.setSearchQuery(query);
    }
}