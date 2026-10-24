package com.example.madar.Repository;

import com.example.madar.Model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {

    User findUserById(Integer id);

    @Query(
            value = "SELECT * FROM user WHERE id = :id FOR UPDATE",
            nativeQuery = true
    )
    User findUserForUpdateById(@Param("id") Integer id);

    User findUserByEmail(String email);

    boolean existsByEmail(String email);
}
