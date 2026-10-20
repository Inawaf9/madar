package com.example.madar.Repository;


import com.example.madar.Model.CurrentHome;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CurrentHomeRepository extends JpaRepository<CurrentHome, Integer> {

    CurrentHome findCurrentHomeById(Integer id);

    CurrentHome findCurrentHomeByUser_Id(Integer userId);
}