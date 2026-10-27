
package com.example.madar.Service;

import com.example.madar.Api.ApiException;
import com.example.madar.Client.GooglePlacesClient;
import com.example.madar.Model.CurrentHome;
import com.example.madar.Model.User;
import com.example.madar.Repository.CurrentHomeRepository;
import com.example.madar.Repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CurrentHomeServiceTest {

    @Mock CurrentHomeRepository homeRepository;
    @Mock UserRepository userRepository;
    @Mock PlacePreferenceService placePreferenceService;
    @Mock GooglePlacesClient googlePlacesClient;
    @Mock PropertyService propertyService;
    @Mock HousingPreferenceService housingPreferenceService;
    @Mock NearbyInterestService nearbyInterestService;

    @InjectMocks
    CurrentHomeService service;

    @Test
    void rejectDuplicateCurrentHomeTest() {
        User user = new User();
        user.setId(1);

        when(userRepository.findUserById(1)).thenReturn(user);
        when(homeRepository.findCurrentHomeByUser_Id(1))
                .thenReturn(new CurrentHome());

        assertThrows(ApiException.class,
                () -> service.addCurrentHome(1, new CurrentHome()));

        verify(homeRepository, never()).save(any());
        verifyNoInteractions(
                googlePlacesClient, propertyService,
                nearbyInterestService);
    }
}
