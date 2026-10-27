
package com.example.madar.Controller;

import com.example.madar.Security.CurrentUserAccess;
import com.example.madar.Security.ResourceOwnershipAccess;
import com.example.madar.Service.SavedPropertyService;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class SavedPropertyControllerTest {

    @Test
    void isPropertySavedTest() throws Exception {
        CurrentUserAccess access = mock(CurrentUserAccess.class);
        ResourceOwnershipAccess ownership =
                mock(ResourceOwnershipAccess.class);
        SavedPropertyService service =
                mock(SavedPropertyService.class);

        when(access.getCurrentUserId()).thenReturn(1);
        when(service.isPropertySaved(1, "KITE", "A123"))
                .thenReturn(true);

        MockMvc mvc = MockMvcBuilders.standaloneSetup(
                new SavedPropertyController(
                        access, ownership, service)).build();

        mvc.perform(get("/api/v1/saved-property/me/check")
                        .param("source", "KITE")
                        .param("externalId", "A123"))
                .andExpect(status().isOk())
                .andExpect(content().string("true"));

        verify(service).isPropertySaved(1, "KITE", "A123");
    }
}
