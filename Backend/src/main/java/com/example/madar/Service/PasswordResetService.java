
package com.example.madar.Service;

import com.example.madar.Model.PasswordResetToken;
import com.example.madar.Model.User;
import com.example.madar.Repository.PasswordResetTokenRepository;
import com.example.madar.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private static final int MAX_ATTEMPTS = 5;
    private static final int OTP_EXPIRY_MINUTES = 5;
    private static final int RESET_EXPIRY_MINUTES = 5;
    private static final int RESEND_COOLDOWN_SECONDS = 60;

    private final PasswordResetTokenRepository resetTokenRepository;
    private final UserRepository userRepository;

    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.security.password-reset-secret}")
    private String resetSecret;

    // ==========================================
    // 1. Create Reset OTP
    // ==========================================

    @Transactional
    public String createResetCode(User user) {

        User lockedUser = userRepository
                .findByIdForUpdate(user.getId())
                .orElseThrow(InvalidResetCodeException::new);

        validateUser(lockedUser);

        LocalDateTime now = LocalDateTime.now();

        PasswordResetToken latest = resetTokenRepository
                .findTopByUserIdOrderByCreatedAtDesc(
                        lockedUser.getId()
                )
                .orElse(null);

        if (latest != null
                && latest.getCreatedAt()
                .plusSeconds(RESEND_COOLDOWN_SECONDS)
                .isAfter(now)) {

            throw new IllegalStateException(
                    "Please wait before requesting another code"
            );
        }

        invalidateExistingTokens(lockedUser.getId());

        String otp = String.format(
                "%06d",
                secureRandom.nextInt(1_000_000)
        );

        PasswordResetToken token = new PasswordResetToken();

        token.setUser(lockedUser);
        token.setOtpHash(hashOtp(otp));
        token.setOtpExpiresAt(
                now.plusMinutes(OTP_EXPIRY_MINUTES)
        );
        token.setAttempts(0);
        token.setVerified(false);
        token.setUsed(false);
        token.setCreatedAt(now);

        resetTokenRepository.save(token);

        return otp;
    }

    // ==========================================
    // 2. Verify OTP and Issue Reset Token
    // ==========================================

    @Transactional(
            noRollbackFor = InvalidResetCodeException.class
    )
    public String verifyCodeAndIssueResetToken(
            String email,
            String code
    ) {

        User user = userRepository.findUserByEmail(email);

        validateUser(user);

        List<PasswordResetToken> pending =
                resetTokenRepository
                        .findPendingByUserIdForUpdate(
                                user.getId()
                        );

        if (pending.isEmpty()) {
            throw new InvalidResetCodeException();
        }

        PasswordResetToken token = pending.get(0);

        LocalDateTime now = LocalDateTime.now();

        if (!token.getOtpExpiresAt().isAfter(now)
                || token.getAttempts() >= MAX_ATTEMPTS) {

            token.setUsed(true);
            throw new InvalidResetCodeException();
        }

        if (code == null || !code.matches("\\d{6}")) {
            registerFailedAttempt(token);
            throw new InvalidResetCodeException();
        }

        String providedHash = hashOtp(code);

        boolean matches = MessageDigest.isEqual(
                token.getOtpHash().getBytes(
                        StandardCharsets.UTF_8
                ),
                providedHash.getBytes(
                        StandardCharsets.UTF_8
                )
        );

        if (!matches) {
            registerFailedAttempt(token);
            throw new InvalidResetCodeException();
        }

        String rawResetToken = generateResetToken();

        token.setVerified(true);

        // Clear the usable OTP hash after verification.
        token.setOtpHash(hashResetToken(
                generateResetToken()
        ));

        token.setResetTokenHash(
                hashResetToken(rawResetToken)
        );

        token.setResetTokenExpiresAt(
                now.plusMinutes(RESET_EXPIRY_MINUTES)
        );

        return rawResetToken;
    }

    // ==========================================
    // 3. Consume Reset Token
    // ==========================================

    @Transactional
    public Integer consumeResetToken(String rawResetToken) {

        if (rawResetToken == null
                || rawResetToken.isBlank()) {
            throw new InvalidResetCodeException();
        }

        String tokenHash = hashResetToken(rawResetToken);

        PasswordResetToken token = resetTokenRepository
                .findByResetTokenHashForUpdate(tokenHash)
                .orElseThrow(InvalidResetCodeException::new);

        LocalDateTime now = LocalDateTime.now();

        if (!token.isVerified()
                || token.isUsed()
                || token.getResetTokenExpiresAt() == null
                || !token.getResetTokenExpiresAt()
                .isAfter(now)) {

            throw new InvalidResetCodeException();
        }

        validateUser(token.getUser());

        token.setUsed(true);

        return token.getUser().getId();
    }

    // ==========================================
    // Helpers
    // ==========================================

    private void validateUser(User user) {

        if (user == null
                || !Boolean.TRUE.equals(user.getActive())
                || Boolean.TRUE.equals(
                user.getSuspendedByAdmin()
        )) {

            throw new InvalidResetCodeException();
        }
    }

    private void registerFailedAttempt(
            PasswordResetToken token
    ) {

        int attempts = token.getAttempts() + 1;

        token.setAttempts(attempts);

        if (attempts >= MAX_ATTEMPTS) {
            token.setUsed(true);
        }
    }

    private void invalidateExistingTokens(
            Integer userId
    ) {

        List<PasswordResetToken> tokens =
                resetTokenRepository
                        .findUnusedByUserIdForUpdate(userId);

        for (PasswordResetToken token : tokens) {
            token.setUsed(true);
        }
    }

    private String generateResetToken() {

        byte[] bytes = new byte[32];

        secureRandom.nextBytes(bytes);

        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(bytes);
    }

    private String hashOtp(String otp) {

        try {

            Mac mac = Mac.getInstance("HmacSHA256");

            mac.init(new SecretKeySpec(
                    resetSecret.getBytes(
                            StandardCharsets.UTF_8
                    ),
                    "HmacSHA256"
            ));

            return HexFormat.of().formatHex(
                    mac.doFinal(
                            otp.getBytes(
                                    StandardCharsets.UTF_8
                            )
                    )
            );

        } catch (Exception ex) {

            throw new IllegalStateException(
                    "Unable to hash reset OTP",
                    ex
            );
        }
    }

    private String hashResetToken(String value) {

        try {

            byte[] digest = MessageDigest
                    .getInstance("SHA-256")
                    .digest(value.getBytes(
                            StandardCharsets.UTF_8
                    ));

            return HexFormat.of().formatHex(digest);

        } catch (NoSuchAlgorithmException ex) {

            throw new IllegalStateException(
                    "SHA-256 unavailable",
                    ex
            );
        }
    }

    public static class InvalidResetCodeException
            extends RuntimeException {

        public InvalidResetCodeException() {
            super("Invalid or expired reset code");
        }
    }
}
