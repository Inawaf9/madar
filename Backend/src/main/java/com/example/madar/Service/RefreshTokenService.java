package com.example.madar.Service;

import com.example.madar.DTO.Out.Auth.AuthResponse;
import com.example.madar.Model.RefreshToken;
import com.example.madar.Model.User;
import com.example.madar.Repository.RefreshTokenRepository;
import com.example.madar.Repository.UserRepository;
import com.example.madar.Security.JwtService;
import com.example.madar.Security.OpaqueTokenHash;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {
    private static final Duration MAX_SESSION_LIFETIME = Duration.ofDays(30);
    private final RefreshTokenRepository refreshTokens;
    private final UserRepository users;
    private final JwtService jwtService;
    private final SecureRandom random = new SecureRandom();
    private final Clock clock = Clock.systemUTC();

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional
    public AuthResponse issueTokenPair(User authenticatedUser) {
        // Capture authentication-time state before refreshing a potentially managed principal.
        Integer version = authenticatedUser.getTokenVersion();
        String password = authenticatedUser.getPassword();
        String role = authenticatedUser.getRole();
        User user = lockUser(authenticatedUser.getId());
        if (!eligible(user) || !Objects.equals(version, user.getTokenVersion())
                || !Objects.equals(password, user.getPassword()) || !Objects.equals(role, user.getRole())) {
            throw new RefreshTokenRejectedException();
        }
        Instant now = now();
        return issue(user, UUID.randomUUID().toString(), now, now.plus(MAX_SESSION_LIFETIME), null);
    }

    // Reuse must commit its family revocation before AuthenticationException becomes HTTP 401.
    // Call this through the Spring proxy without an outer rollback-on-auth-failure transaction.
    @Transactional(noRollbackFor = RefreshTokenRejectedException.class)
    public AuthResponse rotateRefreshToken(String rawToken) {
        String hash = checkedHash(rawToken);
        Integer userId = refreshTokens.findOwnerIdByHash(hash)
                .orElseThrow(RefreshTokenRejectedException::new);
        User user = lockUser(userId);
        RefreshToken token = refreshTokens.findByHashForUpdate(hash)
                .orElseThrow(RefreshTokenRejectedException::new);
        Instant now = now();
        if (token.getConsumedAt() != null) {
            refreshTokens.revokeFamily(userId, token.getFamilyId(), now);
            throw new RefreshTokenRejectedException();
        }
        if (!eligible(user) || token.getRevokedAt() != null
                || !token.getExpiresAt().isAfter(now) || !token.getAbsoluteExpiresAt().isAfter(now)
                || !Objects.equals(token.getIssuedTokenVersion(), user.getTokenVersion())
                || !Objects.equals(token.getIssuedRole(), user.getRole())) {
            throw new RefreshTokenRejectedException();
        }
        token.setConsumedAt(now);
        return issue(user, token.getFamilyId(), now, token.getAbsoluteExpiresAt(), token);
    }

    @Transactional
    public void revokeRefreshToken(String rawToken) {
        if (!validFormat(rawToken)) return;
        String hash = OpaqueTokenHash.sha256(rawToken);
        Integer userId = refreshTokens.findOwnerIdByHash(hash).orElse(null);
        if (userId == null || lockUser(userId) == null) return;
        refreshTokens.findByHashForUpdate(hash).ifPresent(token ->
                refreshTokens.revokeFamily(userId, token.getFamilyId(), now()));
    }

    @Transactional
    public void revokeAllUserRefreshTokens(Integer userId) {
        // All issuers/rotators/revokers acquire the same stable lock before token rows.
        if (lockUserWithoutRefresh(userId) != null) {
            refreshTokens.revokeAllForUser(userId, now());
        }
    }

    private AuthResponse issue(User user, String familyId, Instant now, Instant deadline, RefreshToken previous) {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        RefreshToken next = new RefreshToken();
        next.setUser(user);
        next.setTokenHash(OpaqueTokenHash.sha256(rawToken));
        next.setFamilyId(familyId);
        next.setIssuedTokenVersion(user.getTokenVersion());
        next.setIssuedRole(user.getRole());
        next.setCreatedAt(now);
        next.setExpiresAt(deadline);
        next.setAbsoluteExpiresAt(deadline);
        refreshTokens.saveAndFlush(next);
        if (previous != null) previous.setReplacedByTokenId(next.getId());
        return new AuthResponse(jwtService.generateAccessToken(user, deadline), "Bearer", user.getId(),
                user.getEmail(), user.getRole(), rawToken);
    }

    private User lockUser(Integer userId) {
        User user = lockUserWithoutRefresh(userId);
        if (user != null) entityManager.refresh(user, LockModeType.PESSIMISTIC_WRITE);
        return user;
    }

    private User lockUserWithoutRefresh(Integer userId) {
        return users.findByIdForUpdate(userId).orElse(null);
    }

    private boolean eligible(User user) {
        return user != null && Boolean.TRUE.equals(user.getActive())
                && !Boolean.TRUE.equals(user.getSuspendedByAdmin()) && user.getTokenVersion() != null
                && user.getTokenVersion() >= 0 && ("USER".equals(user.getRole()) || "ADMIN".equals(user.getRole()));
    }

    private String checkedHash(String rawToken) {
        if (!validFormat(rawToken)) throw new RefreshTokenRejectedException();
        return OpaqueTokenHash.sha256(rawToken);
    }

    private boolean validFormat(String rawToken) {
        if (rawToken == null || !rawToken.matches("[A-Za-z0-9_-]{43}")) return false;
        return Base64.getUrlEncoder().withoutPadding()
                .encodeToString(Base64.getUrlDecoder().decode(rawToken)).equals(rawToken);
    }

    private Instant now() {
        return clock.instant().truncatedTo(ChronoUnit.MICROS);
    }

    public static final class RefreshTokenRejectedException extends AuthenticationException {
        public RefreshTokenRejectedException() {
            super("Unauthorized");
        }
    }
}
