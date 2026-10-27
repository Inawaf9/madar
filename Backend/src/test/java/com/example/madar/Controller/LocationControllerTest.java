
package com.example.madar.Controller;

import com.example.madar.Service.LocationService;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class LocationControllerTest {

    @Test
    void getCitiesTest() throws Exception {
        LocationService service = mock(LocationService.class);

        when(service.getCities()).thenReturn(List.of());

        MockMvc mvc = MockMvcBuilders.standaloneSetup(
                new LocationController(service)).build();

        mvc.perform(get("/api/v1/locations/cities"))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));

        verify(service).getCities();
    }
}
