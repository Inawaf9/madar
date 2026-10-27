
package com.example.madar.Controller;

import com.example.madar.Security.CurrentUserAccess;
import com.example.madar.Security.ResourceOwnershipAccess;
import com.example.madar.Service.NotificationService;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class NotificationControllerTest {

    @Test
    void countUnreadNotificationsTest() throws Exception {
        CurrentUserAccess access = mock(CurrentUserAccess.class);
        ResourceOwnershipAccess ownership =
                mock(ResourceOwnershipAccess.class);
        NotificationService service = mock(NotificationService.class);

        when(access.getCurrentUserId()).thenReturn(1);
        when(service.countUnreadNotifications(1)).thenReturn(3L);

        MockMvc mvc = MockMvcBuilders.standaloneSetup(
                new NotificationController(
                        access, ownership, service)).build();

        mvc.perform(get("/api/v1/notification/me/unread-count"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unreadCount").value(3));

        verify(service).countUnreadNotifications(1);
    }
}
