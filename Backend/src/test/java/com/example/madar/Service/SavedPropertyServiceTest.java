
package com.example.madar.Service;

import com.example.madar.Model.User;
import com.example.madar.Repository.SavedPropertyRepository;
import com.example.madar.Repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SavedPropertyServiceTest {

    @Mock UserRepository userRepository;
    @Mock SavedPropertyRepository savedPropertyRepository;
    @Mock PropertyService propertyService;

    @InjectMocks SavedPropertyService service;

    @Test
    void isPropertySavedTest() {
        User user = new User();
        user.setId(1);

        when(userRepository.findUserById(1)).thenReturn(user);
        when(savedPropertyRepository
                .existsByUser_IdAndSourceAndExternalPropertyId(
                        1, "KITE", "A123"))
                .thenReturn(true);

        boolean result =
                service.isPropertySaved(1, "kite", "A123");

        assertTrue(result);
        verify(savedPropertyRepository)
                .existsByUser_IdAndSourceAndExternalPropertyId(
                        1, "KITE", "A123");
        verifyNoInteractions(propertyService);
    }
}
