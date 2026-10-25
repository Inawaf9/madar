package com.example.madar.Controller;


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

    private final NotificationService notificationService;


    //get all my notifications
    @GetMapping("/get-all/{userId}")
    public ResponseEntity<?> getMyNotifications(@PathVariable Integer userId) {
        return ResponseEntity.status(200).body(notificationService.getMyNotifications(userId));
    }


    //get unread notifications
    @GetMapping("/unread/{userId}")
    public ResponseEntity<?> getUnreadNotifications(@PathVariable Integer userId) {
        return ResponseEntity.status(200).body(notificationService.getUnreadNotifications(userId));
    }


    //count unread notifications
    @GetMapping("/unread-count/{userId}")
    public ResponseEntity<?> countUnreadNotifications(@PathVariable Integer userId) {
        return ResponseEntity.status(200).body(Map.of("unreadCount", notificationService.countUnreadNotifications(userId)));
    }


    //mark notification as read
    @PutMapping("/mark-read/{userId}/{notificationId}")
    public ResponseEntity<?> markAsRead(@PathVariable Integer userId, @PathVariable Integer notificationId) {

        notificationService.markAsRead(userId, notificationId);

        return ResponseEntity.status(200).body(new ApiResponse("Notification marked as read"));
    }


    //mark all notifications as read
    @PutMapping("/mark-all-read/{userId}")
    public ResponseEntity<?> markAllAsRead(@PathVariable Integer userId) {

        notificationService.markAllAsRead(userId);

        return ResponseEntity.status(200).body(new ApiResponse("All notifications marked as read"));
    }


    //delete my notification
    @DeleteMapping("/delete/{userId}/{notificationId}")
    public ResponseEntity<?> deleteNotification(@PathVariable Integer userId, @PathVariable Integer notificationId) {

        notificationService.deleteNotification(userId, notificationId);

        return ResponseEntity.status(200).body(new ApiResponse("Notification deleted successfully"));
    }
}