package com.example.madar.Service;



import com.example.madar.Api.ApiException;
import com.example.madar.Model.Notification;
import com.example.madar.Model.User;
import com.example.madar.Repository.NotificationRepository;
import com.example.madar.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;


    //create notification (internal use)
    @Transactional
    public void createNotification(Integer userId, String title, String message, String type, String referenceUrl) {

        User user = userRepository.findUserById(userId);

        if (user == null) {
            throw new ApiException("User not found");
        }
        boolean optionalNotification =
                "PRICE_DROP".equals(type)
                        || "PRICE_INCREASE".equals(type)
                        || "PRICE_CHANGE".equals(type)
                        || "PROMOTION".equals(type);

        if (optionalNotification
                && !Boolean.TRUE.equals(user.getNotificationsEnabled())) {
            return;
        }

        if (title == null || title.isBlank()
                || message == null || message.isBlank()
                || type == null || type.isBlank()) {
            throw new ApiException("Notification details are required");
        }

        if (referenceUrl != null
                && (!referenceUrl.startsWith("/")
                || referenceUrl.startsWith("//")
                || referenceUrl.contains("\\"))) {
            throw new ApiException("Invalid internal reference URL");
        }

        Notification notification = new Notification();
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notification.setReferenceUrl(referenceUrl);
        notification.setIsRead(false);
        notification.setUser(user);

        notificationRepository.save(notification);
    }


    //get all my notifications
    @Transactional(readOnly = true)
    public List<Notification> getMyNotifications(Integer userId) {

        checkUser(userId);

        return notificationRepository.findByUser_IdOrderByCreatedAtDesc(userId);
    }


    //get unread notifications
    @Transactional(readOnly = true)
    public List<Notification> getUnreadNotifications(Integer userId) {

        checkUser(userId);

        return notificationRepository.findByUser_IdAndIsReadFalseOrderByCreatedAtDesc(userId);
    }


    //count unread notifications
    @Transactional(readOnly = true)
    public long countUnreadNotifications(Integer userId) {

        checkUser(userId);

        return notificationRepository.countByUser_IdAndIsReadFalse(userId);
    }


    //mark notification as read
    @Transactional
    public void markAsRead(Integer userId, Integer notificationId) {

        Notification notification = notificationRepository.findByIdAndUser_Id(notificationId, userId);

        if (notification == null) {
            throw new ApiException("Notification not found for this user");
        }

        notification.setIsRead(true);
        notificationRepository.save(notification);
    }


    //mark all notifications as read
    @Transactional
    public void markAllAsRead(Integer userId) {

        checkUser(userId);

        List<Notification> notifications = notificationRepository.findByUser_IdAndIsReadFalseOrderByCreatedAtDesc(userId);

        for (Notification notification : notifications) {
            notification.setIsRead(true);
        }

        notificationRepository.saveAll(notifications);
    }


    //delete my notification
    @Transactional
    public void deleteNotification(Integer userId, Integer notificationId) {

        Notification notification = notificationRepository.findByIdAndUser_Id(notificationId, userId);

        if (notification == null) {
            throw new ApiException("Notification not found for this user");
        }

        notificationRepository.delete(notification);
    }


    //helper method
    private void checkUser(Integer userId) {

        if (userRepository.findUserById(userId) == null) {
            throw new ApiException("User not found");
        }
    }
}
