package com.example.madar.Repository;


import com.example.madar.Model.CreditWallet;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface CreditWalletRepository extends JpaRepository<CreditWallet, Integer> {

    CreditWallet findByUser_Id(Integer userId);

    boolean existsByUser_Id(Integer userId);

    @Query(value = "SELECT * FROM credit_wallet WHERE user_id = :userId FOR UPDATE", nativeQuery = true)
    CreditWallet findWalletForUpdateByUser_Id(@Param("userId") Integer userId);
}