
package com.example.madar.Controller;

import com.example.madar.Api.ApiResponse;
import com.example.madar.DTO.Out.User.UserDashboardSummaryDTO;
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



    //USER

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

    //deactivate my account
    @PutMapping("/deactivate/{userId}")
    public ResponseEntity<?> deactivateMyAccount(@PathVariable Integer userId){
        userService.deactivateMyAccount(userId);
        return ResponseEntity.status(200).body(new ApiResponse("Account deactivated successfully"));
    }

    //reactivate my account
    @PutMapping("/reactivate/{userId}")
    public ResponseEntity<?> reactivateMyAccount(@PathVariable Integer userId){
        userService.reactivateMyAccount(userId);
        return ResponseEntity.status(200).body(new ApiResponse("Account reactivated successfully"));
    }

    @GetMapping("/profile-completion/{userId}")
    public ResponseEntity<?> getProfileCompletion(@PathVariable Integer userId) {
        return ResponseEntity.status(200).body(userService.getProfileCompletion(userId));
    }

    @GetMapping("/dashboard-summary/{userId}")
    public ResponseEntity<UserDashboardSummaryDTO> getDashboardSummary(@PathVariable Integer userId) {
        return ResponseEntity.status(200).body(userService.getDashboardSummary(userId));
    }

    //enable or disable notifications
    @PutMapping("/notifications/{userId}")
    public ResponseEntity<?> updateNotificationsSetting(@PathVariable Integer userId, @RequestParam Boolean enabled) {

        userService.updateNotificationsSetting(userId, enabled);

        return ResponseEntity.status(200).body(new ApiResponse("Notification setting updated successfully"));
    }


    //ADMIN

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

    //admin suspend user
    @PutMapping("/admin/suspend/{adminId}/{userId}")
    public ResponseEntity<?> adminSuspendUser(@PathVariable Integer adminId, @PathVariable Integer userId){
        userService.adminSuspendUser(adminId, userId);
        return ResponseEntity.status(200).body(new ApiResponse("User suspended successfully"));
    }

    //admin unsuspend user
    @PutMapping("/admin/unsuspend/{adminId}/{userId}")
    public ResponseEntity<?> adminUnsuspendUser(@PathVariable Integer adminId, @PathVariable Integer userId){
        userService.adminUnsuspendUser(adminId, userId);
        return ResponseEntity.status(200).body(new ApiResponse("User suspension removed successfully"));
    }
}
