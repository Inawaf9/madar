
package com.example.madar.Controller;

import com.example.madar.Security.CurrentUserAccess;
import com.example.madar.Security.ResourceOwnershipAccess;
import com.example.madar.Service.HousingPreferenceService;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class HousingPreferenceControllerTest {

    @Test
    void getMyHousingPreferenceTest() throws Exception {
        CurrentUserAccess access = mock(CurrentUserAccess.class);
        ResourceOwnershipAccess ownership =
                mock(ResourceOwnershipAccess.class);
        HousingPreferenceService service =
                mock(HousingPreferenceService.class);

        when(access.getCurrentUserId()).thenReturn(1);

        MockMvc mvc = MockMvcBuilders.standaloneSetup(
                new HousingPreferenceController(
                        access, ownership, service)).build();

        mvc.perform(get("/api/v1/housing-preference/me"))
                .andExpect(status().isOk());

        verify(service).getHousingPreferenceByUserId(1);
    }
}
