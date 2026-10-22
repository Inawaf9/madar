package com.example.madar.Repository;


import com.example.madar.Model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;

import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Integer> {

    Payment findPaymentById(Integer id);

    Payment findPaymentByProviderPaymentId(String providerPaymentId);

    Payment findPaymentByIdAndUser_Id(Integer id, Integer userId);

    List<Payment> findPaymentsByUser_Id(Integer userId);

    Payment findPaymentByCheckoutKey(String checkoutKey);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Payment findPaymentForUpdateByIdAndUser_Id(Integer id, Integer userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Payment findPaymentForUpdateByLocalReference(String localReference);
}