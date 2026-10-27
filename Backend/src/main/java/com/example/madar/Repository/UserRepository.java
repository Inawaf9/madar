package com.example.madar.Repository;

import com.example.madar.Model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;
import java.util.List;

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


    @Query(
            value = "SELECT * FROM user WHERE id = :userId FOR UPDATE",
            nativeQuery = true
    )
    Optional<User> findByIdForUpdate(@Param("userId") Integer userId);

    // n8n - Weekly report recipients
    @Query("""
        SELECT u
        FROM User u
        WHERE u.role = 'USER'
          AND u.active = true
          AND u.suspendedByAdmin = false
          AND u.notificationsEnabled = true
          AND u.housingPreference IS NOT NULL
        ORDER BY u.id
        """)
    List<User> findWeeklyReportRecipients();

    Page<User> findByFullNameContainingIgnoreCaseOrEmailContainingIgnoreCase(
            String fullName,
            String email,
            Pageable pageable
    );

    Page<User> findByActiveTrueAndSuspendedByAdminFalse(Pageable pageable);

    Page<User> findByActiveFalse(Pageable pageable);

    Page<User> findBySuspendedByAdminTrue(Pageable pageable);

}
