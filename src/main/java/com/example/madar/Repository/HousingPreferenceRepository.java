package com.example.madar.Repository;


import com.example.madar.Model.HousingPreference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HousingPreferenceRepository extends JpaRepository<HousingPreference, Integer> {

    HousingPreference findHousingPreferenceById(Integer id);

    HousingPreference findHousingPreferenceByUser_Id(Integer userId);
}