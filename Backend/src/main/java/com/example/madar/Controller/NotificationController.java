package com.example.madar.Controller;

import com.example.madar.Security.CurrentUserAccess;
import com.example.madar.Security.ResourceOwnershipAccess;


import com.example.madar.Api.ApiResponse;
import com.example.madar.Service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/notification")
@RequiredArgsConstructor
public class NotificationController {

    private final CurrentUserAccess currentUserAccess;
    private final ResourceOwnershipAccess resourceOwnershipAccess;
    private final NotificationService notificationService;


    //get all my notifications
    @GetMapping("/me")
    public ResponseEntity<?> getMyNotifications() {
        Integer userId = currentUserAccess.getCurrentUserId();

        return ResponseEntity.status(200).body(notificationService.getMyNotifications(userId));
    }


    //get unread notifications
    @GetMapping("/me/unread")
    public ResponseEntity<?> getUnreadNotifications() {
        Integer userId = currentUserAccess.getCurrentUserId();

        return ResponseEntity.status(200).body(notificationService.getUnreadNotifications(userId));
    }


    //count unread notifications
    @GetMapping("/me/unread-count")
    public ResponseEntity<?> countUnreadNotifications() {
        Integer userId = currentUserAccess.getCurrentUserId();

        return ResponseEntity.status(200).body(Map.of("unreadCount", notificationService.countUnreadNotifications(userId)));
    }


    //mark notification as read
    @PutMapping("/me/{notificationId}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Integer notificationId) {
        Integer userId = currentUserAccess.getCurrentUserId();
        resourceOwnershipAccess.requireNotification(notificationId);


        notificationService.markAsRead(userId, notificationId);

        return ResponseEntity.status(200).body(new ApiResponse("Notification marked as read"));
    }


    //mark all notifications as read
    @PutMapping("/me/read-all")
    public ResponseEntity<?> markAllAsRead() {
        Integer userId = currentUserAccess.getCurrentUserId();


        notificationService.markAllAsRead(userId);

        return ResponseEntity.status(200).body(new ApiResponse("All notifications marked as read"));
    }


    //delete my notification
    @DeleteMapping("/me/{notificationId}")
    public ResponseEntity<?> deleteNotification(@PathVariable Integer notificationId) {
        Integer userId = currentUserAccess.getCurrentUserId();
        resourceOwnershipAccess.requireNotification(notificationId);


        notificationService.deleteNotification(userId, notificationId);

        return ResponseEntity.status(200).body(new ApiResponse("Notification deleted successfully"));
    }
}