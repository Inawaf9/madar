package com.example.madar.Service;

import com.example.madar.Api.ApiException;
import com.example.madar.DTO.Out.User.ProfileCompletionDTO;
import com.example.madar.DTO.Out.User.UserDashboardSummaryDTO;
import com.example.madar.Model.CurrentHome;
import com.example.madar.Model.HousingPreference;
import com.example.madar.Model.User;
import com.example.madar.Repository.*;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@RequiredArgsConstructor
@Service
public class UserService {

    private final UserRepository userRepository;
    private final HousingPreferenceRepository housingPreferenceRepository;
    private final PlacePreferenceRepository placePreferenceRepository;
    private final SavedPropertyRepository savedPropertyRepository;
    private final CurrentHomeRepository currentHomeRepository;
    private final LifestyleInterestRepository lifestyleInterestRepository;


    //get all users Todo:(admin)
    //admin get all users
    public List<User> getAllUsers(Integer adminId){
        checkAdmin(adminId);
        return userRepository.findAll();
    }

    //get my account
    public User getMyAccount(Integer userId){
        User user = userRepository.findUserById(userId);
        if(user == null){
            throw new ApiException("User not found");
        }
        return user;
    }

    //register
    public void register(User user){
        if(userRepository.existsByEmail(user.getEmail())){
            throw new ApiException("Email is already registered");
        }
        user.setId(null);
        user.setRole("USER");
        //Todo : encode password with BCrypt when Spring Security is added
        userRepository.save(user);
    }

    //update my account
    public void updateMyAccount(Integer userId, User updated){
        User oldUser = userRepository.findUserById(userId);
        if(oldUser == null){
            throw new ApiException("User not found");
        }
        User userWithEmail = userRepository.findUserByEmail(updated.getEmail());
        if(userWithEmail != null && !userWithEmail.getId().equals(userId)){
            throw new ApiException("Email is already used by another account");
        }
        oldUser.setFullName(updated.getFullName());
        oldUser.setEmail(updated.getEmail());
        oldUser.setPassword(updated.getPassword());
        userRepository.save(oldUser);
    }

    //delete my account
    public void deleteMyAccount(Integer userId){
        User user = userRepository.findUserById(userId);
        if(user == null){
            throw new ApiException("User not found");
        }
        userRepository.delete(user);
    }
    //check admin
    private void checkAdmin(Integer adminId){
        User admin = userRepository.findUserById(adminId);
        if(admin == null){
            throw new ApiException("Admin not found");
        }
        if(!admin.getRole().equals("ADMIN")){
            throw new ApiException("Only admin can perform this action");
        }
    }

    //admin update user
    public void adminUpdateUser(Integer adminId, Integer userId, User updated){
        checkAdmin(adminId);
        User oldUser = userRepository.findUserById(userId);
        if(oldUser == null){
            throw new ApiException("User not found");
        }
        User userWithEmail = userRepository.findUserByEmail(updated.getEmail());
        if(userWithEmail != null && !userWithEmail.getId().equals(userId)){
            throw new ApiException("Email is already used by another account");
        }
        oldUser.setFullName(updated.getFullName());
        oldUser.setEmail(updated.getEmail());
        oldUser.setPassword(updated.getPassword());
        userRepository.save(oldUser);
    }

    //admin delete user
    public void adminDeleteUser(Integer adminId, Integer userId){
        checkAdmin(adminId);
        if(adminId.equals(userId)){
            throw new ApiException("Admin cannot delete their own account from here");
        }
        User user = userRepository.findUserById(userId);
        if(user == null){
            throw new ApiException("User not found");
        }
        userRepository.delete(user);
    }




    /**
     * Returns profile completion status for the frontend.
     * Missing features are optional suggestions, not mandatory steps.
     * The frontend translates messageKeys to Arabic or English.
     */
    @Transactional(readOnly = true)
    public ProfileCompletionDTO getProfileCompletion(Integer userId) {

        User user = userRepository.findUserById(userId);
        if (user == null) {
            throw new ApiException("User not found");
        }

        HousingPreference preference = housingPreferenceRepository.findHousingPreferenceByUser_Id(userId);

        boolean housingCompleted = preference != null;

        boolean placesCompleted = !placePreferenceRepository.findPlacePreferencesByUser_Id(userId).isEmpty();

        boolean interestsCompleted = preference != null
                && lifestyleInterestRepository
                .findByHousingPreference_Id(preference.getId())
                .stream()
                .anyMatch(interest -> Boolean.TRUE.equals(interest.getActive()));

        List<ProfileCompletionDTO.MissingFeature> missingFeatures = new ArrayList<>();

        if (!housingCompleted) {
            missingFeatures.add(new ProfileCompletionDTO.MissingFeature("HOUSING_PREFERENCE", "profile.housingPreference.missing"));
        }

        if (!placesCompleted) {
            missingFeatures.add(new ProfileCompletionDTO.MissingFeature("IMPORTANT_LOCATIONS", "profile.importantLocations.missing"));
        }

        if (!interestsCompleted) {
            missingFeatures.add(new ProfileCompletionDTO.MissingFeature("INTERESTS", "profile.interests.missing"));
        }

        int completed = 0;
        if (housingCompleted) completed++;
        if (placesCompleted) completed++;
        if (interestsCompleted) completed++;

        int percentage = Math.round(completed * 100f / 3);

        return new ProfileCompletionDTO(percentage, housingCompleted, placesCompleted, interestsCompleted, housingCompleted, missingFeatures);
    }

    // Get user dashboard summary
    @Transactional(readOnly = true)
    public UserDashboardSummaryDTO getDashboardSummary(Integer userId) {

        User user = userRepository.findUserById(userId);
        if (user == null) {
            throw new ApiException("User not found");
        }

        boolean housingCompleted = housingPreferenceRepository.findHousingPreferenceByUser_Id(userId) != null;

        long savedCount = savedPropertyRepository.findSavedPropertiesByUser_Id(userId).size();

        long placesCount = placePreferenceRepository.findPlacePreferencesByUser_Id(userId).size();

        CurrentHome home = currentHomeRepository.findCurrentHomeByUser_Id(userId);

        String homeStatus = home == null
                ? "NO_HOME"
                : home.getMovedInAt() == null
                ? "HOME_SET"
                : "MOVED_IN";

        return new UserDashboardSummaryDTO(userId, housingCompleted, savedCount, placesCount, homeStatus);
    }


}