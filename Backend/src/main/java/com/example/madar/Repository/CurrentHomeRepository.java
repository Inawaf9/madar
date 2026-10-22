package com.example.madar.Repository;


import com.example.madar.Model.CurrentHome;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;

@Repository
public interface CurrentHomeRepository extends JpaRepository<CurrentHome, Integer> {

    CurrentHome findCurrentHomeById(Integer id);

    CurrentHome findCurrentHomeByUser_Id(Integer userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    CurrentHome findHomeForUpdateByUser_Id(Integer userId);
}