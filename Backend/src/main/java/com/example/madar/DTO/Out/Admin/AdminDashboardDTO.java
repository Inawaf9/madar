package com.example.madar.DTO.Out.Admin;




import java.util.List;

public record AdminDashboardDTO(
        long totalUsers,
        long activeUsers,
        long inactiveUsers,
        long suspendedUsers,
        long newUsersLast30Days,
        long totalPayments,
        long paidPayments,
        long pendingPayments,
        long failedPayments,
        long refundedPayments,
        long paidAmountHalalas,
        List<MonthlyRegistrationDTO> monthlyRegistrations
) {
    public record MonthlyRegistrationDTO(
            String month,
            long registrations
    ) {}
}


