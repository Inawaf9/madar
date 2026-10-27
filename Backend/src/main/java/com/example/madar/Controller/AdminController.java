package com.example.madar.Controller;



import com.example.madar.Api.ApiResponse;
import com.example.madar.DTO.Out.Admin.AdminDashboardDTO;
import com.example.madar.DTO.Out.Admin.AdminUserDTO;
import com.example.madar.DTO.Out.Payment.PaymentResponseDTO;
import com.example.madar.Model.AdminAuditLog;
import com.example.madar.Security.CurrentUserAccess;
import com.example.madar.Service.AdminService;
import com.example.madar.Service.SystemHealthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.madar.Model.AdminAuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Page;

import java.util.List;

@RestController
@RequestMapping("/api/v1/user/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final CurrentUserAccess currentUserAccess;
    private final SystemHealthService systemHealthService;

    // Get all users

    @GetMapping("/users")
    public ResponseEntity<Page<AdminUserDTO>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status) {

        currentUserAccess.requireAdmin();

        Integer adminId = currentUserAccess.getCurrentUserId();

        return ResponseEntity.status(200).body(adminService.getAllUsers(adminId, page, size, status));
    }


    // Delete user
    @DeleteMapping("/users/{targetUserId}")
    public ResponseEntity<?> deleteUser(@PathVariable Integer targetUserId) {

        currentUserAccess.requireAdmin();
        Integer adminId = currentUserAccess.getCurrentUserId();

        adminService.adminDeleteUser(adminId, targetUserId);

        return ResponseEntity.status(200).body(new ApiResponse("User deleted successfully"));
    }

    // Suspend user
    @PutMapping("/users/{targetUserId}/suspend")
    public ResponseEntity<?> suspendUser(@PathVariable Integer targetUserId) {

        currentUserAccess.requireAdmin();
        Integer adminId = currentUserAccess.getCurrentUserId();

        adminService.adminSuspendUser(adminId, targetUserId);

        return ResponseEntity.status(200).body(new ApiResponse("User suspended successfully"));
    }

    // Unsuspend user
    @PutMapping("/users/{targetUserId}/unsuspend")
    public ResponseEntity<?> unsuspendUser(@PathVariable Integer targetUserId) {

        currentUserAccess.requireAdmin();
        Integer adminId = currentUserAccess.getCurrentUserId();

        adminService.adminUnsuspendUser(adminId, targetUserId);

        return ResponseEntity.status(200).body(new ApiResponse("User unsuspended successfully"));
    }


    // Admin dashboard statistics

    @GetMapping("/dashboard")
    public ResponseEntity<AdminDashboardDTO> getDashboardStatistics() {

        currentUserAccess.requireAdmin();
        Integer adminId = currentUserAccess.getCurrentUserId();

        return ResponseEntity.status(200).body(adminService.getDashboardStatistics(adminId));
    }



    // Search users
    @GetMapping("/users/search")
    public ResponseEntity<Page<AdminUserDTO>> searchUsers(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        currentUserAccess.requireAdmin();

        Integer adminId = currentUserAccess.getCurrentUserId();

        return ResponseEntity.status(200).body(adminService.searchUsers(adminId, keyword, page, size));
    }

    // Get user details
    @GetMapping("/users/{userId}")
    public ResponseEntity<AdminUserDTO> getUserById(@PathVariable Integer userId) {

        currentUserAccess.requireAdmin();
        Integer adminId = currentUserAccess.getCurrentUserId();

        return ResponseEntity.status(200).body(adminService.getUserById(adminId, userId));
    }

    // Latest registered users
    @GetMapping("/dashboard/recent-users")
    public ResponseEntity<List<AdminUserDTO>> getRecentUsers() {

        currentUserAccess.requireAdmin();

        Integer adminId = currentUserAccess.getCurrentUserId();

        return ResponseEntity.status(200).body(adminService.getRecentUsers(adminId));
    }


    // All payments
    @GetMapping("/payments")
    public ResponseEntity<Page<PaymentResponseDTO>> getAllPayments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status) {

        currentUserAccess.requireAdmin();

        Integer adminId = currentUserAccess.getCurrentUserId();

        return ResponseEntity.status(200).body(adminService.getAllPayments(adminId, page, size, status));
    }

    // Payment details
    @GetMapping("/payments/{paymentId}")
    public ResponseEntity<PaymentResponseDTO> getPaymentById(
            @PathVariable Integer paymentId) {

        currentUserAccess.requireAdmin();

        Integer adminId = currentUserAccess.getCurrentUserId();

        return ResponseEntity.status(200).body(adminService.getPaymentById(adminId, paymentId));
    }


    // Admin gifts credits to a user
    @PostMapping("/users/{targetUserId}/gift-credits")
    public ResponseEntity<ApiResponse> giftCredits(
            @PathVariable Integer targetUserId,
            @RequestParam Integer credits,
            @RequestHeader("Idempotency-Key") String operationId) {

        currentUserAccess.requireAdmin();

        Integer adminId = currentUserAccess.getCurrentUserId();

        adminService.giftCreditsToUser(adminId, targetUserId, credits, operationId);

        return ResponseEntity.status(200).body(new ApiResponse("Credits gifted successfully"));
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<Page<AdminAuditLog>> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        currentUserAccess.requireAdmin();

        Integer adminId = currentUserAccess.getCurrentUserId();

        return ResponseEntity.status(200).body(adminService.getAuditLogs(adminId, page, size));
    }

    // System Health Dashboard
    @GetMapping("/system-health")
    public ResponseEntity<?> getSystemHealth() {

        currentUserAccess.requireAdmin();

        return ResponseEntity.status(200).body(systemHealthService.getSystemHealth());
    }




}

