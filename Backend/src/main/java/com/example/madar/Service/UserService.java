package com.example.madar.Service;

import com.example.madar.Api.ApiException;
import com.example.madar.Model.User;
import com.example.madar.Repository.HousingPreferenceRepository;
import com.example.madar.Repository.PlacePreferenceRepository;
import com.example.madar.Repository.UserRepository;
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

}