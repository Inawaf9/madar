package com.example.madar.Service;

import com.example.madar.Api.ApiException;
import com.example.madar.DTO.Out.SavedProperty.SavedPropertySummaryDTO;
import com.example.madar.Model.SavedProperty;
import com.example.madar.Model.User;
import com.example.madar.Repository.SavedPropertyRepository;
import com.example.madar.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@Service
public class SavedPropertyService {
private final UserRepository userRepository;
private final SavedPropertyRepository savedPropertyRepository;

//get for user
 public List<SavedProperty>getMySavedProperty(Integer userId){
  User user =userRepository.findUserById(userId);
  if(user==null){
      throw new ApiException("User not found");
  }
  List<SavedProperty>userList=savedPropertyRepository.findSavedPropertiesByUser_Id(userId);

  return userList;
 }



 //add SaveProperty
    public void addSavedProperty(Integer userId,SavedProperty savedProperty){
     User user=userRepository.findUserById(userId);
     if(user==null){
         throw new ApiException("User Not Found");
     }
     savedProperty.setSource(savedProperty.getSource().toUpperCase());
     boolean exist=savedPropertyRepository.existsByUser_IdAndSourceAndExternalPropertyId(user.getId(),savedProperty.getSource(),savedProperty.getExternalPropertyId());
     if(exist){
         throw new ApiException("This property is already in your saved list");
     }
        savedProperty.setId(null);
        savedProperty.setUser(user);
        savedPropertyRepository.save(savedProperty);

    }

    //delete saved property
    public void deleteSavedProperty(Integer userId, Integer savedPropertyId){
        SavedProperty savedProperty = savedPropertyRepository.findSavedPropertyById(savedPropertyId);
        if(savedProperty == null){
            throw new ApiException("Saved property not found");
        }
        if(!savedProperty.getUser().getId().equals(userId)){
            throw new ApiException("You are not authorized to delete this saved property");
        }
        savedPropertyRepository.delete(savedProperty);
    }


    // Check if a property is saved by the user
    public boolean isPropertySaved(Integer userId, String source, String externalId) {

        User user = userRepository.findUserById(userId);
        if (user == null) {
            throw new ApiException("User not found");
        }

        return savedPropertyRepository.existsByUser_IdAndSourceAndExternalPropertyId(userId, source.toUpperCase(java.util.Locale.ROOT), externalId);
    }

    // Get saved properties summary
    public SavedPropertySummaryDTO getSavedPropertiesSummary(Integer userId) {

        User user = userRepository.findUserById(userId);
        if (user == null) {
            throw new ApiException("User not found");
        }

        List<SavedProperty> savedProperties = savedPropertyRepository.findSavedPropertiesByUser_Id(userId);

        Map<String, Long> countBySource = savedProperties.stream().collect(Collectors.groupingBy(SavedProperty::getSource, Collectors.counting()));

        return new SavedPropertySummaryDTO(savedProperties.size(), countBySource);
    }















































}
