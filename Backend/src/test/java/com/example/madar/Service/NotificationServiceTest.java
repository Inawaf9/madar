
package com.example.madar.Service;

import com.example.madar.Model.Notification;
import com.example.madar.Repository.NotificationRepository;
import com.example.madar.Repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock NotificationRepository notificationRepository;
    @Mock UserRepository userRepository;

    @InjectMocks NotificationService service;

    @Test
    void markNotificationAsReadTest() {
        Notification notification = new Notification();
        notification.setIsRead(false);

        when(notificationRepository.findByIdAndUser_Id(5, 1))
                .thenReturn(notification);

        service.markAsRead(1, 5);

        assertTrue(notification.getIsRead());
        verify(notificationRepository).save(notification);
    }
}
