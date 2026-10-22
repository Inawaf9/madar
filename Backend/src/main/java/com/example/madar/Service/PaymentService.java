package com.example.madar.Service;

import com.example.madar.Api.ApiException;
import com.example.madar.Client.MoyasarClient;
import com.example.madar.Config.PaidServiceProperties;
import com.example.madar.DTO.In.Payment.MoyasarWebhookDTO;
import com.example.madar.DTO.Out.Payment.*;
import com.example.madar.Model.Payment;
import com.example.madar.Model.PlacePreference;
import com.example.madar.Model.User;
import com.example.madar.Repository.PaymentRepository;
import com.example.madar.Repository.PlacePreferenceRepository;
import com.example.madar.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentService {
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final PlacePreferenceRepository placePreferenceRepository;
    private final MoyasarClient moyasarClient;
    private final PaidServiceProperties paidServiceProperties;

    @Value("${moyasar.callback-url:}")
    private String callbackUrl;
    @Value("${moyasar.webhook-secret:}")
    private String webhookSecret;

    // Keep a failed/uncertain attempt so a retry cannot mint a second intent with the same key.
    @Transactional(noRollbackFor = ResponseStatusException.class)
    public CheckoutResponseDTO checkout(Integer userId, String serviceType, String checkoutKey) {
        String type = supportedService(serviceType);
        String key = validUuid(checkoutKey, "Idempotency-Key must be a UUID");
        User user = userRepository.findUserForUpdateById(userId);
        if (user == null) {
            throw new ApiException("User not found");
        }
        Payment existing = paymentRepository.findPaymentByCheckoutKey(key);
        if (existing != null) {
            if (!existing.getUser().getId().equals(userId) || !existing.getServiceType().equals(type)) {
                throw new ApiException("Idempotency-Key belongs to a different checkout");
            }
            return resumeCheckout(existing);
        }
        PaidServiceProperties.Definition definition = serviceDefinition(type);
        validateCheckoutConfiguration();
        validateCommuteInputs(userId);
        if (findAccess(userId, type).access()) {
            throw new ApiException("Access to this service is already active");
        }

        Payment payment = new Payment();
        payment.setUser(user);
        payment.setServiceType(type);
        payment.setAmount(definition.getAmountHalalas());
        payment.setCurrency(definition.getCurrency());
        payment.setAccessDurationHours(definition.getAccessHours());
        payment.setStatus("PENDING");
        payment.setLocalReference("MADAR:" + UUID.randomUUID());
        // The frontend must send this documented given_id when fulfilling the intent.
        payment.setProviderPaymentId(UUID.randomUUID().toString());
        payment.setCheckoutKey(key);
        payment.setRefundedAmount(0);
        paymentRepository.saveAndFlush(payment);

        MoyasarIntentDTO intent = moyasarClient.createIntent(payment.getAmount(), payment.getCurrency(),
                payment.getLocalReference(), callbackUrl);
        validateIntent(payment, intent);
        try {
            validUuid(intent.id(), "Moyasar returned an invalid intent identifier");
        } catch (ApiException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Moyasar returned an invalid intent identifier");
        }
        payment.setProviderIntentId(intent.id());
        paymentRepository.saveAndFlush(payment);
        return checkoutResponse(payment, intent);
    }

    @Transactional
    public PaymentResponseDTO verify(Integer userId, Integer paymentId) {
        getUser(userId);
        Payment payment = paymentRepository.findPaymentForUpdateByIdAndUser_Id(paymentId, userId);
        if (payment == null) {
            throw new ApiException("Payment not found for this user");
        }
        requireTrustedAttempt(payment);
        String providerId = payment.getProviderPaymentId();
        MoyasarPaymentDTO provider = moyasarClient.getPayment(providerId);
        if (provider == null) {
            MoyasarIntentDTO intent = moyasarClient.getIntent(payment.getProviderIntentId());
            validateIntent(payment, intent);
            // No resource exists yet at the reserved given_id. Fulfillment alone
            // is never proof of payment, even if provider visibility is delayed.
            if ("canceled".equals(intent.status()) || ("created".equals(intent.status())
                    && intent.expiresAt() != null && !intent.expiresAt().isAfter(OffsetDateTime.now()))) {
                if ("PENDING".equals(payment.getStatus())) {
                    payment.setStatus("FAILED");
                    paymentRepository.save(payment);
                }
            }
            return response(payment);
        }
        synchronizePayment(payment, provider, providerId);
        return response(payment);
    }

    @Transactional
    public void processWebhook(MoyasarWebhookDTO event) {
        if (webhookSecret == null || webhookSecret.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Moyasar webhook is not configured");
        }
        if (event == null || event.getSecretToken() == null || !MessageDigest.isEqual(
                webhookSecret.getBytes(StandardCharsets.UTF_8), event.getSecretToken().getBytes(StandardCharsets.UTF_8))) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Untrusted Moyasar webhook");
        }
        if (event.getId() == null || event.getId().isBlank() || event.getType() == null || event.getType().isBlank()) {
            throw new ApiException("Malformed Moyasar webhook");
        }
        // Includes the provider's documented payment_faild spelling; the event is
        // a notification to fetch, never an instruction to trust its status.
        if (!event.getType().startsWith("payment_")) {
            return;
        }
        if (event.getData() == null) {
            throw new ApiException("Missing webhook payment");
        }
        String providerId = validUuid(event.getData().getId(), "Invalid webhook payment identifier");
        String reference = event.getData().getDescription();
        if (reference == null || !reference.startsWith("MADAR:")) {
            return; // Payments from other merchant workflows are outside this integration.
        }
        Payment payment = paymentRepository.findPaymentForUpdateByLocalReference(reference);
        if (payment == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Local payment attempt not found");
        }
        MoyasarPaymentDTO provider = moyasarClient.getPayment(providerId);
        if (provider == null) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Webhook payment is not yet available from Moyasar");
        }
        synchronizePayment(payment, provider, providerId);
    }

    public List<PaymentResponseDTO> getHistory(Integer userId, String status) {
        getUser(userId);
        String filter = status == null ? null : status.trim().toUpperCase(Locale.ROOT);
        if (filter != null && !Set.of("PENDING", "PAID", "FAILED", "REFUNDED").contains(filter)) {
            throw new ApiException("Invalid payment status");
        }
        return paymentRepository.findPaymentsByUser_Id(userId).stream()
                .filter(payment -> filter == null || filter.equals(payment.getStatus()))
                .sorted(Comparator.comparing(Payment::getId).reversed())
                .map(this::response).toList();
    }

    public FeatureAccessResponseDTO getAccess(Integer userId, String serviceType) {
        getUser(userId);
        return findAccess(userId, supportedService(serviceType));
    }

    public void requireCommuteAccess(Integer userId) {
        if (!getAccess(userId, "COMMUTE_REPORT").access()) {
            throw new ResponseStatusException(HttpStatus.PAYMENT_REQUIRED, "Paid commute report access is required");
        }
    }

    private void synchronizePayment(Payment payment, MoyasarPaymentDTO provider, String providerId) {
        requireTrustedAttempt(payment);
        if (!providerId.equals(provider.id())
                || (payment.getProviderPaymentId() != null && !payment.getProviderPaymentId().equals(provider.id()))
                || !payment.getAmount().equals(provider.amount())
                || !payment.getCurrency().equals(provider.currency())
                || !payment.getLocalReference().equals(provider.description())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Moyasar payment does not match the local attempt");
        }
        Integer refunded = provider.refunded();
        if (provider.status() == null || refunded == null || refunded < 0 || refunded > payment.getAmount()
                || ("refunded".equals(provider.status()) && refunded == 0)) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Invalid Moyasar refund amount");
        }
        String next;
        if (refunded > 0 || "refunded".equals(provider.status())) {
            next = "REFUNDED"; // Any refund revokes this simple time pass; retain the exact refund amount.
        } else if ("paid".equals(provider.status()) || "captured".equals(provider.status())) {
            if ("captured".equals(provider.status()) && !payment.getAmount().equals(provider.captured())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Partial capture does not grant access");
            }
            next = "PAID";
        } else if (Set.of("failed", "voided", "expired").contains(provider.status())) {
            next = "FAILED";
        } else if (Set.of("initiated", "authorized", "verified").contains(provider.status())) {
            next = "PENDING";
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unsupported Moyasar payment status");
        }
        payment.setProviderPaymentId(provider.id());
        payment.setRefundedAmount(Math.max(payment.getRefundedAmount() == null ? 0 : payment.getRefundedAmount(), refunded));
        // Refunds are terminal. A paid result cannot regress due to delayed notifications.
        if ("REFUNDED".equals(payment.getStatus())) {
            return;
        }
        if ("PAID".equals(payment.getStatus()) && !"REFUNDED".equals(next)
                && !"voided".equals(provider.status())) {
            return;
        }
        if ("FAILED".equals(payment.getStatus()) && "PENDING".equals(next)) {
            return;
        }
        if ("FAILED".equals(payment.getStatus()) && payment.getPaidAt() != null && "PAID".equals(next)) {
            return; // A previously paid, then voided pass cannot be reactivated.
        }
        if ("PAID".equals(next) && payment.getPaidAt() == null) {
            LocalDateTime confirmedAt = LocalDateTime.now();
            payment.setPaidAt(confirmedAt);
            payment.setAccessExpiresAt(confirmedAt.plusHours(payment.getAccessDurationHours()));
        }
        payment.setStatus(next);
        paymentRepository.save(payment);
    }

    private CheckoutResponseDTO resumeCheckout(Payment payment) {
        if (payment.getProviderIntentId() == null) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Checkout creation was unsuccessful or uncertain; this key will not create another intent");
        }
        if (!"PENDING".equals(payment.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Checkout is already completed; verify the payment");
        }
        MoyasarIntentDTO intent = moyasarClient.getIntent(payment.getProviderIntentId());
        validateIntent(payment, intent);
        return checkoutResponse(payment, intent);
    }

    private CheckoutResponseDTO checkoutResponse(Payment payment, MoyasarIntentDTO intent) {
        if (!"created".equals(intent.status()) || intent.expiresAt() == null
                || !intent.expiresAt().isAfter(OffsetDateTime.now())
                || intent.clientSecret() == null || !intent.clientSecret().startsWith("pi_secret_")) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Checkout is expired or already used; verify its payment");
        }
        return new CheckoutResponseDTO(payment.getId(), payment.getServiceType(), payment.getAmount(),
                payment.getCurrency(), intent.id(), intent.clientSecret(), intent.expiresAt(),
                payment.getProviderPaymentId(), Map.of("madar_payment_id", payment.getId().toString(),
                        "user_id", payment.getUser().getId().toString(), "service_type", payment.getServiceType()));
    }

    private void validateIntent(Payment payment, MoyasarIntentDTO intent) {
        if ((payment.getProviderIntentId() != null && !payment.getProviderIntentId().equals(intent.id()))
                || !payment.getAmount().equals(intent.amount()) || !payment.getCurrency().equals(intent.currency())
                || !payment.getLocalReference().equals(intent.description())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Moyasar intent does not match the local attempt");
        }
    }

    private void requireTrustedAttempt(Payment payment) {
        if (payment.getProviderIntentId() == null || payment.getProviderPaymentId() == null
                || payment.getCurrency() == null || payment.getLocalReference() == null
                || payment.getAmount() == null || payment.getAmount() <= 0
                || payment.getAccessDurationHours() == null || payment.getAccessDurationHours() <= 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Payment lacks trusted checkout details; legacy payments require reconciliation");
        }
    }

    private FeatureAccessResponseDTO findAccess(Integer userId, String type) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = paymentRepository.findPaymentsByUser_Id(userId).stream()
                .filter(payment -> type.equals(payment.getServiceType()) && "PAID".equals(payment.getStatus())
                        && payment.getProviderPaymentId() != null && payment.getProviderIntentId() != null
                        && payment.getLocalReference() != null && payment.getCurrency() != null && payment.getPaidAt() != null
                        && payment.getAccessExpiresAt() != null && payment.getAccessExpiresAt().isAfter(now)
                        && (payment.getRefundedAmount() == null || payment.getRefundedAmount() == 0))
                .map(Payment::getAccessExpiresAt).max(Comparator.naturalOrder()).orElse(null);
        return new FeatureAccessResponseDTO(type, expiresAt != null, expiresAt);
    }

    private String supportedService(String serviceType) {
        if (serviceType == null || !"COMMUTE_REPORT".equals(serviceType.trim().toUpperCase(Locale.ROOT))) {
            throw new ApiException("Unsupported paid service type");
        }
        return "COMMUTE_REPORT";
    }

    private PaidServiceProperties.Definition serviceDefinition(String type) {
        PaidServiceProperties.Definition definition = paidServiceProperties.getServices().get(type);
        if (definition == null || !definition.isEnabled() || definition.getAmountHalalas() == null
                || definition.getAmountHalalas() < 100 || !"SAR".equals(definition.getCurrency())
                || definition.getAccessHours() == null || definition.getAccessHours() <= 0) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Paid service pricing is not configured");
        }
        return definition;
    }

    private void validateCheckoutConfiguration() {
        try {
            URI callback = URI.create(callbackUrl);
            if (!"https".equalsIgnoreCase(callback.getScheme()) || callback.getHost() == null
                    || callback.getUserInfo() != null) {
                throw new IllegalArgumentException();
            }
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Configure an HTTPS Moyasar callback URL");
        }
        if (webhookSecret == null || webhookSecret.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Configure Moyasar webhook authenticity first");
        }
    }

    private void validateCommuteInputs(Integer userId) {
        List<PlacePreference> places = placePreferenceRepository.findPlacePreferencesByUser_Id(userId);
        boolean hasWeight = false;
        if (places.isEmpty()) {
            throw new ApiException("Add your important places before purchasing a commute report");
        }
        for (PlacePreference place : places) {
            if (place.getLatitude() == null || place.getLongitude() == null
                    || !Double.isFinite(place.getLatitude()) || !Double.isFinite(place.getLongitude())
                    || place.getLatitude() < -90 || place.getLatitude() > 90
                    || place.getLongitude() < -180 || place.getLongitude() > 180
                    || place.getImportance() == null || place.getImportance() < 1 || place.getImportance() > 5
                    || place.getVisitPerWeek() == null || place.getVisitPerWeek() < 0
                    || (long) place.getImportance() * place.getVisitPerWeek() > Integer.MAX_VALUE) {
                throw new ApiException("Correct your important places before purchasing a commute report");
            }
            hasWeight |= place.getVisitPerWeek() > 0;
        }
        if (!hasWeight) {
            throw new ApiException("At least one important place must have weekly visits");
        }
    }

    private User getUser(Integer userId) {
        User user = userRepository.findUserById(userId);
        if (user == null) {
            throw new ApiException("User not found");
        }
        return user;
    }

    private String validUuid(String value, String message) {
        try {
            if (value == null || !UUID.fromString(value).toString().equalsIgnoreCase(value)) {
                throw new IllegalArgumentException();
            }
            return value.toLowerCase(Locale.ROOT);
        } catch (IllegalArgumentException e) {
            throw new ApiException(message);
        }
    }

    private PaymentResponseDTO response(Payment payment) {
        return new PaymentResponseDTO(payment.getId(), payment.getServiceType(), payment.getAmount(), payment.getCurrency(),
                payment.getStatus(), payment.getCreatedAt(), payment.getPaidAt(), payment.getAccessExpiresAt(), payment.getRefundedAmount());
    }
}
