package com.example.madar.Repository;


import com.example.madar.Model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Integer> {

    List<Notification> findByUser_IdOrderByCreatedAtDesc(Integer userId);

    List<Notification> findByUser_IdAndIsReadFalseOrderByCreatedAtDesc(Integer userId);

    long countByUser_IdAndIsReadFalse(Integer userId);

    Notification findByIdAndUser_Id(Integer notificationId, Integer userId);
}

