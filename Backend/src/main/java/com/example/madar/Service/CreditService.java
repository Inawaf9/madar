package com.example.madar.Service;

import com.example.madar.Api.ApiException;
import com.example.madar.DTO.Out.Credit.CreditTransactionDTO;
import com.example.madar.Model.CreditTransaction;
import com.example.madar.Model.CreditWallet;
import com.example.madar.Model.User;
import com.example.madar.Repository.AdminAuditLogRepository;
import com.example.madar.Repository.CreditTransactionRepository;
import com.example.madar.Repository.CreditWalletRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.example.madar.Model.AdminAuditLog;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CreditService {

    private static final int WELCOME_CREDITS = 100;

    private static final Map<String, Integer> SERVICE_PRICES = Map.of(
            "TOP_3_RECOMMENDATIONS", 15,
            "AI_CHAT", 2,
            "AI_COMPARISON", 10,
            "COMMUTE_REPORT", 20
    );

    private static final String USAGE_REFERENCE = "CREDIT_USAGE";
    private static final String CANCEL_REFERENCE = "CREDIT_CANCEL";

    private final CreditWalletRepository creditWalletRepository;
    private final CreditTransactionRepository creditTransactionRepository;
    private final NotificationService notificationService;
    private final AdminAuditLogRepository adminAuditLogRepository;


    // Create wallet and grant 100 credits for a newly registered user.
    @Transactional
    public void createWelcomeWallet(User user) {

        if (user == null || user.getId() == null) {
            throw new ApiException("User must be saved before creating wallet");
        }

        if (!"USER".equals(user.getRole())) {
            throw new ApiException("Only USER accounts can receive welcome credits");
        }

        if (creditWalletRepository.existsByUser_Id(user.getId())) {
            throw new ApiException("Credit wallet already exists");
        }

        CreditWallet wallet = new CreditWallet();
        wallet.setUser(user);
        wallet.setBalance(WELCOME_CREDITS);

        CreditWallet savedWallet = creditWalletRepository.saveAndFlush(wallet);

        CreditTransaction transaction = new CreditTransaction();
        transaction.setWallet(savedWallet);
        transaction.setType("WELCOME_BONUS");
        transaction.setAmount(WELCOME_CREDITS);
        transaction.setBalanceAfter(WELCOME_CREDITS);
        transaction.setReferenceType("WELCOME_BONUS");
        transaction.setReferenceId(user.getId().toString());
        transaction.setDescription("100 welcome credits for new registration");

        creditTransactionRepository.save(transaction);
    }


    // Get current credit balance.
    @Transactional(readOnly = true)
    public Integer getBalance(Integer userId) {

        CreditWallet wallet = creditWalletRepository.findByUser_Id(userId);

        if (wallet == null) {
            throw new ApiException("Credit wallet not found");
        }

        return wallet.getBalance();
    }


    // Get the cost of a paid service.
    public Integer getServiceCost(String serviceType) {

        Integer cost = SERVICE_PRICES.get(serviceType);

        if (cost == null) {
            throw new ApiException("Unsupported credit service");
        }

        return cost;
    }


    // Get all service prices.
    public Map<String, Integer> getAllServicePrices() {
        return SERVICE_PRICES;
    }


    // Reserve credits before executing a paid service.
    @Transactional
    public Integer reserveCredits(Integer userId, String serviceType, String operationId) {

        int cost = getServiceCost(serviceType);
        String referenceId = validateOperationId(operationId);

        CreditWallet wallet = getLockedWallet(userId);

        CreditTransaction existing = creditTransactionRepository.findByReferenceTypeAndReferenceId(USAGE_REFERENCE, referenceId);

        if (existing != null) {

            validateOwnership(existing, wallet);

            if (existing.getAmount() != -cost ||
                    !("Service: " + serviceType).equals(existing.getDescription())) {
                throw new ApiException("Operation ID already used for another service");
            }

            if ("CANCELLED".equals(existing.getType())) {
                throw new ApiException("Credit operation was cancelled");
            }

            return wallet.getBalance();
        }

        if (wallet.getBalance() < cost) {
            throw new ApiException(
                    "رصيدك من الكريدت غير كافٍ لاستخدام هذه الخدمة. اشحن رصيدك وحاول مرة ثانية."
            );
        }

        int newBalance = wallet.getBalance() - cost;

        wallet.setBalance(newBalance);
        creditWalletRepository.save(wallet);

        CreditTransaction transaction = new CreditTransaction();

        transaction.setWallet(wallet);
        transaction.setType("RESERVED");
        transaction.setAmount(-cost);
        transaction.setBalanceAfter(newBalance);
        transaction.setReferenceType(USAGE_REFERENCE);
        transaction.setReferenceId(referenceId);
        transaction.setDescription("Service: " + serviceType);

        creditTransactionRepository.saveAndFlush(transaction);

        return newBalance;
    }


    // Confirm credits after the paid service succeeds.
    @Transactional
    public void confirmCredits(Integer userId, String operationId) {

        String referenceId = validateOperationId(operationId);
        CreditWallet wallet = getLockedWallet(userId);

        CreditTransaction transaction = getUsageTransaction(referenceId, wallet);

        if ("CONSUMED".equals(transaction.getType())) {
            return;
        }

        if (!"RESERVED".equals(transaction.getType())) {
            throw new ApiException("Credit operation cannot be confirmed");
        }

        transaction.setType("CONSUMED");

        creditTransactionRepository.save(transaction);
    }


    // Return reserved credits when the paid service fails.
    @Transactional
    public void cancelReservation(Integer userId, String operationId) {

        String referenceId = validateOperationId(operationId);
        CreditWallet wallet = getLockedWallet(userId);

        CreditTransaction transaction = getUsageTransaction(
                referenceId,
                wallet
        );

        if ("CANCELLED".equals(transaction.getType())) {
            return;
        }

        if (!"RESERVED".equals(transaction.getType())) {
            throw new ApiException("Credit operation cannot be cancelled");
        }

        if (creditTransactionRepository.existsByReferenceTypeAndReferenceId(CANCEL_REFERENCE, referenceId)) {
            throw new ApiException("Credit refund already recorded");
        }

        int refundAmount = -transaction.getAmount();

        if (refundAmount <= 0) {
            throw new ApiException("Invalid refund amount");
        }

        int newBalance = Math.addExact(wallet.getBalance(), refundAmount);

        wallet.setBalance(newBalance);

        creditWalletRepository.save(wallet);

        CreditTransaction refund = new CreditTransaction();

        refund.setWallet(wallet);
        refund.setType("REFUND");
        refund.setAmount(refundAmount);
        refund.setBalanceAfter(newBalance);
        refund.setReferenceType(CANCEL_REFERENCE);
        refund.setReferenceId(referenceId);
        refund.setDescription("Refund for failed credit operation");

        creditTransactionRepository.saveAndFlush(refund);

        transaction.setType("CANCELLED");
        creditTransactionRepository.save(transaction);
    }

    // Add purchased credits after verified Moyasar payment.
    @Transactional
    public void addPurchasedCredits(Integer userId, Integer paymentId, Integer credits) {

        if (paymentId == null || paymentId <= 0 || credits == null || credits <= 0) {
            throw new ApiException("Invalid credit purchase");
        }

        CreditWallet wallet = getLockedWallet(userId);

        String referenceId = paymentId.toString();

        CreditTransaction existing = creditTransactionRepository.findByReferenceTypeAndReferenceId("CREDIT_PURCHASE", referenceId);

        if (existing != null) {
            validateOwnership(existing, wallet);

            if (!"PURCHASE".equals(existing.getType()) || !existing.getAmount().equals(credits)) {
                throw new ApiException("Credit purchase reference conflict");
            }

            return; // Already credited. Do not add again.
        }

        int newBalance = Math.addExact(wallet.getBalance(), credits);

        wallet.setBalance(newBalance);
        creditWalletRepository.save(wallet);

        CreditTransaction transaction = new CreditTransaction();

        transaction.setWallet(wallet);
        transaction.setType("PURCHASE");
        transaction.setAmount(credits);
        transaction.setBalanceAfter(newBalance);
        transaction.setReferenceType("CREDIT_PURCHASE");
        transaction.setReferenceId(referenceId);
        transaction.setDescription("Credits purchased via Moyasar");

        creditTransactionRepository.saveAndFlush(transaction);
    }

    // Revoke additional credits for a verified partial/full refund.
    @Transactional
    public void revokePurchasedCredits(Integer userId, Integer paymentId, Integer creditsToRevoke, Integer totalRefundedCredits) {

        if (paymentId == null || paymentId <= 0
                || creditsToRevoke == null || creditsToRevoke <= 0
                || totalRefundedCredits == null
                || totalRefundedCredits < creditsToRevoke) {
            throw new ApiException("Invalid credit refund");
        }

        CreditWallet wallet = getLockedWallet(userId);
        String paymentReference = paymentId.toString();

        CreditTransaction purchase = creditTransactionRepository.findByReferenceTypeAndReferenceId("CREDIT_PURCHASE", paymentReference);

        if (purchase == null) {
            throw new ApiException("Original credit purchase not found");
        }

        validateOwnership(purchase, wallet);

        if (!"PURCHASE".equals(purchase.getType()) || purchase.getAmount() < totalRefundedCredits) {
            throw new ApiException("Invalid original credit purchase");
        }

        String refundReference =
                paymentId + ":" + totalRefundedCredits;

        CreditTransaction existing =
                creditTransactionRepository.findByReferenceTypeAndReferenceId(
                        "CREDIT_PURCHASE_REFUND", refundReference
                );

        if (existing != null) {
            validateOwnership(existing, wallet);

            if (!"PURCHASE_REFUND".equals(existing.getType()) || existing.getAmount() != -creditsToRevoke) {
                throw new ApiException("Credit refund reference conflict");
            }

            return;
        }

        int newBalance = Math.subtractExact(wallet.getBalance(), creditsToRevoke);

        wallet.setBalance(newBalance);
        creditWalletRepository.save(wallet);

        CreditTransaction refund = new CreditTransaction();
        refund.setWallet(wallet);
        refund.setType("PURCHASE_REFUND");
        refund.setAmount(-creditsToRevoke);
        refund.setBalanceAfter(newBalance);
        refund.setReferenceType("CREDIT_PURCHASE_REFUND");
        refund.setReferenceId(refundReference);
        refund.setDescription("Credits revoked after Moyasar refund");

        creditTransactionRepository.saveAndFlush(refund);
    }

    // Get credit transaction history for the current user.
    @Transactional(readOnly = true)
    public List<CreditTransactionDTO> getTransactionHistory(Integer userId) {

        CreditWallet wallet = creditWalletRepository.findByUser_Id(userId);

        if (wallet == null) {
            throw new ApiException("Credit wallet not found");
        }

        return creditTransactionRepository
                .findByWallet_IdOrderByCreatedAtDesc(wallet.getId())
                .stream()
                .map(t -> new CreditTransactionDTO(
                        t.getId(),
                        t.getType(),
                        t.getAmount(),
                        t.getBalanceAfter(),
                        t.getDescription(),
                        t.getCreatedAt()
                ))
                .toList();
    }


    // Gift credits to a user by admin
    @Transactional
    public Integer giftCredits(
            Integer userId,
            Integer adminId,
            Integer credits,
            String operationId) {

        if (adminId == null || adminId <= 0) {
            throw new ApiException("Invalid admin ID");
        }

        if (credits == null || credits <= 0 || credits > 10000) {
            throw new ApiException("Credits must be between 1 and 10000");
        }

        String referenceId = validateOperationId(operationId);

        // Lock wallet to prevent concurrent balance modifications
        CreditWallet wallet = getLockedWallet(userId);

        CreditTransaction existing =
                creditTransactionRepository.findByReferenceTypeAndReferenceId(
                        "ADMIN_GIFT",
                        referenceId
                );

        // Repeated request: return balance without creating anything new
        if (existing != null) {

            validateOwnership(existing, wallet);

            if (!"ADMIN_GIFT".equals(existing.getType())
                    || !Integer.valueOf(credits).equals(existing.getAmount())
                    || !("Gift from admin: " + adminId)
                    .equals(existing.getDescription())) {

                throw new ApiException("Gift operation ID conflict");
            }

            return wallet.getBalance();
        }

        // Add credits
        int newBalance;

        try {
            newBalance = Math.addExact(wallet.getBalance(), credits);
        } catch (ArithmeticException e) {
            throw new ApiException("Credit balance overflow");
        }

        wallet.setBalance(newBalance);
        creditWalletRepository.save(wallet);

        // Save credit transaction
        CreditTransaction transaction = new CreditTransaction();

        transaction.setWallet(wallet);
        transaction.setType("ADMIN_GIFT");
        transaction.setAmount(credits);
        transaction.setBalanceAfter(newBalance);
        transaction.setReferenceType("ADMIN_GIFT");
        transaction.setReferenceId(referenceId);
        transaction.setDescription("Gift from admin: " + adminId);

        creditTransactionRepository.saveAndFlush(transaction);

        // Record admin action only for a NEW gift
        AdminAuditLog auditLog = new AdminAuditLog();

        auditLog.setAdminId(adminId);
        auditLog.setTargetUserId(userId);
        auditLog.setAction("GIFT_CREDITS");
        auditLog.setDetails(
                "Gifted " + credits + " credits. Operation: " + referenceId
        );

        adminAuditLogRepository.save(auditLog);

        // Notify user only once
        notificationService.createNotification(
                userId,
                "وصلتك هدية كريدت",
                "أضافت إدارة مدار " + credits + " كريدت إلى محفظتك.",
                "CREDIT_GIFT",
                null
        );

        return newBalance;
    }
    // HELPER METHODS

    private CreditWallet getLockedWallet(Integer userId) {

        if (userId == null) {
            throw new ApiException("User ID is required");
        }

        CreditWallet wallet =
                creditWalletRepository.findWalletForUpdateByUser_Id(userId);

        if (wallet == null) {
            throw new ApiException("Credit wallet not found");
        }

        return wallet;
    }


    private CreditTransaction getUsageTransaction(String referenceId, CreditWallet wallet) {

        CreditTransaction transaction = creditTransactionRepository.findByReferenceTypeAndReferenceId(USAGE_REFERENCE, referenceId);

        if (transaction == null) {
            throw new ApiException("Credit operation not found");
        }

        validateOwnership(transaction, wallet);

        return transaction;
    }


    private void validateOwnership(CreditTransaction transaction, CreditWallet wallet) {

        if (!transaction.getWallet().getId().equals(wallet.getId())) {
            throw new ApiException("Credit operation does not belong to this user");
        }
    }


    private String validateOperationId(String operationId) {

        if (operationId == null || operationId.isBlank()) {
            throw new ApiException("Operation ID is required");
        }

        try {
            return UUID.fromString(operationId).toString();
        } catch (IllegalArgumentException e) {
            throw new ApiException("Invalid operation ID");
        }
    }
}