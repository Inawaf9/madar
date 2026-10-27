package com.example.madar.Repository;



import com.example.madar.Model.CreditPackage;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:madartest;MODE=MySQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect"
})
class CreditPackageRepositoryTest {

    @Autowired
    CreditPackageRepository repository;

    @Test
    void saveAndFindByCodeTest() {
        CreditPackage p = new CreditPackage();
        p.setCode("TEST_BASIC");
        p.setName("Basic");
        p.setCredits(10);
        p.setPriceHalalas(2000);
        p.setDiscountPercent(0);
        p.setActive(true);

        repository.saveAndFlush(p);

        CreditPackage found =
                repository.findCreditPackageByCode("TEST_BASIC");

        assertNotNull(found);
        assertEquals(10, found.getCredits());
    }
}
