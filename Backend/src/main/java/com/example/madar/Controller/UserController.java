package com.example.madar.Controller;

import com.example.madar.Api.ApiResponse;
import com.example.madar.Model.User;
import com.example.madar.Service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    //register
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody @Valid User user){
        userService.register(user);
        return ResponseEntity.status(200).body(new ApiResponse("User registered successfully"));
    }

    //get my account
    @GetMapping("/get/{userId}")
    public ResponseEntity<?> getMyAccount(@PathVariable Integer userId){
        return ResponseEntity.status(200).body(userService.getMyAccount(userId));
    }

    //update my account
    @PutMapping("/update/{userId}")
    public ResponseEntity<?> updateMyAccount(@PathVariable Integer userId, @RequestBody @Valid User user){
        userService.updateMyAccount(userId, user);
        return ResponseEntity.status(200).body(new ApiResponse("Account updated successfully"));
    }

    //delete my account
    @DeleteMapping("/delete/{userId}")
    public ResponseEntity<?> deleteMyAccount(@PathVariable Integer userId){
        userService.deleteMyAccount(userId);
        return ResponseEntity.status(200).body(new ApiResponse("Account deleted successfully"));
    }

    //admin get all users
    @GetMapping("/admin/get-all/{adminId}")
    public ResponseEntity<?> getAllUsers(@PathVariable Integer adminId){
        return ResponseEntity.status(200).body(userService.getAllUsers(adminId));
    }

    //admin update user
    @PutMapping("/admin/update/{adminId}/{userId}")
    public ResponseEntity<?> adminUpdateUser(@PathVariable Integer adminId, @PathVariable Integer userId, @RequestBody @Valid User user){
        userService.adminUpdateUser(adminId, userId, user);
        return ResponseEntity.status(200).body(new ApiResponse("User updated by admin successfully"));
    }

    //admin delete user
    @DeleteMapping("/admin/delete/{adminId}/{userId}")
    public ResponseEntity<?> adminDeleteUser(@PathVariable Integer adminId, @PathVariable Integer userId){
        userService.adminDeleteUser(adminId, userId);
        return ResponseEntity.status(200).body(new ApiResponse("User deleted by admin successfully"));
    }
}