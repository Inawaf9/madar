package com.example.madar.Repository;


import com.example.madar.Model.LifestyleInterest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LifestyleInterestRepository extends JpaRepository<LifestyleInterest, Integer> {

    LifestyleInterest findLifestyleInterestById(Integer id);

    List<LifestyleInterest> findLifestyleInterestsByUser_Id(Integer userId);

    LifestyleInterest findLifestyleInterestByIdAndUser_Id(Integer id, Integer userId);

    boolean existsByUser_IdAndInterestType(Integer userId, String interestType);
}