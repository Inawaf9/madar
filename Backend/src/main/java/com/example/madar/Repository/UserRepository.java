package com.example.madar.Repository;

import com.example.madar.Model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {

    User findUserById(Integer id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    User findUserForUpdateById(Integer id);

    User findUserByEmail(String email);

    boolean existsByEmail(String email);
}
