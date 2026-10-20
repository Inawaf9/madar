package com.example.madar.Repository;


import com.example.madar.Model.PlacePreference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlacePreferenceRepository extends JpaRepository<PlacePreference, Integer> {

    PlacePreference findPlacePreferenceById(Integer id);

    List<PlacePreference> findPlacePreferencesByUser_Id(Integer userId);

    PlacePreference findPlacePreferenceByIdAndUser_Id(Integer id, Integer userId);
}