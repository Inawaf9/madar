package com.example.madar.Repository;


import com.example.madar.Model.CreditPackage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CreditPackageRepository extends JpaRepository<CreditPackage, Integer> {

    CreditPackage findCreditPackageByCode(String code);

    boolean existsByCode(String code);

    List<CreditPackage> findCreditPackagesByActiveTrue();
}