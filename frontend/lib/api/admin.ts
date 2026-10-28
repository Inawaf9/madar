
import { apiRequest } from "./client";
import type { ApiResponse } from "./contracts";

const BASE = "/api/v1/user/admin";

export type AdminUser = {
    id: number;
    fullName: string;
    email: string;
    role: string;
    active: boolean;
    suspendedByAdmin: boolean;
};

export type AdminPage<T> = {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
    first: boolean;
    last: boolean;
    empty: boolean;
};


export type AdminDashboard = {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    suspendedUsers: number;
    newUsersLast30Days: number;
    totalPayments: number;
    paidPayments: number;
    pendingPayments: number;
    failedPayments: number;
    refundedPayments: number;
    paidAmountHalalas: number;
    monthlyRegistrations: {
        month: string;
        registrations: number;
    }[];
};


export type AdminAuditLog = {
    id: number;
    adminId: number;
    targetUserId: number | null;
    action: string;
    details: string | null;
    createdAt: string;
};

export type AdminServiceHealth = {
    status: string;
    message: string;
    responseTimeMs: number | null;
    checkedAt: string;
};

export type AdminSystemHealth = {
    status: string;
    checkedAt: string;
    cacheDurationSeconds: number;
    totalServices: number;
    upServices: number;
    downServices: number;
    degradedServices: number;
    unverifiedServices: number;
    services: Record<string, AdminServiceHealth>;
};


function pageQuery(
    page: number,
    size: number,
    extra?: Record<string, string | undefined>,
) {
    const params = new URLSearchParams({
        page: String(page),
        size: String(size),
    });

    for (const [key, value] of Object.entries(extra ?? {})) {
        if (value) params.set(key, value);
    }

    return params.toString();
}

export type AdminCreditPackage = {
    id: number;
    code: string;
    name: string;
    credits: number;
    priceHalalas: number;
    discountPercent: number;
    active: boolean;
};

export type AdminCreditPackageInput = {
    code: string;
    name: string;
    credits: number;
    priceHalalas: number;
    discountPercent: number;
    active: boolean;
};


export const adminApi = {
    users: (signal?: AbortSignal, page = 0, size = 10, status?: string) =>
        apiRequest<AdminPage<AdminUser>>(
            `${BASE}/users?${pageQuery(page, size, { status })}`,
            { signal },
        ),

    createCreditPackage: (data: AdminCreditPackageInput) =>
        apiRequest<ApiResponse>("/api/v1/credit-packages", {
            method: "POST",
            body: data,
        }),

    updateCreditPackage: (
        packageId: number,
        data: AdminCreditPackageInput
    ) =>
        apiRequest<ApiResponse>(
            `/api/v1/credit-packages/${packageId}`,
            {
                method: "PUT",
                body: data,
            }
        ),

    deactivateCreditPackage: (packageId: number) =>
        apiRequest<ApiResponse>(
            `/api/v1/credit-packages/${packageId}`,
            {
                method: "DELETE",
            }
        ),


    creditPackages: (signal?: AbortSignal) =>
        apiRequest<AdminCreditPackage[]>(
            "/api/v1/credit-packages",
            { signal }
        ),

    searchUsers: (
        keyword: string,
        page = 0,
        size = 10,
        signal?: AbortSignal,
    ) =>
        apiRequest<AdminPage<AdminUser>>(
            `${BASE}/users/search?${pageQuery(page, size, { keyword })}`,
            { signal },
        ),

    userDetails: (userId: number, signal?: AbortSignal) =>
        apiRequest<AdminUser>(`${BASE}/users/${userId}`, { signal }),

    recentUsers: (signal?: AbortSignal) =>
        apiRequest<AdminUser[]>(`${BASE}/dashboard/recent-users`, { signal }),

    dashboard: (signal?: AbortSignal) =>
        apiRequest<AdminDashboard>(`${BASE}/dashboard`, { signal }),

    removeUser: (targetUserId: number) =>
        apiRequest<ApiResponse>(`${BASE}/users/${targetUserId}`, {
            method: "DELETE",
        }),

    suspend: (targetUserId: number) =>
        apiRequest<ApiResponse>(`${BASE}/users/${targetUserId}/suspend`, {
            method: "PUT",
        }),

    unsuspend: (targetUserId: number) =>
        apiRequest<ApiResponse>(`${BASE}/users/${targetUserId}/unsuspend`, {
            method: "PUT",
        }),


    payments: (
        signal?: AbortSignal,
        page = 0,
        size = 10,
        status?: string
    ) =>
        apiRequest<AdminPaymentsPage>(
            `${BASE}/payments?${pageQuery(page, size, { status })}`,
            { signal }
        ),


    paymentDetails: (paymentId: number, signal?: AbortSignal) =>
        apiRequest<AdminPayment>(`${BASE}/payments/${paymentId}`, { signal }),

    giftCredits: (
        targetUserId: number,
        credits: number,
        idempotencyKey: string,
    ) =>
        apiRequest<ApiResponse>(
            `${BASE}/users/${targetUserId}/gift-credits?credits=${encodeURIComponent(credits)}`,
            {
                method: "POST",
                headers: {
                    "Idempotency-Key": idempotencyKey,
                },
            },
        ),

    auditLogs: (page = 0, size = 10, signal?: AbortSignal) =>
        apiRequest<AdminPage<AdminAuditLog>>(
            `${BASE}/audit-logs?${pageQuery(page, size)}`,
            { signal },
        ),

    systemHealth: (signal?: AbortSignal) =>
        apiRequest<AdminSystemHealth>(`${BASE}/system-health`, { signal }),
};

export type AdminPayment = {
    id: number;
    serviceType: string;
    amount: number;
    currency: string;
    status: string;
    createdAt: string | null;
    paidAt: string | null;
    accessExpiresAt: string | null;
    refundedAmount: number | null;
};

export type AdminPaymentsPage = {
    content: AdminPayment[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
};
