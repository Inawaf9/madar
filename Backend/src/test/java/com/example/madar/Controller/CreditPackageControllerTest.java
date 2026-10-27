
package com.example.madar.Controller;

import com.example.madar.Service.CreditPackageService;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class CreditPackageControllerTest {

    @Test
    void getActivePackagesTest() throws Exception {
        CreditPackageService service =
                mock(CreditPackageService.class);

        when(service.getActivePackages()).thenReturn(List.of());

        MockMvc mvc = MockMvcBuilders.standaloneSetup(
                new CreditPackageController(service)).build();

        mvc.perform(get("/api/v1/credit-packages/active"))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));

        verify(service).getActivePackages();
    }
}
