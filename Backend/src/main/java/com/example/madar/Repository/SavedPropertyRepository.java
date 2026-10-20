package com.example.madar.Repository;


import com.example.madar.Model.SavedProperty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SavedPropertyRepository extends JpaRepository<SavedProperty, Integer> {

    SavedProperty findSavedPropertyById(Integer id);

    List<SavedProperty> findSavedPropertiesByUser_Id(Integer userId);

    SavedProperty findSavedPropertyByIdAndUser_Id(Integer id, Integer userId);

    boolean existsByUser_IdAndSourceAndExternalPropertyId(Integer userId, String source, String externalPropertyId);
}