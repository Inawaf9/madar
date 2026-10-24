package com.example.madar.Repository;


import com.example.madar.Model.CurrentHome;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;

@Repository
public interface CurrentHomeRepository extends JpaRepository<CurrentHome, Integer> {

    CurrentHome findCurrentHomeById(Integer id);

    CurrentHome findCurrentHomeByUser_Id(Integer userId);

    @Query(
            value = "SELECT * FROM current_home WHERE user_id = :userId FOR UPDATE",
            nativeQuery = true
    )
    CurrentHome findHomeForUpdateByUser_Id(@Param("userId") Integer userId);
}