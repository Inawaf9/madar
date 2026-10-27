package com.example.madar.Repository;


import com.example.madar.Model.CreditTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CreditTransactionRepository extends JpaRepository<CreditTransaction, Integer> {

    List<CreditTransaction> findByWallet_IdOrderByCreatedAtDesc(Integer walletId);

    boolean existsByReferenceTypeAndReferenceId(String referenceType, String referenceId);

    CreditTransaction findByReferenceTypeAndReferenceId(String referenceType, String referenceId);
}