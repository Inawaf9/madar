package com.example.madar.Repository;

import com.example.madar.Model.RefreshToken;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    // Projection only: do not cache a token entity before acquiring its user's lock.
    @Query("select t.user.id from RefreshToken t where t.tokenHash = :hash")
    Optional<Integer> findOwnerIdByHash(@Param("hash") String hash);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from RefreshToken t where t.tokenHash = :hash")
    Optional<RefreshToken> findByHashForUpdate(@Param("hash") String hash);

    @Modifying(flushAutomatically = true)
    @Query("update RefreshToken t set t.revokedAt = :now "
            + "where t.user.id = :userId and t.familyId = :familyId and t.revokedAt is null")
    int revokeFamily(@Param("userId") Integer userId, @Param("familyId") String familyId,
                     @Param("now") Instant now);

    @Modifying(flushAutomatically = true)
    @Query("update RefreshToken t set t.revokedAt = :now where t.user.id = :userId and t.revokedAt is null")
    int revokeAllForUser(@Param("userId") Integer userId, @Param("now") Instant now);
}
