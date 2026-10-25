
package com.example.madar.Repository;

import com.example.madar.Model.PasswordResetToken;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PasswordResetTokenRepository
        extends JpaRepository<PasswordResetToken, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT p
            FROM PasswordResetToken p
            WHERE p.user.id = :userId
              AND p.used = false
              AND p.verified = false
            ORDER BY p.createdAt DESC, p.id DESC
            """)
    List<PasswordResetToken> findPendingByUserIdForUpdate(
            @Param("userId") Integer userId
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT p
            FROM PasswordResetToken p
            WHERE p.user.id = :userId
              AND p.used = false
            ORDER BY p.createdAt DESC, p.id DESC
            """)
    List<PasswordResetToken> findUnusedByUserIdForUpdate(
            @Param("userId") Integer userId
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT p
            FROM PasswordResetToken p
            WHERE p.resetTokenHash = :hash
              AND p.used = false
            """)
    Optional<PasswordResetToken> findByResetTokenHashForUpdate(
            @Param("hash") String hash
    );

    Optional<PasswordResetToken>
    findTopByUserIdOrderByCreatedAtDesc(Integer userId);
}
