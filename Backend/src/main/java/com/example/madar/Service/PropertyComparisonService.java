package com.example.madar.Service;



import com.example.madar.Api.ApiException;
import com.example.madar.Model.PropertyComparison;
import com.example.madar.Model.User;
import com.example.madar.Repository.PropertyComparisonRepository;
import com.example.madar.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PropertyComparisonService {

    private final PropertyComparisonRepository comparisonRepository;
    private final UserRepository userRepository;



    //CRUD METHODS
    // GET ALL
    public List<PropertyComparison> getAllComparisons() {
        return comparisonRepository.findAll();
    }

    // GET BY USER ID
    public List<PropertyComparison> getComparisonsByUserId(Integer userId) {

        User user = userRepository.findUserById(userId);
        if (user == null) {
            throw new ApiException("User not found");
        }

        return comparisonRepository.findPropertyComparisonsByUser_Id(userId);
    }

    // GET BY ID
    public PropertyComparison getComparisonById(Integer userId, Integer comparisonId) {

        PropertyComparison comparison =
                comparisonRepository.findPropertyComparisonByIdAndUser_Id(comparisonId, userId);

        if (comparison == null) {
            throw new ApiException("Comparison not found for this user");
        }

        return comparison;
    }

    // ADD
    public void addComparison(Integer userId, PropertyComparison comparison) {

        User user = userRepository.findUserById(userId);
        if (user == null) {
            throw new ApiException("User not found");
        }

        validateComparison(userId, comparison, null);

        comparison.setUser(user);
        comparisonRepository.save(comparison);
    }

    // UPDATE
    public void updateComparison(Integer userId, Integer comparisonId,
                                 PropertyComparison updatedComparison) {

        PropertyComparison comparison =
                comparisonRepository.findPropertyComparisonByIdAndUser_Id(comparisonId, userId);

        if (comparison == null) {
            throw new ApiException("Comparison not found for this user");
        }

        validateComparison(userId, updatedComparison, comparisonId);

        comparison.setFirstPropertyId(updatedComparison.getFirstPropertyId());
        comparison.setFirstPropertySource(updatedComparison.getFirstPropertySource());
        comparison.setSecondPropertyId(updatedComparison.getSecondPropertyId());
        comparison.setSecondPropertySource(updatedComparison.getSecondPropertySource());

        comparisonRepository.save(comparison);
    }

    // DELETE
    public void deleteComparison(Integer userId, Integer comparisonId) {

        PropertyComparison comparison =
                comparisonRepository.findPropertyComparisonByIdAndUser_Id(comparisonId, userId);

        if (comparison == null) {
            throw new ApiException("Comparison not found for this user");
        }

        comparisonRepository.delete(comparison);
    }






    //Helper methods
    private void validateComparison(Integer userId, PropertyComparison comparison, Integer comparisonId) {

        // Get the properties' IDs and sources
        String firstId = comparison.getFirstPropertyId();
        String secondId = comparison.getSecondPropertyId();
        String firstSource = comparison.getFirstPropertySource();
        String secondSource = comparison.getSecondPropertySource();


        // Prevent comparing a property with itself
        if (firstId.equals(secondId) && firstSource.equals(secondSource)) {
            throw new ApiException("Cannot compare a property with itself");
        }


        // Get all saved comparisons for this user
        List<PropertyComparison> comparisons = comparisonRepository.findPropertyComparisonsByUser_Id(userId);


        // Check each saved comparison for duplicates
        for (PropertyComparison savedComparison : comparisons) {

            // During update, skip the comparison being updated
            if (savedComparison.getId().equals(comparisonId)) {
                continue;
            }


            // Check if both comparisons have the same properties in the same order
            // Example: A-B = A-B
            boolean sameOrder = savedComparison.getFirstPropertyId().equals(firstId) && savedComparison.getFirstPropertySource().equals(firstSource) &&
                            savedComparison.getSecondPropertyId().equals(secondId) && savedComparison.getSecondPropertySource().equals(secondSource);


            // Check if both comparisons have the same properties in reverse order
            // Example: A-B = B-A
            boolean reversedOrder = savedComparison.getFirstPropertyId().equals(secondId) && savedComparison.getFirstPropertySource().equals(secondSource) &&
                            savedComparison.getSecondPropertyId().equals(firstId) && savedComparison.getSecondPropertySource().equals(firstSource);


            // Reject the comparison if it already exists in either order
            if (sameOrder || reversedOrder) {
                throw new ApiException("This comparison already exists");
            }
        }
    }



}
