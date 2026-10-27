package com.example.madar.Service;



import com.example.madar.Api.ApiException;
import com.example.madar.Client.N8nClient;
import com.example.madar.DTO.Out.Admin.AdminDashboardDTO;
import com.example.madar.DTO.Out.Admin.AdminUserDTO;
import com.example.madar.DTO.Out.Payment.PaymentResponseDTO;
import com.example.madar.Model.User;
import com.example.madar.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.example.madar.Model.Payment;
import com.example.madar.Repository.PaymentRepository;

import com.example.madar.Model.AdminAuditLog;
import com.example.madar.Repository.AdminAuditLogRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final UserService userService;
    private final PaymentRepository paymentRepository;
    private final NotificationService notificationService;
    private final N8nClient n8nClient;
    private final CreditService creditService;
    private final AdminAuditLogRepository adminAuditLogRepository;


    // Get all users with pagination
    @Transactional(readOnly = true)
    public Page<AdminUserDTO> getAllUsers(
            Integer adminId, int page, int size, String status) {

        checkAdmin(adminId);

        Pageable pageable = adminPage(page, size);

        Page<User> users;

        if (status == null || status.isBlank()) {
            users = userRepository.findAll(pageable);
        } else {
            users = switch (status.trim().toUpperCase()) {
                case "ACTIVE" ->
                        userRepository.findByActiveTrueAndSuspendedByAdminFalse(pageable);
                case "INACTIVE" ->
                        userRepository.findByActiveFalse(pageable);
                case "SUSPENDED" ->
                        userRepository.findBySuspendedByAdminTrue(pageable);
                default -> throw new ApiException("Invalid user status");
            };
        }

        return users.map(this::toAdminUserDTO);
    }

    // Delete user
    @Transactional
    public void adminDeleteUser(Integer adminId, Integer userId) {

        checkAdmin(adminId);

        if (adminId.equals(userId)) {
            throw new ApiException("Admin cannot delete their own account from here");
        }
        User user = userRepository.findUserById(userId);

        if (user == null) {
            throw new ApiException("User not found");
        }

        if (!"USER".equals(user.getRole())) {
            throw new ApiException("Only USER accounts can be deleted");
        }

        userService.deleteMyAccount(userId);
        recordAdminAction(adminId, userId, "DELETE_USER", "User account deleted");
    }

    // Suspend user
    @Transactional
    public void adminSuspendUser(Integer adminId, Integer userId) {

        checkAdmin(adminId);

        if (adminId.equals(userId)) {
            throw new ApiException("Admin cannot suspend their own account");
        }

        User user = userRepository.findUserById(userId);

        if (user == null) {
            throw new ApiException("User not found");
        }

        if (!"USER".equals(user.getRole())) {
            throw new ApiException("Only USER accounts can be suspended");
        }

        if (Boolean.TRUE.equals(user.getSuspendedByAdmin())) {
            throw new ApiException("Account is already suspended");
        }

        user.setSuspendedByAdmin(true);
        userRepository.save(user);

        recordAdminAction(adminId, userId, "SUSPEND_USER", "User account suspended");
        notificationService.createNotification(
                userId,
                "تم تعليق حسابك",
                "تم تعليق حسابك مؤقتًا من قبل إدارة مدار. يرجى التواصل مع الدعم للاستفسار.",
                "ACCOUNT_SUSPENDED",
                null
        );
        n8nClient.sendAccountPaymentEventAfterCommit(
                "ACCOUNT_SUSPENDED",
                "ACCOUNT_SUSPENDED:" + userId + ":" + java.util.UUID.randomUUID(),
                user.getFullName(),
                user.getEmail(),
                null
        );
    }

    // Unsuspend user
    @Transactional
    public void adminUnsuspendUser(Integer adminId, Integer userId) {

        checkAdmin(adminId);

        User user = userRepository.findUserById(userId);

        if (user == null) {
            throw new ApiException("User not found");
        }

        if (!"USER".equals(user.getRole())) {
            throw new ApiException("Only USER accounts can be unsuspended");
        }

        if (!Boolean.TRUE.equals(user.getSuspendedByAdmin())) {
            throw new ApiException("Account is not suspended by admin");
        }

        user.setSuspendedByAdmin(false);
        userRepository.save(user);
        recordAdminAction(adminId, userId, "UNSUSPEND_USER", "User account unsuspended");
        notificationService.createNotification(
                userId,
                "تم إلغاء تعليق حسابك",
                "يمكنك الآن تسجيل الدخول واستخدام خدمات مدار مجددًا.",
                "ACCOUNT_UNSUSPENDED",
                null
        );
        n8nClient.sendAccountPaymentEventAfterCommit(
                "ACCOUNT_UNSUSPENDED",
                "ACCOUNT_UNSUSPENDED:" + userId + ":" + java.util.UUID.randomUUID(),
                user.getFullName(),
                user.getEmail(),
                null
        );
    }



    // Admin dashboard statistics
    @Transactional(readOnly = true)
    public AdminDashboardDTO getDashboardStatistics(Integer adminId) {

        checkAdmin(adminId);

        List<User> users = userRepository.findAll().stream()
                .filter(user -> "USER".equals(user.getRole()))
                .toList();

        List<Payment> payments = paymentRepository.findAll();

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime last30Days = now.minusDays(30);

        long totalUsers = users.size();

        long activeUsers = users.stream()
                .filter(user -> Boolean.TRUE.equals(user.getActive())
                        && !Boolean.TRUE.equals(user.getSuspendedByAdmin()))
                .count();

        long inactiveUsers = users.stream()
                .filter(user -> !Boolean.TRUE.equals(user.getActive()))
                .count();

        long suspendedUsers = users.stream()
                .filter(user -> Boolean.TRUE.equals(user.getSuspendedByAdmin()))
                .count();

        long newUsersLast30Days = users.stream()
                .filter(user -> user.getCreatedAt() != null
                        && !user.getCreatedAt().isBefore(last30Days))
                .count();

        long paidPayments = payments.stream()
                .filter(payment -> "PAID".equals(payment.getStatus()))
                .count();

        long pendingPayments = payments.stream()
                .filter(payment -> "PENDING".equals(payment.getStatus()))
                .count();

        long failedPayments = payments.stream()
                .filter(payment -> "FAILED".equals(payment.getStatus()))
                .count();

        long refundedPayments = payments.stream()
                .filter(payment -> "REFUNDED".equals(payment.getStatus()))
                .count();

        // Only new SAR payments stored in halalas.
        // Legacy payments without currency are excluded.
        long paidAmountHalalas = payments.stream()
                .filter(payment -> "PAID".equals(payment.getStatus()))
                .filter(payment -> "SAR".equals(payment.getCurrency()))
                .filter(payment -> payment.getAmount() != null)
                .mapToLong(Payment::getAmount)
                .sum();

        // Registration growth during the last six calendar months.
        List<AdminDashboardDTO.MonthlyRegistrationDTO> monthlyRegistrations =
                new ArrayList<>();

        YearMonth currentMonth = YearMonth.from(now);

        for (int i = 5; i >= 0; i--) {

            YearMonth month = currentMonth.minusMonths(i);

            long registrations = users.stream()
                    .filter(user -> user.getCreatedAt() != null)
                    .filter(user -> YearMonth.from(user.getCreatedAt()).equals(month))
                    .count();

            monthlyRegistrations.add(
                    new AdminDashboardDTO.MonthlyRegistrationDTO(month.toString(), registrations));
        }

        return new AdminDashboardDTO(totalUsers, activeUsers, inactiveUsers, suspendedUsers, newUsersLast30Days, payments.size(), paidPayments, pendingPayments, failedPayments, refundedPayments, paidAmountHalalas, monthlyRegistrations);
    }



    // Search users by name or email
    @Transactional(readOnly = true)
    public Page<AdminUserDTO> searchUsers(Integer adminId, String keyword, int page, int size) {

        checkAdmin(adminId);

        Pageable pageable = adminPage(page, size);

        if (keyword == null || keyword.isBlank()) {
            return userRepository.findAll(pageable)
                    .map(this::toAdminUserDTO);
        }

        String search = keyword.trim();

        return userRepository
                .findByFullNameContainingIgnoreCaseOrEmailContainingIgnoreCase(
                        search,
                        search,
                        pageable
                )
                .map(this::toAdminUserDTO);
    }

    // Get one user's details
    @Transactional(readOnly = true)
    public AdminUserDTO getUserById(Integer adminId, Integer userId) {

        checkAdmin(adminId);

        User user = userRepository.findUserById(userId);

        if (user == null) {
            throw new ApiException("User not found");
        }

        return toAdminUserDTO(user);
    }

    // Convert User to safe admin response
    private AdminUserDTO toAdminUserDTO(User user) {

        return new AdminUserDTO(user.getId(), user.getFullName(), user.getEmail(), user.getRole(), user.getActive(), user.getSuspendedByAdmin());
    }


    // Latest 5 registered users
    @Transactional(readOnly = true)
    public List<AdminUserDTO> getRecentUsers(Integer adminId) {
        checkAdmin(adminId);

        return userRepository.findAll().stream()
                .filter(user -> "USER".equals(user.getRole()))
                .sorted((a, b) -> b.getId().compareTo(a.getId()))
                .limit(5)
                .map(this::toAdminUserDTO)
                .toList();
    }

    // All payment transactions
    @Transactional(readOnly = true)
    public Page<PaymentResponseDTO> getAllPayments(
            Integer adminId, int page, int size, String status) {

        checkAdmin(adminId);

        Pageable pageable = adminPage(page, size);

        if (status == null || status.isBlank()) {
            return paymentRepository.findAll(pageable)
                    .map(this::toPaymentDTO);
        }

        String paymentStatus = status.trim().toUpperCase();

        if (!java.util.Set.of(
                "PAID", "PENDING", "FAILED", "REFUNDED"
        ).contains(paymentStatus)) {
            throw new ApiException("Invalid payment status");
        }

        return paymentRepository.findByStatus(paymentStatus, pageable).map(this::toPaymentDTO);
    }
    // Admin gifts credits to a user
    @Transactional
    public Integer giftCreditsToUser(Integer adminId, Integer userId, Integer credits, String operationId) {

        checkAdmin(adminId);

        User user = userRepository.findUserById(userId);

        if (user == null) {
            throw new ApiException("User not found");
        }

        if (!"USER".equals(user.getRole())) {
            throw new ApiException("Credits can only be gifted to USER accounts");
        }

        if (!Boolean.TRUE.equals(user.getActive()) || Boolean.TRUE.equals(user.getSuspendedByAdmin())) {
            throw new ApiException("Cannot gift credits to an inactive or suspended user");
        }

        return creditService.giftCredits(
                userId, adminId, credits, operationId
        );
    }
    // One payment's details
    @Transactional(readOnly = true)
    public PaymentResponseDTO getPaymentById(Integer adminId, Integer paymentId) {
        checkAdmin(adminId);

        Payment payment = paymentRepository.findById(paymentId).orElseThrow(() -> new ApiException("Payment not found"));

        return toPaymentDTO(payment);
    }

    public void recordAdminAction(
            Integer adminId,
            Integer targetUserId,
            String action,
            String details) {

        AdminAuditLog log = new AdminAuditLog();
        log.setAdminId(adminId);
        log.setTargetUserId(targetUserId);
        log.setAction(action);
        log.setDetails(details);

        adminAuditLogRepository.save(log);
    }

    @Transactional(readOnly = true)
    public Page<AdminAuditLog> getAuditLogs(Integer adminId, int page, int size) {
        checkAdmin(adminId);

        if (page < 0 || size < 1 || size > 100) {
            throw new ApiException("Invalid pagination parameters");
        }

        return adminAuditLogRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(page, size));
    }

    // Convert Payment to safe response
    private PaymentResponseDTO toPaymentDTO(Payment payment) {
        return new PaymentResponseDTO(
                payment.getId(), payment.getServiceType(), payment.getAmount(),
                payment.getCurrency(), payment.getStatus(), payment.getCreatedAt(),
                payment.getPaidAt(), payment.getAccessExpiresAt(), payment.getRefundedAmount());
    }

    // Common admin pagination settings
    private Pageable adminPage(int page, int size) {

        if (page < 0 || size < 1 || size > 100) {
            throw new ApiException(
                    "Invalid pagination parameters"
            );
        }

        return PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
    }
    // Validate admin
    private void checkAdmin(Integer adminId) {

        User admin = userRepository.findUserById(adminId);

        if (admin == null) {
            throw new ApiException("Admin not found");
        }

        if (!"ADMIN".equals(admin.getRole())) {
            throw new ApiException("Only admin can perform this action");
        }
    }
}

