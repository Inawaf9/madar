
package com.example.madar.Controller;

import com.example.madar.Security.CurrentUserAccess;

import com.example.madar.Api.ApiResponse;
import com.example.madar.DTO.Out.User.UserDashboardSummaryDTO;
import com.example.madar.Service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/user")
@RequiredArgsConstructor
public class UserController {

    private final CurrentUserAccess currentUserAccess;
    private final UserService userService;



    //USER

    // Legacy registration, credential updates and reactivation remain disabled.

    //get my account
    @GetMapping("/me")
    public ResponseEntity<?> getMyAccount(){
        Integer userId = currentUserAccess.getCurrentUserId();

        return ResponseEntity.status(200).body(userService.getMyAccount(userId));
    }


    //delete my account
    @DeleteMapping("/me")
    public ResponseEntity<?> deleteMyAccount(){
        Integer userId = currentUserAccess.getCurrentUserId();

        userService.deleteMyAccount(userId);
        return ResponseEntity.status(200).body(new ApiResponse("Account deleted successfully"));
    }

    //deactivate my account
    @PutMapping("/me/deactivate")
    public ResponseEntity<?> deactivateMyAccount(){
        Integer userId = currentUserAccess.getCurrentUserId();

        userService.deactivateMyAccount(userId);
        return ResponseEntity.status(200).body(new ApiResponse("Account deactivated successfully"));
    }


    @GetMapping("/me/profile-completion")
    public ResponseEntity<?> getProfileCompletion() {
        Integer userId = currentUserAccess.getCurrentUserId();

        return ResponseEntity.status(200).body(userService.getProfileCompletion(userId));
    }

    @GetMapping("/me/dashboard-summary")
    public ResponseEntity<UserDashboardSummaryDTO> getDashboardSummary() {
        Integer userId = currentUserAccess.getCurrentUserId();

        return ResponseEntity.status(200).body(userService.getDashboardSummary(userId));
    }

    //enable or disable notifications
    @PutMapping("/me/notifications")
    public ResponseEntity<?> updateNotificationsSetting(@RequestParam Boolean enabled) {
        Integer userId = currentUserAccess.getCurrentUserId();


        userService.updateNotificationsSetting(userId, enabled);

        return ResponseEntity.status(200).body(new ApiResponse("Notification setting updated successfully"));
    }






    //ADMIN

    //admin get all users
    @GetMapping("/admin/users")
    public ResponseEntity<?> getAllUsers(){
        currentUserAccess.requireAdmin();
        Integer adminId = currentUserAccess.getCurrentUserId();

        return ResponseEntity.status(200).body(userService.getAllUsers(adminId));
    }


    //admin delete user
    @DeleteMapping("/admin/users/{targetUserId}")
    public ResponseEntity<?> adminDeleteUser(@PathVariable Integer targetUserId){
        currentUserAccess.requireAdmin();
        Integer adminId = currentUserAccess.getCurrentUserId();

        userService.adminDeleteUser(adminId, targetUserId);
        return ResponseEntity.status(200).body(new ApiResponse("User deleted by admin successfully"));
    }

    //admin suspend user
    @PutMapping("/admin/users/{targetUserId}/suspend")
    public ResponseEntity<?> adminSuspendUser(@PathVariable Integer targetUserId){
        currentUserAccess.requireAdmin();
        Integer adminId = currentUserAccess.getCurrentUserId();

        userService.adminSuspendUser(adminId, targetUserId);
        return ResponseEntity.status(200).body(new ApiResponse("User suspended successfully"));
    }

    //admin unsuspend user
    @PutMapping("/admin/users/{targetUserId}/unsuspend")
    public ResponseEntity<?> adminUnsuspendUser(@PathVariable Integer targetUserId){
        currentUserAccess.requireAdmin();
        Integer adminId = currentUserAccess.getCurrentUserId();

        userService.adminUnsuspendUser(adminId, targetUserId);
        return ResponseEntity.status(200).body(new ApiResponse("User suspension removed successfully"));
    }
}
