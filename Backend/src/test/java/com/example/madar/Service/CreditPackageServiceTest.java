
package com.example.madar.Service;

import com.example.madar.Model.CreditPackage;
import com.example.madar.Repository.CreditPackageRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CreditPackageServiceTest {

    @Mock
    CreditPackageRepository repository;

    @InjectMocks
    CreditPackageService service;

    @Test
    void calculateDiscountTest() {
        CreditPackage p = new CreditPackage();
        p.setCode("BASIC");
        p.setName("Basic");
        p.setCredits(10);
        p.setPriceHalalas(2000);
        p.setDiscountPercent(10);
        p.setActive(true);

        Integer result = service.calculateFinalPrice(p);

        assertEquals(1800, result);
        verifyNoInteractions(repository);
    }
}
