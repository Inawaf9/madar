
package com.example.madar.Service;

import com.example.madar.Api.ApiException;
import com.example.madar.Model.HousingPreference;
import com.example.madar.Model.User;
import com.example.madar.Repository.HousingPreferenceRepository;
import com.example.madar.Repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class HousingPreferenceServiceTest {

    @Mock
    HousingPreferenceRepository preferenceRepository;

    @Mock
    UserRepository userRepository;

    @InjectMocks
    HousingPreferenceService service;

    @Test
    void rejectDuplicateHousingPreferenceTest() {
        User user = new User();
        user.setId(1);

        when(userRepository.findUserById(1)).thenReturn(user);
        when(preferenceRepository.findHousingPreferenceByUser_Id(1))
                .thenReturn(new HousingPreference());

        assertThrows(ApiException.class,
                () -> service.addHousingPreference(
                        1, new HousingPreference()));

        verify(preferenceRepository, never()).save(any());
    }
}
