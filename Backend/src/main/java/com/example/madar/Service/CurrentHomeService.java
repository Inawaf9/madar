package com.example.madar.Service;


import com.example.madar.Api.ApiException;
import com.example.madar.Model.CurrentHome;
import com.example.madar.Model.User;
import com.example.madar.Repository.CurrentHomeRepository;
import com.example.madar.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CurrentHomeService {

    private final CurrentHomeRepository currentHomeRepository;
    private final UserRepository userRepository;

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

    //extra endpoints




}
