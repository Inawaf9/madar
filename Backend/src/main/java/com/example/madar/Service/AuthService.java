
package com.example.madar.Service;

import com.example.madar.DTO.In.Auth.*;
import com.example.madar.DTO.Out.Auth.AuthResponse;
import com.example.madar.Model.User;
import com.example.madar.Repository.UserRepository;
import com.example.madar.Security.JwtService;
import com.example.madar.Security.OpaqueTokenHash;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import jakarta.persistence.PersistenceContext;
import com.example.madar.Client.N8nClient;

import lombok.RequiredArgsConstructor;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final PasswordResetService passwordResetService;
    private final RefreshTokenService refreshTokenService;
    private final N8nClient n8nClient;

    @PersistenceContext
    private EntityManager entityManager;
//    private final EmailService emailService;

    // ==========================================
    // 1. Register
    // ==========================================

    @Transactional
    public AuthResponse register(RegisterRequest request) {

        String email = normalizeEmail(request.email());

        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException(
                    "Email already registered"
            );
        }

        User user = new User();

        user.setFullName(request.fullName().trim());
        user.setEmail(email);
        user.setPassword(
                passwordEncoder.encode(request.password())
        );

        // Never accept the role from the client.
        user.setRole("USER");
        user.setActive(true);
        user.setSuspendedByAdmin(false);
        user.setNotificationsEnabled(false);

        User savedUser = userRepository.save(user);

        org.springframework.transaction.support.TransactionSynchronizationManager
                .registerSynchronization(
                        new org.springframework.transaction.support.TransactionSynchronization() {
                            @Override
                            public void afterCommit() {
                                n8nClient.sendWelcome(
                                        savedUser.getFullName(),
                                        savedUser.getEmail()
                                );
                            }
                        }
                );

        return createAuthResponse(savedUser);
    }

    // ==========================================
    // 2. Login
    // ==========================================

    public AuthResponse login(LoginRequest request) {

        String email = normalizeEmail(request.email());

        Authentication authentication =
                authenticationManager.authenticate(
                        new UsernamePasswordAuthenticationToken(
                                email,
                                request.password()
                        )
                );

        User user = (User) authentication.getPrincipal();

        return createAuthResponse(user);
    }

    // ==========================================
    // 3. Forgot Password
    // ==========================================

    public void forgotPassword(ForgotPasswordRequest request) {

        String email = normalizeEmail(request.email());

        User user = userRepository.findUserByEmail(email);

        // Do not disclose whether the account exists.
        if (user == null) {
            return;
        }

        if (!Boolean.TRUE.equals(user.getActive())
                || Boolean.TRUE.equals(user.getSuspendedByAdmin())) {
            return;
        }

        // PasswordResetService must enforce:
        // - OTP expiration
        // - Attempt limits
        // - Resend limits
        // - One-time usage
        // - Secure OTP hashing
        String otp = passwordResetService.createResetCode(user);

//        emailService.sendPasswordResetCode(
//                user.getEmail(),
//                otp
//        );
    }

    // ==========================================
    // 4. Verify Reset Code
    // ==========================================

    public String verifyResetCode(
            VerifyResetCodeRequest request
    ) {

        String email = normalizeEmail(request.email());

        // Returns a short-lived, one-time reset token.
        // This is NOT an access JWT.
        return passwordResetService.verifyCodeAndIssueResetToken(
                email,
                request.code()
        );
    }

    // ==========================================
    // 5. Reset Password
    // ==========================================

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {

        // Read only the owner first, then lock the user before consuming reset proof.
        // This matches issuance/refresh/logout lock order and avoids user/reset-row inversion.
        Integer ownerId = entityManager.createQuery(
                        "select p.user.id from PasswordResetToken p where p.resetTokenHash = :hash", Integer.class)
                .setParameter("hash", OpaqueTokenHash.sha256(request.resetToken()))
                .setMaxResults(1).getResultList().stream().findFirst()
                .orElseThrow(PasswordResetService.InvalidResetCodeException::new);
        User user = userRepository.findByIdForUpdate(ownerId)
                .orElseThrow(PasswordResetService.InvalidResetCodeException::new);
        entityManager.refresh(user, LockModeType.PESSIMISTIC_WRITE);

        // Must atomically consume the reset token
        // within this transaction.
        Integer userId =
                passwordResetService.consumeResetToken(
                        request.resetToken()
                );

        if (!ownerId.equals(userId)) {
            throw new PasswordResetService.InvalidResetCodeException();
        }

        if (!Boolean.TRUE.equals(user.getActive())
                || Boolean.TRUE.equals(user.getSuspendedByAdmin())) {
            throw new AccessDeniedException(
                    "Account is disabled"
            );
        }

        if (passwordEncoder.matches(
                request.newPassword(),
                user.getPassword()
        )) {
            throw new IllegalArgumentException(
                    "New password must be different"
            );
        }

        user.setPassword(
                passwordEncoder.encode(request.newPassword())
        );

        userRepository.save(user);

        // Must persist token revocation state.
        // JWT validation must check that state
        // on subsequent protected requests.
        jwtService.invalidateUserTokens(user.getId());
        refreshTokenService.revokeAllUserRefreshTokens(user.getId());
    }

    // ==========================================
    // 6. Change Password
    // ==========================================

    @Transactional
    public void changePassword(ChangePasswordRequest request) {

        User user = getAuthenticatedUser();

        if (!passwordEncoder.matches(
                request.currentPassword(),
                user.getPassword()
        )) {
            throw new IllegalArgumentException(
                    "Current password is incorrect"
            );
        }

        if (passwordEncoder.matches(
                request.newPassword(),
                user.getPassword()
        )) {
            throw new IllegalArgumentException(
                    "New password must be different"
            );
        }

        user.setPassword(
                passwordEncoder.encode(request.newPassword())
        );

        userRepository.save(user);

        jwtService.invalidateUserTokens(user.getId());
        refreshTokenService.revokeAllUserRefreshTokens(user.getId());
    }

    // No outer transaction here: replay rejection must not roll back family revocation.
    public AuthResponse refresh(RefreshTokenRequest request) {
        return refreshTokenService.rotateRefreshToken(request.refreshToken());
    }

    public void logout(RefreshTokenRequest request) {
        refreshTokenService.revokeRefreshToken(request.refreshToken());
    }

    @Transactional
    public void logoutAll() {
        User user = getAuthenticatedUser();
        jwtService.invalidateUserTokens(user.getId());
        refreshTokenService.revokeAllUserRefreshTokens(user.getId());
    }

    // ==========================================
    // Helper: Create Auth Response
    // ==========================================

    private AuthResponse createAuthResponse(User user) {
        return refreshTokenService.issueTokenPair(user);
    }

    // ==========================================
    // Helper: Get Authenticated User
    // ==========================================

    private User getAuthenticatedUser() {

        Authentication authentication =
                SecurityContextHolder.getContext()
                        .getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof Jwt jwt)) {

            throw new AccessDeniedException(
                    "Authentication required"
            );
        }

        Integer userId;

        try {
            userId = Integer.valueOf(jwt.getSubject());
        } catch (NumberFormatException ex) {
            throw new AccessDeniedException(
                    "Invalid authentication subject"
            );
        }

        User user = userRepository.findByIdForUpdate(userId)
                .orElseThrow(() ->
                        new AccessDeniedException(
                                "User not found"
                        )
                );

        entityManager.refresh(user, LockModeType.PESSIMISTIC_WRITE);
        Object version = jwt.getClaims().get("tokenVersion");
        if (!(version instanceof Number number) || user.getTokenVersion() == null
                || number.longValue() != user.getTokenVersion().longValue()
                || !Objects.equals(user.getRole(), jwt.getClaims().get("role"))) {
            throw new BadCredentialsException("Unauthorized");
        }

        if (!Boolean.TRUE.equals(user.getActive())
                || Boolean.TRUE.equals(user.getSuspendedByAdmin())) {

            throw new AccessDeniedException(
                    "Account is disabled"
            );
        }

        return user;
    }

    // ==========================================
    // Helper: Normalize Email
    // ==========================================

    private String normalizeEmail(String email) {

        return email.trim().toLowerCase(Locale.ROOT);
    }
}
