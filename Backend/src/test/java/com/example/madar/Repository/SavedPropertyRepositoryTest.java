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
class SavedPropertyRepositoryTest {

    @Autowired
    SavedPropertyRepository repository;

    @Test
    void propertyIsNotSavedTest() {
        boolean saved =
                repository.existsByUser_IdAndSourceAndExternalPropertyId(
                        999999, "KITE", "TEST-123");

        assertFalse(saved);
    }
}
