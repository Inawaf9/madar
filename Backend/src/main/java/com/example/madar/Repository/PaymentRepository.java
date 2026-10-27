package com.example.madar.Repository;

import com.example.madar.Model.Payment;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;

import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Integer> {

    Payment findPaymentById(Integer id);

    Payment findPaymentByProviderPaymentId(String providerPaymentId);

    Payment findPaymentByIdAndUser_Id(Integer id, Integer userId);

    List<Payment> findPaymentsByUser_Id(Integer userId);

    Payment findPaymentByCheckoutKey(String checkoutKey);

    @Query(
            value = "SELECT * FROM payment WHERE id = :id AND user_id = :userId FOR UPDATE",
            nativeQuery = true
    )
    Payment findPaymentForUpdateByIdAndUser_Id(@Param("id") Integer id, @Param("userId") Integer userId);

    @Query(
            value = "SELECT * FROM payment WHERE local_reference = :localReference FOR UPDATE",
            nativeQuery = true
    )
    Payment findPaymentForUpdateByLocalReference(@Param("localReference") String localReference);

    Page<Payment> findByStatus(String status, Pageable pageable);
}