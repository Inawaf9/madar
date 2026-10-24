package com.example.madar.Repository;



import com.example.madar.Model.LifestyleInterest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LifestyleInterestRepository extends JpaRepository<LifestyleInterest, Integer> {

    List<LifestyleInterest> findByHousingPreference_Id(Integer preferenceId);
    LifestyleInterest findLifestyleInterestById(Integer interestId);
    boolean existsByHousingPreference_IdAndCodeIgnoreCase(Integer preferenceId, String code);
    boolean existsByHousingPreference_IdAndCodeIgnoreCaseAndIdNot(Integer preferenceId, String code, Integer interestId);
}