package com.example.madar.Repository;

import com.example.madar.Model.PropertyComparison;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PropertyComparisonRepository extends JpaRepository<PropertyComparison, Integer> {

    PropertyComparison findPropertyComparisonById(Integer id);

    List<PropertyComparison> findPropertyComparisonsByUser_Id(Integer userId);

    PropertyComparison findPropertyComparisonByIdAndUser_Id(Integer id, Integer userId);

    boolean existsByUser_IdAndFirstPropertyIdAndFirstPropertySourceAndSecondPropertyIdAndSecondPropertySource(Integer userId, String firstPropertyId, String firstPropertySource, String secondPropertyId, String secondPropertySource);
}