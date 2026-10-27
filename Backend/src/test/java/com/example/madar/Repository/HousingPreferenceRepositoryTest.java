package com.example.madar.Repository;



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
class HousingPreferenceRepositoryTest {

    @Autowired
    HousingPreferenceRepository repository;

    @Test
    void findPreferenceForUnknownUserTest() {
        assertNull(
                repository.findHousingPreferenceByUser_Id(999999)
        );
    }
}
